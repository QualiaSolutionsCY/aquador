import { resolveShipping } from '../shipping';

describe('resolveShipping', () => {
  it('charges Greece a flat €15 (1500 cents) regardless of subtotal', () => {
    const small = resolveShipping('greece', 10);
    const large = resolveShipping('greece', 200);
    expect(small.amountCents).toBe(1500);
    expect(large.amountCents).toBe(1500);
    expect(small.allowedCountries).toEqual(['GR']);
    expect(small.displayName).toBe('Greece delivery');
  });

  it('gives Cyprus & EU free shipping at or above €35', () => {
    const result = resolveShipping('cy-eu', 35);
    expect(result.amountCents).toBe(0);
    expect(result.displayName).toBe('Free shipping');
    expect(result.allowedCountries).not.toContain('GR');
    expect(result.allowedCountries).toContain('CY');
  });

  it('charges Cyprus & EU €3 under €35', () => {
    const result = resolveShipping('cy-eu', 29.99);
    expect(result.amountCents).toBe(300);
    expect(result.displayName).toBe('Standard delivery');
  });

  it('never lets a Greece order ship to a non-GR address, or a cy-eu order to GR', () => {
    expect(resolveShipping('greece', 50).allowedCountries).toEqual(['GR']);
    expect(resolveShipping('cy-eu', 50).allowedCountries).not.toContain('GR');
  });
});
