import type { PortfolioData } from '../types';
import { encryptData, decryptData, hashPassword } from '../utils/crypto';

export const STORAGE_KEY = 'arthsetu_wealth_data';
export const AUTH_KEY = 'arthsetu_auth_hash';

const OLD_STORAGE_KEY = 'antigravity_wealth_data';
const OLD_AUTH_KEY = 'antigravity_auth_hash';

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
  stocks: [],
  crypto: [],
  mutualFunds: [],
  banking: [],
  salary: [],
  goals: [],
  notes: [],
  vaultCards: [],
  nominees: [],
  insurances: [],
  loans: [],
  watchlist: [],
  notifications: [
    {
      id: 'nf-welcome',
      text: 'Welcome to ArthSetu! Your secure offline-first environment is ready. Click on any tab to start logging your assets.',
      type: 'info',
      date: new Date().toISOString().split('T')[0],
      read: false,
    }
  ],
  lastUpdated: new Date().toISOString(),
};

/**
 * Initialize storage with default mock data if empty
 */
export function initializeStorage(): void {
  // Migrate from old keys if present
  const oldData = localStorage.getItem(OLD_STORAGE_KEY);
  const oldAuth = localStorage.getItem(OLD_AUTH_KEY);

  if (oldData && !localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, oldData);
    localStorage.removeItem(OLD_STORAGE_KEY);
  }
  if (oldAuth && !localStorage.getItem(AUTH_KEY)) {
    localStorage.setItem(AUTH_KEY, oldAuth);
    localStorage.removeItem(OLD_AUTH_KEY);
  }

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
      if (decrypted && !decrypted.mutualFunds) {
        decrypted.mutualFunds = [];
      }
      return decrypted;
    } catch (e) {
      throw new Error('Incorrect master password or corrupted database.');
    }
  } else {
    // Attempt plain parse
    try {
      const parsed = JSON.parse(rawContent);
      if (parsed && !parsed.mutualFunds) {
        parsed.mutualFunds = [];
      }
      return parsed;
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
