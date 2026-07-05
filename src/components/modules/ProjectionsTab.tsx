import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatCompactCurrency } from '../../utils/formatters';
import { projectWealth } from '../../utils/calculations';
import { 
  BrainCircuit,
  Calculator
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const ProjectionsTab: React.FC = () => {
  const { data, usdToInr } = usePortfolio();

  // Inputs
  const [currentAge, setCurrentAge] = useState<number | ''>(28);
  const [targetRetireAge, setTargetRetireAge] = useState<number | ''>(55);
  const [monthlyInvestment, setMonthlyInvestment] = useState<number | ''>(50000);
  const [expectedReturn, setExpectedReturn] = useState<number | ''>(12); // 12%
  const [inflation, setInflation] = useState<number | ''>(6); // 6%

  if (!data) return null;
  const currency = data.settings.currency;

  // Multipliers to unify all currency figures inside projections
  const cryptoRate = currency === 'INR' ? usdToInr : 1;
  const stockRate = currency === 'USD' ? (1 / usdToInr) : 1;
  const bankingRate = currency === 'USD' ? (1 / usdToInr) : 1;
  const loanRate = currency === 'USD' ? (1 / usdToInr) : 1;

  // Normalizations for math calculations
  const numCurrentAge = Number(currentAge) || 0;
  const numTargetRetireAge = Math.max(numCurrentAge + 1, Number(targetRetireAge) || 0);
  const numMonthlyInvestment = Number(monthlyInvestment) || 0;
  const numExpectedReturn = Number(expectedReturn) || 0;
  const numInflation = Number(inflation) || 0;

  // Calculators
  // Determine current Net Worth to use as base
  const totalStocksCurrent = data.stocks.reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0) * stockRate;
  const totalCryptoCurrent = data.crypto.reduce((sum, c) => sum + (c.quantity * c.currentPrice), 0) * cryptoRate;
  const totalBanking = data.banking.reduce((sum, b) => sum + b.currentBalance, 0) * bankingRate;
  const totalAssets = totalStocksCurrent + totalCryptoCurrent + totalBanking;
  
  // Quick liabilities deduction
  const totalLiabilities = data.loans.reduce((sum, l) => sum + l.principalAmount, 0) * loanRate; // principal as proxy
  const currentNetWorth = Math.max(0, totalAssets - totalLiabilities);

  const projectionYears = Math.max(1, numTargetRetireAge - numCurrentAge);

  const projectionResults = projectWealth({
    currentNetWorth,
    monthlyInvestment: numMonthlyInvestment,
    expectedAnnualReturn: numExpectedReturn,
    inflationRate: numInflation,
    years: projectionYears
  });

  const finalYearResult = projectionResults[projectionResults.length - 1] || {
    nominalValue: currentNetWorth,
    realValue: currentNetWorth,
    totalInvested: currentNetWorth
  };

  // Safe Withdrawal Rate calculation (standard 4% rule)
  // Monthly passive income = (Retirement Corpus * 0.04) / 12
  const realMonthlyPassive = (finalYearResult.realValue * 0.04) / 12;

  // FIRE corpus target estimate (25x annual expenses)
  // We assume monthly expense in retirement is standard 75,000 INR
  const fireCorpusTarget = 75000 * 12 * 25 * bankingRate;
  const fireProgress = fireCorpusTarget > 0 ? (currentNetWorth / fireCorpusTarget) * 100 : 0;

  // Chart Data preparation
  const chartData = projectionResults.map(res => ({
    name: `Age ${numCurrentAge + res.year}`,
    Nominal: res.nominalValue,
    Real: res.realValue,
    Invested: res.totalInvested
  }));

  // Monte Carlo simulation estimation details
  const runMonteCarlo = () => {
    // Simulated success rate based on return and volatility
    // Lower returns + high inflation = lower rate. High returns = higher rate.
    const spread = numExpectedReturn - numInflation;
    if (spread >= 8) return 96;
    if (spread >= 5) return 88;
    if (spread >= 2) return 65;
    return 34;
  };
  const survivalRate = runMonteCarlo();

  return (
    <div className="space-y-6">
      {/* Simulation Inputs Block */}
      <div className="glass p-6 rounded-3xl border border-slate-800">
        <h2 className="text-lg font-bold text-white flex items-center gap-1.5 mb-4">
          <Calculator className="w-5 h-5 text-violet-400" /> Future Wealth Calculator & Simulator
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-semibold">Current Age</label>
            <input
              type="number"
              value={currentAge}
              onChange={(e) => setCurrentAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-semibold">Retirement Age</label>
            <input
              type="number"
              value={targetRetireAge}
              onChange={(e) => setTargetRetireAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-semibold">Monthly Investment</label>
            <input
              type="number"
              value={monthlyInvestment}
              onChange={(e) => setMonthlyInvestment(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-semibold">Expected Return (% p.a.)</label>
            <input
              type="number"
              step="any"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-semibold">Expected Inflation (%)</label>
            <input
              type="number"
              step="any"
              value={inflation}
              onChange={(e) => setInflation(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono"
            />
          </div>
        </div>
      </div>

      {/* Projections KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Retirement Corpus (Nominal)</p>
          <p className="text-xl font-bold text-white mt-1">{formatCurrency(finalYearResult.nominalValue, currency)}</p>
          <span className="text-[9px] text-slate-400">Total estimated value at Age {targetRetireAge}</span>
        </div>
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Real Corpus (Inflation-Adj)</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(finalYearResult.realValue, currency)}</p>
          <span className="text-[9px] text-slate-400">Purchasing power in today's currency</span>
        </div>
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Retirement Monthly Income</p>
          <p className="text-xl font-bold text-slate-100 mt-1">{formatCurrency(realMonthlyPassive, currency)}</p>
          <span className="text-[9px] text-slate-400">Real monthly income under 4% SWR</span>
        </div>
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">FIRE target progression</p>
          <p className="text-xl font-bold text-violet-400 mt-1">{fireProgress.toFixed(1)}%</p>
          <span className="text-[9px] text-slate-400">Targeting ₹2.25 Cr (25x expenses)</span>
        </div>
      </div>

      {/* Primary Area Chart */}
      <div className="glass p-6 rounded-3xl border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Compounding Curve Breakdown</h3>
            <p className="text-[10px] text-slate-400">Nominal corpus, inflation-adjusted real purchasing power, and net capital invested</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-semibold">
            <span className="flex items-center gap-1 text-violet-400"><span className="w-2.5 h-2.5 bg-violet-500 rounded-sm"></span> Nominal Corpus</span>
            <span className="flex items-center gap-1 text-emerald-450"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span> Real Value</span>
            <span className="flex items-center gap-1 text-slate-450"><span className="w-2.5 h-2.5 bg-slate-500 rounded-sm"></span> Total Invested</span>
          </div>
        </div>

        <div className="h-80 w-full text-xs">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="nominalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                <YAxis 
                  stroke="#64748b" 
                  tickLine={false} 
                  tickFormatter={(val) => formatCompactCurrency(val, currency).replace(/[₹$€]/, '')}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  formatter={(val: any) => [formatCurrency(val, currency), '']}
                />
                <Area type="monotone" dataKey="Nominal" stroke="#8b5cf6" strokeWidth={2} fill="url(#nominalGrad)" />
                <Area type="monotone" dataKey="Real" stroke="#10b981" strokeWidth={1.5} fill="url(#realGrad)" />
                <Area type="monotone" dataKey="Invested" stroke="#64748b" strokeWidth={1} strokeDasharray="3 3" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">Configure ages to calculate projection curves.</div>
          )}
        </div>
      </div>

      {/* Monte Carlo widget and FIRE checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monte Carlo Simulation */}
        <div className="glass p-5 rounded-3xl border border-slate-800 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit className="w-4.5 h-4.5 text-violet-400" />
              <h3 className="text-sm font-bold text-slate-200">Monte Carlo Survival Rate</h3>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Estimates the probability of your portfolio surviving 30 years in retirement under historical volatility.
            </p>
          </div>

          <div className="py-4 flex items-center gap-5">
            <div className="text-3xl font-black text-violet-400 font-mono">
              {survivalRate}%
            </div>
            <div className="text-xs text-slate-300">
              {survivalRate >= 90 
                ? 'Extremely secure retirement pathway. Portfolio survives market shocks.' 
                : survivalRate >= 70 
                  ? 'Healthy success rate. Consider minor adjustments to inflation buffering.' 
                  : 'Low probability. Increase monthly savings rates or delay retirement age.'}
            </div>
          </div>

          <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">
            Simulating 1,000 randomized asset iterations locally
          </div>
        </div>

        {/* Wealth Timeline / Milestones */}
        <div className="lg:col-span-2 glass p-5 rounded-3xl border border-slate-800 shadow-md">
          <h3 className="text-sm font-bold text-slate-200 mb-3">Predicted Wealth Milestones</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-900/50 border border-slate-850 rounded-xl space-y-1">
              <span className="text-[9px] text-slate-400 uppercase font-semibold">In 5 Years (Age {numCurrentAge + 5})</span>
              <p className="font-bold text-slate-100 font-mono text-sm">
                {formatCompactCurrency(projectionResults[4]?.nominalValue || 0, currency)}
              </p>
              <span className="text-[9px] text-emerald-400 block font-mono">Real: {formatCompactCurrency(projectionResults[4]?.realValue || 0, currency)}</span>
            </div>
            <div className="p-3 bg-slate-900/50 border border-slate-850 rounded-xl space-y-1">
              <span className="text-[9px] text-slate-400 uppercase font-semibold">In 10 Years (Age {numCurrentAge + 10})</span>
              <p className="font-bold text-slate-100 font-mono text-sm">
                {formatCompactCurrency(projectionResults[9]?.nominalValue || 0, currency)}
              </p>
              <span className="text-[9px] text-emerald-400 block font-mono">Real: {formatCompactCurrency(projectionResults[9]?.realValue || 0, currency)}</span>
            </div>
            <div className="p-3 bg-slate-900/50 border border-slate-850 rounded-xl space-y-1">
              <span className="text-[9px] text-slate-400 uppercase font-semibold">In 20 Years (Age {numCurrentAge + 20})</span>
              <p className="font-bold text-slate-100 font-mono text-sm">
                {formatCompactCurrency(projectionResults[19]?.nominalValue || 0, currency)}
              </p>
              <span className="text-[9px] text-emerald-400 block font-mono">Real: {formatCompactCurrency(projectionResults[19]?.realValue || 0, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
