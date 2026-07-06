export type CurrencyType = 'INR' | 'USD' | 'EUR';
export type ThemeType = 'light' | 'dark';

export interface AppSettings {
  theme: ThemeType;
  currency: CurrencyType;
  refreshInterval: number; // in seconds
  lockTimeout: number; // in minutes (0 means disabled)
  isEncrypted: boolean;
  hasMasterPassword: boolean;
}

export interface StockAsset {
  id: string;
  company: string;
  ticker: string;
  broker: string;
  exchange: string;
  purchaseDate: string;
  quantity: number;
  purchasePrice: number; // average cost price
  currentPrice: number;
  dividend: number; // total dividends received or yield %
  sector: string;
  notes?: string;
  previousClose?: number;
}

export interface CryptoAsset {
  id: string;
  coin: string; // BTC, ETH, etc.
  exchange: string;
  wallet: string;
  purchaseDate: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  notes?: string;
  previousClose?: number;
}

export type BankAccountType = 'Savings' | 'Current' | 'Fixed Deposit' | 'Recurring Deposit';
export type CompoundingFrequency = 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly' | 'Simple';

export interface BankAsset {
  id: string;
  bankName: string;
  branch: string;
  accountType: BankAccountType;
  interestRate: number; // percentage
  currentBalance: number;
  openingDate: string;
  compoundingFrequency: CompoundingFrequency;
  maturityDate?: string; // only for FD/RD
  expectedInterest?: number; // calculation cache
  maturityAmount?: number;
  monthlyDeposit?: number; // only for RD
  notes?: string;
}

export interface SalaryRecord {
  id: string;
  year: number;
  month: number; // 0-11
  employer: string;
  expectedSalary: number;
  receivedSalary: number;
  creditDate: string;
  bonuses: number;
  incrementPercent: number;
  notes?: string;
  
  // Categorized Monthly Expense Parameters (Financial Expert Trackers)
  rentAndUtilities?: number;
  foodAndGroceries?: number;
  travelAndLeisure?: number;
  medicalAndInsurance?: number;
  miscellaneous?: number;
  totalExpenses?: number;
  monthlyInvestments?: number;
}

export type GoalCategory = 'House' | 'Vacation' | 'Emergency Fund' | 'Car' | 'Retirement' | 'Wedding' | 'Education' | 'Other';

export interface FinancialGoal {
  id: string;
  name: string;
  category: GoalCategory;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  notes?: string;
}

export interface PortfolioNote {
  id: string;
  title: string;
  content: string;
  date: string;
  category: string;
}

export interface VaultCard {
  id: string;
  cardName: string; // PAN, Aadhar, Credit Card, SSN
  holderName: string;
  cardNumber: string;
  expiryDate?: string;
  cvv?: string; // encrypted
  notes?: string;
}

export interface NomineeDetails {
  id: string;
  name: string;
  relationship: string;
  allocationPercent: number; // e.g. 100
  contactInfo?: string;
  notes?: string;
}

export interface InsurancePolicy {
  id: string;
  company: string;
  policyName: string;
  policyNumber: string;
  premiumAmount: number;
  sumAssured: number;
  renewalDate: string;
  type: 'Health' | 'Life' | 'Term' | 'Motor' | 'Home' | 'Other';
  notes?: string;
}

export interface LoanRecord {
  id: string;
  bankName: string;
  loanType: 'Home' | 'Personal' | 'Car' | 'Education' | 'Other';
  principalAmount: number;
  interestRate: number; // annual
  tenureMonths: number;
  startMonth: string; // YYYY-MM
  emiAmount: number;
  notes?: string;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  assetType: 'Stock' | 'Crypto';
  targetPrice?: number;
  notes?: string;
}

export interface AppNotification {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  date: string;
  read: boolean;
}

export interface MutualFundAsset {
  id: string;
  fundName: string;
  schemeCode: string; // AMFI scheme code for live price tracking
  folioNumber?: string;
  category: string; // Equity, Debt, Hybrid, Index, etc.
  purchaseDate: string;
  units: number;
  averageNav: number; // Purchase price per unit
  currentNav: number;
  notes?: string;
  previousCloseNav?: number;
}

export interface PortfolioData {
  settings: AppSettings;
  stocks: StockAsset[];
  crypto: CryptoAsset[];
  mutualFunds: MutualFundAsset[];
  banking: BankAsset[];
  salary: SalaryRecord[];
  goals: FinancialGoal[];
  notes: PortfolioNote[];
  vaultCards: VaultCard[];
  nominees: NomineeDetails[];
  insurances: InsurancePolicy[];
  loans: LoanRecord[];
  watchlist: WatchlistItem[];
  notifications: AppNotification[];
  lastUpdated: string;
}
