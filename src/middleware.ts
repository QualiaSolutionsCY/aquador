import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Site-wide maintenance lock.
 *
 * Flipping `MAINTENANCE_MODE` to `true` redirects every storefront route to
 * `/maintenance` unless the request carries the operator access cookie
 * (`aq_access=1`, set by entering the unlock code on the maintenance page).
 *
 * Exempt from the lock:
 *   - `/maintenance` itself (otherwise infinite redirect)
 *   - `/admin/*` and `/api/*` (admin must remain reachable to manage the
 *     store and serve auth/webhook traffic)
 *   - static assets served from /public (handled by the matcher exclusion)
 *
 * The flag is intentionally a constant rather than an env var so the lock
 * is committed-and-deployed atomically — flipping it back to `false` is a
 * single edit + push, with no risk of an env drift between preview and
 * production environments.
 */
const MAINTENANCE_MODE = false;

const ACCESS_COOKIE = 'aq_access';

export async function middleware(request: NextRequest) {
  // Generate a unique request ID
  const requestId = crypto.randomUUID();

  // Clone the request headers and add the request ID
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminLoginRoute = pathname === '/admin/login';
  const isApiRoute = pathname.startsWith('/api');
  const isMaintenanceRoute = pathname === '/maintenance';
  const hasAccessCookie =
    request.cookies.get(ACCESS_COOKIE)?.value === '1';

  // Maintenance gate. Runs FIRST so even authenticated admins still see the
  // lock from a storefront URL; admins use /admin/* paths, which are exempt.
  if (
    MAINTENANCE_MODE &&
    !isMaintenanceRoute &&
    !isAdminRoute &&
    !isApiRoute &&
    !hasAccessCookie
  ) {
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }

  // Handle admin route authentication
  if (isAdminRoute && !isAdminLoginRoute) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request: {
                headers: requestHeaders,
              },
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Check if user is an admin - use maybeSingle to avoid throwing on no results
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (adminError || !adminUser) {
      return NextResponse.redirect(new URL('/admin/login?error=unauthorized', request.url));
    }
  }

  // Add request ID to response headers for debugging
  response.headers.set('x-request-id', requestId);

  return response;
}

export const config = {
  // Match every route except Next internals, static assets, and obvious
  // file requests (anything with a dot in the path segment, which catches
  // .mp4, .webp, .jpg, .png, .svg, etc.). The matcher exclusion is cheap
  // compared to running middleware on every image / video request.
  matcher: [
    '/((?!_next/static|_next/image|_next/data|favicon\\.ico|favicon\\.png|icon\\.png|apple-icon\\.png|aquador\\.webp|videos/|images/|og/|robots\\.txt|sitemap\\.xml).*)',
  ],
};
