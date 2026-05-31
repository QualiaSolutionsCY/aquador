'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

/** Validate redirect URL to prevent open redirects */
function isValidRedirect(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//');
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '/admin';
  const redirect = isValidRedirect(redirectParam) ? redirectParam : '/admin';
  const errorParam = searchParams.get('error');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gold/20 rounded-2xl p-8 shadow-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/aquador.webp"
            alt="Aquad'or Admin"
            width={200}
            height={60}
            className="h-16 w-auto"
          />
        </div>

        <h1 className="text-2xl font-playfair text-white text-center mb-2">
          Admin Portal
        </h1>
        <p className="text-gray-400 text-center mb-8 text-sm">
          Sign in to manage your store
        </p>

        {/* Error messages */}
        {(error || errorParam === 'unauthorized') && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error || 'You are not authorized to access the admin panel.'}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
              placeholder="admin@aquadorcy.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-gold to-amber-600 text-black font-semibold rounded-lg hover:from-amber-500 hover:to-gold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-gray-500">
          Protected area. Authorized personnel only.
        </p>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="w-full max-w-md">
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gold/20 rounded-2xl p-8 shadow-2xl animate-pulse">
        <div className="flex justify-center mb-8">
          <div className="h-16 w-48 bg-gray-800 rounded" />
        </div>
        <div className="h-8 bg-gray-800 rounded w-1/2 mx-auto mb-2" />
        <div className="h-4 bg-gray-800 rounded w-2/3 mx-auto mb-8" />
        <div className="space-y-5">
          <div className="h-12 bg-gray-800 rounded" />
          <div className="h-12 bg-gray-800 rounded" />
          <div className="h-12 bg-gray-800 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
