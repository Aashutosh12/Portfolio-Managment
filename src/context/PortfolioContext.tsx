import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { 
  PortfolioData, 
  StockAsset, 
  CryptoAsset, 
  BankAsset, 
  SalaryRecord, 
  FinancialGoal, 
  PortfolioNote, 
  VaultCard, 
  NomineeDetails, 
  InsurancePolicy, 
  LoanRecord, 
  WatchlistItem, 
  AppSettings,
  AppNotification
} from '../types';
import { 
  loadPortfolioData, 
  savePortfolioData, 
  hasMasterPasswordSet, 
  verifyMasterPassword, 
  setMasterPassword, 
  disableMasterPassword,
  resetPortfolioDatabase,
  exportPortfolioBackup,
  STORAGE_KEY,
  AUTH_KEY
} from '../services/storage';
import { fetchLiveCryptoPrices, fetchLiveStockPrices, updateStockPrices, updateCryptoPrices, fetchUsdInrRate } from '../services/market';
import { decryptData, encryptData, hashPassword } from '../utils/crypto';

interface PortfolioContextType {
  data: PortfolioData;
  locked: boolean;
  activePassword: string | undefined;
  isLoading: boolean;
  lastPriceRefresh: Date;
  usdToInr: number;
  unlock: (password: string) => boolean;
  lock: () => void;
  enableEncryption: (password: string) => void;
  disableEncryption: (password: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  // Stock Methods
  addStock: (stock: Omit<StockAsset, 'id'>) => void;
  addStocksBulk: (stocks: Omit<StockAsset, 'id'>[]) => void;
  editStock: (id: string, stock: Partial<StockAsset>) => void;
  deleteStock: (id: string) => void;
  
  // Crypto Methods
  addCrypto: (crypto: Omit<CryptoAsset, 'id'>) => void;
  editCrypto: (id: string, crypto: Partial<CryptoAsset>) => void;
  deleteCrypto: (id: string) => void;
  
  // Banking Methods
  addBank: (bank: Omit<BankAsset, 'id'>) => void;
  editBank: (id: string, bank: Partial<BankAsset>) => void;
  deleteBank: (id: string) => void;
  
  // Salary Methods
  addSalary: (salary: Omit<SalaryRecord, 'id'>) => void;
  editSalary: (id: string, salary: Partial<SalaryRecord>) => void;
  deleteSalary: (id: string) => void;
  
  // Goals Methods
  addGoal: (goal: Omit<FinancialGoal, 'id'>) => void;
  editGoal: (id: string, goal: Partial<FinancialGoal>) => void;
  deleteGoal: (id: string) => void;
  
  // Notes Methods
  addNote: (note: Omit<PortfolioNote, 'id'>) => void;
  editNote: (id: string, note: Partial<PortfolioNote>) => void;
  deleteNote: (id: string) => void;
  
  // Vault Card Methods
  addVaultCard: (card: Omit<VaultCard, 'id'>) => void;
  editVaultCard: (id: string, card: Partial<VaultCard>) => void;
  deleteVaultCard: (id: string) => void;
  
  // Nominee Methods
  addNominee: (nominee: Omit<NomineeDetails, 'id'>) => void;
  editNominee: (id: string, nominee: Partial<NomineeDetails>) => void;
  deleteNominee: (id: string) => void;
  
  // Insurance Methods
  addInsurance: (insurance: Omit<InsurancePolicy, 'id'>) => void;
  editInsurance: (id: string, insurance: Partial<InsurancePolicy>) => void;
  deleteInsurance: (id: string) => void;
  
  // Loan Methods
  addLoan: (loan: Omit<LoanRecord, 'id'>) => void;
  editLoan: (id: string, loan: Partial<LoanRecord>) => void;
  deleteLoan: (id: string) => void;
  
  // Watchlist Methods
  addToWatchlist: (item: Omit<WatchlistItem, 'id'>) => void;
  removeFromWatchlist: (id: string) => void;
  
  // Notification Methods
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  addNotification: (text: string, type: AppNotification['type']) => void;
  
  // Global Actions
  refreshLivePrices: () => Promise<void>;
  importBackupData: (backupStr: string, password?: string) => void;
  exportBackupData: (password?: string) => string;
  resetDatabase: () => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<PortfolioData>(null as any);
  const [locked, setLocked] = useState<boolean>(true);
  const [activePassword, setActivePassword] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastPriceRefresh, setLastPriceRefresh] = useState<Date>(new Date());
  const [usdToInr, setUsdToInr] = useState<number>(83.50);
  
  const autoLockTimerRef = useRef<any>(null);

  // Refs to avoid stale closures in background refresh loops
  const dataRef = useRef<PortfolioData>(data);
  const activePasswordRef = useRef<string | undefined>(activePassword);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    activePasswordRef.current = activePassword;
  }, [activePassword]);

  // Initialize and check password status
  useEffect(() => {
    const hasPassword = hasMasterPasswordSet();
    if (!hasPassword) {
      // Unencrypted, load directly
      try {
        const loaded = loadPortfolioData();
        setData(loaded);
        setLocked(false);
      } catch (err) {
        console.error('Failed to load portfolio:', err);
      }
      setIsLoading(false);
    } else {
      // Encrypted, block until unlocked
      setLocked(true);
      setIsLoading(false);
    }
  }, []);

  // Save changes to localStorage whenever data changes
  const saveState = (updatedData: PortfolioData, passwordToUse = activePassword) => {
    setData(updatedData);
    try {
      savePortfolioData(updatedData, passwordToUse);
    } catch (e) {
      console.error('Failed to save portfolio updates:', e);
    }
  };

  // Activity-based auto lock timer
  useEffect(() => {
    if (locked || !data || data.settings.lockTimeout === 0) {
      if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
      return;
    }

    const resetTimer = () => {
      if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
      
      const timeoutMs = data.settings.lockTimeout * 60 * 1000;
      autoLockTimerRef.current = setTimeout(() => {
        lock();
      }, timeoutMs);
    };

    // Listen to user interactions
    const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'click'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    
    resetTimer(); // Initialize timer

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
    };
  }, [locked, data?.settings.lockTimeout]);

  // Price update on initial unlock
  useEffect(() => {
    if (locked || !data) return;
    refreshLivePrices();
  }, [locked]);

  // Lock Session
  const lock = () => {
    setActivePassword(undefined);
    setLocked(true);
    // Remove data from memory to prevent memory leaks or security breaches
    setData(null as any);
  };

  // Unlock Session
  const unlock = (password: string): boolean => {
    if (verifyMasterPassword(password)) {
      try {
        const loaded = loadPortfolioData(password);
        setData(loaded);
        setActivePassword(password);
        setLocked(false);
        return true;
      } catch (err) {
        console.error('Unlock failed during decryption:', err);
        return false;
      }
    }
    return false;
  };

  // Enable AES-256 Encryption
  const enableEncryption = (password: string) => {
    setMasterPassword(password, data);
    setActivePassword(password);
    setLocked(false);
    
    // Update local settings state
    const updated = {
      ...data,
      settings: {
        ...data.settings,
        isEncrypted: true,
        hasMasterPassword: true
      }
    };
    saveState(updated, password);
  };

  // Disable Encryption
  const disableEncryption = (password: string) => {
    disableMasterPassword(password, data);
    setActivePassword(undefined);
    
    const updated = {
      ...data,
      settings: {
        ...data.settings,
        isEncrypted: false,
        hasMasterPassword: false
      }
    };
    saveState(updated, undefined);
  };

  // Update Settings
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = {
      ...data,
      settings: {
        ...data.settings,
        ...newSettings
      }
    };
    saveState(updated);
  };

  // Refresh Stock & Crypto Prices
  const refreshLivePrices = async () => {
    try {
      const initialStocks = dataRef.current?.stocks;
      const initialCryptos = dataRef.current?.crypto;
      const [liveCryptos, liveStocks, liveUsdInr] = await Promise.all([
        fetchLiveCryptoPrices(initialCryptos),
        fetchLiveStockPrices(initialStocks),
        fetchUsdInrRate()
      ]);

      setUsdToInr(liveUsdInr);

      const currentData = dataRef.current;
      if (!currentData) return;

      const updatedStocks = updateStockPrices(currentData.stocks, liveStocks);
      const updatedCryptos = updateCryptoPrices(currentData.crypto, liveCryptos);

      const updated = {
        ...currentData,
        stocks: updatedStocks,
        crypto: updatedCryptos
      };
      
      setData(updated);
      setLastPriceRefresh(new Date());
      // We don't necessarily need to trigger disk write on every minor fluctuation tick
      // unless user leaves or modifies assets, but let's save to keep it updated.
      savePortfolioData(updated, activePasswordRef.current);
    } catch (err) {
      console.warn('Could not complete background live price update', err);
    }
  };

  const createNotification = (text: string, type: AppNotification['type']): AppNotification => {
    return {
      id: `nf-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      text,
      type,
      date: new Date().toISOString().split('T')[0],
      read: false
    };
  };

  // Notifications helper
  const addNotification = (text: string, type: AppNotification['type']) => {
    const newNotif = createNotification(text, type);
    const updated = {
      ...data,
      notifications: [newNotif, ...data.notifications]
    };
    saveState(updated);
  };

  // --- CRUD METHODS ---

  // Stocks
  const addStock = (stock: Omit<StockAsset, 'id'>) => {
    const newStock: StockAsset = { ...stock, id: `st-${Date.now()}` };
    const newNotif = createNotification(`Added stock investment in ${stock.company} (${stock.ticker})`, 'success');
    const updated = { 
      ...data, 
      stocks: [...data.stocks, newStock],
      notifications: [newNotif, ...data.notifications]
    };
    saveState(updated);
  };
  const addStocksBulk = (stocks: Omit<StockAsset, 'id'>[]) => {
    const timestamp = Date.now();
    const newStocks: StockAsset[] = stocks.map((stock, index) => ({
      ...stock,
      id: `st-${timestamp}-${index}`
    }));
    const newNotif = createNotification(`Imported ${stocks.length} stocks successfully`, 'success');
    const updated = {
      ...data,
      stocks: [...data.stocks, ...newStocks],
      notifications: [newNotif, ...data.notifications]
    };
    saveState(updated);
  };
  const editStock = (id: string, updatedStock: Partial<StockAsset>) => {
    const updated = {
      ...data,
      stocks: data.stocks.map(s => s.id === id ? { ...s, ...updatedStock } : s)
    };
    saveState(updated);
  };

  const deleteStock = (id: string) => {
    const stock = data.stocks.find(s => s.id === id);
    const newNotif = createNotification(`Deleted stock holding ${stock ? stock.company : ''}`, 'info');
    const updated = {
      ...data,
      stocks: data.stocks.filter(s => s.id !== id),
      notifications: [newNotif, ...data.notifications]
    };
    saveState(updated);
  };

  // Cryptos
  const addCrypto = (crypto: Omit<CryptoAsset, 'id'>) => {
    const newCrypto: CryptoAsset = { ...crypto, id: `cr-${Date.now()}` };
    const newNotif = createNotification(`Added crypto investment in ${crypto.coin}`, 'success');
    const updated = { 
      ...data, 
      crypto: [...data.crypto, newCrypto],
      notifications: [newNotif, ...data.notifications]
    };
    saveState(updated);
  };

  const editCrypto = (id: string, updatedCrypto: Partial<CryptoAsset>) => {
    const updated = {
      ...data,
      crypto: data.crypto.map(c => c.id === id ? { ...c, ...updatedCrypto } : c)
    };
    saveState(updated);
  };

  const deleteCrypto = (id: string) => {
    const crypto = data.crypto.find(c => c.id === id);
    const newNotif = createNotification(`Deleted crypto asset ${crypto ? crypto.coin : ''}`, 'info');
    const updated = {
      ...data,
      crypto: data.crypto.filter(c => c.id !== id),
      notifications: [newNotif, ...data.notifications]
    };
    saveState(updated);
  };

  // Banking
  const addBank = (bank: Omit<BankAsset, 'id'>) => {
    const newBank: BankAsset = { ...bank, id: `bk-${Date.now()}` };
    const newNotif = createNotification(`Added bank account: ${bank.bankName} (${bank.accountType})`, 'success');
    const updated = { 
      ...data, 
      banking: [...data.banking, newBank],
      notifications: [newNotif, ...data.notifications]
    };
    saveState(updated);
  };

  const editBank = (id: string, updatedBank: Partial<BankAsset>) => {
    const updated = {
      ...data,
      banking: data.banking.map(b => b.id === id ? { ...b, ...updatedBank } : b)
    };
    saveState(updated);
  };

  const deleteBank = (id: string) => {
    const bank = data.banking.find(b => b.id === id);
    const newNotif = createNotification(`Removed bank record for ${bank ? bank.bankName : ''}`, 'info');
    const updated = {
      ...data,
      banking: data.banking.filter(b => b.id !== id),
      notifications: [newNotif, ...data.notifications]
    };
    saveState(updated);
  };

  // Salary
  const addSalary = (salary: Omit<SalaryRecord, 'id'>) => {
    const newSalary: SalaryRecord = { ...salary, id: `sl-${Date.now()}` };
    const newNotif = createNotification(`Recorded salary credit from ${salary.employer}`, 'success');
    const updated = { 
      ...data, 
      salary: [newSalary, ...data.salary],
      notifications: [newNotif, ...data.notifications]
    };
    saveState(updated);
  };

  const editSalary = (id: string, updatedSalary: Partial<SalaryRecord>) => {
    const updated = {
      ...data,
      salary: data.salary.map(s => s.id === id ? { ...s, ...updatedSalary } : s)
    };
    saveState(updated);
  };

  const deleteSalary = (id: string) => {
    const salary = data.salary.find(s => s.id === id);
    const newNotif = createNotification(`Deleted salary entry for month ${salary ? salary.month + 1 : ''}`, 'info');
    const updated = {
      ...data,
      salary: data.salary.filter(s => s.id !== id),
      notifications: [newNotif, ...data.notifications]
    };
    saveState(updated);
  };

  // Goals
  const addGoal = (goal: Omit<FinancialGoal, 'id'>) => {
    const newGoal: FinancialGoal = { ...goal, id: `gl-${Date.now()}` };
    const newNotif = createNotification(`Created new financial goal: ${goal.name}`, 'success');
    const updated = { 
      ...data, 
      goals: [...data.goals, newGoal],
      notifications: [newNotif, ...data.notifications]
    };
    saveState(updated);
  };

  const editGoal = (id: string, updatedGoal: Partial<FinancialGoal>) => {
    const updated = {
      ...data,
      goals: data.goals.map(g => g.id === id ? { ...g, ...updatedGoal } : g)
    };
    saveState(updated);
  };

  const deleteGoal = (id: string) => {
    const goal = data.goals.find(g => g.id === id);
    const newNotif = createNotification(`Deleted financial goal ${goal ? goal.name : ''}`, 'info');
    const updated = {
      ...data,
      goals: data.goals.filter(g => g.id !== id),
      notifications: [newNotif, ...data.notifications]
    };
    saveState(updated);
  };

  // Notes
  const addNote = (note: Omit<PortfolioNote, 'id'>) => {
    const newNote: PortfolioNote = { ...note, id: `nt-${Date.now()}` };
    const updated = { ...data, notes: [...data.notes, newNote] };
    saveState(updated);
  };

  const editNote = (id: string, updatedNote: Partial<PortfolioNote>) => {
    const updated = {
      ...data,
      notes: data.notes.map(n => n.id === id ? { ...n, ...updatedNote } : n)
    };
    saveState(updated);
  };

  const deleteNote = (id: string) => {
    const updated = {
      ...data,
      notes: data.notes.filter(n => n.id !== id)
    };
    saveState(updated);
  };

  // Vault Cards
  const addVaultCard = (card: Omit<VaultCard, 'id'>) => {
    const newCard: VaultCard = { ...card, id: `vc-${Date.now()}` };
    const newNotif = createNotification(`Added secure card credential: ${card.cardName}`, 'success');
    const updated = { 
      ...data, 
      vaultCards: [...data.vaultCards, newCard],
      notifications: [newNotif, ...data.notifications]
    };
    saveState(updated);
  };

  const editVaultCard = (id: string, updatedCard: Partial<VaultCard>) => {
    const updated = {
      ...data,
      vaultCards: data.vaultCards.map(vc => vc.id === id ? { ...vc, ...updatedCard } : vc)
    };
    saveState(updated);
  };

  const deleteVaultCard = (id: string) => {
    const card = data.vaultCards.find(vc => vc.id === id);
    const newNotif = createNotification(`Deleted card credential ${card ? card.cardName : ''}`, 'info');
    const updated = {
      ...data,
      vaultCards: data.vaultCards.filter(vc => vc.id !== id),
      notifications: [newNotif, ...data.notifications]
    };
    saveState(updated);
  };

  // Nominees
  const addNominee = (nominee: Omit<NomineeDetails, 'id'>) => {
    const newNominee: NomineeDetails = { ...nominee, id: `nm-${Date.now()}` };
    const updated = { ...data, nominees: [...data.nominees, newNominee] };
    saveState(updated);
  };

  const editNominee = (id: string, updatedNominee: Partial<NomineeDetails>) => {
    const updated = {
      ...data,
      nominees: data.nominees.map(n => n.id === id ? { ...n, ...updatedNominee } : n)
    };
    saveState(updated);
  };

  const deleteNominee = (id: string) => {
    const updated = {
      ...data,
      nominees: data.nominees.filter(n => n.id !== id)
    };
    saveState(updated);
  };

  // Insurances
  const addInsurance = (insurance: Omit<InsurancePolicy, 'id'>) => {
    const newInsurance: InsurancePolicy = { ...insurance, id: `in-${Date.now()}` };
    const newNotif = createNotification(`Added insurance policy: ${insurance.policyName}`, 'success');
    const updated = { 
      ...data, 
      insurances: [...data.insurances, newInsurance],
      notifications: [newNotif, ...data.notifications]
    };
    saveState(updated);
  };

  const editInsurance = (id: string, updatedInsurance: Partial<InsurancePolicy>) => {
    const updated = {
      ...data,
      insurances: data.insurances.map(i => i.id === id ? { ...i, ...updatedInsurance } : i)
    };
    saveState(updated);
  };

  const deleteInsurance = (id: string) => {
    const insurance = data.insurances.find(i => i.id === id);
    const newNotif = createNotification(`Deleted insurance policy ${insurance ? insurance.policyName : ''}`, 'info');
    const updated = {
      ...data,
      insurances: data.insurances.filter(i => i.id !== id),
      notifications: [newNotif, ...data.notifications]
    };
    saveState(updated);
  };

  // Loans
  const addLoan = (loan: Omit<LoanRecord, 'id'>) => {
    const newLoan: LoanRecord = { ...loan, id: `ln-${Date.now()}` };
    const newNotif = createNotification(`Recorded active loan with ${loan.bankName}`, 'warning');
    const updated = { 
      ...data, 
      loans: [...data.loans, newLoan],
      notifications: [newNotif, ...data.notifications]
    };
    saveState(updated);
  };

  const editLoan = (id: string, updatedLoan: Partial<LoanRecord>) => {
    const updated = {
      ...data,
      loans: data.loans.map(l => l.id === id ? { ...l, ...updatedLoan } : l)
    };
    saveState(updated);
  };

  const deleteLoan = (id: string) => {
    const loan = data.loans.find(l => l.id === id);
    const newNotif = createNotification(`Deleted loan record for ${loan ? loan.bankName : ''}`, 'info');
    const updated = {
      ...data,
      loans: data.loans.filter(l => l.id !== id),
      notifications: [newNotif, ...data.notifications]
    };
    saveState(updated);
  };

  // Watchlist
  const addToWatchlist = (item: Omit<WatchlistItem, 'id'>) => {
    const newItem: WatchlistItem = { ...item, id: `wl-${Date.now()}` };
    const updated = { ...data, watchlist: [...data.watchlist, newItem] };
    saveState(updated);
  };

  const removeFromWatchlist = (id: string) => {
    const updated = {
      ...data,
      watchlist: data.watchlist.filter(w => w.id !== id)
    };
    saveState(updated);
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    const updated = {
      ...data,
      notifications: data.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    };
    saveState(updated);
  };

  const clearNotifications = () => {
    const updated = {
      ...data,
      notifications: []
    };
    saveState(updated);
  };

  // Global resets and imports
  const importBackupData = (backupStr: string, password?: string) => {
    try {
      let cleanBackupStr = backupStr.trim();
      const isPlainJson = cleanBackupStr.startsWith('{');

      let parsed: PortfolioData;
      if (!isPlainJson) {
        // Backup is encrypted (base64 ciphertext)
        cleanBackupStr = cleanBackupStr.replace(/\s+/g, '');
        parsed = decryptData(cleanBackupStr, password || '');
        
        // Write master password hash and encrypted database synchronously to localStorage!
        if (password) {
          const hash = hashPassword(password);
          localStorage.setItem(AUTH_KEY, hash);
          
          const updatedData = {
            ...parsed,
            settings: {
              ...parsed.settings,
              isEncrypted: true,
              hasMasterPassword: true
            },
            lastUpdated: new Date().toISOString()
          };
          const ciphertext = encryptData(updatedData, password);
          localStorage.setItem(STORAGE_KEY, ciphertext);
        } else {
          // Plain fallback
          localStorage.removeItem(AUTH_KEY);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            ...parsed,
            settings: {
              ...parsed.settings,
              isEncrypted: false,
              hasMasterPassword: false
            }
          }));
        }
      } else {
        // Plain JSON backup
        parsed = JSON.parse(cleanBackupStr);
        localStorage.removeItem(AUTH_KEY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ...parsed,
          settings: {
            ...parsed.settings,
            isEncrypted: false,
            hasMasterPassword: false
          }
        }));
      }
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Failed to import backup.');
    }
  };

  const exportBackupData = (password?: string): string => {
    return exportPortfolioBackup(data, password || activePassword);
  };

  const resetDatabase = () => {
    resetPortfolioDatabase();
    setData(null as any);
    setLocked(false);
    setActivePassword(undefined);
    window.location.reload();
  };

  return (
    <PortfolioContext.Provider
      value={{
        data,
        locked,
        activePassword,
        isLoading,
        lastPriceRefresh,
        usdToInr,
        unlock,
        lock,
        enableEncryption,
        disableEncryption,
        updateSettings,
        addStock,
        addStocksBulk,
        editStock,
        deleteStock,
        addCrypto,
        editCrypto,
        deleteCrypto,
        addBank,
        editBank,
        deleteBank,
        addSalary,
        editSalary,
        deleteSalary,
        addGoal,
        editGoal,
        deleteGoal,
        addNote,
        editNote,
        deleteNote,
        addVaultCard,
        editVaultCard,
        deleteVaultCard,
        addNominee,
        editNominee,
        deleteNominee,
        addInsurance,
        editInsurance,
        deleteInsurance,
        addLoan,
        editLoan,
        deleteLoan,
        addToWatchlist,
        removeFromWatchlist,
        markNotificationRead,
        clearNotifications,
        addNotification,
        refreshLivePrices,
        importBackupData,
        exportBackupData,
        resetDatabase
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};
