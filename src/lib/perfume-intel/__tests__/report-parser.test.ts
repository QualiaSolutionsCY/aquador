import { parseReportPayload } from '../report-parser';

describe('parseReportPayload', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fills omitted arrays with empty lists', () => {
    const report = parseReportPayload({
      perfumeName: 'Light Blue Italian Zest',
      brand: 'Dolce & Gabbana',
      audience: 'fresh citrus customer',
      summary: 'A bright citrus profile.',
      performance: {
        longevity: { label: 'moderate', score: 55, evidence: 'review consensus' },
        sillage: { label: 'soft', score: 35, evidence: 'review consensus' },
      },
      demographics: {
        gender: { label: 'unisex', score: 50, evidence: 'broad citrus profile' },
        value: { label: 'ok', score: 50, evidence: 'market dependent' },
      },
      aquadorUse: {
        customerProfile: 'For customers asking for fresh citrus.',
      },
    }, 'Light Blue Italian Zest');

    expect(report.mainAccords).toEqual([]);
    expect(report.pyramid).toEqual({ top: [], middle: [], base: [] });
    expect(report.aquadorUse.sellingAngles).toEqual([]);
    expect(report.similarPerfumes).toEqual([]);
    expect(report.sources).toEqual([]);
  });

  it('fills omitted nested objects with safe staff-facing defaults', () => {
    const report = parseReportPayload({
      perfumeName: 'Light Blue Italian Zest',
      brand: 'Dolce & Gabbana',
      audience: 'fresh citrus customer',
      summary: 'A bright citrus profile.',
    }, 'Light Blue Italian Zest');

    expect(report.performance.longevity.label).toBe('not enough data');
    expect(report.demographics.gender.label).toBe('not enough data');
    expect(report.aquadorUse.customerProfile).toContain('starting point');
  });

  it('falls back when the model returns a non-object payload', () => {
    const report = parseReportPayload('not a report', 'Light Blue Italian Zest');

    expect(report.perfumeName).toBe('Light Blue Italian Zest');
    expect(report.brand).toBe('Unknown brand');
    expect(report.mainAccords).toEqual([]);
  });
});
