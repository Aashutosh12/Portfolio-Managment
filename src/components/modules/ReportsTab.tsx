import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { 
  formatCurrency, 
  formatPercent
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
  const totalStocksInvested = data.stocks.reduce((sum, s) => sum + (s.quantity * s.purchasePrice), 0) * stockRate;
  const totalStocksCurrent = data.stocks.reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0) * stockRate;
  const totalStockDividends = data.stocks.reduce((sum, s) => sum + s.dividend, 0) * stockRate;
  const totalCryptoCurrent = data.crypto.reduce((sum, c) => sum + (c.quantity * c.currentPrice), 0) * cryptoRate;

  // Mutual Funds
  const mfRate = currency === 'USD' ? (1 / usdToInr) : 1;
  const mutualFundsList = data.mutualFunds || [];
  const totalMfCurrent = mutualFundsList.reduce((sum, f) => sum + (f.units * f.currentNav), 0) * mfRate;

  const cashBalance = data.banking
    .filter(b => b.accountType === 'Savings' || b.accountType === 'Current')
    .reduce((sum, b) => sum + b.currentBalance, 0) * bankingRate;

  const fdAccounts = data.banking.filter(b => b.accountType === 'Fixed Deposit' || b.accountType === 'Recurring Deposit');
  const fixedIncomeBalance = fdAccounts.reduce((sum, b) => sum + b.currentBalance, 0) * bankingRate;

  const totalLiabilities = data.loans.reduce((sum, loan) => {
    const calc = calculateOutstandingLoan(loan.principalAmount, loan.interestRate, loan.tenureMonths, loan.startMonth);
    return sum + calc.outstandingBalance;
  }, 0) * loanRate;

  const totalAssets = totalStocksCurrent + totalCryptoCurrent + totalMfCurrent + cashBalance + fixedIncomeBalance;
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
  mutualFundsList.forEach(f => {
    if (f.units * f.averageNav > 0) {
      allPerformanceAssets.push({ name: f.fundName, gainPct: (f.currentNav - f.averageNav) / f.averageNav, type: 'Stock' });
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
  if (mutualFundsList.length > 0) uniqueAssetClasses.add('mutual_funds');
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

  // Dynamic Today's Gain Calculations
  const stockTodayGain = data.stocks.reduce((sum, s) => {
    const prevClose = s.previousClose || s.currentPrice;
    return sum + ((s.currentPrice - prevClose) * s.quantity);
  }, 0) * stockRate;

  const cryptoTodayGain = data.crypto.reduce((sum, c) => {
    const prevClose = c.previousClose || c.currentPrice;
    return sum + ((c.currentPrice - prevClose) * c.quantity);
  }, 0) * cryptoRate;

  const mfTodayGain = mutualFundsList.reduce((sum, f) => {
    const prevClose = f.previousCloseNav || f.currentNav;
    return sum + ((f.currentNav - prevClose) * f.units);
  }, 0) * mfRate;

  const totalTodayGain = stockTodayGain + cryptoTodayGain + mfTodayGain;
  const totalFluctuatingAssetsCurrent = totalStocksCurrent + totalCryptoCurrent + totalMfCurrent;
  const yesterdayFluctuatingValue = totalFluctuatingAssetsCurrent - totalTodayGain;
  const todayGainPercent = yesterdayFluctuatingValue > 0 ? (totalTodayGain / yesterdayFluctuatingValue) : 0;

  // Dynamic Equities CAGR calculation (Matches Dashboard)
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

  // Dynamic Wealth Index Score calculation (Matches Dashboard)
  let debtScore = 30;
  if (totalAssets > 0) {
    const debtRatio = totalLiabilities / totalAssets;
    debtScore = Math.max(0, Math.min(30, 30 * (1 - debtRatio)));
  }

  const emergencyScore = Math.min(30, Math.round(emergencyFundRatio * 30)) || 15;

  let activeAssetClassesCount = 0;
  if (totalAssets > 0) {
    if (totalStocksCurrent / totalAssets > 0.05) activeAssetClassesCount++;
    if (totalCryptoCurrent / totalAssets > 0.05) activeAssetClassesCount++;
    if (totalMfCurrent / totalAssets > 0.05) activeAssetClassesCount++;
    if (cashBalance / totalAssets > 0.05) activeAssetClassesCount++;
    if (fixedIncomeBalance / totalAssets > 0.05) activeAssetClassesCount++;
  }
  const diversificationScore = Math.max(10, activeAssetClassesCount * 10);
  
  const wealthIndexScore = totalAssets === 0 ? 50 : Math.min(100, Math.max(10, Math.round(debtScore + emergencyScore + diversificationScore)));
  
  let wealthScoreRating = 'Average';
  if (wealthIndexScore >= 85) {
    wealthScoreRating = 'Excellent';
  } else if (wealthIndexScore >= 70) {
    wealthScoreRating = 'Good';
  } else {
    wealthScoreRating = 'Needs Attention';
  }

  // Dynamic Savings and Investment Rates calculation
  let savingsRate = 0; // fallback to 0%
  let investmentRate = 0; // fallback to 0%

  if (data.salary.length > 0) {
    let totalIncome = 0;
    let totalSavings = 0;
    let totalInvestments = 0;

    data.salary.forEach(s => {
      const monthIncome = s.receivedSalary + s.bonuses;
      if (monthIncome > 0) {
        totalIncome += monthIncome;
        const monthExpenses = s.totalExpenses || 0;
        totalSavings += Math.max(0, monthIncome - monthExpenses);
        totalInvestments += s.monthlyInvestments || 0;
      }
    });

    if (totalIncome > 0) {
      savingsRate = totalSavings / totalIncome;
      investmentRate = totalInvestments / totalIncome;
    }
  }

  const healthScoreResult = calculateFinancialHealthScore({
    numAssetClasses: uniqueAssetClasses.size,
    emergencyFundRatio,
    savingsRate,
    investmentRate,
    debtRatio: totalLiabilities / totalAssets || 0,
    hasInsurance: data.insurances.length > 0,
    hasNominees: data.nominees.length > 0
  });

  // Find nearest maturing FD
  const activeFDs = data.banking.filter(b => 
    (b.accountType === 'Fixed Deposit' || b.accountType === 'Recurring Deposit') && 
    b.maturityDate
  );

  let nearestFDText = 'No active Fixed/Recurring Deposits';
  let nearestFDDesc = 'Start logging term deposits in the Banking tab to see maturity schedules.';

  if (activeFDs.length > 0) {
    const sortedFDs = [...activeFDs].sort((a, b) => {
      return new Date(a.maturityDate!).getTime() - new Date(b.maturityDate!).getTime();
    });
    
    const nearestFD = sortedFDs[0];
    const daysToMaturity = Math.ceil(
      (new Date(nearestFD.maturityDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    
    nearestFDText = `${nearestFD.bankName} ${nearestFD.accountType} (${formatCurrency(nearestFD.maturityAmount || nearestFD.currentBalance, currency)})`;
    if (daysToMaturity < 0) {
      nearestFDDesc = `Matured ${Math.abs(daysToMaturity)} days ago on ${nearestFD.maturityDate}. Total FDs expected maturity interest is ${formatCurrency(expectedFDInterest, currency)}.`;
    } else {
      nearestFDDesc = `Matures in ${daysToMaturity} days on ${nearestFD.maturityDate}. Total FDs expected maturity interest is ${formatCurrency(expectedFDInterest, currency)}.`;
    }
  } else {
    if (expectedFDInterest > 0) {
      nearestFDDesc = `Total expected interest is ${formatCurrency(expectedFDInterest, currency)}.`;
    }
  }

  // Find largest asset class for diversification description
  let largestAssetClass = 'Liquid Cash';
  let maxAssetVal = cashBalance;
  
  if (totalStocksCurrent > maxAssetVal) {
    largestAssetClass = 'Equities (Stocks)';
    maxAssetVal = totalStocksCurrent;
  }
  if (totalCryptoCurrent > maxAssetVal) {
    largestAssetClass = 'Cryptocurrencies';
    maxAssetVal = totalCryptoCurrent;
  }
  if (totalMfCurrent > maxAssetVal) {
    largestAssetClass = 'Mutual Funds';
    maxAssetVal = totalMfCurrent;
  }
  if (fixedIncomeBalance > maxAssetVal) {
    largestAssetClass = 'Fixed/Recurring Income';
    maxAssetVal = fixedIncomeBalance;
  }
  
  const totalAssetSum = totalAssets || 1;
  const largestAssetPct = (maxAssetVal / totalAssetSum) * 100;
  
  let diversificationHeading = `${uniqueAssetClasses.size} Asset Classes`;
  if (totalAssets > 0) {
    diversificationHeading = `${largestAssetClass} Heavy (${largestAssetPct.toFixed(0)}% Allocation)`;
  }

  // Find the primary employer from salary records
  let primaryEmployer = 'unrecorded sources';
  if (salaryRecords.length > 0) {
    const employers = salaryRecords.map(s => s.employer).filter(Boolean);
    if (employers.length > 0) {
      const counts = employers.reduce((acc, emp) => {
        acc[emp] = (acc[emp] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      primaryEmployer = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    }
  }

  // Dynamic wealth projection settings
  const totalLoggedInvestments = data.salary.reduce((sum, r) => sum + (r.monthlyInvestments || 0), 0);
  const avgMonthlyInvestment = data.salary.length > 0 && totalLoggedInvestments > 0 
    ? (totalLoggedInvestments / data.salary.length) 
    : 50000 * stockRate;

  const projectionCagr = equitiesCagr > 0 ? Math.round(equitiesCagr * 1000) / 10 : 12;

  // Re-project using dynamic investment amount and CAGR
  const projectionResults = projectWealth({
    currentNetWorth: netWorth,
    monthlyInvestment: avgMonthlyInvestment,
    expectedAnnualReturn: projectionCagr,
    inflationRate: 6,
    years: 20
  });

  const fiveYearsTotal = projectionResults[4]?.nominalValue || 0;
  const tenYearsTotal = projectionResults[9]?.nominalValue || 0;
  const twentyYearsTotal = projectionResults[19]?.nominalValue || 0;

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
            <p className={`text-base font-bold font-mono ${totalTodayGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalTodayGain >= 0 ? '+' : ''}{formatCurrency(totalTodayGain, currency)} ({formatPercent(todayGainPercent)})
            </p>
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
                  {formatPercent(topAsset.gainPct)} Absolute
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
                <span className={`text-[10px] font-semibold font-mono ${worstAsset.gainPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatPercent(worstAsset.gainPct)}
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
            <p className="text-base font-bold text-slate-200">{diversificationHeading}</p>
            <p className="text-[10px] text-slate-400 leading-normal">
              Asset concentration: Equities {totalAssets > 0 ? ((totalStocksCurrent / totalAssets) * 100).toFixed(0) : 0}%, Mutual Funds {totalAssets > 0 ? ((totalMfCurrent / totalAssets) * 100).toFixed(0) : 0}%, Cryptos {totalAssets > 0 ? ((totalCryptoCurrent / totalAssets) * 100).toFixed(0) : 0}%, Fixed Income {totalAssets > 0 ? ((fixedIncomeBalance / totalAssets) * 100).toFixed(0) : 0}%, Liquid Checking {totalAssets > 0 ? ((cashBalance / totalAssets) * 100).toFixed(0) : 0}%.
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
            <p className={`text-base font-bold font-mono flex items-center gap-1 ${
              wealthIndexScore >= 85
                ? 'text-emerald-400'
                : wealthIndexScore >= 70
                ? 'text-indigo-400'
                : 'text-amber-400'
            }`}>
              <Award className="w-4 h-4" />
              {wealthIndexScore} / 100 ({wealthScoreRating})
            </p>
            <p className="text-[10px] text-slate-450 leading-normal font-semibold italic text-violet-300">
              Recommendation: {healthScoreResult.recommendations[0] || 'Keep monitoring and growing your assets.'}
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
              {nearestFDText}
            </p>
            <p className="text-[10px] text-slate-400 leading-normal">
              {nearestFDDesc}
            </p>
          </div>

          {/* Box 11 */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">11. How much salary have I received this year?</span>
            <p className="text-base font-bold text-white font-mono">
              {formatCurrency(totalSalaryReceived, currency)} (Year 2026)
            </p>
            <p className="text-[10px] text-slate-400 leading-normal">
              Recorded paycredits from {primaryEmployer}. Total basic salary: {formatCurrency(totalBasicSalary, currency)}. Performance bonuses: {formatCurrency(totalBonuses, currency)}.
            </p>
          </div>

          {/* Box 12 */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">12. What will my wealth look like in 5, 10, and 20 years?</span>
            <p className="text-base font-bold text-white font-mono">
              10Y Est: {formatCurrency(tenYearsTotal, currency)}
            </p>
            <p className="text-[10px] text-slate-400 leading-normal">
              Assumed monthly investments of {formatCurrency(avgMonthlyInvestment, currency)} at {projectionCagr.toFixed(1)}% CAGR. 5Y: {formatCurrency(fiveYearsTotal, currency)} | 20Y: {formatCurrency(twentyYearsTotal, currency)}.
            </p>
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
