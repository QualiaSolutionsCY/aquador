import { createClient } from '@/lib/supabase/server';
import SettingsForm, {
  type StoreSettingsValues,
} from '@/components/admin/SettingsForm';
import type { StoreSettings } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

const DEFAULTS: StoreSettingsValues = {
  contactEmail: '',
  contactPhone: '',
  instagramUrl: '',
  facebookUrl: '',
  shippingPolicySummary: '',
  returnsPolicySummary: '',
  freeShippingThresholdCents: 3500,
  stripePaymentEnabled: true,
  stripeApplePayEnabled: true,
  stripeGooglePayEnabled: true,
  seoDefaultTitle: '',
  seoDefaultDescription: '',
};

function rowToValues(row: StoreSettings): StoreSettingsValues {
  return {
    contactEmail: row.contact_email ?? '',
    contactPhone: row.contact_phone ?? '',
    instagramUrl: row.instagram_url ?? '',
    facebookUrl: row.facebook_url ?? '',
    shippingPolicySummary: row.shipping_policy_summary ?? '',
    returnsPolicySummary: row.returns_policy_summary ?? '',
    freeShippingThresholdCents: row.free_shipping_threshold_cents ?? 3500,
    stripePaymentEnabled: row.stripe_payment_enabled ?? true,
    stripeApplePayEnabled: row.stripe_apple_pay_enabled ?? true,
    stripeGooglePayEnabled: row.stripe_google_pay_enabled ?? true,
    seoDefaultTitle: row.seo_default_title ?? '',
    seoDefaultDescription: row.seo_default_description ?? '',
  };
}

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('store_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  const initial: StoreSettingsValues = data
    ? rowToValues(data)
    : DEFAULTS;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-[28px] leading-tight text-fg">
          Settings
        </h1>
        <p className="mt-1 font-body text-[14px] text-fg-muted">
          Store-wide values surfaced on the storefront and at checkout.
        </p>
      </header>
      <SettingsForm initial={initial} />
    </div>
  );
}
