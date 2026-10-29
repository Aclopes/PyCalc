export type AppTab = 'calculator' | 'repl' | 'grapher' | 'formulas' | 'variables';

export type ResultRepresentation = 'standard' | 'fraction' | 'scientific' | 'hex' | 'binary';

export interface CalculationDetails {
  formatted: string;
  type: string;
  raw: string;
  fraction?: string | null;
  scientific?: string | null;
  hex?: string | null;
  bin?: string | null;
}

export interface CalculationHistoryItem {
  id: string;
  expression: string;
  pythonCode: string;
  result: string;
  details?: CalculationDetails;
  timestamp: string;
  executionTimeMs?: number;
  explanation?: string | null;
  error?: string | null;
}

export interface SessionVariable {
  name: string;
  type: string;
  value: string;
  isNumeric: boolean;
}

export interface FormulaPreset {
  id: string;
  title: string;
  category: 'Algebra' | 'Trigonometry' | 'Statistics' | 'Finance' | 'Physics';
  mathNotation: string;
  description: string;
  pythonSnippet: string;
  defaultInputs?: Record<string, number | string>;
  computeFn?: string;
}

export interface PlotPoint {
  x: number;
  y: number | null;
  valid: boolean;
}

export interface PlotResponse {
  success: boolean;
  formula: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  points: PlotPoint[];
  roots: number[];
  samples: number;
  executionTimeMs: number;
  error?: string;
}
