import React from 'react';
import { AppTab } from '../types/calculator';
import { Terminal, Download, Calculator, LineChart, BookOpen, Layers } from 'lucide-react';

interface HeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onExportSession: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onExportSession,
  historyCount,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
          py
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0">
          PyCalc Studio
        </span>
      </div>

      {/* Zone 2: Clean single-line nav tabs */}
      <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-900/90 rounded-lg border border-slate-800/80">
        <button
          onClick={() => onTabChange('calculator')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'calculator'
              ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Calculator</span>
        </button>

        <button
          onClick={() => onTabChange('repl')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'repl'
              ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Script REPL</span>
        </button>

        <button
          onClick={() => onTabChange('grapher')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'grapher'
              ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LineChart className="w-3.5 h-3.5" />
          <span>Function Grapher</span>
        </button>

        <button
          onClick={() => onTabChange('formulas')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'formulas'
              ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Formula Library</span>
        </button>

        <button
          onClick={() => onTabChange('variables')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'variables'
              ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Variables</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onExportSession}
          title="Export calculations and code to Python file"
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export .py Script</span>
        </button>
      </div>
    </header>
  );
};
