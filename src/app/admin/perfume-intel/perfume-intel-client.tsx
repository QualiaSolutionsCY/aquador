'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Apple,
  BrainCircuit,
  Candy,
  Citrus,
  Clock,
  Coffee,
  Droplets,
  ExternalLink,
  Flame,
  Flower2,
  Gem,
  Image as ImageIcon,
  Leaf,
  Milk,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Sun,
  Trees,
  Upload,
  Waves,
  Wind,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import type {
  PerfumeIntelMemory,
  PerfumeIntelMetric,
  PerfumeIntelReport,
  PerfumeIntelResponse,
  PerfumeIntelConversation,
} from '@/lib/perfume-intel/types';

interface SelectedImage {
  name: string;
  dataUrl: string;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}

function scoreWidth(score: number) {
  return `${Math.max(4, Math.min(100, score))}%`;
}

interface ScentVisual {
  Icon: LucideIcon;
  background: string;
  color: string;
}

function getScentVisual(name: string): ScentVisual {
  const value = name.toLowerCase();
  if (/(citrus|orange|lemon|bergamot|grapefruit|lime|mandarin|neroli|petitgrain)/.test(value)) {
    return { Icon: Citrus, background: 'oklch(0.94 0.12 92)', color: 'oklch(0.48 0.12 74)' };
  }
  if (/(flower|floral|jasmine|rose|honeysuckle|lily|violet|iris|tuberose|ylang|magnolia|peony)/.test(value)) {
    return { Icon: Flower2, background: 'oklch(0.92 0.09 350)', color: 'oklch(0.52 0.16 342)' };
  }
  if (/(green|leaf|basil|mint|herbal|grass|tea|sage|lavender|rosemary)/.test(value)) {
    return { Icon: Leaf, background: 'oklch(0.91 0.11 145)', color: 'oklch(0.43 0.13 148)' };
  }
  if (/(fruit|apple|berry|blueberry|pear|peach|plum|fig|melon|pineapple|currant)/.test(value)) {
    return { Icon: Apple, background: 'oklch(0.91 0.10 24)', color: 'oklch(0.53 0.18 28)' };
  }
  if (/(wood|cedar|sandalwood|oud|agarwood|patchouli|vetiver|oak|moss|pine)/.test(value)) {
    return { Icon: Trees, background: 'oklch(0.88 0.08 70)', color: 'oklch(0.42 0.11 58)' };
  }
  if (/(water|aquatic|marine|ozonic|sea|salt|rain)/.test(value)) {
    return { Icon: Waves, background: 'oklch(0.91 0.08 220)', color: 'oklch(0.45 0.14 235)' };
  }
  if (/(spice|spicy|pepper|cardamom|cinnamon|clove|ginger|saffron)/.test(value)) {
    return { Icon: Flame, background: 'oklch(0.91 0.10 48)', color: 'oklch(0.52 0.15 42)' };
  }
  if (/(sweet|vanilla|caramel|tonka|candy|sugar|praline|chocolate)/.test(value)) {
    return { Icon: Candy, background: 'oklch(0.93 0.07 330)', color: 'oklch(0.55 0.18 330)' };
  }
  if (/(amber|resin|benzoin|labdanum|incense|smoke)/.test(value)) {
    return { Icon: Gem, background: 'oklch(0.90 0.08 83)', color: 'oklch(0.48 0.13 71)' };
  }
  if (/(musk|musky|powder|cotton|clean|soap)/.test(value)) {
    return { Icon: Milk, background: 'oklch(0.93 0.02 260)', color: 'oklch(0.45 0.04 265)' };
  }
  if (/(honey|nectar|syrup)/.test(value)) {
    return { Icon: Droplets, background: 'oklch(0.92 0.10 88)', color: 'oklch(0.50 0.13 78)' };
  }
  if (/(coffee|cacao|cocoa|espresso)/.test(value)) {
    return { Icon: Coffee, background: 'oklch(0.87 0.06 55)', color: 'oklch(0.36 0.08 48)' };
  }
  if (/(aromatic|airy|aldehyde|fresh)/.test(value)) {
    return { Icon: Wind, background: 'oklch(0.93 0.04 200)', color: 'oklch(0.44 0.09 205)' };
  }
  if (/(solar|warm|sun)/.test(value)) {
    return { Icon: Sun, background: 'oklch(0.93 0.09 100)', color: 'oklch(0.51 0.13 85)' };
  }
  return { Icon: Sparkles, background: 'oklch(0.91 0.03 90)', color: 'oklch(0.45 0.06 92)' };
}

function MetricBlock({
  label,
  metric,
  color = 'bg-accent',
}: {
  label: string;
  metric: PerfumeIntelMetric;
  color?: string;
}) {
  return (
    <div className="rounded-[8px] border border-border bg-bg-alt p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-micro text-[11px] uppercase tracking-[0.12em] text-fg-muted">
            {label}
          </p>
          <p className="mt-1 font-display text-[20px] leading-tight text-fg">
            {metric.label}
          </p>
        </div>
        <span className="font-micro text-[12px] text-fg-muted">
          {Math.round(metric.score)}
        </span>
      </div>
      <div className="mt-4 h-2 rounded-full bg-bg">
        <div
          className={cn('h-full rounded-full', color)}
          style={{ width: scoreWidth(metric.score) }}
        />
      </div>
      <p className="mt-3 font-body text-[13px] leading-relaxed text-fg-muted">
        {metric.evidence}
      </p>
    </div>
  );
}

function NoteGroup({
  title,
  notes,
}: {
  title: string;
  notes: PerfumeIntelReport['pyramid']['top'];
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <p className="font-micro text-[11px] uppercase tracking-[0.14em] text-fg-muted">
          {title}
        </p>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {notes.length > 0 ? notes.map((note) => {
          const visual = getScentVisual(note.name);
          const Icon = visual.Icon;
          return (
            <span
              key={`${title}-${note.name}`}
              className="flex min-w-28 max-w-40 flex-col items-center rounded-[8px] border border-border bg-bg px-3 py-3 text-center"
            >
              <span
                className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: visual.background, color: visual.color }}
              >
                <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.6} />
              </span>
              <span className="block font-body text-[14px] leading-tight text-fg">{note.name}</span>
              {note.detail && (
                <span className="mt-1 block max-w-36 font-micro text-[10px] uppercase tracking-[0.05em] text-fg-muted">
                  {note.detail}
                </span>
              )}
            </span>
          );
        }) : (
          <span className="font-body text-[13px] text-fg-muted">No clear notes found</span>
        )}
      </div>
    </div>
  );
}

function ReportView({
  data,
  memories,
  onMemorySaved,
}: {
  data: PerfumeIntelResponse;
  memories: PerfumeIntelMemory[];
  onMemorySaved: (memories: PerfumeIntelMemory[]) => void;
}) {
  const { report } = data;
  const [memoryNote, setMemoryNote] = useState('');
  const [savingMemory, setSavingMemory] = useState(false);
  const [memoryError, setMemoryError] = useState<string | null>(null);

  async function saveMemory() {
    const note = memoryNote.trim();
    if (!note) return;
    setSavingMemory(true);
    setMemoryError(null);
    try {
      const response = await fetch('/api/admin/perfume-intel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfumeName: report.perfumeName, note }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not save memory');
      onMemorySaved(payload.memories ?? []);
      setMemoryNote('');
    } catch (error) {
      setMemoryError(error instanceof Error ? error.message : 'Could not save memory');
    } finally {
      setSavingMemory(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-1 gap-6 border-b border-border pb-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={data.cached ? 'neutral' : 'accent'}>
              {data.cached ? 'Saved profile' : 'Updated profile'}
            </Badge>
            {(data.learnedMemories?.length ?? 0) > 0 && (
              <Badge variant="neutral">
                {data.learnedMemories.length} new learnings
              </Badge>
            )}
          </div>
          <div>
            <p className="font-micro text-[12px] uppercase tracking-[0.12em] text-fg-muted">
              {report.brand}
            </p>
            <h2 className="mt-2 font-display text-[34px] leading-tight text-fg md:text-[42px]">
              {report.perfumeName}
            </h2>
            <p className="mt-3 max-w-3xl font-body text-[16px] leading-relaxed text-fg-muted">
              {report.summary}
            </p>
          </div>
          <div className="rounded-[8px] border border-border bg-bg-alt p-5">
            <p className="font-micro text-[11px] uppercase tracking-[0.12em] text-fg-muted">
              Aquador customer profile
            </p>
            <p className="mt-2 font-body text-[15px] leading-relaxed text-fg">
              {report.aquadorUse.customerProfile}
            </p>
          </div>
        </div>

        <div className="rounded-[8px] border border-border bg-bg-alt p-5">
          <p className="font-micro text-[11px] uppercase tracking-[0.12em] text-fg-muted">
            Main accords
          </p>
          <div className="mt-5 flex flex-col gap-2">
            {report.mainAccords.map((accord) => {
              const visual = getScentVisual(accord.name);
              const Icon = visual.Icon;
              return (
                <div key={accord.name} className="grid grid-cols-[9rem_1fr_3rem] items-center gap-3">
                  <span className="flex min-w-0 items-center gap-2 font-body text-[14px] text-fg">
                    <span
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: visual.background, color: visual.color }}
                    >
                      <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.6} />
                    </span>
                    <span className="truncate">{accord.name}</span>
                  </span>
                  <div className="h-7 overflow-hidden rounded-sm bg-bg">
                    <div
                      className="h-full rounded-sm"
                      style={{ width: scoreWidth(accord.weight), backgroundColor: accord.color }}
                    />
                  </div>
                  <span className="text-right font-micro text-[11px] text-fg-muted">
                    {Math.round(accord.weight)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-[8px] border border-border bg-bg-alt p-6">
        <div className="mb-7 flex items-center justify-between gap-4 border-b border-border pb-4">
          <p className="font-micro text-[12px] uppercase tracking-[0.12em] text-fg">
            Perfume pyramid
          </p>
          <Sparkles aria-hidden="true" className="h-4 w-4 text-accent" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col gap-8">
          <NoteGroup title="Top notes" notes={report.pyramid.top} />
          <NoteGroup title="Middle notes" notes={report.pyramid.middle} />
          <NoteGroup title="Base notes" notes={report.pyramid.base} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <MetricBlock label="Longevity" metric={report.performance.longevity} />
        <MetricBlock label="Sillage" metric={report.performance.sillage} />
        <MetricBlock label="Gender read" metric={report.demographics.gender} color="bg-[oklch(0.68_0.22_345)]" />
        <MetricBlock label="Price value" metric={report.demographics.value} color="bg-[oklch(0.70_0.16_75)]" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-[8px] border border-border bg-bg-alt p-5">
          <p className="font-micro text-[12px] uppercase tracking-[0.12em] text-fg">
            Selling angles
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {report.aquadorUse.sellingAngles.map((item) => (
              <li key={item} className="font-body text-[14px] leading-relaxed text-fg-muted">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[8px] border border-border bg-bg-alt p-5">
          <p className="font-micro text-[12px] uppercase tracking-[0.12em] text-fg">
            Objections
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {report.aquadorUse.objections.map((item) => (
              <li key={item} className="font-body text-[14px] leading-relaxed text-fg-muted">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[8px] border border-border bg-bg-alt p-5">
          <p className="font-micro text-[12px] uppercase tracking-[0.12em] text-fg">
            Questions to ask
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {report.aquadorUse.questionsToAsk.map((item) => (
              <li key={item} className="font-body text-[14px] leading-relaxed text-fg-muted">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-[8px] border border-border bg-bg-alt p-5">
          <p className="font-micro text-[12px] uppercase tracking-[0.12em] text-fg">
            Aquador matches
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {report.aquadorRecommendations.map((item) => (
              <a
                key={`${item.name}-${item.path}`}
                href={item.path}
                className="rounded-[8px] border border-border bg-bg p-4 transition-colors hover:border-accent"
              >
                <span className="font-micro text-[10px] uppercase tracking-[0.12em] text-fg-muted">
                  {item.brand}
                </span>
                <span className="mt-2 block font-display text-[18px] leading-tight text-fg">
                  {item.name}
                </span>
                <span className="mt-2 block font-body text-[13px] leading-relaxed text-fg-muted">
                  {item.reason}
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="rounded-[8px] border border-border bg-bg-alt p-5">
          <p className="font-micro text-[12px] uppercase tracking-[0.12em] text-fg">
            Reminds customers of
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {report.similarPerfumes.map((item) => (
              <div key={`${item.brand}-${item.name}`} className="rounded-[8px] border border-border bg-bg p-4">
                <span className="font-micro text-[10px] uppercase tracking-[0.12em] text-fg-muted">
                  {item.brand}
                </span>
                <span className="mt-2 block font-display text-[18px] leading-tight text-fg">
                  {item.name}
                </span>
                <span className="mt-2 block font-body text-[13px] leading-relaxed text-fg-muted">
                  {item.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[8px] border border-border bg-bg-alt p-5">
          <p className="font-micro text-[12px] uppercase tracking-[0.12em] text-fg">
            Sources
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {report.sources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-4 rounded-[8px] border border-border bg-bg px-4 py-3 font-body text-[14px] text-fg-muted transition-colors hover:border-accent hover:text-fg"
              >
                <span className="min-w-0 truncate">{source.title}</span>
                <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>

        <div className="rounded-[8px] border border-border bg-bg-alt p-5">
          <div className="flex items-center gap-2">
            <BrainCircuit aria-hidden="true" className="h-4 w-4 text-accent" strokeWidth={1.5} />
            <p className="font-micro text-[12px] uppercase tracking-[0.12em] text-fg">
              Memory
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {memories.length > 0 ? memories.map((memory) => (
              <p
                key={memory.id}
                className="rounded-[8px] border border-border bg-bg p-3 font-body text-[13px] leading-relaxed text-fg-muted"
              >
                {memory.note}
              </p>
            )) : (
              <p className="font-body text-[13px] leading-relaxed text-fg-muted">
                Save what the team learns at the counter. Future profiles for this perfume will use it.
              </p>
            )}
          </div>
          <textarea
            value={memoryNote}
            onChange={(event) => setMemoryNote(event.target.value)}
            className="mt-4 min-h-28 w-full rounded-[8px] border border-border-strong bg-bg px-4 py-3 font-body text-[14px] text-fg outline-none transition-shadow placeholder:text-fg-muted/60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            placeholder="Example: Cyprus customers ask for this when they want a fresh orange opening without a heavy drydown."
          />
          {memoryError && (
            <p className="mt-2 font-micro text-[12px] text-critical">{memoryError}</p>
          )}
          <Button
            className="mt-4 w-full"
            variant="secondary"
            size="sm"
            isLoading={savingMemory}
            disabled={!memoryNote.trim() || savingMemory}
            onClick={saveMemory}
            leadingIcon={<Star className="h-4 w-4" strokeWidth={1.5} />}
          >
            Save learning
          </Button>
        </div>
      </section>
    </div>
  );
}

function HistoryPanel({
  history,
  onSelect,
}: {
  history: PerfumeIntelConversation[];
  onSelect: (conversation: PerfumeIntelConversation) => void;
}) {
  return (
    <aside className="rounded-[8px] border border-border bg-bg-alt p-5">
      <div className="flex items-center gap-2">
        <Clock aria-hidden="true" className="h-4 w-4 text-accent" strokeWidth={1.5} />
        <p className="font-micro text-[12px] uppercase tracking-[0.12em] text-fg">
          Recent research
        </p>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {history.length > 0 ? history.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className="rounded-[8px] border border-border bg-bg px-4 py-3 text-left transition-colors hover:border-accent"
          >
            <span className="block font-display text-[16px] leading-tight text-fg">
              {item.perfumeName}
            </span>
            <span className="mt-1 block font-micro text-[10px] uppercase tracking-[0.12em] text-fg-muted">
              {item.inputType} · {new Date(item.createdAt).toLocaleDateString('en-IE')}
            </span>
          </button>
        )) : (
          <p className="font-body text-[13px] leading-relaxed text-fg-muted">
            Completed profiles will stay here for the team.
          </p>
        )}
      </div>
    </aside>
  );
}

export default function PerfumeIntelClient() {
  const [perfumeName, setPerfumeName] = useState('');
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [data, setData] = useState<PerfumeIntelResponse | null>(null);
  const [memories, setMemories] = useState<PerfumeIntelMemory[]>([]);
  const [history, setHistory] = useState<PerfumeIntelConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusText = useMemo(() => {
    if (!data) return 'Built for Aquador by Qualia Solutions. Use a perfume name, a bottle photo, or both.';
    const generated = new Date(data.generatedAt).toLocaleString('en-IE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    return `${data.cached ? 'Loaded from saved research' : 'Updated profile'} on ${generated}.`;
  }, [data]);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/perfume-intel')
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (active && payload?.history) setHistory(payload.history);
      })
      .catch(() => {
        // History is useful but not required for the first search.
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) {
      setError('Upload a JPEG, PNG, WebP, or AVIF image.');
      return;
    }
    if (file.size > 2_500_000) {
      setError('Image must be under 2.5 MB.');
      return;
    }
    setError(null);
    const dataUrl = await fileToDataUrl(file);
    setSelectedImage({ name: file.name, dataUrl });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = perfumeName.trim();
    if (!query && !selectedImage) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/perfume-intel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perfumeName: query || undefined,
          imageDataUrl: selectedImage?.dataUrl,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Perfume research failed');
      setData(payload);
      setMemories(payload.memories ?? []);
      setHistory(payload.history ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Perfume research failed');
    } finally {
      setLoading(false);
    }
  }

  function selectHistory(conversation: PerfumeIntelConversation) {
    setData({
      report: conversation.report,
      cached: true,
      generatedAt: conversation.createdAt,
      model: '',
      memories: [],
      learnedMemories: conversation.learnedMemories,
      history,
    });
    setPerfumeName(conversation.perfumeName);
    setSelectedImage(null);
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-5 border-b border-border pb-6">
        <div>
          <p className="font-micro text-[12px] uppercase tracking-[0.05em] text-fg-muted">
            Perfume Intelligence
          </p>
          <h1 className="mt-2 font-display text-[30px] leading-tight text-fg">
            Research desk for staff
          </h1>
          <p className="mt-2 max-w-3xl font-body text-[14px] leading-relaxed text-fg-muted">
            Enter a perfume name or upload a bottle photo. The desk returns a clear profile for helping customers at Aquador.
          </p>
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <Input
              label="Perfume name"
              value={perfumeName}
              onChange={(event) => setPerfumeName(event.target.value)}
              placeholder="Orange Tonic Azzaro"
              leadingIcon={<Search className="h-4 w-4" strokeWidth={1.5} />}
            />
            <div className="flex flex-col gap-2">
              <span className="font-micro text-[12px] uppercase tracking-[0.05em] text-fg-muted">
                Bottle photo
              </span>
              <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-border bg-bg-alt px-4 font-micro text-[12px] uppercase tracking-[0.08em] text-fg-muted transition-colors hover:border-accent hover:text-fg">
                <Upload aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
                Upload
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="sr-only"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          </div>

          <Button
            type="submit"
            size="md"
            isLoading={loading}
            disabled={(!perfumeName.trim() && !selectedImage) || loading}
            leadingIcon={<Sparkles className="h-4 w-4" strokeWidth={1.5} />}
          >
            Research
          </Button>
        </form>

        {selectedImage && (
          <div className="flex w-fit items-center gap-3 rounded-[8px] border border-border bg-bg-alt px-4 py-3">
            <ImageIcon aria-hidden="true" className="h-4 w-4 text-accent" strokeWidth={1.5} />
            <span className="max-w-[16rem] truncate font-body text-[13px] text-fg-muted">
              {selectedImage.name}
            </span>
            <button
              type="button"
              aria-label="Remove selected image"
              onClick={() => setSelectedImage(null)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-[4px] text-fg-muted transition-colors hover:bg-bg hover:text-fg"
            >
              <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        )}

        <p className="font-body text-[13px] text-fg-muted">{statusText}</p>
        {error && (
          <p className="rounded-[8px] border border-critical/30 bg-critical/10 px-4 py-3 font-body text-[14px] text-critical">
            {error}
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {data ? (
          <ReportView
            data={data}
            memories={memories}
            onMemorySaved={setMemories}
          />
        ) : (
          <section className="flex min-h-[18rem] items-center justify-center border border-dashed border-border bg-bg-alt/50 px-6 py-12 text-center">
            <div>
              <Sparkles aria-hidden="true" className="mx-auto h-5 w-5 text-accent" strokeWidth={1.5} />
              <p className="mt-4 font-display text-[22px] leading-tight text-fg">
                Ready for the next customer question.
              </p>
              <p className="mt-2 max-w-xl font-body text-[14px] leading-relaxed text-fg-muted">
                Use a perfume name, a bottle photo, or both.
              </p>
            </div>
          </section>
        )}
        <HistoryPanel history={history} onSelect={selectHistory} />
      </div>

      {loading && (
        <div className="fixed bottom-6 right-6 flex items-center gap-3 rounded-[8px] border border-border bg-bg-alt px-4 py-3 shadow-[0_12px_40px_-24px_black]">
          <RefreshCw aria-hidden="true" className="h-4 w-4 animate-spin text-accent" strokeWidth={1.5} />
          <span className="font-micro text-[12px] uppercase tracking-[0.12em] text-fg-muted">
            Researching
          </span>
        </div>
      )}
    </div>
  );
}
