/**
 * Financial Calculation Utilities
 */
import type { CompoundingFrequency } from '../types';

/**
 * Calculates CAGR (Compound Annual Growth Rate)
 * CAGR = (Ending Value / Beginning Value) ^ (1 / Years) - 1
 */
export function calculateCAGR(beginningValue: number, endingValue: number, years: number): number {
  if (beginningValue <= 0 || endingValue <= 0 || years <= 0) return 0;
  return Math.pow(endingValue / beginningValue, 1 / years) - 1;
}

/**
 * Calculates XIRR (Extended Internal Rate of Return) using the Bisection Method.
 * Cash flows contain positive/negative values.
 * - Negative: cash outflow (investments made)
 * - Positive: cash inflow (withdrawals or current value)
 */
export interface CashFlow {
  amount: number; // positive or negative
  date: Date;
}

export function calculateXIRR(cashFlows: CashFlow[]): number {
  if (cashFlows.length < 2) return 0;

  // Sort cash flows by date
  const sortedFlows = [...cashFlows].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const d0 = sortedFlows[0].date.getTime();
  
  // Calculate years since the start date for each flow
  const flowsWithTime = sortedFlows.map(flow => ({
    amount: flow.amount,
    t: (flow.date.getTime() - d0) / (365 * 24 * 60 * 60 * 1000), // years
  }));

  // Net present value function
  const npv = (rate: number): number => {
    let sum = 0;
    for (const flow of flowsWithTime) {
      sum += flow.amount / Math.pow(1 + rate, flow.t);
    }
    return sum;
  };

  // Solver using bisection method
  let low = -0.999;
  let high = 100.0; // 10000%
  let mid = 0;
  const tolerance = 1e-6;
  const maxIterations = 100;
  
  let fLow = npv(low);
  let fHigh = npv(high);

  // If signs are the same, we might not have a root in this interval
  if (fLow * fHigh > 0) {
    // Try adjusting low and high to find signs crossing
    let found = false;
    for (let i = 0; i < 10; i++) {
      high *= 2;
      fHigh = npv(high);
      if (fLow * fHigh < 0) {
        found = true;
        break;
      }
    }
    if (!found) return 0;
  }

  for (let i = 0; i < maxIterations; i++) {
    mid = (low + high) / 2;
    const fMid = npv(mid);

    if (Math.abs(fMid) < tolerance) {
      return mid; // Converged
    }

    if (fLow * fMid < 0) {
      high = mid;
      fHigh = fMid;
    } else {
      low = mid;
      fLow = fMid;
    }
  }

  return mid; // Best estimate
}

/**
 * Future Wealth Projection
 * Calculates Year-by-Year compounding values considering inflation.
 */
export interface ProjectionInput {
  currentNetWorth: number;
  monthlyInvestment: number;
  expectedAnnualReturn: number; // percentage (e.g. 12)
  inflationRate: number; // percentage (e.g. 6)
  years: number;
}

export interface ProjectionYearlyResult {
  year: number;
  nominalValue: number;
  realValue: number; // inflation-adjusted
  totalInvested: number;
}

export function projectWealth(input: ProjectionInput): ProjectionYearlyResult[] {
  const { currentNetWorth, monthlyInvestment, expectedAnnualReturn, inflationRate, years } = input;
  
  const results: ProjectionYearlyResult[] = [];
  let nominal = currentNetWorth;
  let real = currentNetWorth;
  let totalInvested = currentNetWorth;
  
  const r = expectedAnnualReturn / 100;
  const inf = inflationRate / 100;
  
  // Real growth rate: Fisher equation or simple approximation (r - inf)
  // Let's project both nominal and inflation-adjusted value
  
  for (let y = 1; y <= years; y++) {
    // We add monthly investments throughout the year
    // Compound monthly
    const monthlyRate = r / 12;
    const monthlyInfRate = inf / 12;
    
    for (let m = 0; m < 12; m++) {
      nominal = nominal * (1 + monthlyRate) + monthlyInvestment;
      real = real * (1 + (monthlyRate - monthlyInfRate)) + monthlyInvestment;
      totalInvested += monthlyInvestment;
    }
    
    results.push({
      year: y,
      nominalValue: Math.round(nominal),
      realValue: Math.round(real),
      totalInvested: Math.round(totalInvested),
    });
  }
  
  return results;
}

/**
 * Calculates Financial Health Score out of 100
 */
export interface HealthScoreInput {
  numAssetClasses: number; // Stock, Crypto, Banks, Insurance, Loan
  emergencyFundRatio: number; // Emergency fund / 6-months expenses
  savingsRate: number; // (Income - Expense - EMI) / Income
  investmentRate: number; // Investment / Income
  debtRatio: number; // Outstanding Debt / Total Assets
  hasInsurance: boolean;
  hasNominees: boolean;
}

export interface HealthScoreResult {
  score: number;
  breakdown: {
    diversification: number; // max 20
    emergencyFund: number; // max 20
    savingsRate: number; // max 15
    investmentRate: number; // max 15
    debt: number; // max 15
    protection: number; // max 15 (Insurance + Nominees)
  };
  recommendations: string[];
}

export function calculateFinancialHealthScore(input: HealthScoreInput): HealthScoreResult {
  const breakdown = {
    diversification: 0,
    emergencyFund: 0,
    savingsRate: 0,
    investmentRate: 0,
    debt: 0,
    protection: 0,
  };
  
  const recommendations: string[] = [];

  // 1. Diversification (Max 20)
  // 3+ asset classes is good
  if (input.numAssetClasses >= 4) {
    breakdown.diversification = 20;
  } else if (input.numAssetClasses === 3) {
    breakdown.diversification = 15;
    recommendations.push('Consider diversifying into other asset classes like Gold, Debt, or Real Estate.');
  } else if (input.numAssetClasses === 2) {
    breakdown.diversification = 10;
    recommendations.push('Your portfolio is concentrated. Explore adding secondary asset classes to spread risk.');
  } else {
    breakdown.diversification = 5;
    recommendations.push('Highly concentrated portfolio! Add diversified assets to protect your wealth.');
  }

  // 2. Emergency Fund Ratio (Max 20)
  // ratio = current emergency fund / (6 * monthly expense)
  if (input.emergencyFundRatio >= 1.0) {
    breakdown.emergencyFund = 20;
  } else if (input.emergencyFundRatio >= 0.5) {
    breakdown.emergencyFund = 12;
    recommendations.push('Top up your emergency fund to cover at least 6 months of expenses (currently covers ' + Math.round(input.emergencyFundRatio * 6) + ' months).');
  } else {
    breakdown.emergencyFund = 5;
    recommendations.push('Critical: Your emergency fund is low. Prioritize building a 6-month buffer.');
  }

  // 3. Savings Rate (Max 15)
  // 30%+ savings rate is excellent
  if (input.savingsRate >= 0.40) {
    breakdown.savingsRate = 15;
  } else if (input.savingsRate >= 0.25) {
    breakdown.savingsRate = 12;
  } else if (input.savingsRate >= 0.10) {
    breakdown.savingsRate = 8;
    recommendations.push('Aim to cut down non-essential expenses to increase your savings rate above 25%.');
  } else {
    breakdown.savingsRate = 3;
    recommendations.push('Your savings rate is below 10%. Review your cash flow and create a strict budget.');
  }

  // 4. Investment Rate (Max 15)
  // 20%+ investment rate is great
  if (input.investmentRate >= 0.30) {
    breakdown.investmentRate = 15;
  } else if (input.investmentRate >= 0.15) {
    breakdown.investmentRate = 11;
  } else if (input.investmentRate >= 0.05) {
    breakdown.investmentRate = 6;
    recommendations.push('Increase your automated monthly SIP investments to capture long-term compounding.');
  } else {
    breakdown.investmentRate = 2;
    recommendations.push('You are saving but not investing enough. Start small with regular mutual fund SIPs.');
  }

  // 5. Debt Ratio (Max 15)
  // Debt to assets: < 20% is ideal, > 50% is dangerous
  if (input.debtRatio <= 0.1) {
    breakdown.debt = 15;
  } else if (input.debtRatio <= 0.3) {
    breakdown.debt = 12;
  } else if (input.debtRatio <= 0.5) {
    breakdown.debt = 7;
    recommendations.push('Your debt-to-asset ratio is ' + Math.round(input.debtRatio * 100) + '%. Avoid taking new loans and pre-pay high-interest debts.');
  } else {
    breakdown.debt = 2;
    recommendations.push('High debt alert! Your debt-to-asset ratio exceeds 50%. Focus aggressively on debt repayment.');
  }

  // 6. Protection (Max 15)
  // Insurance = 10 points, Nominees = 5 points
  if (input.hasInsurance) {
    breakdown.protection += 10;
  } else {
    recommendations.push('Protect your family: Buy term life insurance and a comprehensive health insurance policy.');
  }
  
  if (input.hasNominees) {
    breakdown.protection += 5;
  } else {
    recommendations.push('Add nominee details for your assets to secure simple transmission.');
  }

  const score = breakdown.diversification + breakdown.emergencyFund + breakdown.savingsRate + breakdown.investmentRate + breakdown.debt + breakdown.protection;

  return {
    score,
    breakdown,
    recommendations: recommendations.length > 0 ? recommendations : ['Great job! Maintain this financial balance.'],
  };
}

/**
 * Simple calculation of compounding interest for banking products
 */
export function calculateMaturity(
  principal: number,
  rate: number, // percentage
  frequency: CompoundingFrequency,
  tenureYears: number
): { maturityAmount: number; interestEarned: number } {
  let n = 1;
  if (frequency === 'Monthly') n = 12;
  else if (frequency === 'Quarterly') n = 4;
  else if (frequency === 'Half-Yearly') n = 2;
  else if (frequency === 'Yearly') n = 1;
  
  const r = rate / 100;
  
  let maturityAmount = 0;
  if (frequency === 'Simple') {
    maturityAmount = principal * (1 + r * tenureYears);
  } else {
    maturityAmount = principal * Math.pow(1 + r / n, n * tenureYears);
  }
  
  return {
    maturityAmount: Math.round(maturityAmount),
    interestEarned: Math.round(maturityAmount - principal),
  };
}

/**
 * Calculates outstanding loan balance after a given number of months have elapsed.
 */
export function calculateOutstandingLoan(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  startMonthStr: string,
  currentDateStr: string = '2026-07-05'
): { monthsPaid: number; monthsRemaining: number; outstandingBalance: number; totalPaid: number; emi: number } {
  const parts = startMonthStr.split('-');
  const startYear = parseInt(parts[0], 10);
  const startMonth = parseInt(parts[1], 10); // 1-12
  
  const current = new Date(currentDateStr);
  const curYear = current.getFullYear();
  const curMonth = current.getMonth() + 1; // 1-12

  const monthsElapsed = Math.max(0, (curYear - startYear) * 12 + (curMonth - startMonth));
  const monthsPaid = Math.min(tenureMonths, monthsElapsed);
  const monthsRemaining = tenureMonths - monthsPaid;

  const r = annualRate / 12 / 100;
  
  if (r === 0) {
    const emi = principal / tenureMonths;
    const outstanding = Math.max(0, principal - emi * monthsPaid);
    return {
      monthsPaid,
      monthsRemaining,
      outstandingBalance: Math.round(outstanding),
      totalPaid: Math.round(emi * monthsPaid),
      emi: Math.round(emi),
    };
  }

  const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  
  // Outstanding balance after p payments:
  // Bal = Principal * (1+r)^p - EMI * [((1+r)^p - 1)/r]
  const p = monthsPaid;
  const outstanding = principal * Math.pow(1 + r, p) - emi * ((Math.pow(1 + r, p) - 1) / r);

  return {
    monthsPaid,
    monthsRemaining,
    outstandingBalance: Math.round(Math.max(0, outstanding)),
    totalPaid: Math.round(emi * monthsPaid),
    emi: Math.round(emi),
  };
}
