import type { PortfolioData } from '../types';
import { encryptData, decryptData, hashPassword } from '../utils/crypto';

export const STORAGE_KEY = 'antigravity_wealth_data';
export const AUTH_KEY = 'antigravity_auth_hash';

// Detailed premium mock data to instantly populate the dashboard and wow the user
const DEFAULT_MOCK_DATA: PortfolioData = {
  settings: {
    theme: 'dark',
    currency: 'INR',
    refreshInterval: 60,
    lockTimeout: 5,
    isEncrypted: false,
    hasMasterPassword: false,
  },
  stocks: [
    {
      id: 'st-1',
      company: 'Reliance Industries Ltd.',
      ticker: 'RELIANCE.NS',
      broker: 'Zerodha',
      exchange: 'NSE',
      purchaseDate: '2024-11-15',
      quantity: 120,
      purchasePrice: 2340.50,
      currentPrice: 2890.75,
      dividend: 1550,
      sector: 'Energy & Conglomerate',
      notes: 'Long term bluechip holding. Strong cash flow.',
    },
    {
      id: 'st-2',
      company: 'Tata Consultancy Services',
      ticker: 'TCS.NS',
      broker: 'Groww',
      exchange: 'NSE',
      purchaseDate: '2025-02-10',
      quantity: 45,
      purchasePrice: 3820.00,
      currentPrice: 4125.40,
      dividend: 2800,
      sector: 'IT Services',
      notes: 'High dividend payer, defensive stock.',
    },
    {
      id: 'st-3',
      company: 'Apple Inc.',
      ticker: 'AAPL',
      broker: 'Vested',
      exchange: 'NASDAQ',
      purchaseDate: '2023-08-20',
      quantity: 35,
      purchasePrice: 172.50,
      currentPrice: 218.30,
      dividend: 45,
      sector: 'Technology',
      notes: 'US Tech core holding. Premium ecosystem.',
    },
    {
      id: 'st-4',
      company: 'HDFC Bank Ltd.',
      ticker: 'HDFCBANK.NS',
      broker: 'Zerodha',
      exchange: 'NSE',
      purchaseDate: '2025-05-12',
      quantity: 150,
      purchasePrice: 1480.00,
      currentPrice: 1720.50,
      dividend: 900,
      sector: 'Banking & Financials',
      notes: 'Banking sector proxy. Bought during correction.',
    },
    {
      id: 'st-5',
      company: 'Tesla Inc.',
      ticker: 'TSLA',
      broker: 'Interactive Brokers',
      exchange: 'NASDAQ',
      purchaseDate: '2024-04-05',
      quantity: 15,
      purchasePrice: 165.00,
      currentPrice: 248.50,
      dividend: 0,
      sector: 'Automotive / EV',
      notes: 'High volatility asset. Keep allocation below 2%.',
    }
  ],
  crypto: [
    {
      id: 'cr-1',
      coin: 'BTC',
      exchange: 'Binance',
      wallet: 'Ledger Nano X',
      purchaseDate: '2023-10-01',
      quantity: 0.65,
      averageCost: 32000,
      currentPrice: 68500,
      notes: 'Primary crypto asset. Stored in cold wallet.',
    },
    {
      id: 'cr-2',
      coin: 'ETH',
      exchange: 'Coinbase',
      wallet: 'MetaMask',
      purchaseDate: '2024-01-15',
      quantity: 4.2,
      averageCost: 1950,
      currentPrice: 3540,
      notes: 'Web3 infrastructure play.',
    },
    {
      id: 'cr-3',
      coin: 'SOL',
      exchange: 'Kraken',
      wallet: 'Phantom Wallet',
      purchaseDate: '2024-08-10',
      quantity: 32,
      averageCost: 92.50,
      currentPrice: 145.80,
      notes: 'High-speed layer 1. Tactical allocation.',
    }
  ],
  banking: [
    {
      id: 'bk-1',
      bankName: 'HDFC Bank',
      branch: 'Koramangala, Bangalore',
      accountType: 'Savings',
      interestRate: 3.5,
      currentBalance: 320000,
      openingDate: '2019-04-12',
      compoundingFrequency: 'Quarterly',
    },
    {
      id: 'bk-2',
      bankName: 'ICICI Bank',
      branch: 'Indiranagar, Bangalore',
      accountType: 'Savings',
      interestRate: 3.0,
      currentBalance: 125000,
      openingDate: '2021-08-22',
      compoundingFrequency: 'Quarterly',
    },
    {
      id: 'bk-3',
      bankName: 'SBI',
      branch: 'Main Branch, Delhi',
      accountType: 'Fixed Deposit',
      interestRate: 7.1,
      currentBalance: 500000,
      openingDate: '2025-08-01',
      compoundingFrequency: 'Quarterly',
      maturityDate: '2026-08-01', // Maturing soon
      expectedInterest: 36450,
      maturityAmount: 536450,
    },
    {
      id: 'bk-4',
      bankName: 'Axis Bank',
      branch: 'Whitefield, Bangalore',
      accountType: 'Recurring Deposit',
      interestRate: 6.8,
      currentBalance: 120000,
      openingDate: '2025-10-05',
      compoundingFrequency: 'Quarterly',
      maturityDate: '2026-10-05',
      monthlyDeposit: 10000,
      expectedInterest: 4500,
      maturityAmount: 124500,
    }
  ],
  salary: [
    {
      id: 'sl-1',
      year: 2026,
      month: 5, // June (0-indexed)
      employer: 'Google LLC',
      expectedSalary: 180000,
      receivedSalary: 180000,
      creditDate: '2026-06-30',
      bonuses: 25000,
      incrementPercent: 8,
      notes: 'Mid-year performance bonus included.',
      rentAndUtilities: 35000,
      foodAndGroceries: 20000,
      travelAndLeisure: 25000,
      medicalAndInsurance: 5000,
      miscellaneous: 10000,
      totalExpenses: 95000,
      monthlyInvestments: 55000
    },
    {
      id: 'sl-2',
      year: 2026,
      month: 4, // May
      employer: 'Google LLC',
      expectedSalary: 180000,
      receivedSalary: 180000,
      creditDate: '2026-05-29',
      bonuses: 0,
      incrementPercent: 8,
      rentAndUtilities: 35000,
      foodAndGroceries: 18000,
      travelAndLeisure: 15000,
      medicalAndInsurance: 5000,
      miscellaneous: 7000,
      totalExpenses: 80000,
      monthlyInvestments: 50000
    },
    {
      id: 'sl-3',
      year: 2026,
      month: 3, // April
      employer: 'Google LLC',
      expectedSalary: 180000,
      receivedSalary: 180000,
      creditDate: '2026-04-30',
      bonuses: 0,
      incrementPercent: 8,
      rentAndUtilities: 35000,
      foodAndGroceries: 22000,
      travelAndLeisure: 18000,
      medicalAndInsurance: 5000,
      miscellaneous: 8000,
      totalExpenses: 88000,
      monthlyInvestments: 48000
    },
    {
      id: 'sl-4',
      year: 2026,
      month: 2, // March
      employer: 'Google LLC',
      expectedSalary: 165000,
      receivedSalary: 165000,
      creditDate: '2026-03-31',
      bonuses: 12000,
      incrementPercent: 0,
      notes: 'LTI vesting stock bonus.',
      rentAndUtilities: 32000,
      foodAndGroceries: 16000,
      travelAndLeisure: 12000,
      medicalAndInsurance: 4000,
      miscellaneous: 6000,
      totalExpenses: 70000,
      monthlyInvestments: 40000
    },
    {
      id: 'sl-5',
      year: 2026,
      month: 1, // February
      employer: 'Google LLC',
      expectedSalary: 165000,
      receivedSalary: 165000,
      creditDate: '2026-02-27',
      bonuses: 0,
      incrementPercent: 0,
      rentAndUtilities: 32000,
      foodAndGroceries: 15000,
      travelAndLeisure: 10000,
      medicalAndInsurance: 4000,
      miscellaneous: 5000,
      totalExpenses: 66000,
      monthlyInvestments: 40000
    },
    {
      id: 'sl-6',
      year: 2026,
      month: 0, // January
      employer: 'Google LLC',
      expectedSalary: 165000,
      receivedSalary: 165000,
      creditDate: '2026-01-30',
      bonuses: 0,
      incrementPercent: 0,
      rentAndUtilities: 32000,
      foodAndGroceries: 17000,
      travelAndLeisure: 11000,
      medicalAndInsurance: 4000,
      miscellaneous: 6000,
      totalExpenses: 70000,
      monthlyInvestments: 38000
    },
  ],
  goals: [
    {
      id: 'gl-1',
      name: 'Emergency Buffer Fund',
      category: 'Emergency Fund',
      targetAmount: 300000,
      currentAmount: 300000, // Fully funded
      targetDate: '2025-12-31',
      notes: 'Completed. Saved 6 months of absolute expenses.',
    },
    {
      id: 'gl-2',
      name: 'Tesla Model Y EV',
      category: 'Car',
      targetAmount: 4500000,
      currentAmount: 1850000,
      targetDate: '2027-12-31',
      notes: 'Planning to purchase cash + minor low-rate EV loan.',
    },
    {
      id: 'gl-3',
      name: 'Dream Villa downpayment',
      category: 'House',
      targetAmount: 8000000,
      currentAmount: 2500000,
      targetDate: '2029-06-30',
      notes: 'Ongoing investments. Redirecting annual bonuses here.',
    },
    {
      id: 'gl-4',
      name: 'Early Retirement Fund (FIRE)',
      category: 'Retirement',
      targetAmount: 35000000,
      currentAmount: 7350000,
      targetDate: '2038-12-31',
      notes: 'Aiming for 3.5 Crore corpus for financial independence.',
    }
  ],
  notes: [
    {
      id: 'nt-1',
      title: 'H1 2026 Portfolio Strategy',
      content: 'Maintain 65% in equities, 15% debt/FD, 10% Crypto and 10% Cash. Rebalance in December if equity allocation exceeds 70% due to run up.',
      date: '2026-06-15',
      category: 'Strategy',
    },
    {
      id: 'nt-2',
      title: 'Term Life Renewal checklist',
      content: 'Max Life Term Insurance premium is due on August 12. Check bank auto-debit status.',
      date: '2026-07-02',
      category: 'Reminder',
    }
  ],
  vaultCards: [
    {
      id: 'vc-1',
      cardName: 'Permanent Account Number (PAN)',
      holderName: 'AASHUTOSH SINGH RAWAT',
      cardNumber: 'ABCDE1234F',
      notes: 'Indian Income Tax ID. Required for stock account openings.',
    },
    {
      id: 'vc-2',
      cardName: 'ICICI Rubyx Credit Card',
      holderName: 'A S Rawat',
      cardNumber: '4321-xxxx-xxxx-8877',
      expiryDate: '12/29',
      cvv: '123',
      notes: 'Primary card for dining and utility cashbacks.',
    }
  ],
  nominees: [
    {
      id: 'nm-1',
      name: 'Kiran Rawat',
      relationship: 'Spouse',
      allocationPercent: 70,
      contactInfo: 'kiran@email.com | +91 9876543210',
      notes: 'Primary Nominee for HDFC accounts and Zerodha Demat.',
    },
    {
      id: 'nm-2',
      name: 'Rohan Rawat',
      relationship: 'Child',
      allocationPercent: 30,
      contactInfo: 'rohan@email.com',
      notes: 'Secondary Nominee.',
    }
  ],
  insurances: [
    {
      id: 'in-1',
      company: 'Max Life Insurance',
      policyName: 'Term Plan Plus',
      policyNumber: 'ML-99887766',
      premiumAmount: 18500,
      sumAssured: 15000000,
      renewalDate: '2026-08-12',
      type: 'Term',
      notes: 'Pure Term Insurance. Nominee: Spouse (100%).',
    },
    {
      id: 'in-2',
      company: 'Niva Bupa Health',
      policyName: 'Health Companion',
      policyNumber: 'NB-11223344',
      premiumAmount: 22000,
      sumAssured: 1000000,
      renewalDate: '2026-11-20',
      type: 'Health',
      notes: 'Family Floater covering self and spouse.',
    }
  ],
  loans: [
    {
      id: 'ln-1',
      bankName: 'HDFC Home Loans',
      loanType: 'Home',
      principalAmount: 4500000,
      interestRate: 8.4,
      tenureMonths: 180, // 15 years
      startMonth: '2024-01',
      emiAmount: 44086,
      notes: 'Floating interest rate. Planning to prepay 2 Lakhs yearly to reduce tenure.',
    }
  ],
  watchlist: [
    {
      id: 'wl-1',
      symbol: 'NIFTY50',
      name: 'Nifty 50 Index',
      assetType: 'Stock',
      targetPrice: 22000,
    },
    {
      id: 'wl-2',
      symbol: 'NVDA',
      name: 'NVIDIA Corp.',
      assetType: 'Stock',
      targetPrice: 110,
    },
    {
      id: 'wl-3',
      symbol: 'DOGE',
      name: 'Dogecoin',
      assetType: 'Crypto',
      targetPrice: 0.08,
    }
  ],
  notifications: [
    {
      id: 'nf-1',
      text: 'SBI Fixed Deposit maturing soon on 2026-08-01. Expected yield is ₹5,36,450.',
      type: 'warning',
      date: '2026-07-04',
      read: false,
    },
    {
      id: 'nf-2',
      text: 'June Salary credited successfully by Google LLC: ₹1,80,000.',
      type: 'success',
      date: '2026-06-30',
      read: true,
    },
    {
      id: 'nf-3',
      text: 'Wealth Milestone: Your Net Worth crossed the ₹1 Crore (10 Million INR) mark!',
      type: 'info',
      date: '2026-06-15',
      read: false,
    }
  ],
  lastUpdated: new Date().toISOString(),
};

/**
 * Initialize storage with default mock data if empty
 */
export function initializeStorage(): void {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MOCK_DATA));
  }
}

/**
 * Checks if the system has a master password set
 */
export function hasMasterPasswordSet(): boolean {
  return localStorage.getItem(AUTH_KEY) !== null;
}

/**
 * Sets a new master password and encrypts all existing data
 */
export function setMasterPassword(password: string, currentData: PortfolioData): void {
  const hash = hashPassword(password);
  localStorage.setItem(AUTH_KEY, hash);
  
  // Mark settings as encrypted
  const updatedData: PortfolioData = {
    ...currentData,
    settings: {
      ...currentData.settings,
      isEncrypted: true,
      hasMasterPassword: true
    }
  };
  
  // Save encrypted
  const ciphertext = encryptData(updatedData, password);
  localStorage.setItem(STORAGE_KEY, ciphertext);
}

/**
 * Verifies a master password and returns true if correct
 */
export function verifyMasterPassword(password: string): boolean {
  const storedHash = localStorage.getItem(AUTH_KEY);
  if (!storedHash) return true; // No password set
  return hashPassword(password) === storedHash;
}

/**
 * Removes master password and saves data in plaintext
 */
export function disableMasterPassword(password: string, decryptedData: PortfolioData): void {
  if (!verifyMasterPassword(password)) {
    throw new Error('Incorrect password');
  }
  
  localStorage.removeItem(AUTH_KEY);
  
  const updatedData: PortfolioData = {
    ...decryptedData,
    settings: {
      ...decryptedData.settings,
      isEncrypted: false,
      hasMasterPassword: false
    }
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
}

/**
 * Loads portfolio data. 
 * If encrypted, requires password. If not, loads plaintext.
 */
export function loadPortfolioData(password?: string): PortfolioData {
  initializeStorage();
  
  const rawContent = localStorage.getItem(STORAGE_KEY);
  if (!rawContent) {
    return DEFAULT_MOCK_DATA;
  }
  
  const hasPassword = hasMasterPasswordSet();
  
  if (hasPassword) {
    if (!password) {
      throw new Error('Password required to load encrypted data');
    }
    // Attempt decryption
    try {
      const decrypted = decryptData(rawContent, password);
      return decrypted;
    } catch (e) {
      throw new Error('Incorrect master password or corrupted database.');
    }
  } else {
    // Attempt plain parse
    try {
      return JSON.parse(rawContent);
    } catch (e) {
      // Maybe it was encrypted but auth key was deleted
      console.error('Data parsing failed. Check if database is encrypted.', e);
      return DEFAULT_MOCK_DATA;
    }
  }
}

/**
 * Saves portfolio data.
 * Encrypts if master password is set, otherwise saves in plain JSON.
 */
export function savePortfolioData(data: PortfolioData, password?: string): void {
  const hasPassword = hasMasterPasswordSet();
  const updatedData = {
    ...data,
    lastUpdated: new Date().toISOString()
  };
  
  if (hasPassword) {
    if (!password) {
      throw new Error('Master password required for encrypted save');
    }
    const ciphertext = encryptData(updatedData, password);
    localStorage.setItem(STORAGE_KEY, ciphertext);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
  }
}

/**
 * Exports data as a downloadable JSON string (encrypted or plaintext depending on setting)
 */
export function exportPortfolioBackup(data: PortfolioData, passwordForBackup?: string): string {
  if (passwordForBackup) {
    return encryptData(data, passwordForBackup);
  }
  return JSON.stringify(data, null, 2);
}

/**
 * Restores data from a backup string. Supports encrypted backup if password is provided.
 */
export function importPortfolioBackup(backupStr: string, passwordForBackup?: string): PortfolioData {
  if (passwordForBackup) {
    const decrypted = decryptData(backupStr, passwordForBackup);
    return decrypted;
  }
  return JSON.parse(backupStr);
}

/**
 * Fully wipes all local storage keys (factory reset)
 */
export function resetPortfolioDatabase(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(AUTH_KEY);
}
