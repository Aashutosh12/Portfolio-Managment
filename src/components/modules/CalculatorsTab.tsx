import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatCompactCurrency } from '../../utils/formatters';
import { 
  Calculator
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export const CalculatorsTab: React.FC = () => {
  const { data } = usePortfolio();
  const [calcMode, setCalcMode] = useState<'sip' | 'lumpsum' | 'swp' | 'inflation'>('sip');

  if (!data) return null;
  const currency = data.settings.currency;

  // Colors
  const COLORS = ['#475569', '#8b5cf6'];

  // --- 1. SIP CALCULATOR STATES ---
  const [sipMonthly, setSipMonthly] = useState<number | ''>(25000);
  const [sipRate, setSipRate] = useState<number | ''>(12);
  const [sipYears, setSipYears] = useState<number | ''>(15);
  const [sipResult, setSipResult] = useState({ invested: 0, returns: 0, total: 0 });

  useEffect(() => {
    const P = Number(sipMonthly) || 0;
    const i = ((Number(sipRate) || 0) / 100) / 12;
    const n = (Number(sipYears) || 0) * 12;
    
    if (i === 0) {
      const invested = P * n;
      setSipResult({ invested, returns: 0, total: invested });
      return;
    }
    
    // SIP Formula: M = P * [ ( (1 + i)^n - 1 ) / i ] * (1 + i)
    const total = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    const invested = P * n;
    const returns = Math.max(0, total - invested);
    
    setSipResult({
      invested: Math.round(invested),
      returns: Math.round(returns),
      total: Math.round(total)
    });
  }, [sipMonthly, sipRate, sipYears]);

  // --- 2. LUMPSUM CALCULATOR STATES ---
  const [lumpPrincipal, setLumpPrincipal] = useState<number | ''>(500000);
  const [lumpRate, setLumpRate] = useState<number | ''>(12);
  const [lumpYears, setLumpYears] = useState<number | ''>(10);
  const [lumpResult, setLumpResult] = useState({ invested: 0, returns: 0, total: 0 });

  useEffect(() => {
    const P = Number(lumpPrincipal) || 0;
    const r = (Number(lumpRate) || 0) / 100;
    const n = Number(lumpYears) || 0;
    
    // Formula: A = P * (1 + r)^n
    const total = P * Math.pow(1 + r, n);
    const returns = Math.max(0, total - P);
    
    setLumpResult({
      invested: P,
      returns: Math.round(returns),
      total: Math.round(total)
    });
  }, [lumpPrincipal, lumpRate, lumpYears]);

  // --- 3. SWP CALCULATOR STATES ---
  const [swpPrincipal, setSwpPrincipal] = useState<number | ''>(10000000); // 1 Crore
  const [swpWithdrawal, setSwpWithdrawal] = useState<number | ''>(50000); // 50k monthly
  const [swpRate, setSwpRate] = useState<number | ''>(8);
  const [swpYears, setSwpYears] = useState<number | ''>(20);
  const [swpResult, setSwpResult] = useState({ totalWithdrawn: 0, balanceLeft: 0 });

  useEffect(() => {
    let balance = Number(swpPrincipal) || 0;
    let swpWithdrawalAmt = Number(swpWithdrawal) || 0;
    const r = ((Number(swpRate) || 0) / 100) / 12; // monthly interest rate
    
    const months = (Number(swpYears) || 0) * 12;
    let totalWithdrawn = 0;
    for (let m = 1; m <= months; m++) {
      // Add interest first
      balance = balance * (1 + r);
      // Deduct withdrawal
      if (balance >= swpWithdrawalAmt) {
        balance -= swpWithdrawalAmt;
        totalWithdrawn += swpWithdrawalAmt;
      } else {
        totalWithdrawn += balance;
        balance = 0;
        break;
      }
    }

    setSwpResult({
      totalWithdrawn: Math.round(totalWithdrawn),
      balanceLeft: Math.round(balance)
    });
  }, [swpPrincipal, swpWithdrawal, swpRate, swpYears]);

  // --- 4. INFLATION CALCULATOR STATES ---
  const [infCost, setInfCost] = useState<number | ''>(100000);
  const [infRate, setInfRate] = useState<number | ''>(6);
  const [infYears, setInfYears] = useState<number | ''>(10);
  const [infResult, setInfResult] = useState(0);

  useEffect(() => {
    const P = Number(infCost) || 0;
    const r = (Number(infRate) || 0) / 100;
    const n = Number(infYears) || 0;
    
    // Formula: Future Value = Cost * (1 + r)^n
    const futureVal = P * Math.pow(1 + r, n);
    setInfResult(Math.round(futureVal));
  }, [infCost, infRate, infYears]);

  // Chart data helpers
  const getPieData = (invested: number, returns: number) => [
    { name: 'Invested Capital', value: invested },
    { name: 'Estimated Returns', value: returns }
  ];

  return (
    <div className="space-y-6">
      {/* Sub menu selectors */}
      <div className="flex border-b border-slate-800 pb-px">
        <button
          onClick={() => setCalcMode('sip')}
          className={`py-3 px-6 text-xs font-bold border-b-2 uppercase tracking-wider transition-all ${
            calcMode === 'sip' ? 'border-violet-500 text-white bg-slate-900/30' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          SIP Systematic Plan
        </button>
        <button
          onClick={() => setCalcMode('lumpsum')}
          className={`py-3 px-6 text-xs font-bold border-b-2 uppercase tracking-wider transition-all ${
            calcMode === 'lumpsum' ? 'border-violet-500 text-white bg-slate-900/30' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Lumpsum Calculator
        </button>
        <button
          onClick={() => setCalcMode('swp')}
          className={`py-3 px-6 text-xs font-bold border-b-2 uppercase tracking-wider transition-all ${
            calcMode === 'swp' ? 'border-violet-500 text-white bg-slate-900/30' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          SWP Withdrawal Plan
        </button>
        <button
          onClick={() => setCalcMode('inflation')}
          className={`py-3 px-6 text-xs font-bold border-b-2 uppercase tracking-wider transition-all ${
            calcMode === 'inflation' ? 'border-violet-500 text-white bg-slate-900/30' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Inflation Cost impact
        </button>
      </div>

      {/* --- RENDER INDIVIDUAL CALCULATORS --- */}

      {/* 1. SIP CALCULATOR */}
      {calcMode === 'sip' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass p-6 rounded-3xl border border-slate-800 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-slate-805">
              <Calculator className="w-5 h-5 text-violet-400" /> SIP (Systematic Investment Plan)
            </h3>
            
            <div className="space-y-5 text-xs">
              {/* Slider 1 */}
              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-350">Monthly Investment</span>
                  <span className="font-mono text-white font-bold">{formatCurrency(Number(sipMonthly) || 0, currency)}</span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={500000}
                  step={1000}
                  value={sipMonthly}
                  onChange={(e) => setSipMonthly(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
              </div>

              {/* Slider 2 */}
              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-350">Expected Return Rate (% p.a.)</span>
                  <span className="font-mono text-white font-bold">{sipRate}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={0.5}
                  value={sipRate}
                  onChange={(e) => setSipRate(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
              </div>

              {/* Slider 3 */}
              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-350">Tenure (Years)</span>
                  <span className="font-mono text-white font-bold">{sipYears} yrs</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={40}
                  step={1}
                  value={sipYears}
                  onChange={(e) => setSipYears(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-3xl border border-slate-800 flex flex-col justify-between shadow-lg">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Yield Summary</h4>
            
            <div className="h-44 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getPieData(sipResult.invested, sipResult.returns)}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatCurrency(val, currency)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-[9px] uppercase text-slate-450 font-bold">Total Corpus</span>
                <span className="text-sm font-black text-white mt-0.5">{formatCompactCurrency(sipResult.total, currency)}</span>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-800/40 pt-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Invested Capital</span>
                <span className="font-bold text-slate-200 font-mono">{formatCurrency(sipResult.invested, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Wealth Gained</span>
                <span className="font-bold text-emerald-450 font-mono">+{formatCurrency(sipResult.returns, currency)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800/40 pt-2 font-bold text-slate-100">
                <span>Maturity Amount</span>
                <span className="font-mono text-violet-400">{formatCurrency(sipResult.total, currency)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. LUMPSUM CALCULATOR */}
      {calcMode === 'lumpsum' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass p-6 rounded-3xl border border-slate-800 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-slate-805">
              <Calculator className="w-5 h-5 text-violet-400" /> Lumpsum Compound Calculator
            </h3>
            
            <div className="space-y-5 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-350">Lumpsum Principal</span>
                  <span className="font-mono text-white font-bold">{formatCurrency(Number(lumpPrincipal) || 0, currency)}</span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={5000000}
                  step={5000}
                  value={lumpPrincipal}
                  onChange={(e) => setLumpPrincipal(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-350">Expected Return Rate (% p.a.)</span>
                  <span className="font-mono text-white font-bold">{lumpRate}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={0.5}
                  value={lumpRate}
                  onChange={(e) => setLumpRate(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-350">Tenure (Years)</span>
                  <span className="font-mono text-white font-bold">{lumpYears} yrs</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={40}
                  step={1}
                  value={lumpYears}
                  onChange={(e) => setLumpYears(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-3xl border border-slate-800 flex flex-col justify-between shadow-lg">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Yield Summary</h4>
            
            <div className="h-44 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getPieData(lumpResult.invested, lumpResult.returns)}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatCurrency(val, currency)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-[9px] uppercase text-slate-450 font-bold">Total Yield</span>
                <span className="text-sm font-black text-white mt-0.5">{formatCompactCurrency(lumpResult.total, currency)}</span>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-800/40 pt-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Principal Cost</span>
                <span className="font-bold text-slate-200 font-mono">{formatCurrency(lumpResult.invested, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Compound Returns</span>
                <span className="font-bold text-emerald-455 font-mono">+{formatCurrency(lumpResult.returns, currency)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800/40 pt-2 font-bold text-slate-100">
                <span>Final Value</span>
                <span className="font-mono text-violet-400">{formatCurrency(lumpResult.total, currency)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SWP CALCULATOR */}
      {calcMode === 'swp' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass p-6 rounded-3xl border border-slate-800 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-slate-805">
              <Calculator className="w-5 h-5 text-violet-400" /> SWP (Systematic Withdrawal Plan)
            </h3>
            
            <div className="space-y-5 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-350">Initial Investment</span>
                  <span className="font-mono text-white font-bold">{formatCurrency(Number(swpPrincipal) || 0, currency)}</span>
                </div>
                <input
                  type="range"
                  min={100000}
                  max={50000000}
                  step={100000}
                  value={swpPrincipal}
                  onChange={(e) => setSwpPrincipal(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-350">Monthly Withdrawal</span>
                  <span className="font-mono text-white font-bold">{formatCurrency(Number(swpWithdrawal) || 0, currency)}</span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={500000}
                  step={5000}
                  value={swpWithdrawal}
                  onChange={(e) => setSwpWithdrawal(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-350">Yield Rate on Remaining balance (% p.a.)</span>
                  <span className="font-mono text-white font-bold">{swpRate}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={0.5}
                  value={swpRate}
                  onChange={(e) => setSwpRate(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-350">Duration (Years)</span>
                  <span className="font-mono text-white font-bold">{swpYears} yrs</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={40}
                  step={1}
                  value={swpYears}
                  onChange={(e) => setSwpYears(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-3xl border border-slate-800 flex flex-col justify-between shadow-lg">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Withdrawal Yield Details</h4>
            
            <div className="space-y-6 py-6 text-xs">
              <div className="space-y-1">
                <span className="text-slate-450 font-bold block uppercase tracking-wide text-[9px]">Total Cash Withdrawn</span>
                <p className="text-2xl font-black text-emerald-400 font-mono">
                  {formatCurrency(Number(swpResult.totalWithdrawn) || 0, currency)}
                </p>
                <span className="text-[10px] text-slate-400 block leading-tight">Total cash payout received during {swpYears} years.</span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-455 font-bold block uppercase tracking-wide text-[9px]">Remaining Balance Left</span>
                <p className={`text-2xl font-black font-mono ${swpResult.balanceLeft > 0 ? 'text-violet-400' : 'text-rose-400'}`}>
                  {formatCurrency(Number(swpResult.balanceLeft) || 0, currency)}
                </p>
                <span className="text-[10px] text-slate-400 block leading-tight">Remaining corpus still compounding in the fund.</span>
              </div>
            </div>

            <div className="border-t border-slate-800/40 pt-3 text-[10px] text-slate-500 text-center uppercase font-mono tracking-wider">
              Models continuous monthly withdrawals
            </div>
          </div>
        </div>
      )}

      {/* 4. INFLATION CALCULATOR */}
      {calcMode === 'inflation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass p-6 rounded-3xl border border-slate-800 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-slate-805">
              <Calculator className="w-5 h-5 text-violet-400" /> Inflation Expense Cost Simulator
            </h3>
            
            <div className="space-y-5 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-350">Current Cost of Asset</span>
                  <span className="font-mono text-white font-bold">{formatCurrency(Number(infCost) || 0, currency)}</span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={5000000}
                  step={1000}
                  value={infCost}
                  onChange={(e) => setInfCost(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-350">Inflation Rate (% p.a.)</span>
                  <span className="font-mono text-white font-bold">{infRate}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={0.5}
                  value={infRate}
                  onChange={(e) => setInfRate(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-350">Tenure (Years)</span>
                  <span className="font-mono text-white font-bold">{infYears} yrs</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={40}
                  step={1}
                  value={infYears}
                  onChange={(e) => setInfYears(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-3xl border border-slate-800 flex flex-col justify-between shadow-lg">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Inflation Impact Summary</h4>
            
            <div className="space-y-6 py-6 text-xs">
              <div className="space-y-1">
                <span className="text-slate-450 font-bold block uppercase tracking-wide text-[9px]">Future Cost of Item</span>
                <p className="text-2xl font-black text-rose-400 font-mono">
                  {formatCurrency(infResult, currency)}
                </p>
                <span className="text-[10px] text-slate-400 block leading-tight">Cost of the same purchase in {infYears} years under {infRate}% inflation.</span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-455 font-bold block uppercase tracking-wide text-[9px]">Purchasing Power Erosion</span>
                <p className="text-xl font-bold text-slate-300 font-mono">
                  -{((1 - ((Number(infCost) || 0) / infResult)) * 100).toFixed(1)}%
                </p>
                <span className="text-[10px] text-slate-400 block leading-tight">Your cash loses this much value if kept under simple non-compounding vaults.</span>
              </div>
            </div>

            <div className="border-t border-slate-800/40 pt-3 text-[10px] text-slate-500 text-center uppercase font-mono tracking-wider">
              Compounded annually
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
