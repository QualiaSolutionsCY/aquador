export interface PerfumeIntelAccord {
  name: string;
  weight: number;
  color: string;
}

export interface PerfumeIntelNote {
  name: string;
  detail?: string;
}

export interface PerfumeIntelMetric {
  label: string;
  score: number;
  evidence: string;
}

export interface PerfumeIntelAlternative {
  name: string;
  brand: string;
  reason: string;
}

export interface PerfumeIntelRecommendation {
  name: string;
  brand: string;
  path: string;
  reason: string;
}

export interface PerfumeIntelSource {
  title: string;
  url: string;
}

export interface PerfumeIntelMemory {
  id: string;
  note: string;
  source: string;
  createdAt: string;
}

export interface PerfumeIntelReport {
  perfumeName: string;
  brand: string;
  audience: string;
  summary: string;
  mainAccords: PerfumeIntelAccord[];
  pyramid: {
    top: PerfumeIntelNote[];
    middle: PerfumeIntelNote[];
    base: PerfumeIntelNote[];
  };
  performance: {
    longevity: PerfumeIntelMetric;
    sillage: PerfumeIntelMetric;
  };
  demographics: {
    gender: PerfumeIntelMetric;
    value: PerfumeIntelMetric;
  };
  aquadorUse: {
    customerProfile: string;
    sellingAngles: string[];
    objections: string[];
    questionsToAsk: string[];
  };
  similarPerfumes: PerfumeIntelAlternative[];
  aquadorRecommendations: PerfumeIntelRecommendation[];
  sources: PerfumeIntelSource[];
}

export interface PerfumeIntelResponse {
  report: PerfumeIntelReport;
  cached: boolean;
  generatedAt: string;
  model: string;
  memories: PerfumeIntelMemory[];
  learnedMemories: string[];
  history: PerfumeIntelConversation[];
}

export interface PerfumeIntelConversation {
  id: string;
  perfumeName: string;
  normalizedQuery: string;
  inputType: 'text' | 'image' | 'mixed';
  report: PerfumeIntelReport;
  learnedMemories: string[];
  createdAt: string;
}
