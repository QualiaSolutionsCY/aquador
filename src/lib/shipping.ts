import {
  FREE_SHIPPING_THRESHOLD,
  DELIVERY_FEE,
  GREECE_DELIVERY_FEE,
  SHIPPING_COUNTRIES,
  type ShippingCountry,
} from './constants';
import { toCents } from './currency';

/**
 * Shipping destinations the shopper picks in the cart before checkout. Greece
 * is billed at a flat fee that overrides the free-shipping threshold; Cyprus
 * and the rest of the EU keep the free-over-€35 / €3-under rule. The chosen
 * destination drives BOTH the shipping amount and the set of countries Stripe
 * will accept for the address, so the address can never mismatch the charge.
 */
export type ShippingDestination = 'cy-eu' | 'greece';

export const SHIPPING_DESTINATIONS: ReadonlyArray<{
  id: ShippingDestination;
  label: string;
}> = [
  { id: 'cy-eu', label: 'Cyprus & EU' },
  { id: 'greece', label: 'Greece' },
];

// Cyprus & rest-of-EU countries. Greece is excluded because it has its own flat
// rate and its own destination option.
const CY_EU_COUNTRIES: ShippingCountry[] = SHIPPING_COUNTRIES.filter(
  (country) => country !== 'GR',
);

export interface ResolvedShipping {
  amountCents: number;
  allowedCountries: ShippingCountry[];
  displayName: string;
}

export function resolveShipping(
  destination: ShippingDestination,
  subtotalEur: number,
): ResolvedShipping {
  if (destination === 'greece') {
    return {
      amountCents: toCents(GREECE_DELIVERY_FEE),
      allowedCountries: ['GR'],
      displayName: 'Greece delivery',
    };
  }

  const qualifiesFree = subtotalEur >= FREE_SHIPPING_THRESHOLD;
  return {
    amountCents: qualifiesFree ? 0 : toCents(DELIVERY_FEE),
    allowedCountries: CY_EU_COUNTRIES,
    displayName: qualifiesFree ? 'Free shipping' : 'Standard delivery',
  };
}
