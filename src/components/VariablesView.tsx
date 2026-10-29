import React, { useState } from 'react';
import { Layers, Plus, Trash2, ArrowRight } from 'lucide-react';
import { evaluatePythonExpression } from '../utils/pythonApi';

interface VariablesViewProps {
  variables: Record<string, any>;
  onVariableUpdate: (name: string, val: any) => void;
  onVariableDelete: (name: string) => void;
  onClearVariables: () => void;
  onSendToCalculator: (expr: string) => void;
}

export const VariablesView: React.FC<VariablesViewProps> = ({
  variables,
  onVariableUpdate,
  onVariableDelete,
  onClearVariables,
  onSendToCalculator,
}) => {
  const [newVarName, setNewVarName] = useState<string>('');
  const [newVarVal, setNewVarVal] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddVariable = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const name = newVarName.trim();
    const val = newVarVal.trim();

    if (!name || !val) {
      setErrorMsg('Both variable name and expression value are required.');
      return;
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      setErrorMsg('Variable name must be a valid Python identifier.');
      return;
    }

    // Evaluate in Python
    const res = await evaluatePythonExpression(`${name} = ${val}`, false, variables);
    if (res.success) {
      onVariableUpdate(name, res.result);
      setNewVarName('');
      setNewVarVal('');
    } else {
      setErrorMsg(res.error || 'Failed to evaluate variable expression in Python.');
    }
  };

  const varList = Object.entries(variables);

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Python Workspace Variables</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Variables persist across the calculator, script REPL, and function plotting sessions.
          </p>
        </div>

        {varList.length > 0 && (
          <button
            onClick={onClearVariables}
            className="px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-200 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/50 rounded-lg transition-colors"
          >
            Clear All Variables
          </button>
        )}
      </div>

      {/* Add New Variable Form */}
      <form
        onSubmit={handleAddVariable}
        className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-sm"
      >
        <div className="text-xs font-semibold text-slate-200 font-mono uppercase tracking-wider mb-3">
          Assign New Variable
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-4">
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Variable Name:
            </label>
            <input
              type="text"
              value={newVarName}
              onChange={(e) => setNewVarName(e.target.value)}
              placeholder="e.g. radius or initial_velocity"
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-slate-700"
            />
          </div>

          <div className="md:col-span-5">
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Python Expression / Value:
            </label>
            <input
              type="text"
              value={newVarVal}
              onChange={(e) => setNewVarVal(e.target.value)}
              placeholder="e.g. 15.5 or math.pi * 4"
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-slate-700"
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors font-mono"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign in Python</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 text-xs font-mono text-rose-400 bg-rose-950/20 border border-rose-900/40 p-2.5 rounded-lg">
            {errorMsg}
          </div>
        )}
      </form>

      {/* Variables Table / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-3 border-b border-slate-800 mb-3 font-semibold">
          <span>Variable Name</span>
          <div className="flex items-center gap-12 pr-4">
            <span>Python Value</span>
            <span>Actions</span>
          </div>
        </div>

        {varList.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs font-mono">
            No variables assigned yet. Variables created in the calculator or REPL appear here.
          </div>
        ) : (
          <div className="space-y-2">
            {varList.map(([name, val]) => (
              <div
                key={name}
                className="flex items-center justify-between p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg font-mono text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">{name}</span>
                  <span className="text-slate-600">=</span>
                </div>

                <div className="flex items-center gap-6">
                  <span className="text-slate-200 tabular-nums max-w-[280px] truncate text-right">
                    {String(val)}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSendToCalculator(name)}
                      className="px-2 py-1 text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded transition-colors text-[11px] flex items-center gap-1"
                      title="Use in calculator expression"
                    >
                      <span>Use</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onVariableDelete(name)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete variable"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
