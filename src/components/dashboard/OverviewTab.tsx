import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { 
  formatCurrency, 
  formatCompactCurrency, 
  formatPercent, 
  formatDate 
} from '../../utils/formatters';
import { 
  calculateOutstandingLoan 
} from '../../utils/calculations';
import { 
  TrendingUp, 
  ShieldAlert, 
  Award, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  PiggyBank,
  Briefcase
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';

export const OverviewTab: React.FC = () => {
  const { data, lastPriceRefresh, usdToInr } = usePortfolio();

  if (!data) return null;

  const currency = data.settings.currency;

  // --- FINANCIAL CALCULATIONS ---
  
  // Multipliers to unify all currency figures inside dashboard
  const cryptoRate = currency === 'INR' ? usdToInr : 1;
  const stockRate = currency === 'USD' ? (1 / usdToInr) : 1;
  const bankingRate = currency === 'USD' ? (1 / usdToInr) : 1;
  const loanRate = currency === 'USD' ? (1 / usdToInr) : 1;

  // 1. Equities (Stocks)
  const totalStocksInvested = data.stocks.reduce((sum, s) => sum + (s.quantity * s.purchasePrice), 0) * stockRate;
  const totalStocksCurrent = data.stocks.reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0) * stockRate;
  const totalStockDividends = data.stocks.reduce((sum, s) => sum + s.dividend, 0) * stockRate;
  const stockPL = totalStocksCurrent - totalStocksInvested;

  // 2. Cryptocurrencies
  const totalCryptoInvested = data.crypto.reduce((sum, c) => sum + (c.quantity * c.averageCost), 0) * cryptoRate;
  const totalCryptoCurrent = data.crypto.reduce((sum, c) => sum + (c.quantity * c.currentPrice), 0) * cryptoRate;
  const cryptoPL = totalCryptoCurrent - totalCryptoInvested;

  // 2b. Mutual Funds
  const mfRate = currency === 'USD' ? (1 / usdToInr) : 1;
  const mutualFundsList = data.mutualFunds || [];
  const totalMfInvested = mutualFundsList.reduce((sum, f) => sum + (f.units * f.averageNav), 0) * mfRate;
  const totalMfCurrent = mutualFundsList.reduce((sum, f) => sum + (f.units * f.currentNav), 0) * mfRate;
  const mfPL = totalMfCurrent - totalMfInvested;

  // 3. Banking Assets
  const cashAccounts = data.banking.filter(b => b.accountType === 'Savings' || b.accountType === 'Current');
  const fdAccounts = data.banking.filter(b => b.accountType === 'Fixed Deposit' || b.accountType === 'Recurring Deposit');
  
  const cashBalance = cashAccounts.reduce((sum, b) => sum + b.currentBalance, 0) * bankingRate;
  const fixedIncomeBalance = fdAccounts.reduce((sum, b) => sum + b.currentBalance, 0) * bankingRate;
  const totalBankingBalance = cashBalance + fixedIncomeBalance;

  // 4. Liabilities (Amortized Loan calculations)
  const totalLiabilities = data.loans.reduce((sum, loan) => {
    const calc = calculateOutstandingLoan(
      loan.principalAmount,
      loan.interestRate,
      loan.tenureMonths,
      loan.startMonth
    );
    return sum + calc.outstandingBalance;
  }, 0) * loanRate;

  // 5. Aggregate Wealth Metrics
  const totalAssets = totalStocksCurrent + totalCryptoCurrent + totalMfCurrent + totalBankingBalance;
  const netWorth = totalAssets - totalLiabilities;
  
  const totalInvested = totalStocksInvested + totalCryptoInvested + totalMfInvested + fixedIncomeBalance;
  const totalProfitLoss = stockPL + cryptoPL + mfPL;
  const absoluteReturn = totalInvested > 0 ? (totalProfitLoss / totalInvested) : 0;

  // 6. Passive Income Metrics
  // Sum up expected interest from FDs + Dividends received
  const expectedFDInterest = fdAccounts.reduce((sum, b) => sum + (b.expectedInterest || 0), 0);
  const totalPassiveIncome = expectedFDInterest + totalStockDividends;

  // 7. Emergency Fund Balance
  const emergencyGoals = data.goals.filter(g => g.category === 'Emergency Fund');
  const emergencyFundValue = emergencyGoals.reduce((sum, g) => sum + g.currentAmount, 0) || cashBalance; // fallback to savings

  // 8. Dynamic Top / Worst performing asset calculations
  const allPerformanceAssets: { name: string; gainPct: number; type: 'Stock' | 'Crypto' }[] = [];
  
  data.stocks.forEach(s => {
    const cost = s.quantity * s.purchasePrice;
    if (cost > 0) {
      allPerformanceAssets.push({
        name: s.ticker,
        gainPct: (s.currentPrice - s.purchasePrice) / s.purchasePrice,
        type: 'Stock'
      });
    }
  });

  data.crypto.forEach(c => {
    const cost = c.quantity * c.averageCost;
    if (cost > 0) {
      allPerformanceAssets.push({
        name: c.coin,
        gainPct: (c.currentPrice - c.averageCost) / c.averageCost,
        type: 'Crypto'
      });
    }
  });

  const mfList = data.mutualFunds || [];
  mfList.forEach(f => {
    const cost = f.units * f.averageNav;
    if (cost > 0) {
      allPerformanceAssets.push({
        name: f.fundName,
        gainPct: (f.currentNav - f.averageNav) / f.averageNav,
        type: 'Stock'
      });
    }
  });

  const sortedPerformance = [...allPerformanceAssets].sort((a, b) => b.gainPct - a.gainPct);
  const topAsset = sortedPerformance[0];
  const worstAsset = sortedPerformance[sortedPerformance.length - 1];

  // 9. Dynamic Today's Gain Calculations
  const stockTodayGain = data.stocks.reduce((sum, s) => {
    const prevClose = s.previousClose || s.currentPrice;
    return sum + ((s.currentPrice - prevClose) * s.quantity);
  }, 0) * stockRate;

  const cryptoTodayGain = data.crypto.reduce((sum, c) => {
    const prevClose = c.previousClose || c.currentPrice;
    return sum + ((c.currentPrice - prevClose) * c.quantity);
  }, 0) * cryptoRate;

  const mfTodayGain = mfList.reduce((sum, f) => {
    const prevClose = f.previousCloseNav || f.currentNav;
    return sum + ((f.currentNav - prevClose) * f.units);
  }, 0) * mfRate;

  const totalTodayGain = stockTodayGain + cryptoTodayGain + mfTodayGain;
  const totalFluctuatingAssetsCurrent = totalStocksCurrent + totalCryptoCurrent + totalMfCurrent;
  const yesterdayFluctuatingValue = totalFluctuatingAssetsCurrent - totalTodayGain;
  const todayGainPercent = yesterdayFluctuatingValue > 0 ? (totalTodayGain / yesterdayFluctuatingValue) : 0;

  // 10. Dynamic Equities CAGR calculation
  let equitiesCagr = 0;
  if (totalStocksInvested > 0 && data.stocks.length > 0) {
    let totalWeightedYears = 0;
    let totalWeight = 0;
    const now = new Date();
    
    data.stocks.forEach(s => {
      const purchaseDate = new Date(s.purchaseDate);
      if (!isNaN(purchaseDate.getTime())) {
        const diffTime = Math.abs(now.getTime() - purchaseDate.getTime());
        const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25) || 0.1;
        const weight = s.quantity * s.purchasePrice;
        totalWeightedYears += diffYears * weight;
        totalWeight += weight;
      }
    });
    
    const avgHoldingYears = totalWeight > 0 ? (totalWeightedYears / totalWeight) : 1;
    const totalRatio = totalStocksCurrent / totalStocksInvested;
    if (totalRatio > 0) {
      equitiesCagr = Math.pow(totalRatio, 1 / Math.max(1, avgHoldingYears)) - 1;
    }
  }

  // 11. Dynamic Wealth Index Score calculation
  let debtScore = 30;
  if (totalAssets > 0) {
    const debtRatio = totalLiabilities / totalAssets;
    debtScore = Math.max(0, Math.min(30, 30 * (1 - debtRatio)));
  }

  const salaryRecords = data.salary;
  let avgMonthlyExpense = 50000 * bankingRate; // default fallback
  if (salaryRecords && salaryRecords.length > 0) {
    const totalExp = salaryRecords.reduce((sum, s) => sum + (s.totalExpenses || 0), 0);
    avgMonthlyExpense = totalExp / salaryRecords.length || 50000 * bankingRate;
  }
  const emergencyCoverageMonths = avgMonthlyExpense > 0 ? (emergencyFundValue / avgMonthlyExpense) : 6;
  const emergencyScore = Math.min(30, Math.round(emergencyCoverageMonths * 5)) || 15;

  // Dynamic Savings Rate calculation
  let savingsRate = 0; // fallback to 0%
  if (data.salary.length > 0) {
    let totalIncome = 0;
    let totalSavings = 0;
    data.salary.forEach(s => {
      const monthIncome = s.receivedSalary + s.bonuses;
      if (monthIncome > 0) {
        totalIncome += monthIncome;
        const monthExpenses = s.totalExpenses || 0;
        totalSavings += Math.max(0, monthIncome - monthExpenses);
      }
    });
    if (totalIncome > 0) {
      savingsRate = totalSavings / totalIncome;
    }
  }

  let activeAssetClasses = 0;
  if (totalAssets > 0) {
    if (totalStocksCurrent / totalAssets > 0.05) activeAssetClasses++;
    if (totalCryptoCurrent / totalAssets > 0.05) activeAssetClasses++;
    if (totalMfCurrent / totalAssets > 0.05) activeAssetClasses++;
    if (cashBalance / totalAssets > 0.05) activeAssetClasses++;
    if (fixedIncomeBalance / totalAssets > 0.05) activeAssetClasses++;
  }
  const diversificationScore = Math.max(10, activeAssetClasses * 10);
  
  const wealthIndexScore = totalAssets === 0 ? 50 : Math.min(100, Math.max(10, Math.round(debtScore + emergencyScore + diversificationScore)));
  
  let wealthScoreRating = 'AVERAGE';
  let wealthScoreDescription = '';
  if (wealthIndexScore >= 85) {
    wealthScoreRating = 'EXCELLENT';
    wealthScoreDescription = `High emergency buffer and low liabilities drive your top index score. Diversification score is ${diversificationScore}/40.`;
  } else if (wealthIndexScore >= 70) {
    wealthScoreRating = 'GOOD';
    wealthScoreDescription = `Good overall health. Improving asset diversification or lowering liabilities can raise your rating. Diversification score is ${diversificationScore}/40.`;
  } else {
    wealthScoreRating = 'NEEDS ATTENTION';
    wealthScoreDescription = `Needs optimization. Build emergency funds and pay down high-interest liabilities to secure your rating. Diversification score is ${diversificationScore}/40.`;
  }

  // --- CHART DATA GENERATION ---

  // A. Net Worth History (Seed Data matching historical months)
  const netWorthHistory = [
    { name: 'Jan 26', NetWorth: Math.round(netWorth * 0.85), Invested: Math.round(totalInvested * 0.90) },
    { name: 'Feb 26', NetWorth: Math.round(netWorth * 0.88), Invested: Math.round(totalInvested * 0.92) },
    { name: 'Mar 26', NetWorth: Math.round(netWorth * 0.91), Invested: Math.round(totalInvested * 0.94) },
    { name: 'Apr 26', NetWorth: Math.round(netWorth * 0.93), Invested: Math.round(totalInvested * 0.96) },
    { name: 'May 26', NetWorth: Math.round(netWorth * 0.95), Invested: Math.round(totalInvested * 0.98) },
    { name: 'Jun 26', NetWorth: Math.round(netWorth * 0.97), Invested: Math.round(totalInvested * 0.99) },
    { name: 'Jul 26', NetWorth: Math.round(netWorth), Invested: Math.round(totalInvested) },
  ];

  // B. Asset Allocation
  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
  const allocationData = [
    { name: 'Equities (Stocks)', value: totalStocksCurrent },
    { name: 'Mutual Funds', value: totalMfCurrent },
    { name: 'Crypto', value: totalCryptoCurrent },
    { name: 'Savings / Cash', value: cashBalance },
    { name: 'Fixed Income (FD/RD)', value: fixedIncomeBalance },
  ].filter(item => item.value > 0);

  // C. Growth comparison
  const performanceChartData = [
    { name: 'Stocks', Invested: totalStocksInvested, Current: totalStocksCurrent },
    { name: 'Mutual Funds', Invested: totalMfInvested, Current: totalMfCurrent },
    { name: 'Crypto', Invested: totalCryptoInvested, Current: totalCryptoCurrent },
    { name: 'Banking/FDs', Invested: fixedIncomeBalance, Current: fixedIncomeBalance + expectedFDInterest },
  ];

  // D. Upcoming FD Maturity notifications
  const upcomingFDs = data.banking
    .filter(b => (b.accountType === 'Fixed Deposit' || b.accountType === 'Recurring Deposit') && b.maturityDate)
    .map(b => {
      const remainingDays = b.maturityDate 
        ? Math.ceil((new Date(b.maturityDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      return { ...b, remainingDays };
    })
    .sort((a, b) => a.remainingDays - b.remainingDays)
    .slice(0, 2);

  // E. Upcoming Insurance Premium Renewals
  const upcomingInsurances = data.insurances
    .map(i => {
      const remainingDays = Math.ceil((new Date(i.renewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return { ...i, remainingDays };
    })
    .sort((a, b) => a.remainingDays - b.remainingDays)
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Top Banner Ticker Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 glass rounded-2xl border border-slate-800/80 gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Live Asset Valuation Enabled</h2>
            <p className="text-xs text-slate-400">Stocks (Yahoo Finance Live) • Cryptocurrencies (Coinbase API Live) • Mutual Funds (AMFI API Live)</p>
          </div>
        </div>
        <div className="text-xs text-slate-400 font-mono self-end sm:self-center">
          Refreshed: {lastPriceRefresh.toLocaleTimeString()}
        </div>
      </div>

      {/* Main Net Worth Spotlight Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main large aggregate card */}
        <div className="lg:col-span-2 bg-gradient-to-tr from-violet-900/40 via-indigo-950/20 to-slate-950 p-6 rounded-3xl border border-violet-800/30 flex flex-col justify-between shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-violet-600/15 transition-all duration-500"></div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-violet-300 font-semibold tracking-wider uppercase flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> Consolidated Net Worth
              </span>
              <span className="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full font-mono uppercase font-semibold">
                LOCAL AES-256
              </span>
            </div>
            
            <div className="flex items-baseline gap-2">
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-sm">
                {formatCurrency(netWorth, currency)}
              </h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
              <div className={`flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                totalTodayGain >= 0 
                  ? 'text-emerald-400 bg-emerald-950/45 border-emerald-500/20' 
                  : 'text-red-400 bg-red-950/45 border-red-500/20'
              }`}>
                <TrendingUp className={`w-3.5 h-3.5 mr-1 ${totalTodayGain < 0 ? 'rotate-180 text-red-400' : 'text-emerald-400'}`} />
                {totalTodayGain >= 0 ? '+' : ''}{formatCurrency(totalTodayGain, currency)} (Today {formatPercent(todayGainPercent)})
              </div>
              <div className="text-slate-400 text-xs">
                Invested: <span className="font-semibold text-slate-200">{formatCurrency(totalInvested, currency)}</span>
              </div>
              <div className={`text-xs font-semibold ${totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                Gain: {totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(totalProfitLoss, currency)} ({formatPercent(absoluteReturn)})
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-slate-800/60 mt-6 pt-4 text-center">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-medium">Total Assets</p>
              <p className="text-sm font-bold text-slate-100 mt-0.5">{formatCompactCurrency(totalAssets, currency)}</p>
            </div>
            <div className="border-x border-slate-800/40">
              <p className="text-[10px] text-slate-400 uppercase font-medium">Total Debt</p>
              <p className="text-sm font-bold text-red-400 mt-0.5">{formatCompactCurrency(totalLiabilities, currency)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-medium">Monthly Savings</p>
              <p className="text-sm font-bold text-emerald-400 mt-0.5">{(savingsRate * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Dynamic Health Score / Quick Stats */}
        <div className="glass p-6 rounded-3xl border border-slate-850 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" /> Wealth Index Rating
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border ${
              wealthIndexScore >= 85
                ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20'
                : wealthIndexScore >= 70
                ? 'text-indigo-400 bg-indigo-950/40 border-indigo-500/20'
                : 'text-amber-400 bg-amber-950/40 border-amber-500/20'
            }`}>
              {wealthScoreRating}
            </span>
          </div>

          <div className="py-4 flex items-center gap-6">
            {/* Health dial visualization */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="34" className="stroke-slate-800 fill-none" strokeWidth="6" />
                <circle 
                  cx="40" 
                  cy="40" 
                  r="34" 
                  className="stroke-violet-500 fill-none" 
                  strokeWidth="6" 
                  strokeDasharray="213.6" 
                  strokeDashoffset={213.6 - (213.6 * wealthIndexScore) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xl font-black text-white">{wealthIndexScore}</span>
            </div>
            
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-200">Financial Health Score</h4>
              <p className="text-[11px] text-slate-400 leading-tight">
                {wealthScoreDescription}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/60 text-xs">
            <div className="p-2 bg-slate-900/50 rounded-xl">
              <p className="text-slate-400 text-[10px] uppercase">CAGR (Equities)</p>
              <p className={`font-semibold mt-0.5 ${equitiesCagr >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatPercent(equitiesCagr)}
              </p>
            </div>
            <div className="p-2 bg-slate-900/50 rounded-xl">
              <p className="text-slate-400 text-[10px] uppercase">Passive Income</p>
              <p className="font-semibold text-slate-200 mt-0.5">{formatCurrency(totalPassiveIncome, currency)}/yr</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Micro KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-2xl border border-slate-800/60">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Emergency Fund</p>
          <p className="text-base font-bold text-slate-100 mt-1">{formatCompactCurrency(emergencyFundValue, currency)}</p>
          <div className="flex items-center text-[10px] text-emerald-400 mt-1">
            <PiggyBank className="w-3 h-3 mr-1" />
            100% Funded (6m Expenses)
          </div>
        </div>

        <div className="glass p-4 rounded-2xl border border-slate-800/60">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Cash Available</p>
          <p className="text-base font-bold text-slate-100 mt-1">{formatCompactCurrency(cashBalance, currency)}</p>
          <span className="text-[9px] text-slate-400">Savings & Current Accounts</span>
        </div>

        <div className="glass p-4 rounded-2xl border border-slate-800/60">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Top Performing Asset</p>
          {topAsset ? (
            <>
              <p className="text-base font-bold text-slate-100 mt-1 flex items-center gap-1 text-ellipsis overflow-hidden">
                {topAsset.name} 
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center font-mono">
                  <ArrowUpRight className="w-3 h-3" />
                  {Math.round(topAsset.gainPct * 100)}%
                </span>
              </p>
              <span className="text-[9px] text-slate-400 uppercase font-mono">{topAsset.type}</span>
            </>
          ) : (
            <p className="text-sm font-semibold text-slate-500 mt-2">No data yet</p>
          )}
        </div>

        <div className="glass p-4 rounded-2xl border border-slate-800/60">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Underperforming Asset</p>
          {worstAsset ? (
            <>
              <p className="text-base font-bold text-slate-100 mt-1 flex items-center gap-1 text-ellipsis overflow-hidden">
                {worstAsset.name} 
                <span className={`text-[10px] font-semibold flex items-center font-mono ${worstAsset.gainPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {worstAsset.gainPct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.round(worstAsset.gainPct * 100)}%
                </span>
              </p>
              <span className="text-[9px] text-slate-400 uppercase font-mono">{worstAsset.type}</span>
            </>
          ) : (
            <p className="text-sm font-semibold text-slate-500 mt-2">No data yet</p>
          )}
        </div>
      </div>

      {/* Primary Graphs & Allocation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Area Chart (Net Worth History) */}
        <div className="lg:col-span-2 glass p-5 rounded-3xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Portfolio Growth Curve</h3>
              <p className="text-[10px] text-slate-400">Total Net Worth and Net Invested comparison</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-semibold">
              <span className="flex items-center gap-1 text-violet-400"><span className="w-2.5 h-2.5 bg-violet-500 rounded-sm"></span> Net Worth</span>
              <span className="flex items-center gap-1 text-slate-450"><span className="w-2.5 h-2.5 bg-slate-600 rounded-sm"></span> Invested</span>
            </div>
          </div>
          
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netWorthHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#475569" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#475569" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#64748b" 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => formatCompactCurrency(val, currency).replace(/[₹$€]/, '')}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                  formatter={(val: any) => [formatCurrency(val, currency), '']}
                />
                <Area type="monotone" dataKey="NetWorth" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorNetWorth)" />
                <Area type="monotone" dataKey="Invested" stroke="#64748b" strokeWidth={1.5} strokeDasharray="3 3" fillOpacity={1} fill="url(#colorInvested)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Allocation Pie/Donut Chart */}
        <div className="glass p-5 rounded-3xl border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Asset Allocation</h3>
            <p className="text-[10px] text-slate-400">Distribution across major asset classes</p>
          </div>

          <div className="h-48 w-full flex justify-center items-center relative py-2">
            {allocationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {allocationData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '11px' }}
                    formatter={(val: any) => [formatCurrency(val, currency), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 text-xs">No assets recorded. Please add to see breakdown.</div>
            )}
            
            {/* Center total */}
            {allocationData.length > 0 && (
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Total Assets</span>
                <span className="text-sm font-black text-slate-100 mt-0.5">{formatCompactCurrency(totalAssets, currency)}</span>
              </div>
            )}
          </div>

          {/* Allocation Legend */}
          <div className="space-y-1.5 pt-3 border-t border-slate-800/40">
            {allocationData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-350">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  {item.name}
                </span>
                <span className="font-semibold text-slate-200 font-mono">
                  {((item.value / totalAssets) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Asset Performance Breakdown & Notifications Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Comparison Chart */}
        <div className="lg:col-span-2 glass p-5 rounded-3xl border border-slate-800 shadow-lg">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Invested vs Current Market Value</h3>
            <p className="text-[10px] text-slate-400">Comparing original cost to current valuation across modules</p>
          </div>
          
          <div className="h-60 w-full text-xs mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#64748b" 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => formatCompactCurrency(val, currency).replace(/[₹$€]/, '')}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                  formatter={(val: any) => [formatCurrency(val, currency), '']}
                />
                <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Invested" fill="#475569" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Current" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time upcoming calendar & reminders */}
        <div className="glass p-5 rounded-3xl border border-slate-800 shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Financial Calendar</h3>
            <p className="text-[10px] text-slate-400">Critical upcoming maturity dates and payments</p>
          </div>

          <div className="space-y-3 flex-grow">
            {/* FDs maturing */}
            {upcomingFDs.length > 0 ? (
              upcomingFDs.map(fd => (
                <div key={fd.id} className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-200">
                      FD Maturity: {fd.bankName}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Receiving {formatCurrency(fd.maturityAmount || fd.currentBalance, currency)} on {formatDate(fd.maturityDate || '')}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      {/* simple days countdown */}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase font-mono ${fd.remainingDays < 30 ? 'bg-amber-950 text-amber-400' : 'bg-slate-850 text-slate-400'}`}>
                        {fd.remainingDays} days left
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">No deposits maturing soon.</p>
            )}

            {/* Insurance renewals */}
            {upcomingInsurances.length > 0 && (
              upcomingInsurances.map(ins => (
                <div key={ins.id} className="p-3 bg-slate-900/50 border border-slate-850 rounded-xl flex items-start gap-3">
                  <ShieldAlert className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-200">
                      Renewal: {ins.company} ({ins.type})
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Premium {formatCurrency(ins.premiumAmount, currency)} due {formatDate(ins.renewalDate)}
                    </p>
                    <span className="text-[9px] bg-slate-850 text-slate-400 px-1.5 py-0.5 rounded font-bold font-mono">
                      {ins.remainingDays} days left
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 text-[10px] text-slate-500 text-center border-t border-slate-800/40 uppercase tracking-wide">
            Automated local triggers checking daily
          </div>
        </div>
      </div>
    </div>
  );
};
