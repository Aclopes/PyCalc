import React, { useState, useEffect, useRef } from 'react';
import {
  CalculationHistoryItem,
  ResultRepresentation,
  CalculationDetails,
} from '../types/calculator';
import { evaluatePythonExpression } from '../utils/pythonApi';
import {
  Copy,
  Check,
  RotateCcw,
  Delete,
  Clock,
  ArrowRight,
  Code2,
  HelpCircle,
  Cpu,
} from 'lucide-react';

interface CalculatorViewProps {
  onSendToRepl: (code: string) => void;
  variables: Record<string, any>;
  onVariableUpdate: (name: string, val: any) => void;
  history: CalculationHistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<CalculationHistoryItem[]>>;
}

export const CalculatorView: React.FC<CalculatorViewProps> = ({
  onSendToRepl,
  variables,
  onVariableUpdate,
  history,
  setHistory,
}) => {
  const [expression, setExpression] = useState<string>('math.sqrt(144) + 2**5');
  const [currentResult, setCurrentResult] = useState<string>('44');
  const [currentDetails, setCurrentDetails] = useState<CalculationDetails | null>({
    formatted: '44',
    type: 'float',
    raw: '44.0',
    fraction: null,
    scientific: '4.400000e+01',
    hex: null,
    bin: null,
  });
  const [explanation, setExplanation] = useState<string | null>(
    'Addition of (Call math.sqrt(144)) and (Exponentiation (power) of (2) and (5))'
  );
  const [isDegMode, setIsDegMode] = useState<boolean>(false);
  const [representation, setRepresentation] = useState<ResultRepresentation>('standard');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [memoryVal, setMemoryVal] = useState<number>(0);
  const [showScientificGroup, setShowScientificGroup] = useState<'trig' | 'powers' | 'combinatorics'>('powers');

  const inputRef = useRef<HTMLInputElement>(null);

  // Execute calculation using Python Engine
  const calculate = async (codeToRun?: string) => {
    const expr = (codeToRun !== undefined ? codeToRun : expression).trim();
    if (!expr) return;

    setIsLoading(true);
    setErrorMessage(null);

    const res = await evaluatePythonExpression(expr, isDegMode, variables);
    setIsLoading(false);

    if (res.success && res.result !== undefined) {
      setCurrentResult(res.result);
      setCurrentDetails(res.details || null);
      setExplanation(res.explanation || null);

      if (res.updatedVariables) {
        Object.entries(res.updatedVariables).forEach(([k, v]) => {
          onVariableUpdate(k, v);
        });
      }

      // Add to history
      const historyItem: CalculationHistoryItem = {
        id: Date.now().toString(),
        expression: expr,
        pythonCode: expr,
        result: res.result,
        details: res.details,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        executionTimeMs: res.executionTimeMs,
        explanation: res.explanation,
      };

      setHistory((prev) => [historyItem, ...prev.slice(0, 49)]);
    } else {
      setErrorMessage(res.error || 'Syntax or evaluation error in Python expression');
    }
  };

  // Keyboard support for calculator
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is focused on the input field, allow standard typing
      if (document.activeElement === inputRef.current) {
        if (e.key === 'Enter') {
          e.preventDefault();
          calculate();
        }
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        calculate();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setExpression('');
        setErrorMessage(null);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setExpression((prev) => prev.slice(0, -1));
      } else if ('0123456789+-*/.()'.includes(e.key)) {
        e.preventDefault();
        setExpression((prev) => prev + e.key);
      } else if (e.key === '^') {
        e.preventDefault();
        setExpression((prev) => prev + '**');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expression, isDegMode, variables]);

  const insertToken = (token: string, wrapInParens: boolean = false) => {
    setErrorMessage(null);
    if (wrapInParens) {
      setExpression((prev) => {
        if (!prev) return `${token}()`;
        return `${token}(${prev})`;
      });
    } else {
      setExpression((prev) => prev + token);
    }
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setExpression('');
    setCurrentResult('0');
    setCurrentDetails(null);
    setErrorMessage(null);
    setExplanation(null);
    inputRef.current?.focus();
  };

  const handleDelete = () => {
    setExpression((prev) => prev.slice(0, -1));
    inputRef.current?.focus();
  };

  const copyPythonCode = () => {
    navigator.clipboard.writeText(expression);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Memory operations
  const handleMemory = (op: 'MC' | 'MR' | 'M+' | 'M-' | 'MS') => {
    const num = parseFloat(currentResult) || 0;
    if (op === 'MC') setMemoryVal(0);
    else if (op === 'MR') insertToken(memoryVal.toString());
    else if (op === 'M+') setMemoryVal((m) => m + num);
    else if (op === 'M-') setMemoryVal((m) => m - num);
    else if (op === 'MS') setMemoryVal(num);
  };

  // Format displayed output according to chosen representation
  const getDisplayOutput = () => {
    if (!currentDetails) return currentResult;
    if (representation === 'fraction' && currentDetails.fraction) {
      return currentDetails.fraction;
    }
    if (representation === 'scientific' && currentDetails.scientific) {
      return currentDetails.scientific;
    }
    if (representation === 'hex' && currentDetails.hex) {
      return currentDetails.hex;
    }
    if (representation === 'binary' && currentDetails.bin) {
      return currentDetails.bin;
    }
    return currentDetails.formatted;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
      {/* 2-column console layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Calculator Center Column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Display Console Screen */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
            {/* Top Bar inside Display: Angle Mode & Representation Selectors */}
            <div className="flex items-center justify-between gap-4 mb-3 border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsDegMode(false)}
                  className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors ${
                    !isDegMode ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Angles in Radians"
                >
                  RAD
                </button>
                <button
                  onClick={() => setIsDegMode(true)}
                  className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors ${
                    isDegMode ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Angles in Degrees"
                >
                  DEG
                </button>
                {memoryVal !== 0 && (
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                    M = {memoryVal}
                  </span>
                )}
              </div>

              {/* Format Selectors */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-md border border-slate-800 text-xs font-mono">
                {(['standard', 'fraction', 'scientific', 'hex', 'binary'] as ResultRepresentation[]).map((rep) => (
                  <button
                    key={rep}
                    onClick={() => setRepresentation(rep)}
                    className={`px-2 py-0.5 capitalize rounded transition-colors ${
                      representation === rep
                        ? 'bg-slate-800 text-slate-100 font-semibold'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {rep === 'standard' ? 'Standard' : rep === 'fraction' ? 'Fraction' : rep === 'scientific' ? 'Sci' : rep === 'hex' ? 'Hex' : 'Bin'}
                  </button>
                ))}
              </div>
            </div>

            {/* Editable Expression Field */}
            <div className="relative mb-2">
              <input
                ref={inputRef}
                type="text"
                value={expression}
                onChange={(e) => {
                  setExpression(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="Enter expression (e.g. math.sin(math.pi/4) or 2**10)..."
                className="w-full bg-transparent text-slate-300 font-mono text-base tracking-wide focus:outline-none border-b border-transparent focus:border-slate-700 pb-1"
              />
            </div>

            {/* Computed Result Display */}
            <div className="flex items-baseline justify-end gap-3 min-h-[52px] py-1">
              {isLoading ? (
                <div className="flex items-center gap-2 text-slate-400 font-mono text-sm py-2">
                  <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <span>Computing via Python 3...</span>
                </div>
              ) : errorMessage ? (
                <div className="text-rose-400 font-mono text-sm tracking-tight text-right w-full">
                  <span className="text-rose-500 font-semibold">Error:</span> {errorMessage}
                </div>
              ) : (
                <div className="text-right">
                  <div className="text-3xl md:text-4xl font-bold font-mono tabular-nums text-slate-100 tracking-tight">
                    {getDisplayOutput()}
                  </div>
                  {currentDetails && (
                    <div className="text-xs text-slate-400 font-mono flex items-center justify-end gap-2 mt-1">
                      <span>type: {currentDetails.type}</span>
                      {currentDetails.fraction && representation !== 'fraction' && (
                        <span>· frac: {currentDetails.fraction}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Python Code Translation Card */}
            <div className="mt-4 pt-3 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 -mx-5 -mb-5 px-5 py-2.5">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 truncate max-w-lg">
                <Code2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-500 shrink-0">python:</span>
                <span className="text-slate-300 truncate font-semibold">{expression || '—'}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={copyPythonCode}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700/80 rounded transition-colors"
                  title="Copy Python code to clipboard"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                </button>
                <button
                  onClick={() => onSendToRepl(expression)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:text-emerald-200 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 rounded transition-colors"
                  title="Open code in multi-line REPL script editor"
                >
                  <span>Open in REPL</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* AST / Operation Explanation Note */}
          {explanation && (
            <div className="flex items-start gap-2.5 px-4 py-2.5 bg-slate-900/50 border border-slate-800/80 rounded-lg text-xs text-slate-400">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <div className="flex-1 font-mono leading-relaxed">
                <span className="text-slate-300 font-semibold">Evaluation Structure: </span>
                {explanation}
              </div>
            </div>
          )}

          {/* Scientific Keypad Section */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
            {/* Memory Toolbar & Sub-mode tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
              {/* Memory Keys */}
              <div className="flex items-center gap-1">
                {(['MC', 'MR', 'M+', 'M-', 'MS'] as const).map((mKey) => (
                  <button
                    key={mKey}
                    onClick={() => handleMemory(mKey)}
                    className="px-2.5 py-1 text-xs font-mono font-medium text-slate-400 hover:text-slate-100 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded transition-colors"
                  >
                    {mKey}
                  </button>
                ))}
              </div>

              {/* Function Group Tabs */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setShowScientificGroup('powers')}
                  className={`px-3 py-1 rounded transition-colors font-medium ${
                    showScientificGroup === 'powers'
                      ? 'bg-slate-800 text-slate-100'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Powers & Logs
                </button>
                <button
                  onClick={() => setShowScientificGroup('trig')}
                  className={`px-3 py-1 rounded transition-colors font-medium ${
                    showScientificGroup === 'trig'
                      ? 'bg-slate-800 text-slate-100'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Trigonometry
                </button>
                <button
                  onClick={() => setShowScientificGroup('combinatorics')}
                  className={`px-3 py-1 rounded transition-colors font-medium ${
                    showScientificGroup === 'combinatorics'
                      ? 'bg-slate-800 text-slate-100'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Math & Combinatorics
                </button>
              </div>
            </div>

            {/* Function Drawer Based on Active Category */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-4 bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
              {showScientificGroup === 'powers' && (
                <>
                  <button
                    onClick={() => insertToken('math.sqrt(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded border border-slate-800 transition-colors"
                  >
                    √x (sqrt)
                  </button>
                  <button
                    onClick={() => insertToken('math.cbrt(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded border border-slate-800 transition-colors"
                  >
                    ∛x (cbrt)
                  </button>
                  <button
                    onClick={() => insertToken('**2')}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-200 rounded border border-slate-800 transition-colors"
                  >
                    x²
                  </button>
                  <button
                    onClick={() => insertToken('**3')}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-200 rounded border border-slate-800 transition-colors"
                  >
                    x³
                  </button>
                  <button
                    onClick={() => insertToken('**')}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-200 rounded border border-slate-800 transition-colors"
                  >
                    xʸ (pow)
                  </button>
                  <button
                    onClick={() => insertToken('math.exp(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded border border-slate-800 transition-colors"
                  >
                    eˣ (exp)
                  </button>
                  <button
                    onClick={() => insertToken('math.log(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded border border-slate-800 transition-colors"
                  >
                    ln(x)
                  </button>
                  <button
                    onClick={() => insertToken('math.log10(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded border border-slate-800 transition-colors"
                  >
                    log₁₀(x)
                  </button>
                  <button
                    onClick={() => insertToken('math.log2(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded border border-slate-800 transition-colors"
                  >
                    log₂(x)
                  </button>
                  <button
                    onClick={() => insertToken('1 / (', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-200 rounded border border-slate-800 transition-colors"
                  >
                    1/x
                  </button>
                  <button
                    onClick={() => insertToken('abs(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-200 rounded border border-slate-800 transition-colors"
                  >
                    |x| (abs)
                  </button>
                  <button
                    onClick={() => insertToken('10**')}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-200 rounded border border-slate-800 transition-colors"
                  >
                    10ˣ
                  </button>
                </>
              )}

              {showScientificGroup === 'trig' && (
                <>
                  <button
                    onClick={() => insertToken('sin(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded border border-slate-800 transition-colors"
                  >
                    sin
                  </button>
                  <button
                    onClick={() => insertToken('cos(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded border border-slate-800 transition-colors"
                  >
                    cos
                  </button>
                  <button
                    onClick={() => insertToken('tan(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded border border-slate-800 transition-colors"
                  >
                    tan
                  </button>
                  <button
                    onClick={() => insertToken('asin(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded border border-slate-800 transition-colors"
                  >
                    asin (sin⁻¹)
                  </button>
                  <button
                    onClick={() => insertToken('acos(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded border border-slate-800 transition-colors"
                  >
                    acos (cos⁻¹)
                  </button>
                  <button
                    onClick={() => insertToken('atan(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded border border-slate-800 transition-colors"
                  >
                    atan (tan⁻¹)
                  </button>
                  <button
                    onClick={() => insertToken('sinh(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors"
                  >
                    sinh
                  </button>
                  <button
                    onClick={() => insertToken('cosh(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors"
                  >
                    cosh
                  </button>
                  <button
                    onClick={() => insertToken('tanh(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors"
                  >
                    tanh
                  </button>
                  <button
                    onClick={() => insertToken('math.hypot(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors"
                  >
                    hypot(x,y)
                  </button>
                  <button
                    onClick={() => insertToken('radians(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-400 rounded border border-slate-800 transition-colors"
                  >
                    rad(x)
                  </button>
                  <button
                    onClick={() => insertToken('degrees(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-400 rounded border border-slate-800 transition-colors"
                  >
                    deg(x)
                  </button>
                </>
              )}

              {showScientificGroup === 'combinatorics' && (
                <>
                  <button
                    onClick={() => insertToken('factorial(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded border border-slate-800 transition-colors"
                  >
                    n! (factorial)
                  </button>
                  <button
                    onClick={() => insertToken('comb(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded border border-slate-800 transition-colors"
                  >
                    comb(n, k)
                  </button>
                  <button
                    onClick={() => insertToken('perm(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded border border-slate-800 transition-colors"
                  >
                    perm(n, k)
                  </button>
                  <button
                    onClick={() => insertToken('gcd(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors"
                  >
                    gcd(a, b)
                  </button>
                  <button
                    onClick={() => insertToken('lcm(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors"
                  >
                    lcm(a, b)
                  </button>
                  <button
                    onClick={() => insertToken('round(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors"
                  >
                    round(x, n)
                  </button>
                  <button
                    onClick={() => insertToken('floor(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors"
                  >
                    floor(x)
                  </button>
                  <button
                    onClick={() => insertToken('ceil(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors"
                  >
                    ceil(x)
                  </button>
                  <button
                    onClick={() => insertToken('Fraction(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded border border-slate-800 transition-colors"
                  >
                    Fraction(n,d)
                  </button>
                  <button
                    onClick={() => insertToken('Decimal(', false)}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded border border-slate-800 transition-colors"
                  >
                    Decimal('x')
                  </button>
                  <button
                    onClick={() => insertToken('math.pi')}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors"
                  >
                    π (pi)
                  </button>
                  <button
                    onClick={() => insertToken('math.e')}
                    className="px-3 py-2 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors"
                  >
                    e (euler)
                  </button>
                </>
              )}
            </div>

            {/* Standard Keypad Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
              {/* Row 1 */}
              <button
                onClick={handleClear}
                className="py-3 px-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-mono text-sm font-semibold rounded-lg border border-rose-800/50 transition-colors"
              >
                AC
              </button>
              <button
                onClick={handleDelete}
                className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-sm rounded-lg border border-slate-700/60 transition-colors flex items-center justify-center"
                title="Backspace"
              >
                <Delete className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertToken('(')}
                className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-sm font-semibold rounded-lg border border-slate-700/60 transition-colors"
              >
                (
              </button>
              <button
                onClick={() => insertToken(')')}
                className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-sm font-semibold rounded-lg border border-slate-700/60 transition-colors"
              >
                )
              </button>
              <button
                onClick={() => insertToken(' / ')}
                className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono text-base font-semibold rounded-lg border border-slate-700/60 transition-colors"
              >
                ÷
              </button>

              {/* Row 2 */}
              <button
                onClick={() => insertToken('7')}
                className="py-3.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-100 font-mono text-base font-semibold rounded-lg border border-slate-800/80 transition-colors"
              >
                7
              </button>
              <button
                onClick={() => insertToken('8')}
                className="py-3.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-100 font-mono text-base font-semibold rounded-lg border border-slate-800/80 transition-colors"
              >
                8
              </button>
              <button
                onClick={() => insertToken('9')}
                className="py-3.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-100 font-mono text-base font-semibold rounded-lg border border-slate-800/80 transition-colors"
              >
                9
              </button>
              <button
                onClick={() => insertToken(' * ')}
                className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono text-base font-semibold rounded-lg border border-slate-700/60 transition-colors"
              >
                ×
              </button>
              <button
                onClick={() => insertToken(' // ')}
                className="py-3 px-3 bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded-lg border border-slate-700/60 transition-colors"
                title="Integer Division (//)"
              >
                // (div)
              </button>

              {/* Row 3 */}
              <button
                onClick={() => insertToken('4')}
                className="py-3.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-100 font-mono text-base font-semibold rounded-lg border border-slate-800/80 transition-colors"
              >
                4
              </button>
              <button
                onClick={() => insertToken('5')}
                className="py-3.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-100 font-mono text-base font-semibold rounded-lg border border-slate-800/80 transition-colors"
              >
                5
              </button>
              <button
                onClick={() => insertToken('6')}
                className="py-3.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-100 font-mono text-base font-semibold rounded-lg border border-slate-800/80 transition-colors"
              >
                6
              </button>
              <button
                onClick={() => insertToken(' - ')}
                className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono text-base font-semibold rounded-lg border border-slate-700/60 transition-colors"
              >
                −
              </button>
              <button
                onClick={() => insertToken(' % ')}
                className="py-3 px-3 bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded-lg border border-slate-700/60 transition-colors"
                title="Modulo Remainder (%)"
              >
                % (mod)
              </button>

              {/* Row 4 */}
              <button
                onClick={() => insertToken('1')}
                className="py-3.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-100 font-mono text-base font-semibold rounded-lg border border-slate-800/80 transition-colors"
              >
                1
              </button>
              <button
                onClick={() => insertToken('2')}
                className="py-3.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-100 font-mono text-base font-semibold rounded-lg border border-slate-800/80 transition-colors"
              >
                2
              </button>
              <button
                onClick={() => insertToken('3')}
                className="py-3.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-100 font-mono text-base font-semibold rounded-lg border border-slate-800/80 transition-colors"
              >
                3
              </button>
              <button
                onClick={() => insertToken(' + ')}
                className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono text-base font-semibold rounded-lg border border-slate-700/60 transition-colors"
              >
                +
              </button>
              <button
                onClick={() => insertToken('ans')}
                className="py-3 px-3 bg-slate-800/90 hover:bg-slate-700 text-cyan-300 font-mono text-xs rounded-lg border border-slate-700/60 transition-colors"
                title="Previous Result Variable (ans)"
              >
                ans
              </button>

              {/* Row 5 */}
              <button
                onClick={() => insertToken('0')}
                className="py-3.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-100 font-mono text-base font-semibold rounded-lg border border-slate-800/80 transition-colors"
              >
                0
              </button>
              <button
                onClick={() => insertToken('.')}
                className="py-3.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-100 font-mono text-base font-semibold rounded-lg border border-slate-800/80 transition-colors"
              >
                .
              </button>
              <button
                onClick={() => insertToken('-')}
                className="py-3.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-100 font-mono text-sm font-semibold rounded-lg border border-slate-800/80 transition-colors"
                title="Negative sign (-)"
              >
                (−)
              </button>
              <button
                onClick={() => calculate()}
                className="col-span-2 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-lg font-bold rounded-lg transition-colors shadow-md shadow-emerald-950/30 flex items-center justify-center gap-2"
              >
                <span>=</span>
                <span className="text-xs font-normal opacity-75 font-sans">(Enter)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Audit Trail / Session History Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-200">Audit History</h3>
              </div>
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="text-xs text-slate-500 hover:text-slate-300 font-medium transition-colors"
                >
                  Clear History
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-mono">
                No computations recorded yet.
                <br />
                Evaluate an expression to see logs here.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setExpression(item.expression);
                      setCurrentResult(item.result);
                      setCurrentDetails(item.details || null);
                      setExplanation(item.explanation || null);
                    }}
                    className="group cursor-pointer p-3 bg-slate-950/70 hover:bg-slate-800/70 border border-slate-800/80 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 font-mono mb-1">
                      <span>{item.timestamp}</span>
                      {item.executionTimeMs !== undefined && (
                        <span className="text-emerald-500/80 font-mono tabular-nums">
                          {item.executionTimeMs} ms
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-slate-300 group-hover:text-emerald-400 truncate mb-1">
                      {item.expression}
                    </div>
                    <div className="text-sm font-mono font-bold text-slate-100 text-right tabular-nums">
                      = {item.result}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Variables Snapshot */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm text-xs font-mono">
            <div className="flex items-center justify-between text-slate-300 font-semibold mb-2">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Active Python State
              </span>
              <span className="text-slate-500 text-[11px]">deg: {isDegMode ? 'ON' : 'OFF'}</span>
            </div>
            <div className="text-slate-400 text-xs space-y-1">
              <div>ans = <span className="text-emerald-400">{variables.ans !== undefined ? String(variables.ans) : currentResult}</span></div>
              {Object.entries(variables)
                .filter(([k]) => k !== 'ans')
                .map(([k, v]) => (
                  <div key={k} className="truncate">
                    {k} = <span className="text-cyan-300">{String(v)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
