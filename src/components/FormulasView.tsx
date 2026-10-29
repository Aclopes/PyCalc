import React, { useState } from 'react';
import { FORMULA_PRESETS } from '../data/presets';
import { FormulaPreset } from '../types/calculator';
import { runPythonScript } from '../utils/pythonApi';
import { BookOpen, Play, ArrowRight, Check, Copy } from 'lucide-react';

interface FormulasViewProps {
  onSendToRepl: (code: string) => void;
  onSendToCalculator: (expr: string) => void;
}

export const FormulasView: React.FC<FormulasViewProps> = ({
  onSendToRepl,
  onSendToCalculator,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [results, setResults] = useState<Record<string, { stdout: string; isRunning: boolean }>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['All', 'Algebra', 'Trigonometry', 'Statistics', 'Finance', 'Physics'];

  const filteredPresets =
    selectedCategory === 'All'
      ? FORMULA_PRESETS
      : FORMULA_PRESETS.filter((p) => p.category === selectedCategory);

  const handleRunPreset = async (preset: FormulaPreset) => {
    setResults((prev) => ({
      ...prev,
      [preset.id]: { stdout: '', isRunning: true },
    }));

    const res = await runPythonScript(preset.pythonSnippet, false);

    setResults((prev) => ({
      ...prev,
      [preset.id]: {
        stdout: res.stdout || res.error || (res.lastResult ? res.lastResult.formatted : 'Executed.'),
        isRunning: false,
      },
    }));
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
      {/* Category Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Python Mathematical Formula Library</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real Python scientific algorithms, kinematics, statistics, and algebraic models.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-slate-800 text-slate-100 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Formula Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPresets.map((preset) => {
          const runState = results[preset.id] || { stdout: '', isRunning: false };

          return (
            <div
              key={preset.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Title & Category */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-slate-100">{preset.title}</h3>
                  <span className="text-xs font-mono text-slate-400">{preset.category}</span>
                </div>

                <p className="text-xs text-slate-400 mb-3">{preset.description}</p>

                {/* Math Formula Display Box */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 mb-3 font-mono text-xs text-emerald-400 overflow-x-auto">
                  {preset.mathNotation}
                </div>

                {/* Python Snippet Box */}
                <div className="relative mb-3">
                  <pre className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/60 font-mono text-xs text-slate-300 overflow-x-auto max-h-[140px] leading-relaxed">
                    {preset.pythonSnippet}
                  </pre>
                  <button
                    onClick={() => handleCopyCode(preset.id, preset.pythonSnippet)}
                    className="absolute top-2 right-2 p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded transition-colors"
                    title="Copy code"
                  >
                    {copiedId === preset.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* Execution Output (if run) */}
                {runState.stdout && (
                  <div className="bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-lg font-mono text-xs text-emerald-300 whitespace-pre-wrap mb-3">
                    {runState.stdout}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800 mt-2">
                <button
                  onClick={() => handleRunPreset(preset)}
                  disabled={runState.isRunning}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-semibold rounded-lg transition-colors font-mono"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{runState.isRunning ? 'Running...' : 'Execute in Python'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSendToRepl(preset.pythonSnippet)}
                    className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <span>Open in REPL</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
