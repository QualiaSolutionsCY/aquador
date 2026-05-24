import { NextResponse, type NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  normalizePerfumeName,
  serializeCatalogueMatches,
} from '@/lib/perfume-intel/catalogue';
import { createFallbackReport, parseReportPayload } from '@/lib/perfume-intel/report-parser';
import type {
  PerfumeIntelConversation,
  PerfumeIntelMemory,
  PerfumeIntelReport,
  PerfumeIntelResponse,
} from '@/lib/perfume-intel/types';

export const maxDuration = 60;

const OPENROUTER_ENDPOINT = process.env.AI_API_ENDPOINT || 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
const MODEL = process.env.PERFUME_INTEL_MODEL || 'google/gemini-3.5-flash';

const searchSchema = z.object({
  perfumeName: z.string().trim().max(180).optional(),
  imageDataUrl: z.string().max(3_500_000).optional(),
}).refine(
  (value) => Boolean(value.perfumeName?.trim() || value.imageDataUrl?.trim()),
  { message: 'Enter a perfume name or upload a perfume photo' },
);

const memorySchema = z.object({
  perfumeName: z.string().trim().min(2).max(180),
  note: z.string().trim().min(3).max(1200),
});

interface AdminOk {
  ok: true;
  userId: string;
}

interface AdminFail {
  ok: false;
  status: number;
  error: string;
}

interface CachedReportRow {
  id: string;
  report: PerfumeIntelReport;
  model: string;
  updated_at: string;
  usage_count: number;
}

interface ImageInput {
  dataUrl: string;
  mime: string;
  hash: string;
}

async function assertAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<AdminOk | AdminFail> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, error: 'Unauthorized' };

  const { data: adminRow, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (error) return { ok: false, status: 500, error: error.message };
  if (!adminRow) return { ok: false, status: 403, error: 'Forbidden' };
  return { ok: true, userId: user.id };
}

function stripJsonFence(value: string): string {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

function parseImageDataUrl(value?: string): ImageInput | null {
  if (!value) return null;
  const match = value.match(/^data:(image\/(?:jpeg|png|webp|avif));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    throw new Error('Upload a JPEG, PNG, WebP, or AVIF image');
  }
  const [, mime, base64] = match;
  const bytes = Buffer.from(base64, 'base64');
  if (bytes.length > 2_500_000) {
    throw new Error('Image must be under 2.5 MB');
  }
  return {
    dataUrl: value,
    mime,
    hash: createHash('sha256').update(bytes).digest('hex'),
  };
}

function memoryRowsToShape(
  rows: Array<{ id: string; note: string; source?: string | null; created_at: string }>,
): PerfumeIntelMemory[] {
  return rows.map((row) => ({
    id: row.id,
    note: row.note,
    source: row.source ?? 'manual',
    createdAt: row.created_at,
  }));
}

function conversationRowsToShape(
  rows: Array<{
    id: string;
    perfume_name: string;
    normalized_query: string;
    input_type: string;
    report: PerfumeIntelReport;
    learned_memories: string[] | null;
    created_at: string;
  }>,
): PerfumeIntelConversation[] {
  return rows.map((row) => ({
    id: row.id,
    perfumeName: row.perfume_name,
    normalizedQuery: row.normalized_query,
    inputType: row.input_type === 'image' ? 'image' : row.input_type === 'mixed' ? 'mixed' : 'text',
    report: row.report,
    learnedMemories: row.learned_memories ?? [],
    createdAt: row.created_at,
  }));
}

async function getMemories(
  supabase: Awaited<ReturnType<typeof createClient>>,
  normalizedQuery: string,
): Promise<PerfumeIntelMemory[]> {
  const { data, error } = await (supabase as any)
    .from('perfume_intel_memories')
    .select('id,note,source,created_at')
    .eq('normalized_query', normalizedQuery)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    if (/relation .*perfume_intel_memories|schema cache/i.test(error.message)) return [];
    throw new Error(error.message);
  }
  return memoryRowsToShape(data ?? []);
}

async function getCachedReport(
  supabase: Awaited<ReturnType<typeof createClient>>,
  normalizedQuery: string,
): Promise<CachedReportRow | null> {
  const { data, error } = await (supabase as any)
    .from('perfume_intel_reports')
    .select('id,report,model,updated_at,usage_count')
    .eq('normalized_query', normalizedQuery)
    .maybeSingle();

  if (error) {
    if (/relation .*perfume_intel_reports|schema cache/i.test(error.message)) return null;
    throw new Error(error.message);
  }
  return data as CachedReportRow | null;
}

async function getHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<PerfumeIntelConversation[]> {
  const { data, error } = await (supabase as any)
    .from('perfume_intel_conversations')
    .select('id,perfume_name,normalized_query,input_type,report,learned_memories,created_at')
    .order('created_at', { ascending: false })
    .limit(18);

  if (error) {
    if (/relation .*perfume_intel_conversations|schema cache/i.test(error.message)) return [];
    throw new Error(error.message);
  }
  return conversationRowsToShape(data ?? []);
}

async function bumpCachedReport(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
  usageCount: number,
) {
  await (supabase as any)
    .from('perfume_intel_reports')
    .update({
      usage_count: usageCount + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', id);
}

function buildMemoryBlock(memories: PerfumeIntelMemory[]): string {
  if (memories.length === 0) return 'No saved Aquador memory for this perfume yet.';
  return memories.map((memory) => `- ${memory.note}`).join('\n');
}

function buildPrompt({
  perfumeName,
  memories,
  hasImage,
}: {
  perfumeName?: string;
  memories: PerfumeIntelMemory[];
  hasImage: boolean;
}) {
  const target = perfumeName?.trim()
    ? `"${perfumeName.trim()}"`
    : 'the perfume bottle in the uploaded image';
  const catalogueBlock = serializeCatalogueMatches(perfumeName || '');
  return `You are Aquador Perfume Intelligence, created by Qualia Solutions for Aquador in Cyprus.

Your job is to help the Aquador team identify, explain, compare, and sell perfumes. You are specialized in fragrance families, accords, top notes, heart notes, base notes, sillage, longevity, value, customer fit, and matching a customer's requested scent to Aquador products.

Know the team context without segmenting the profile: Marina and Marcos need concise counter-ready guidance, while Mahmoud as owner needs commercial value, stock-fit, and positioning signals.

Research ${target} online${hasImage ? ' and inspect the uploaded bottle image before deciding the perfume identity' : ''}. Prefer perfume encyclopedias, brand pages, reputable fragrance shops, and review summaries. Do not copy source wording. If the image is unclear, still produce the best likely identification and say why in the summary.

Saved Aquador memory:
${buildMemoryBlock(memories)}

Aquador catalogue candidates:
${catalogueBlock}

Return JSON only with this exact shape:
{
  "perfumeName": "display name",
  "brand": "brand",
  "audience": "short audience description",
  "summary": "plain English selling summary for a staff member",
  "mainAccords": [{"name":"citrus","weight":95,"color":"#d9f934"}],
  "pyramid": {
    "top": [{"name":"Orange","detail":"bright citrus opening"}],
    "middle": [{"name":"Jasmine"}],
    "base": [{"name":"Musk"}]
  },
  "performance": {
    "longevity": {"label":"moderate","score":55,"evidence":"why"},
    "sillage": {"label":"intimate","score":35,"evidence":"why"}
  },
  "demographics": {
    "gender": {"label":"more feminine","score":70,"evidence":"why"},
    "value": {"label":"good value","score":62,"evidence":"why"}
  },
  "aquadorUse": {
    "customerProfile": "who should be shown this profile",
    "sellingAngles": ["angle"],
    "objections": ["objection and answer"],
    "questionsToAsk": ["question"]
  },
  "similarPerfumes": [{"name":"Name","brand":"Brand","reason":"why"}],
  "aquadorRecommendations": [{"name":"Aquador product","brand":"Brand","path":"/products/slug","reason":"why it fits"}],
  "sources": [{"title":"Source title","url":"https://..."}]
}

Use 3 to 8 main accords. Scores are 0 to 100. Every Aquador recommendation must come from the catalogue candidates when candidates exist. Keep the output useful for Marina, Mahmoud, and Marcos at the shop counter.`;
}

function buildUserContent(prompt: string, image: ImageInput | null) {
  if (!image) return prompt;
  return [
    { type: 'text', text: prompt },
    { type: 'image_url', image_url: { url: image.dataUrl } },
  ];
}

function inferLearningNotes(report: PerfumeIntelReport): string[] {
  const topAccords = report.mainAccords
    .slice(0, 3)
    .map((accord) => accord.name)
    .join(', ');
  const firstMatch = report.aquadorRecommendations[0];
  return [
    `${report.perfumeName} by ${report.brand}: strongest accords are ${topAccords}; position it as ${report.audience}.`,
    `${report.perfumeName}: shared Aquador counter profile is ${report.aquadorUse.customerProfile}`,
    firstMatch
      ? `${report.perfumeName}: first Aquador shelf match is ${firstMatch.name} by ${firstMatch.brand} because ${firstMatch.reason}`
      : `${report.perfumeName}: no direct shelf match found; sell by accord family and customer intent.`,
  ].map((note) => note.slice(0, 1200));
}

async function generateReport({
  perfumeName,
  memories,
  image,
}: {
  perfumeName?: string;
  memories: PerfumeIntelMemory[];
  image: ImageInput | null;
}) {
  if (!API_KEY) {
    throw new Error('AI key is not configured');
  }

  const prompt = buildPrompt({
    perfumeName,
    memories,
    hasImage: Boolean(image),
  });

  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://aquadorcy.com',
      'X-Title': "Aquad'or Perfume Intelligence",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are Aquador Perfume Intelligence, created by Qualia Solutions. Return accurate, cited perfume intelligence as valid JSON only.',
        },
        {
          role: 'user',
          content: buildUserContent(prompt, image),
        },
      ],
      tools: [
        {
          type: 'openrouter:web_search',
          parameters: {
            engine: 'auto',
            max_results: 5,
            max_total_results: 10,
            search_context_size: 'medium',
          },
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.25,
      max_tokens: 2600,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Research model ${response.status}: ${text}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('The research model returned an empty perfume report');
  }

  try {
    const parsedJson = JSON.parse(stripJsonFence(content)) as unknown;
    return parseReportPayload(parsedJson, perfumeName);
  } catch (error) {
    console.warn('perfume intel JSON fallback:', error);
    return createFallbackReport(perfumeName);
  }
}

async function saveReport(
  supabase: Awaited<ReturnType<typeof createClient>>,
  normalizedQuery: string,
  perfumeName: string,
  report: PerfumeIntelReport,
  userId: string,
) {
  const now = new Date().toISOString();
  const { data, error } = await (supabase as any)
    .from('perfume_intel_reports')
    .upsert({
      normalized_query: normalizedQuery,
      perfume_name: perfumeName,
      report,
      model: MODEL,
      web_searched: true,
      usage_count: 1,
      created_by: userId,
      updated_at: now,
      last_used_at: now,
    }, { onConflict: 'normalized_query' })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data?.id as string | undefined;
}

async function saveAutoMemories({
  supabase,
  normalizedQuery,
  perfumeName,
  report,
  userId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  normalizedQuery: string;
  perfumeName: string;
  report: PerfumeIntelReport;
  userId: string;
}) {
  const learned = inferLearningNotes(report);
  const { error } = await (supabase as any)
    .from('perfume_intel_memories')
    .insert(learned.map((note) => ({
      normalized_query: normalizedQuery,
      perfume_name: perfumeName,
      note,
      source: 'auto',
      created_by: userId,
    })));

  if (error && !/relation .*perfume_intel_memories|schema cache/i.test(error.message)) {
    throw new Error(error.message);
  }
  return learned;
}

async function saveConversation({
  supabase,
  normalizedQuery,
  requestedName,
  image,
  report,
  learnedMemories,
  userId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  normalizedQuery: string;
  requestedName: string;
  image: ImageInput | null;
  report: PerfumeIntelReport;
  learnedMemories: string[];
  userId: string;
}) {
  const inputType = image && requestedName ? 'mixed' : image ? 'image' : 'text';
  const { error } = await (supabase as any)
    .from('perfume_intel_conversations')
    .insert({
      normalized_query: normalizedQuery,
      perfume_name: report.perfumeName,
      requested_name: requestedName || null,
      input_type: inputType,
      image_hash: image?.hash ?? null,
      image_mime: image?.mime ?? null,
      report,
      learned_memories: learnedMemories,
      created_by: userId,
    });

  if (error && !/relation .*perfume_intel_conversations|schema cache/i.test(error.message)) {
    throw new Error(error.message);
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const auth = await assertAdmin(supabase);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const history = await getHistory(supabase);
    return NextResponse.json({ history });
  } catch (error) {
    console.error('perfume intel GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load perfume history' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await assertAdmin(supabase);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => null);
    const parsed = searchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid request' },
        { status: 400 },
      );
    }

    const requestedName = parsed.data.perfumeName?.trim() ?? '';
    const image = parseImageDataUrl(parsed.data.imageDataUrl);
    const shouldBypassCache = Boolean(image);
    const initialNormalizedQuery = requestedName
      ? normalizePerfumeName(requestedName)
      : `image ${image?.hash.slice(0, 32)}`;
    const memories = requestedName ? await getMemories(supabase, initialNormalizedQuery) : [];

    if (!shouldBypassCache && requestedName) {
      const cached = await getCachedReport(supabase, initialNormalizedQuery);
      if (cached) {
        await bumpCachedReport(supabase, cached.id, cached.usage_count);
        await saveConversation({
          supabase,
          normalizedQuery: initialNormalizedQuery,
          requestedName,
          image: null,
          report: cached.report,
          learnedMemories: [],
          userId: auth.userId,
        });
        const response: PerfumeIntelResponse = {
          report: cached.report,
          cached: true,
          generatedAt: cached.updated_at,
          model: cached.model,
          memories,
          learnedMemories: [],
          history: await getHistory(supabase),
        };
        return NextResponse.json(response);
      }
    }

    const report = await generateReport({
      perfumeName: requestedName || undefined,
      memories,
      image,
    });
    const finalNormalizedQuery = normalizePerfumeName(report.perfumeName);
    await saveReport(supabase, finalNormalizedQuery, report.perfumeName, report, auth.userId);
    const learnedMemories = await saveAutoMemories({
      supabase,
      normalizedQuery: finalNormalizedQuery,
      perfumeName: report.perfumeName,
      report,
      userId: auth.userId,
    });
    await saveConversation({
      supabase,
      normalizedQuery: finalNormalizedQuery,
      requestedName,
      image,
      report,
      learnedMemories,
      userId: auth.userId,
    });

    const response: PerfumeIntelResponse = {
      report,
      cached: false,
      generatedAt: new Date().toISOString(),
      model: MODEL,
      memories: await getMemories(supabase, finalNormalizedQuery),
      learnedMemories,
      history: await getHistory(supabase),
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('perfume intel POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Perfume research failed' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await assertAdmin(supabase);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => null);
    const parsed = memorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid memory note' },
        { status: 400 },
      );
    }

    const normalizedQuery = normalizePerfumeName(parsed.data.perfumeName);
    const { error } = await (supabase as any)
      .from('perfume_intel_memories')
      .insert({
        normalized_query: normalizedQuery,
        perfume_name: parsed.data.perfumeName,
        note: parsed.data.note,
        source: 'manual',
        created_by: auth.userId,
      });

    if (error) throw new Error(error.message);

    const memories = await getMemories(supabase, normalizedQuery);
    return NextResponse.json({ memories, history: await getHistory(supabase) });
  } catch (error) {
    console.error('perfume intel PUT error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not save memory. Apply the perfume intelligence database migration if this is a new environment.' },
      { status: 500 },
    );
  }
}
