import { createClient } from '@/lib/supabase/server';
import SettingsForm, {
  type StoreSettingsValues,
} from '@/components/admin/SettingsForm';

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

interface StoreSettingsRow {
  contact_email: string;
  contact_phone: string;
  instagram_url: string;
  facebook_url: string;
  shipping_policy_summary: string;
  returns_policy_summary: string;
  free_shipping_threshold_cents: number;
  stripe_payment_enabled: boolean;
  stripe_apple_pay_enabled: boolean;
  stripe_google_pay_enabled: boolean;
  seo_default_title: string;
  seo_default_description: string;
}

function rowToValues(row: StoreSettingsRow): StoreSettingsValues {
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

  // store_settings is new in this phase and not yet covered by the generated
  // Database types — cast the client to `any` for this one query so the page
  // compiles cleanly. A future `supabase gen types` regeneration will let us
  // drop the cast.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('store_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  const initial: StoreSettingsValues = data
    ? rowToValues(data as StoreSettingsRow)
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
