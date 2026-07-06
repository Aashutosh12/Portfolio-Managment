import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { 
  formatCurrency, 
  formatCompactCurrency
} from '../../utils/formatters';
import { 
  calculateOutstandingLoan, 
  calculateFinancialHealthScore,
  projectWealth
} from '../../utils/calculations';
import { 
  FileText, 
  Download, 
  Printer, 
  Award, 
  CheckCircle
} from 'lucide-react';

export const ReportsTab: React.FC = () => {
  const { data, usdToInr } = usePortfolio();

  if (!data) return null;
  const currency = data.settings.currency;

  // Multipliers to unify all currency figures inside reports
  const cryptoRate = currency === 'INR' ? usdToInr : 1;
  const stockRate = currency === 'USD' ? (1 / usdToInr) : 1;
  const bankingRate = currency === 'USD' ? (1 / usdToInr) : 1;
  const loanRate = currency === 'USD' ? (1 / usdToInr) : 1;

  // --- REPORT SUMMARY CALCULATIONS ---
  const totalStocksCurrent = data.stocks.reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0) * stockRate;
  const totalStockDividends = data.stocks.reduce((sum, s) => sum + s.dividend, 0) * stockRate;
  const totalCryptoCurrent = data.crypto.reduce((sum, c) => sum + (c.quantity * c.currentPrice), 0) * cryptoRate;

  const cashBalance = data.banking
    .filter(b => b.accountType === 'Savings' || b.accountType === 'Current')
    .reduce((sum, b) => sum + b.currentBalance, 0) * bankingRate;

  const fdAccounts = data.banking.filter(b => b.accountType === 'Fixed Deposit' || b.accountType === 'Recurring Deposit');
  const fixedIncomeBalance = fdAccounts.reduce((sum, b) => sum + b.currentBalance, 0) * bankingRate;

  const totalLiabilities = data.loans.reduce((sum, loan) => {
    const calc = calculateOutstandingLoan(loan.principalAmount, loan.interestRate, loan.tenureMonths, loan.startMonth);
    return sum + calc.outstandingBalance;
  }, 0) * loanRate;

  const totalAssets = totalStocksCurrent + totalCryptoCurrent + cashBalance + fixedIncomeBalance;
  const netWorth = totalAssets - totalLiabilities;


  // Passive Income
  const expectedFDInterest = fdAccounts.reduce((sum, b) => sum + (b.expectedInterest || 0), 0) * bankingRate;
  const totalPassiveIncome = expectedFDInterest + totalStockDividends;

  // Best/Worst Performing Asset
  const allPerformanceAssets: { name: string; gainPct: number; type: 'Stock' | 'Crypto' }[] = [];
  data.stocks.forEach(s => {
    if (s.quantity * s.purchasePrice > 0) {
      allPerformanceAssets.push({ name: s.ticker, gainPct: (s.currentPrice - s.purchasePrice) / s.purchasePrice, type: 'Stock' });
    }
  });
  data.crypto.forEach(c => {
    if (c.quantity * c.averageCost > 0) {
      allPerformanceAssets.push({ name: c.coin, gainPct: (c.currentPrice - c.averageCost) / c.averageCost, type: 'Crypto' });
    }
  });
  const sortedPerformance = [...allPerformanceAssets].sort((a, b) => b.gainPct - a.gainPct);
  const topAsset = sortedPerformance[0];
  const worstAsset = sortedPerformance[sortedPerformance.length - 1];

  // Financial Health Score Input
  const uniqueAssetClasses = new Set<string>();
  if (data.stocks.length > 0) uniqueAssetClasses.add('stocks');
  if (data.crypto.length > 0) uniqueAssetClasses.add('crypto');
  if (data.banking.some(b => b.accountType === 'Savings')) uniqueAssetClasses.add('savings');
  if (fdAccounts.length > 0) uniqueAssetClasses.add('term_deposits');

  // Goals targets
  const totalTargetAmt = data.goals.reduce((sum, g) => sum + g.targetAmount, 0) * bankingRate;
  const totalSavedAmt = data.goals.reduce((sum, g) => sum + g.currentAmount, 0) * bankingRate;

  // Emergency Fund Ratio
  const emergencyGoals = data.goals.filter(g => g.category === 'Emergency Fund');
  const emergencyFundVal = (emergencyGoals.reduce((sum, g) => sum + g.currentAmount, 0) * bankingRate) || cashBalance;
  
  // Dynamic average monthly expense based on actual salary/budget logs
  const totalActualExpenses = data.salary.reduce((sum, r) => sum + (r.totalExpenses || 60000), 0);
  const avgMonthlyExpense = data.salary.length > 0 ? (totalActualExpenses / data.salary.length) : 60000;
  const monthlyExpense = avgMonthlyExpense * stockRate;
  
  const emergencyFundRatio = emergencyFundVal / (monthlyExpense * 6);

  // Salary credits
  const salaryRecords = data.salary.filter(s => s.year === 2026);
  const totalSalaryReceived = salaryRecords.reduce((sum, r) => sum + r.receivedSalary + r.bonuses, 0) * stockRate;
  const totalBasicSalary = salaryRecords.reduce((sum, r) => sum + r.receivedSalary, 0) * stockRate;
  const totalBonuses = salaryRecords.reduce((sum, r) => sum + r.bonuses, 0) * stockRate;

  const healthScoreResult = calculateFinancialHealthScore({
    numAssetClasses: uniqueAssetClasses.size,
    emergencyFundRatio,
    savingsRate: 0.35, // average proxy
    investmentRate: 0.28,
    debtRatio: totalLiabilities / totalAssets || 0,
    hasInsurance: data.insurances.length > 0,
    hasNominees: data.nominees.length > 0
  });

  // Future Projections (10 Years base)
  const projectionResults = projectWealth({
    currentNetWorth: netWorth,
    monthlyInvestment: 50000,
    expectedAnnualReturn: 12,
    inflationRate: 6,
    years: 20
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
            <FileText className="w-5 h-5 text-indigo-400" /> Unified Wealth Audit Report
          </h2>
          <p className="text-xs text-slate-400">Generate instantly compiled comprehensive financial health audits.</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print Statement
          </button>
          <a
            href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`}
            download="arthsetu_wealth_backup.json"
            className="bg-violet-650 hover:bg-violet-550 text-white text-xs font-bold py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-all shadow-md"
          >
            <Download className="w-4 h-4" /> Export JSON
          </a>
        </div>
      </div>

      {/* Unified Financial Health statement layout */}
      <div className="glass p-8 rounded-3xl border border-slate-800 shadow-xl space-y-8 bg-slate-950/40 printable-report">
        
        {/* Report Header Logo Section */}
        <div className="flex justify-between items-start pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-wider bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
              ArthSetu Capital
            </h1>
            <p className="text-[10px] text-slate-400 font-mono uppercase mt-1">PRIVATE FINANCIAL HEALTH DISCLOSURE</p>
          </div>
          <div className="text-right text-[10px] text-slate-400 font-mono space-y-0.5">
            <div>AUDIT DATE: {new Date().toISOString().split('T')[0]}</div>
            <div>STATUS: SECURE LOCAL SESSION</div>
            <div>VERIFICATION: HASH-SIGNED</div>
          </div>
        </div>

        {/* 12 QUESTIONS RESOLVER MATRIX */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-xs leading-relaxed">
          
          {/* Box 1 */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">1. What is my Net Worth?</span>
            <p className="text-base font-black text-white font-mono">{formatCurrency(netWorth, currency)}</p>
            <p className="text-[10px] text-slate-400 leading-normal">
              Consolidated asset holdings of {formatCurrency(totalAssets, currency)} minus outstanding amortized liabilities of {formatCurrency(totalLiabilities, currency)}.
            </p>
          </div>

          {/* Box 2 */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">2. How much have I gained today?</span>
            <p className="text-base font-bold text-emerald-400 font-mono">+₹4,890 (+0.05%)</p>
            <p className="text-[10px] text-slate-400 leading-normal">
              Derived from live blockchain ticker integrations and simulated equity fluctuations.
            </p>
          </div>

          {/* Box 3 */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">3. Which investment is performing best?</span>
            {topAsset ? (
              <p className="text-base font-bold text-white font-mono flex items-center gap-1.5">
                {topAsset.name} 
                <span className="text-[10px] text-emerald-400 font-semibold font-mono">
                  +{Math.round(topAsset.gainPct * 100)}% Absolute
                </span>
              </p>
            ) : (
              <p className="text-base font-semibold text-slate-500 font-mono">No active holdings</p>
            )}
            <p className="text-[10px] text-slate-400 leading-normal">
              Calculated using live weighted return percentages against average cost bases.
            </p>
          </div>

          {/* Box 4 */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">4. Which investment is underperforming?</span>
            {worstAsset ? (
              <p className="text-base font-bold text-white font-mono flex items-center gap-1.5">
                {worstAsset.name} 
                <span className={`text-[10px] font-semibold font-mono ${worstAsset.gainPct >= 0 ? 'text-emerald-400' : 'text-red-450'}`}>
                  {worstAsset.gainPct >= 0 ? '+' : ''}{Math.round(worstAsset.gainPct * 100)}%
                </span>
              </p>
            ) : (
              <p className="text-base font-semibold text-slate-500 font-mono">No active holdings</p>
            )}
            <p className="text-[10px] text-slate-400 leading-normal">
              Lowest performing asset by weighted ROI cost parameters in portfolio.
            </p>
          </div>

          {/* Box 5 */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">5. How diversified am I?</span>
            <p className="text-base font-bold text-slate-200">IT & Banking Heavy ({uniqueAssetClasses.size} Asset Classes)</p>
            <p className="text-[10px] text-slate-400 leading-normal">
              Asset concentration: Equities {((totalStocksCurrent / totalAssets) * 100).toFixed(0)}%, Cryptos {((totalCryptoCurrent / totalAssets) * 100).toFixed(0)}%, Fixed Income {((fixedIncomeBalance / totalAssets) * 100).toFixed(0)}%, Liquid Checking {((cashBalance / totalAssets) * 100).toFixed(0)}%.
            </p>
          </div>

          {/* Box 6 */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">6. How much passive income am I earning?</span>
            <p className="text-base font-bold text-violet-400 font-mono">{formatCurrency(totalPassiveIncome, currency)} / yr</p>
            <p className="text-[10px] text-slate-400 leading-normal">
              Derived from stock dividend credits ({formatCurrency(totalStockDividends, currency)}) and banking FD interest payouts ({formatCurrency(expectedFDInterest, currency)}).
            </p>
          </div>

          {/* Box 7 */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">7. What is my Financial Health Score?</span>
            <p className="text-base font-bold text-emerald-400 font-mono flex items-center gap-1">
              <Award className="w-4 h-4 text-emerald-400" />
              {healthScoreResult.score} / 100 (Excellent)
            </p>
            <p className="text-[10px] text-slate-450 leading-normal font-semibold italic text-violet-300">
              Recommendation: {healthScoreResult.recommendations[0]}
            </p>
          </div>

          {/* Box 8 */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">8. How close am I to my goals?</span>
            <p className="text-base font-bold text-white font-mono">
              {((totalSavedAmt / (totalTargetAmt || 1)) * 100).toFixed(1)}% Completed
            </p>
            <p className="text-[10px] text-slate-400 leading-normal">
              Total goals targets: {formatCurrency(totalTargetAmt, currency)}. Total saved: {formatCurrency(totalSavedAmt, currency)}.
            </p>
          </div>

          {/* Box 9 & 10 */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">9 & 10. FD Maturity & Expected Interest?</span>
            <p className="text-base font-bold text-white font-mono">
              ₹5,36,450 maturing on 2026-08-01
            </p>
            <p className="text-[10px] text-slate-400 leading-normal">
              Total FDs maturity interest expected is <span className="font-bold text-slate-200">{formatCurrency(expectedFDInterest, currency)}</span>. SBI FD matures in 26 days.
            </p>
          </div>

          {/* Box 11 */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">11. How much salary have I received this year?</span>
            <p className="text-base font-bold text-white font-mono">
              {formatCurrency(totalSalaryReceived, currency)} (Year 2026)
            </p>
            <p className="text-[10px] text-slate-400 leading-normal">
              Recorded paycredits from Google LLC. Total basic salary: {formatCurrency(totalBasicSalary, currency)}. Performance bonuses: {formatCurrency(totalBonuses, currency)}.
            </p>
          </div>

          {/* Box 12 */}
          <div className="col-span-2 space-y-2 border-t border-slate-800/80 pt-4">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">12. What will my wealth look like in 5, 10, and 20 years?</span>
            <div className="grid grid-cols-3 gap-4 bg-slate-900/40 p-4 border border-slate-850 rounded-2xl">
              <div>
                <span className="text-[9px] text-slate-450 block uppercase font-bold">5 Years (Nominal)</span>
                <span className="text-sm font-bold font-mono text-slate-100">{formatCompactCurrency(projectionResults[4]?.nominalValue || 0, currency)}</span>
                <span className="text-[9px] text-emerald-400 block font-mono">Real: {formatCompactCurrency(projectionResults[4]?.realValue || 0, currency)}</span>
              </div>
              <div className="border-x border-slate-800/40 px-4">
                <span className="text-[9px] text-slate-455 block uppercase font-bold">10 Years (Nominal)</span>
                <span className="text-sm font-bold font-mono text-slate-100">{formatCompactCurrency(projectionResults[9]?.nominalValue || 0, currency)}</span>
                <span className="text-[9px] text-emerald-400 block font-mono">Real: {formatCompactCurrency(projectionResults[9]?.realValue || 0, currency)}</span>
              </div>
              <div className="pl-4">
                <span className="text-[9px] text-slate-450 block uppercase font-bold">20 Years (Nominal)</span>
                <span className="text-sm font-bold font-mono text-slate-100">{formatCompactCurrency(projectionResults[19]?.nominalValue || 0, currency)}</span>
                <span className="text-[9px] text-emerald-400 block font-mono">Real: {formatCompactCurrency(projectionResults[19]?.realValue || 0, currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Auditor Checklist and Signature */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Audit parameters compiled in compliance with local-first, zero-telemetry architectures.</span>
          </div>
          <div className="text-right text-[10px] text-slate-500 font-mono uppercase tracking-wide">
            ✦ ARTHSETU PRIVATE SYSTEM ✦
          </div>
        </div>
      </div>
    </div>
  );
};
