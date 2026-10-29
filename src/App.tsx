import React, { useState } from 'react';
import { AppTab, CalculationHistoryItem } from './types/calculator';
import { Header } from './components/Header';
import { CalculatorView } from './components/CalculatorView';
import { ReplView } from './components/ReplView';
import { GrapherView } from './components/GrapherView';
import { FormulasView } from './components/FormulasView';
import { VariablesView } from './components/VariablesView';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('calculator');
  const [replCode, setReplCode] = useState<string>('');
  const [variables, setVariables] = useState<Record<string, any>>({
    ans: 44,
  });
  const [history, setHistory] = useState<CalculationHistoryItem[]>([
    {
      id: 'init-1',
      expression: 'math.sqrt(144) + 2**5',
      pythonCode: 'math.sqrt(144) + 2**5',
      result: '44',
      timestamp: '15:20:00',
      executionTimeMs: 0.08,
      explanation: 'Addition of (Call math.sqrt(144)) and (Exponentiation (power) of (2) and (5))',
    },
  ]);

  const handleVariableUpdate = (name: string, val: any) => {
    setVariables((prev) => ({
      ...prev,
      [name]: val,
    }));
  };

  const handleVariableDelete = (name: string) => {
    setVariables((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleClearVariables = () => {
    setVariables({ ans: 0 });
  };

  const handleSendToRepl = (code: string) => {
    setReplCode(code);
    setActiveTab('repl');
  };

  const handleSendToCalculator = (expr: string) => {
    setActiveTab('calculator');
  };

  const handleExportSession = () => {
    // Construct Python script export with imports and recorded session
    const dateStr = new Date().toISOString();
    let content = `"""\nPyCalc Studio - Exported Python Computation Session\nGenerated: ${dateStr}\n"""\n\n`;
    content += `import math\nimport cmath\nimport statistics\nimport decimal\nfrom decimal import Decimal\nimport fractions\nfrom fractions import Fraction\n\n`;

    content += `# --- Session Variables ---\n`;
    Object.entries(variables).forEach(([k, v]) => {
      content += `${k} = ${v}\n`;
    });

    content += `\n# --- Calculation History Log ---\n`;
    history.forEach((h, idx) => {
      content += `# [Step ${idx + 1}] Timestamp: ${h.timestamp}\n`;
      content += `step_${idx + 1} = ${h.expression}\n`;
      content += `print(f"Result ${idx + 1}: {step_${idx + 1}}")\n\n`;
    });

    const blob = new Blob([content], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pycalc_session_${Date.now()}.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onExportSession={handleExportSession}
        historyCount={history.length}
      />

      <main className="flex-1">
        {activeTab === 'calculator' && (
          <CalculatorView
            onSendToRepl={handleSendToRepl}
            variables={variables}
            onVariableUpdate={handleVariableUpdate}
            history={history}
            setHistory={setHistory}
          />
        )}

        {activeTab === 'repl' && (
          <ReplView
            initialCode={replCode}
            variables={variables}
            onVariableUpdate={handleVariableUpdate}
            onClearVariables={handleClearVariables}
          />
        )}

        {activeTab === 'grapher' && <GrapherView />}

        {activeTab === 'formulas' && (
          <FormulasView
            onSendToRepl={handleSendToRepl}
            onSendToCalculator={handleSendToCalculator}
          />
        )}

        {activeTab === 'variables' && (
          <VariablesView
            variables={variables}
            onVariableUpdate={handleVariableUpdate}
            onVariableDelete={handleVariableDelete}
            onClearVariables={handleClearVariables}
            onSendToCalculator={handleSendToCalculator}
          />
        )}
      </main>

      {/* Clean unboxed footer with typographic separators */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-mono">
          <span>Python 3.10 Engine</span>
          <span aria-hidden="true">·</span>
          <span>Standard Math & Statistics</span>
          <span aria-hidden="true">·</span>
          <span>Fraction & Decimal Precision</span>
          <span aria-hidden="true">·</span>
          <span>PyCalc Studio</span>
        </div>
      </footer>
    </div>
  );
}
