import React, { useState, useEffect } from 'react';
import { runPythonScript } from '../utils/pythonApi';
import { Play, RotateCcw, Copy, Check, Terminal, Sparkles, Layers } from 'lucide-react';

interface ReplViewProps {
  initialCode?: string;
  variables: Record<string, any>;
  onVariableUpdate: (name: string, val: any) => void;
  onClearVariables: () => void;
}

const DEFAULT_SCRIPT = `# Interactive Python 3 Math & Scientific Scratchpad
# Standard libraries pre-loaded: math, cmath, statistics, decimal, fractions, itertools

import math
import statistics

# Define data points
measurements = [14.2, 18.5, 12.1, 19.8, 15.6, 22.4, 16.9]

mean_val = statistics.mean(measurements)
stdev_val = statistics.stdev(measurements)

print(f"Dataset: {measurements}")
print(f"Sample Count: {len(measurements)}")
print(f"Arithmetic Mean: {mean_val:.4f}")
print(f"Sample Std Dev:  {stdev_val:.4f}")

# Return final value or expression
{"mean": round(mean_val, 4), "stdev": round(stdev_val, 4)}
`;

export const ReplView: React.FC<ReplViewProps> = ({
  initialCode,
  variables,
  onVariableUpdate,
  onClearVariables,
}) => {
  const [code, setCode] = useState<string>(initialCode || DEFAULT_SCRIPT);
  const [stdout, setStdout] = useState<string>('');
  const [stderr, setStderr] = useState<string>('');
  const [lastResult, setLastResult] = useState<any>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // If initialCode changes from outside (e.g. sent from calculator or formula preset)
  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    }
  }, [initialCode]);

  const handleRun = async () => {
    if (!code.trim()) return;
    setIsRunning(true);
    setStderr('');

    const res = await runPythonScript(code, false, variables);
    setIsRunning(false);

    if (res.success) {
      setStdout(res.stdout || '');
      setStderr(res.stderr || '');
      setLastResult(res.lastResult || null);
      setExecutionTimeMs(res.executionTimeMs ?? null);

      if (res.variables) {
        Object.entries(res.variables).forEach(([k, info]) => {
          onVariableUpdate(k, info.value);
        });
      }
    } else {
      setStderr(res.error || 'Execution failed');
      setStdout(res.stdout || '');
      setLastResult(null);
      setExecutionTimeMs(res.executionTimeMs ?? null);
    }
  };

  const insertSnippet = (snippet: string) => {
    setCode((prev) => prev + '\n' + snippet);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Script Editor (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            {/* Editor Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-semibold text-slate-200">
                  python3_session.py
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => setCode('')}
                  className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
                  title="Run Script (Ctrl+Enter)"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isRunning ? 'Executing...' : 'Run Code'}</span>
                </button>
              </div>
            </div>

            {/* Multi-line Code Input */}
            <div className="relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleRun();
                  }
                }}
                rows={16}
                placeholder="Write Python code here... (press Ctrl+Enter to execute)"
                className="w-full bg-slate-950 text-slate-200 font-mono text-xs md:text-sm p-4 rounded-lg border border-slate-800 focus:outline-none focus:border-slate-700 leading-relaxed resize-y"
                spellCheck={false}
              />
            </div>

            {/* Quick Math Snippet Helpers */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-mono text-[11px] mr-1">Insert template:</span>
              <button
                onClick={() =>
                  insertSnippet(
                    `# List comprehension\nsquares = [x**2 for x in range(1, 11)]\nprint("Squares:", squares)`
                  )
                }
                className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded font-mono text-[11px] transition-colors"
              >
                + List Comp
              </button>
              <button
                onClick={() =>
                  insertSnippet(
                    `# User function\ndef factorial_rec(n):\n    return 1 if n <= 1 else n * factorial_rec(n - 1)\nfactorial_rec(8)`
                  )
                }
                className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded font-mono text-[11px] transition-colors"
              >
                + Recursion
              </button>
              <button
                onClick={() =>
                  insertSnippet(
                    `# Fractions & Decimals\nfrom fractions import Fraction\nfrom decimal import Decimal\nf1 = Fraction(3, 7)\nf2 = Fraction(2, 5)\nprint(f"{f1} + {f2} =", f1 + f2)`
                  )
                }
                className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded font-mono text-[11px] transition-colors"
              >
                + Fractions
              </button>
              <button
                onClick={() =>
                  insertSnippet(
                    `# Complex numbers\nz1 = 3 + 4j\nz2 = 1 - 2j\nprint("Product:", z1 * z2)\nprint("Magnitude:", abs(z1))`
                  )
                }
                className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded font-mono text-[11px] transition-colors"
              >
                + Complex Numbers
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Execution Output & State (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Console Output Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col min-h-[380px]">
            <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-200 font-mono">Terminal Output</span>
              </div>
              <div className="flex items-center gap-2">
                {executionTimeMs !== null && (
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded tabular-nums">
                    {executionTimeMs} ms
                  </span>
                )}
                {(stdout || stderr || lastResult) && (
                  <button
                    onClick={() => {
                      setStdout('');
                      setStderr('');
                      setLastResult(null);
                      setExecutionTimeMs(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Clear Output
                  </button>
                )}
              </div>
            </div>

            {/* Console Screen */}
            <div className="flex-1 bg-slate-950 border border-slate-800/80 rounded-lg p-4 font-mono text-xs overflow-y-auto max-h-[420px] flex flex-col gap-3">
              {!stdout && !stderr && !lastResult ? (
                <div className="text-slate-600 italic py-16 text-center">
                  Press 'Run Code' or Ctrl+Enter to execute Python code.
                  <br />
                  Outputs and returned values will be streamed here.
                </div>
              ) : null}

              {/* Standard Output (print statements) */}
              {stdout && (
                <div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">
                    Standard Out (stdout):
                  </div>
                  <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-900/60 p-3 rounded border border-slate-800/60">
                    {stdout}
                  </pre>
                </div>
              )}

              {/* Return Value / Evaluated Expression */}
              {lastResult && (
                <div>
                  <div className="text-[11px] text-emerald-500 uppercase tracking-wider mb-1 font-semibold">
                    Evaluated Value (ans):
                  </div>
                  <div className="bg-emerald-950/20 border border-emerald-800/40 p-3 rounded text-emerald-300 font-bold whitespace-pre-wrap">
                    {lastResult.formatted}
                    <div className="text-[11px] text-emerald-500/80 font-normal mt-1">
                      type: {lastResult.type}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Traceback (if any) */}
              {stderr && (
                <div>
                  <div className="text-[11px] text-rose-500 uppercase tracking-wider mb-1 font-semibold">
                    Runtime Traceback (stderr):
                  </div>
                  <pre className="text-rose-400 whitespace-pre-wrap leading-relaxed bg-rose-950/20 p-3 rounded border border-rose-900/40">
                    {stderr}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Session Variables in REPL */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm text-xs font-mono">
            <div className="flex items-center justify-between text-slate-300 font-semibold mb-2">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Session Variables ({Object.keys(variables).length})
              </span>
              {Object.keys(variables).length > 0 && (
                <button
                  onClick={onClearVariables}
                  className="text-slate-500 hover:text-slate-300 text-[11px] transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            {Object.keys(variables).length === 0 ? (
              <div className="text-slate-500 py-2">No variables assigned yet.</div>
            ) : (
              <div className="space-y-1 max-h-[140px] overflow-y-auto">
                {Object.entries(variables).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-0.5 border-b border-slate-800/40">
                    <span className="text-emerald-400 font-semibold">{k}</span>
                    <span className="text-slate-300 truncate max-w-[200px]">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
