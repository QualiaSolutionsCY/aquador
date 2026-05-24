import { z } from 'zod';
import type { PerfumeIntelReport } from './types';

const accordSchema = z.object({
  name: z.string().min(1).max(80),
  weight: z.number().min(0).max(100),
  color: z.string().min(3).max(40),
});

const noteSchema = z.object({
  name: z.string().min(1).max(80),
  detail: z.string().max(180).optional(),
});

const fallbackMetric = {
  label: 'not enough data',
  score: 0,
  evidence: 'The model did not return a reliable public signal for this section.',
};

const metricSchema = z.object({
  label: z.string().min(1).max(80).catch(fallbackMetric.label),
  score: z.number().min(0).max(100).catch(fallbackMetric.score),
  evidence: z.string().min(1).max(300).catch(fallbackMetric.evidence),
}).catch(fallbackMetric);

const fallbackPerformance = {
  longevity: fallbackMetric,
  sillage: fallbackMetric,
};

const fallbackDemographics = {
  gender: fallbackMetric,
  value: fallbackMetric,
};

const fallbackAquadorUse = {
  customerProfile: 'Use this profile as a starting point and ask the customer what they liked about the requested perfume.',
  sellingAngles: [],
  objections: [],
  questionsToAsk: [],
};

const performanceSchema = z.object({
  longevity: metricSchema,
  sillage: metricSchema,
}).catch(fallbackPerformance);

const demographicsSchema = z.object({
  gender: metricSchema,
  value: metricSchema,
}).catch(fallbackDemographics);

const aquadorUseSchema = z.object({
  customerProfile: z.string().min(1).max(500).catch(fallbackAquadorUse.customerProfile),
  sellingAngles: z.array(z.string().min(1).max(220)).max(8).catch([]),
  objections: z.array(z.string().min(1).max(220)).max(6).catch([]),
  questionsToAsk: z.array(z.string().min(1).max(180)).max(8).catch([]),
}).catch(fallbackAquadorUse);

const reportSchema = z.object({
  perfumeName: z.string().min(1).max(180).catch('Unknown perfume'),
  brand: z.string().min(1).max(120).catch('Unknown brand'),
  audience: z.string().min(1).max(160).catch('General fragrance customer'),
  summary: z.string().min(1).max(700).catch('The model returned a partial report. Use the available notes, matches, and sources as a starting point.'),
  mainAccords: z.array(accordSchema).max(9).catch([]),
  pyramid: z.object({
    top: z.array(noteSchema).max(9).catch([]),
    middle: z.array(noteSchema).max(9).catch([]),
    base: z.array(noteSchema).max(9).catch([]),
  }).catch({ top: [], middle: [], base: [] }),
  performance: performanceSchema,
  demographics: demographicsSchema,
  aquadorUse: aquadorUseSchema,
  similarPerfumes: z.array(z.object({
    name: z.string().min(1).max(120),
    brand: z.string().min(1).max(120),
    reason: z.string().min(1).max(240),
  })).max(10).catch([]),
  aquadorRecommendations: z.array(z.object({
    name: z.string().min(1).max(120),
    brand: z.string().min(1).max(120),
    path: z.string().min(1).max(220),
    reason: z.string().min(1).max(240),
  })).max(8).catch([]),
  sources: z.array(z.object({
    title: z.string().min(1).max(180),
    url: z.string().url().max(700),
  })).max(8).catch([]),
});

export function createFallbackReport(perfumeName?: string): PerfumeIntelReport {
  return {
    perfumeName: perfumeName?.trim() || 'Unknown perfume',
    brand: 'Unknown brand',
    audience: 'General fragrance customer',
    summary: 'The research model returned a partial response. Use this as a starting profile, then save any counter learnings so the next lookup is stronger.',
    mainAccords: [],
    pyramid: { top: [], middle: [], base: [] },
    performance: fallbackPerformance,
    demographics: fallbackDemographics,
    aquadorUse: fallbackAquadorUse,
    similarPerfumes: [],
    aquadorRecommendations: [],
    sources: [],
  };
}

export function parseReportPayload(value: unknown, perfumeName?: string): PerfumeIntelReport {
  const parsed = reportSchema.safeParse(value);
  if (parsed.success) return parsed.data as PerfumeIntelReport;
  console.warn('perfume intel partial report fallback:', parsed.error.issues);
  return createFallbackReport(perfumeName);
}
