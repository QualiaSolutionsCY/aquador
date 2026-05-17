import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import * as Sentry from '@sentry/nextjs';
import { fetchWithTimeout } from '@/lib/api-utils';
import { formatPrice, escapeHtml } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';
import { getProductsByIds } from '@/lib/supabase/product-service';

export const maxDuration = 30;

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  productType?: string;
  // Admin-Customer-Service fields. Carried so /admin/orders/[id] can
  // surface the full point-of-sale snapshot a CS operator needs without
  // joining back to the products table (which may have moved on by the
  // time CS opens the ticket).
  productId?: string;
  slug?: string;
  image?: string;
  brand?: string;
  size?: string;
  category?: string;
}

interface ShippingAddress {
  name?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
}

async function persistOrder(
  session: Stripe.Checkout.Session,
  items: OrderItem[],
  shippingAddress: ShippingAddress | null,
  orderTags: Record<string, string>,
  customerPhone: string | null = null
): Promise<{ isNewOrder: boolean }> {
  try {
    const supabase = createAdminClient();
    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name;

    if (!customerEmail) return { isNewOrder: false };

    // Resolve customer_id BEFORE the orders insert so the FK lands on the
    // first write (M4 P1 T2 / OPTIMIZE H16). We upsert by email so a
    // repeat buyer reuses their existing customers.id. Aggregate fields
    // (total_orders, total_spent, ...) are updated below in the customer
    // namespace once we know whether this is a duplicate webhook.
    //
    // If the upsert fails, we log via the existing reportSafe pattern
    // and continue with customer_id = null — the order MUST land in the
    // DB even if the customers table glitches; admin can manually
    // reconcile from customer_email later.
    let customerId: string | null = null;
    const { data: customerUpsert, error: customerUpsertError } = await supabase
      .from('customers')
      .upsert(
        {
          email: customerEmail,
          name: customerName || null,
          ...(customerPhone ? { phone: customerPhone } : {}),
        },
        { onConflict: 'email' }
      )
      .select('id')
      .single();

    if (customerUpsertError) {
      Sentry.captureMessage('Customer upsert (FK link) failed — proceeding with customer_id=null', {
        level: 'warning',
        extra: { error: customerUpsertError.message, sessionId: session.id },
      });
    } else if (customerUpsert?.id) {
      customerId = customerUpsert.id;
    }

    // Insert order (idempotent via unique stripe_session_id)
    const { data: orderData, error: orderError } = await supabase.from('orders').upsert(
      {
        stripe_session_id: session.id,
        customer_id: customerId,
        customer_email: customerEmail,
        customer_name: customerName || null,
        customer_phone: customerPhone,
        items: JSON.parse(JSON.stringify(items)),
        total: session.amount_total || 0,
        currency: session.currency || 'eur',
        status: 'confirmed' as const,
        shipping_address: shippingAddress ? JSON.parse(JSON.stringify(shippingAddress)) : null,
        tags: Object.keys(orderTags).length > 0 ? orderTags : {},
      },
      { onConflict: 'stripe_session_id', ignoreDuplicates: true }
    ).select();

    if (orderError) {
      Sentry.captureMessage('Order persistence failed', {
        level: 'error',
        extra: { orderError, sessionId: session.id },
      });
      return { isNewOrder: false };
    }

    // If orderData is null or empty, the order was a duplicate (ignoreDuplicates blocked insert)
    if (!orderData || orderData.length === 0) {
      Sentry.addBreadcrumb({ category: 'stripe-webhook', message: 'Duplicate order detected', level: 'info', data: { sessionId: session.id } });
      return { isNewOrder: false };
    }

    // Upsert customer
    const now = new Date().toISOString();
    const { data: existing } = await supabase
      .from('customers')
      .select('id, total_orders, total_spent, shipping_addresses')
      .eq('email', customerEmail)
      .single();

    if (existing) {
      const addresses = (existing.shipping_addresses as ShippingAddress[]) || [];
      if (shippingAddress?.address) {
        const addrStr = JSON.stringify(shippingAddress);
        const alreadyStored = addresses.some(a => JSON.stringify(a) === addrStr);
        if (!alreadyStored) addresses.push(shippingAddress);
      }

      await supabase
        .from('customers')
        .update({
          name: customerName || undefined,
          total_orders: existing.total_orders + 1,
          total_spent: existing.total_spent + (session.amount_total || 0),
          last_order_at: now,
          shipping_addresses: JSON.parse(JSON.stringify(addresses)),
          ...(customerPhone ? { phone: customerPhone } : {}),
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('customers').insert({
        email: customerEmail,
        name: customerName || null,
        phone: customerPhone,
        total_orders: 1,
        total_spent: session.amount_total || 0,
        first_order_at: now,
        last_order_at: now,
        shipping_addresses: shippingAddress
          ? JSON.parse(JSON.stringify([shippingAddress]))
          : [],
      });
    }

    return { isNewOrder: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { action: 'persist_order' },
      extra: { sessionId: session.id },
    });
    return { isNewOrder: false };
  }
}

async function sendOrderConfirmationEmail(
  customerEmail: string,
  orderDetails: {
    sessionId: string;
    items: OrderItem[];
    total: number;
    currency: string;
    shippingAddress?: ShippingAddress | null;
  }
): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    return false;
  }

  const itemsHtml = orderDetails.items
    .map(item => {
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(item.name)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.price)}</td>
        </tr>
      `;
    })
    .join('');

  const shippingHtml = orderDetails.shippingAddress?.address ? `
    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #333; margin-top: 0;">Shipping Address</h3>
      <p style="color: #555; margin: 0;">
        ${escapeHtml(orderDetails.shippingAddress.name || '')}<br>
        ${escapeHtml(orderDetails.shippingAddress.address.line1 || '')}<br>
        ${orderDetails.shippingAddress.address.line2 ? escapeHtml(orderDetails.shippingAddress.address.line2) + '<br>' : ''}
        ${escapeHtml(orderDetails.shippingAddress.address.city || '')}, ${escapeHtml(orderDetails.shippingAddress.address.postal_code || '')}<br>
        ${escapeHtml(orderDetails.shippingAddress.address.country || '')}
      </p>
    </div>
  ` : '';

  try {
    const response = await fetchWithTimeout('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Aquad'or <orders@aquadorcy.com>",
        to: [customerEmail],
        subject: `Order Confirmation - Aquad'or #${orderDetails.sessionId.slice(-8).toUpperCase()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
            <div style="background: #0a0a0a; padding: 30px; text-align: center;">
              <h1 style="color: #D4AF37; margin: 0; font-family: Georgia, serif;">Aquad'or</h1>
              <p style="color: #888; margin: 10px 0 0;">Where Luxury Meets Distinction</p>
            </div>

            <div style="padding: 30px;">
              <h2 style="color: #333; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">
                Thank You for Your Order!
              </h2>

              <p style="color: #555; line-height: 1.6;">
                Your order has been confirmed and is being prepared. You'll receive another email when your order ships.
              </p>

              <p style="color: #888; font-size: 14px;">
                Order Reference: <strong style="color: #333;">#${orderDetails.sessionId.slice(-8).toUpperCase()}</strong>
              </p>

              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                  <tr style="background: #f9f9f9;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #D4AF37;">Item</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #D4AF37;">Qty</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #D4AF37;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold;">Total:</td>
                    <td style="padding: 12px; text-align: right; font-weight: bold; color: #D4AF37;">
                      ${formatPrice(orderDetails.total / 100)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              ${shippingHtml}

              <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 30px;">
                <h3 style="color: #333; margin-top: 0;">Need Help?</h3>
                <p style="color: #555; margin: 0;">
                  Contact us at <a href="mailto:info@aquadorcy.com" style="color: #D4AF37;">info@aquadorcy.com</a><br>
                  or call +357 99 980809
                </p>
              </div>
            </div>

            <div style="background: #0a0a0a; padding: 20px; text-align: center;">
              <p style="color: #888; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} Aquad'or Cyprus. All rights reserved.<br>
                Ledra 145, 1011, Nicosia, Cyprus
              </p>
            </div>
          </div>
        `,
      }),
      timeout: 10000,
    });

    if (!response.ok) {
      const errorData = await response.json();
      Sentry.captureMessage('Order confirmation email failed', {
        level: 'warning',
        tags: { service: 'resend' },
        extra: { errorData, sessionId: orderDetails.sessionId },
      });
      return false;
    }

    return true;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { service: 'resend', action: 'order_confirmation' },
    });
    return false;
  }
}

async function sendStoreOrderNotification(
  customerEmail: string,
  orderDetails: {
    sessionId: string;
    items: OrderItem[];
    total: number;
    currency: string;
    shippingAddress?: ShippingAddress | null;
  }
): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) return false;

  const itemsList = orderDetails.items
    .map(item => {
      const line = `${escapeHtml(item.name)} x${item.quantity} — ${formatPrice(item.price)}`;
      return `<li style="padding:8px 0;border-bottom:1px solid #333;">${line}</li>`;
    })
    .join('');

  const addr = orderDetails.shippingAddress?.address;
  const shippingText = addr
    ? `${escapeHtml(orderDetails.shippingAddress?.name || '')}<br>${escapeHtml(addr.line1 || '')}${addr.line2 ? '<br>' + escapeHtml(addr.line2) : ''}<br>${escapeHtml(addr.city || '')} ${escapeHtml(addr.postal_code || '')}<br>${escapeHtml(addr.country || '')}`
    : 'No shipping address provided';

  try {
    const response = await fetchWithTimeout('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Aquad'or Orders <orders@aquadorcy.com>",
        to: ['info@aquadorcy.com'],
        subject: `New Order #${orderDetails.sessionId.slice(-8).toUpperCase()} — ${formatPrice(orderDetails.total / 100)}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:30px;border-radius:12px;">
            <h1 style="color:#D4AF37;margin:0 0 5px;">New Order Received</h1>
            <p style="color:#888;margin:0 0 20px;">Order #${orderDetails.sessionId.slice(-8).toUpperCase()}</p>

            <div style="background:#1a1a1a;padding:16px;border-radius:8px;margin-bottom:16px;">
              <h3 style="color:#D4AF37;margin:0 0 8px;">Customer</h3>
              <p style="margin:0;color:#ccc;">${escapeHtml(customerEmail)}</p>
            </div>

            <div style="background:#1a1a1a;padding:16px;border-radius:8px;margin-bottom:16px;">
              <h3 style="color:#D4AF37;margin:0 0 8px;">Items</h3>
              <ul style="list-style:none;padding:0;margin:0;color:#ccc;">${itemsList}</ul>
            </div>

            <div style="background:#1a1a1a;padding:16px;border-radius:8px;margin-bottom:16px;">
              <h3 style="color:#D4AF37;margin:0 0 8px;">Shipping</h3>
              <p style="margin:0;color:#ccc;">${shippingText}</p>
            </div>

            <div style="text-align:center;padding:16px;background:linear-gradient(135deg,#D4AF37,#B8960C);border-radius:8px;">
              <span style="color:#000;font-size:24px;font-weight:bold;">${formatPrice(orderDetails.total / 100)}</span>
            </div>

            <p style="text-align:center;margin:20px 0 0;"><a href="https://aquadorcy.com/admin/orders" style="color:#D4AF37;">View in Admin Panel →</a></p>
          </div>
        `,
      }),
      timeout: 10000,
    });

    if (!response.ok) {
      Sentry.captureMessage('Store notification email failed', { level: 'warning' });
      return false;
    }
    return true;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { service: 'resend', action: 'store_notification' },
    });
    return false;
  }
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    Sentry.captureMessage('STRIPE_WEBHOOK_SECRET not configured', { level: 'error' });
    return NextResponse.json(
      { error: 'Webhook configuration error' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    Sentry.captureException(err, {
      tags: { webhook: 'stripe', error_type: 'signature_verification' },
      extra: { ip: request.headers.get('x-forwarded-for') },
    });
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const webhookSession = event.data.object as Stripe.Checkout.Session;

      Sentry.addBreadcrumb({
        category: 'order',
        message: 'Checkout completed',
        data: { sessionId: webhookSession.id, amount: webhookSession.amount_total },
      });

      // Retrieve the full session from Stripe to get phone_number_collection data
      // The webhook payload often omits customer_details.phone
      const session = await stripe.checkout.sessions.retrieve(webhookSession.id, {
        expand: ['customer_details'],
      });

      // Parse items, shipping, and order tags
      const customerEmail = session.customer_details?.email;
      const customerPhone = session.customer_details?.phone || null;
      let items: OrderItem[] = [];
      let shippingAddress: ShippingAddress | null = null;

      const orderTags: Record<string, string> = {};

      const metadata = session.metadata || {};

      if (metadata.items) {
        // Standard cart checkout — parse shortened metadata (pid, vid, qty)
        // Reconstruct full item details from product catalog
        try {
          const shortItems = JSON.parse(metadata.items) as Array<{
            pid: string;
            vid: string;
            qty: number;
          }>;

          const productIds = shortItems.map(si => si.pid);
          const products = await getProductsByIds(productIds);
          const productMap = new Map(products.map(p => [p.id, p]));

          for (const shortItem of shortItems) {
            const product = productMap.get(shortItem.pid);
            if (product) {
              items.push({
                name: product.name,
                quantity: shortItem.qty,
                price: product.sale_price || product.price,
                productType: product.product_type,
                productId: product.id,
                // The `id` column doubles as the URL slug — see
                // src/lib/supabase/product-service.ts `getProductBySlug` which
                // calls `getProductById(slug)`. No separate `slug` column.
                slug: product.id,
                image: product.image,
                brand: product.brand ?? undefined,
                size: product.size,
                category: product.category,
              });
            }
          }
        } catch (parseError) {
          Sentry.captureException(parseError, {
            tags: { action: 'parse_cart_items' },
            extra: { sessionId: session.id },
          });
        }
      } else if (metadata.productType === 'custom-perfume') {
        // Custom perfume checkout — reconstruct item from individual metadata fields
        const volume = metadata.volume || '50ml';
        items = [{
          name: `Custom Perfume: ${metadata.perfumeName || 'Unnamed'}`,
          quantity: 1,
          price: volume === '100ml' ? 199.00 : 29.99,
          productType: 'custom-perfume',
        }];
        orderTags['custom-perfume'] = 'true';
        orderTags['composition'] = `Top: ${metadata.topNote || '?'}, Heart: ${metadata.heartNote || '?'}, Base: ${metadata.baseNote || '?'}`;
        orderTags['volume'] = volume;
        if (metadata.specialRequests) {
          orderTags['special-requests'] = metadata.specialRequests;
        }
      }

      const shippingDetails = session.collected_information?.shipping_details;
      if (shippingDetails) {
        shippingAddress = {
          name: shippingDetails.name ?? undefined,
          address: shippingDetails.address ? {
            line1: shippingDetails.address.line1 ?? undefined,
            line2: shippingDetails.address.line2 ?? undefined,
            city: shippingDetails.address.city ?? undefined,
            postal_code: shippingDetails.address.postal_code ?? undefined,
            country: shippingDetails.address.country ?? undefined,
          } : undefined,
        };
      }

      // Persist order + customer to Supabase
      const { isNewOrder } = await persistOrder(session, items, shippingAddress, orderTags, customerPhone);

      // Send confirmation email to customer + notification to store (only for new orders)
      if (customerEmail) {
        const orderDetails = {
          sessionId: session.id,
          items,
          total: session.amount_total || 0,
          currency: session.currency || 'eur',
          shippingAddress,
        };

        if (isNewOrder) {
          await Promise.all([
            sendOrderConfirmationEmail(customerEmail, orderDetails),
            sendStoreOrderNotification(customerEmail, orderDetails),
          ]);
          Sentry.addBreadcrumb({ category: 'stripe-webhook', message: 'Order emails sent', level: 'info', data: { sessionId: session.id } });
        } else {
          Sentry.addBreadcrumb({ category: 'stripe-webhook', message: 'Duplicate webhook — skipped emails', level: 'info', data: { sessionId: session.id } });
        }
      }

      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session;
      Sentry.addBreadcrumb({
        category: 'order',
        message: 'Session expired',
        data: { sessionId: session.id },
      });
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      Sentry.addBreadcrumb({
        category: 'order',
        message: 'Payment failed',
        data: { paymentIntentId: paymentIntent.id },
      });
      break;
    }

    default:
      Sentry.addBreadcrumb({
        category: 'webhook',
        message: `Unhandled event: ${event.type}`,
      });
  }

  return NextResponse.json({ received: true });
}
