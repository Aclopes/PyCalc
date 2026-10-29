import { CalculationDetails, PlotResponse } from '../types/calculator';

export interface EvalApiResponse {
  success: boolean;
  result?: string;
  details?: CalculationDetails;
  executionTimeMs?: number;
  explanation?: string | null;
  stdout?: string;
  updatedVariables?: Record<string, any>;
  error?: string;
  hint?: string;
}

export interface RunApiResponse {
  success: boolean;
  stdout?: string;
  stderr?: string;
  lastResult?: CalculationDetails | null;
  variables?: Record<string, { type: string; value: string }>;
  executionTimeMs?: number;
  error?: string;
}

export async function evaluatePythonExpression(
  code: string,
  degMode: boolean = false,
  variables: Record<string, any> = {}
): Promise<EvalApiResponse> {
  try {
    const res = await fetch('/api/python/eval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, degMode, variables }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `HTTP ${res.status}: ${text || res.statusText}` };
    }

    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: `Connection error: ${err.message || 'Cannot reach Python engine'}`,
      hint: 'Ensure server is running or refresh the application.',
    };
  }
}

export async function runPythonScript(
  code: string,
  degMode: boolean = false,
  variables: Record<string, any> = {}
): Promise<RunApiResponse> {
  try {
    const res = await fetch('/api/python/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, degMode, variables }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `HTTP ${res.status}: ${text || res.statusText}` };
    }

    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: `Execution failed: ${err.message || 'Network error'}`,
    };
  }
}

export async function plotPythonFormula(
  formula: string,
  xMin: number = -10,
  xMax: number = 10,
  samples: number = 200
): Promise<PlotResponse> {
  try {
    const res = await fetch('/api/python/plot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formula, xMin, xMax, samples }),
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        success: false,
        error: `HTTP ${res.status}: ${text || res.statusText}`,
        formula,
        xMin,
        xMax,
        yMin: -1,
        yMax: 1,
        points: [],
        roots: [],
        samples: 0,
        executionTimeMs: 0,
      };
    }

    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to reach plot service',
      formula,
      xMin,
      xMax,
      yMin: -1,
      yMax: 1,
      points: [],
      roots: [],
      samples: 0,
      executionTimeMs: 0,
    };
  }
}
