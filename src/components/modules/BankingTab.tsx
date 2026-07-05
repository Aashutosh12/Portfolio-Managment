import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import type { BankAsset, BankAccountType, CompoundingFrequency } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { calculateMaturity } from '../../utils/calculations';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  X, 
  Landmark, 
  Clock, 
  Percent
} from 'lucide-react';

export const BankingTab: React.FC = () => {
  const { data, addBank, editBank, deleteBank } = usePortfolio();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | BankAccountType>('All');

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankAsset | null>(null);

  // Form States
  const [bankName, setBankName] = useState('');
  const [branch, setBranch] = useState('');
  const [accountType, setAccountType] = useState<BankAccountType>('Savings');
  const [interestRate, setInterestRate] = useState(3.0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [openingDate, setOpeningDate] = useState(new Date().toISOString().split('T')[0]);
  const [compoundingFrequency, setCompoundingFrequency] = useState<CompoundingFrequency>('Quarterly');
  const [maturityDate, setMaturityDate] = useState('');
  const [monthlyDeposit, setMonthlyDeposit] = useState(0);
  const [expectedInterest, setExpectedInterest] = useState(0);
  const [maturityAmount, setMaturityAmount] = useState(0);
  const [notes, setNotes] = useState('');

  if (!data) return null;
  const currency = data.settings.currency;

  // Calculators
  const totalSavingsCash = data.banking
    .filter(b => b.accountType === 'Savings' || b.accountType === 'Current')
    .reduce((sum, b) => sum + b.currentBalance, 0);

  const totalFixedDeposits = data.banking
    .filter(b => b.accountType === 'Fixed Deposit' || b.accountType === 'Recurring Deposit')
    .reduce((sum, b) => sum + b.currentBalance, 0);

  const totalBankingAsset = totalSavingsCash + totalFixedDeposits;



  const totalExpectedInterest = data.banking.reduce((sum, b) => sum + (b.expectedInterest || 0), 0);

  // Handle live calculation inside Form when parameters change
  useEffect(() => {
    if (accountType === 'Fixed Deposit' && currentBalance > 0 && interestRate > 0 && openingDate && maturityDate) {
      const openTime = new Date(openingDate).getTime();
      const matureTime = new Date(maturityDate).getTime();
      const years = (matureTime - openTime) / (1000 * 60 * 60 * 24 * 365.25);
      
      if (years > 0) {
        const calc = calculateMaturity(currentBalance, interestRate, compoundingFrequency, years);
        setExpectedInterest(calc.interestEarned);
        setMaturityAmount(calc.maturityAmount);
      }
    } else if (accountType === 'Recurring Deposit' && monthlyDeposit > 0 && interestRate > 0 && openingDate && maturityDate) {
      // RD compound approximation:
      // Form: totalInvested = monthly * months
      const openTime = new Date(openingDate).getTime();
      const matureTime = new Date(maturityDate).getTime();
      const totalMonths = Math.round((matureTime - openTime) / (1000 * 60 * 60 * 24 * 30.44));
      
      if (totalMonths > 0) {
        const invested = monthlyDeposit * totalMonths;
        // Simple compounding per monthly installment
        let finalAmount = 0;
        const r = (interestRate / 100) / 12; // monthly rate
        for (let i = 1; i <= totalMonths; i++) {
          finalAmount += monthlyDeposit * Math.pow(1 + r, totalMonths - i + 1);
        }
        const roundedMaturity = Math.round(finalAmount);
        setMaturityAmount(roundedMaturity);
        setExpectedInterest(Math.round(roundedMaturity - invested));
        setCurrentBalance(invested);
      }
    } else {
      setExpectedInterest(0);
      setMaturityAmount(0);
    }
  }, [accountType, currentBalance, interestRate, compoundingFrequency, openingDate, maturityDate, monthlyDeposit]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addBank({
      bankName,
      branch,
      accountType,
      interestRate,
      currentBalance: accountType === 'Recurring Deposit' ? currentBalance : currentBalance,
      openingDate,
      compoundingFrequency,
      maturityDate: (accountType === 'Fixed Deposit' || accountType === 'Recurring Deposit') ? maturityDate : undefined,
      expectedInterest: (accountType === 'Fixed Deposit' || accountType === 'Recurring Deposit') ? expectedInterest : undefined,
      maturityAmount: (accountType === 'Fixed Deposit' || accountType === 'Recurring Deposit') ? maturityAmount : undefined,
      monthlyDeposit: accountType === 'Recurring Deposit' ? monthlyDeposit : undefined,
      notes
    });
    setIsAddOpen(false);
    resetForm();
  };

  const openEditModal = (b: BankAsset) => {
    setSelectedBank(b);
    setBankName(b.bankName);
    setBranch(b.branch);
    setAccountType(b.accountType);
    setInterestRate(b.interestRate);
    setCurrentBalance(b.currentBalance);
    setOpeningDate(b.openingDate);
    setCompoundingFrequency(b.compoundingFrequency);
    setMaturityDate(b.maturityDate || '');
    setMonthlyDeposit(b.monthlyDeposit || 0);
    setExpectedInterest(b.expectedInterest || 0);
    setMaturityAmount(b.maturityAmount || 0);
    setNotes(b.notes || '');
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBank) return;
    editBank(selectedBank.id, {
      bankName,
      branch,
      accountType,
      interestRate,
      currentBalance,
      openingDate,
      compoundingFrequency,
      maturityDate: (accountType === 'Fixed Deposit' || accountType === 'Recurring Deposit') ? maturityDate : undefined,
      expectedInterest: (accountType === 'Fixed Deposit' || accountType === 'Recurring Deposit') ? expectedInterest : undefined,
      maturityAmount: (accountType === 'Fixed Deposit' || accountType === 'Recurring Deposit') ? maturityAmount : undefined,
      monthlyDeposit: accountType === 'Recurring Deposit' ? monthlyDeposit : undefined,
      notes
    });
    setIsEditOpen(false);
    resetForm();
  };

  const handleDuplicate = (b: BankAsset) => {
    addBank({
      ...b,
      bankName: `${b.bankName} (Copy)`
    });
  };

  const resetForm = () => {
    setBankName('');
    setBranch('');
    setAccountType('Savings');
    setInterestRate(3.0);
    setCurrentBalance(0);
    setOpeningDate(new Date().toISOString().split('T')[0]);
    setCompoundingFrequency('Quarterly');
    setMaturityDate('');
    setMonthlyDeposit(0);
    setExpectedInterest(0);
    setMaturityAmount(0);
    setNotes('');
    setSelectedBank(null);
  };

  // Filter accounts
  const filteredAccounts = data.banking.filter(b => {
    const matchesSearch = b.bankName.toLowerCase().includes(search.toLowerCase()) || 
                          b.branch.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'All' || b.accountType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* KPI Banking Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Banking Assets</p>
          <p className="text-xl font-bold text-white mt-1">{formatCurrency(totalBankingAsset, currency)}</p>
          <span className="text-[9px] text-slate-400">Savings + Term Deposits</span>
        </div>
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Savings Accounts</p>
          <p className="text-xl font-bold text-slate-100 mt-1">{formatCurrency(totalSavingsCash, currency)}</p>
          <span className="text-[9px] text-slate-400">Liquid cash reserves</span>
        </div>
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Fixed & Term Deposits</p>
          <p className="text-xl font-bold text-slate-100 mt-1">{formatCurrency(totalFixedDeposits, currency)}</p>
          <span className="text-[9px] text-slate-400">Locked-in investments</span>
        </div>
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Accrued Term Interest</p>
          <p className="text-xl font-bold text-violet-400 mt-1">{formatCurrency(totalExpectedInterest, currency)}</p>
          <span className="text-[9px] text-slate-400">Estimated maturity interest yield</span>
        </div>
      </div>

      {/* Main Bank Account Manager */}
      <div className="glass p-6 rounded-3xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 gap-4 border-b border-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-indigo-400" /> Banking & Fixed Income Ledger
            </h2>
            <p className="text-xs text-slate-400">Secure bank savings, current checking accounts, and compound interest FDs/RDs.</p>
          </div>
          
          <button
            onClick={() => {
              resetForm();
              setIsAddOpen(true);
            }}
            className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-center"
          >
            <Plus className="w-4 h-4" /> Add Bank Account
          </button>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search bank, branch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2">
            <span className="text-[10px] text-slate-500 uppercase px-1">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-transparent border-none text-xs text-slate-200 py-1.5 px-2 focus:outline-none w-full"
            >
              <option value="All">All Accounts</option>
              <option value="Savings">Savings</option>
              <option value="Current">Current / Checking</option>
              <option value="Fixed Deposit">Fixed Deposit</option>
              <option value="Recurring Deposit">Recurring Deposit</option>
            </select>
          </div>
        </div>

        {/* Accounts Listings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAccounts.length > 0 ? (
            filteredAccounts.map((account) => {
              const isTermDeposit = account.accountType === 'Fixed Deposit' || account.accountType === 'Recurring Deposit';
              
              // Maturity Calculations
              let daysLeft = 0;
              let elapsedPercent = 0;
              if (isTermDeposit && account.openingDate && account.maturityDate) {
                const totalDur = new Date(account.maturityDate).getTime() - new Date(account.openingDate).getTime();
                const currentElapsed = new Date().getTime() - new Date(account.openingDate).getTime();
                elapsedPercent = Math.max(0, Math.min(100, (currentElapsed / totalDur) * 100));
                
                daysLeft = Math.ceil((new Date(account.maturityDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              }

              return (
                <div key={account.id} className="bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden transition-all group flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between pb-3 border-b border-slate-800/40">
                      <div>
                        <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                          {account.bankName}
                          <span className={`text-[9px] border font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                            isTermDeposit 
                              ? 'bg-violet-950/60 border-violet-800 text-violet-400' 
                              : 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                          }`}>
                            {account.accountType}
                          </span>
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">{account.branch}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(account)}
                          className="p-1 text-slate-400 hover:text-white rounded"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(account)}
                          className="p-1 text-slate-400 hover:text-white rounded"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete bank account ${account.bankName}?`)) {
                              deleteBank(account.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-400 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Balance and Interest Rate */}
                    <div className="grid grid-cols-2 gap-3 py-4">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-semibold">Current Balance</span>
                        <p className="text-base font-black text-slate-100 mt-0.5">{formatCurrency(account.currentBalance, currency)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 uppercase font-semibold flex items-center justify-end gap-0.5">
                          <Percent className="w-3 h-3 text-emerald-500" /> Yield Rate
                        </span>
                        <p className="text-base font-bold text-slate-200 mt-0.5">{account.interestRate}% <span className="text-[9px] text-slate-500 font-normal">p.a.</span></p>
                      </div>
                    </div>

                    {/* FD specific countdown and progress */}
                    {isTermDeposit && (
                      <div className="space-y-3 pt-2 border-t border-slate-800/40">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-violet-400" /> Maturity: {formatDate(account.maturityDate || '')}
                          </span>
                          <span className={`font-bold ${daysLeft <= 30 ? 'text-amber-400 font-mono animate-pulse' : 'text-slate-300 font-mono'}`}>
                            {daysLeft > 0 ? `${daysLeft} days remaining` : 'Matured!'}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-violet-600 to-indigo-500 h-1.5 rounded-full transition-all duration-500" 
                            style={{ width: `${elapsedPercent}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between items-center text-[10px] pt-1">
                          <span className="text-slate-400">
                            Yielding: <span className="font-semibold text-slate-200 font-mono">{formatCurrency(account.maturityAmount || 0, currency)}</span>
                          </span>
                          <span className="text-slate-400">
                            Maturity Gain: <span className="font-semibold text-emerald-400 font-mono">+{formatCurrency(account.expectedInterest || 0, currency)}</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {account.notes && (
                    <div className="mt-2 text-[10px] text-slate-500 bg-slate-950/20 p-2 rounded-lg italic">
                      {account.notes}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-2 text-center text-slate-500 py-10">
              No bank records match your filters. Click 'Add Bank Account' to log your accounts.
            </div>
          )}
        </div>
      </div>

      {/* --- ADD BANK MODAL --- */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-dark rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Add Bank / FD Record</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank, ICICI Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Branch Name</label>
                <input
                  type="text"
                  placeholder="e.g. Koramangala Branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-slate-400">Account Type</label>
                <select
                  value={accountType}
                  onChange={(e) => {
                    const type = e.target.value as BankAccountType;
                    setAccountType(type);
                    // Standard interest fallbacks
                    if (type === 'Fixed Deposit') setInterestRate(7.0);
                    else if (type === 'Recurring Deposit') setInterestRate(6.8);
                    else setInterestRate(3.0);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                >
                  <option value="Savings">Savings Account</option>
                  <option value="Current">Current / Business Account</option>
                  <option value="Fixed Deposit">Fixed Deposit (FD)</option>
                  <option value="Recurring Deposit">Recurring Deposit (RD)</option>
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-slate-400">Interest Rate (% p.a.)</label>
                <input
                  type="number"
                  step="any"
                  value={interestRate}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  required
                />
              </div>

              {accountType === 'Recurring Deposit' ? (
                <div className="space-y-1">
                  <label className="text-slate-400">Monthly Deposit Amount</label>
                  <input
                    type="number"
                    value={monthlyDeposit || ''}
                    onChange={(e) => setMonthlyDeposit(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-slate-400">{accountType === 'Fixed Deposit' ? 'Principal Investment' : 'Current Balance'}</label>
                  <input
                    type="number"
                    value={currentBalance || ''}
                    onChange={(e) => setCurrentBalance(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    required
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-400">Opening Date</label>
                <input
                  type="date"
                  value={openingDate}
                  onChange={(e) => setOpeningDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono"
                  required
                />
              </div>

              {(accountType === 'Fixed Deposit' || accountType === 'Recurring Deposit') && (
                <>
                  <div className="space-y-1">
                    <label className="text-slate-400">Maturity Date</label>
                    <input
                      type="date"
                      value={maturityDate}
                      onChange={(e) => setMaturityDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">Compounding Frequency</label>
                    <select
                      value={compoundingFrequency}
                      onChange={(e) => setCompoundingFrequency(e.target.value as CompoundingFrequency)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Half-Yearly">Half-Yearly</option>
                      <option value="Yearly">Yearly</option>
                      <option value="Simple">Simple Interest</option>
                    </select>
                  </div>
                  
                  {/* Realtime Yield Calculations */}
                  <div className="col-span-2 p-3 bg-violet-950/30 border border-violet-850 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wide">Dynamic Compound Simulator</span>
                    <div className="grid grid-cols-2 text-[11px] text-slate-350 pt-1">
                      <div>
                        Expected Interest: <span className="font-bold font-mono text-emerald-400">{formatCurrency(expectedInterest, currency)}</span>
                      </div>
                      <div className="text-right">
                        Maturity Amount: <span className="font-bold font-mono text-white">{formatCurrency(maturityAmount, currency)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="col-span-2 space-y-1">
                <label className="text-slate-400">Portfolio Notes</label>
                <textarea
                  placeholder="e.g. Linked to nominee, auto-renewal settings..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white h-20"
                />
              </div>

              <div className="col-span-2 pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold py-2.5 px-4 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 px-5 rounded-xl"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT BANK MODAL --- */}
      {isEditOpen && selectedBank && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-dark rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Modify Bank Record ({selectedBank.bankName})</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Branch Name</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-slate-400">Account Type</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as BankAccountType)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                >
                  <option value="Savings">Savings Account</option>
                  <option value="Current">Current / Business Account</option>
                  <option value="Fixed Deposit">Fixed Deposit (FD)</option>
                  <option value="Recurring Deposit">Recurring Deposit (RD)</option>
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-slate-400">Interest Rate (% p.a.)</label>
                <input
                  type="number"
                  step="any"
                  value={interestRate}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  required
                />
              </div>

              {accountType === 'Recurring Deposit' ? (
                <div className="space-y-1">
                  <label className="text-slate-400">Monthly Deposit Amount</label>
                  <input
                    type="number"
                    value={monthlyDeposit || ''}
                    onChange={(e) => setMonthlyDeposit(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-slate-400">Current Balance</label>
                  <input
                    type="number"
                    value={currentBalance || ''}
                    onChange={(e) => setCurrentBalance(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    required
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-400">Opening Date</label>
                <input
                  type="date"
                  value={openingDate}
                  onChange={(e) => setOpeningDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono"
                  required
                />
              </div>

              {(accountType === 'Fixed Deposit' || accountType === 'Recurring Deposit') && (
                <>
                  <div className="space-y-1">
                    <label className="text-slate-400">Maturity Date</label>
                    <input
                      type="date"
                      value={maturityDate}
                      onChange={(e) => setMaturityDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">Compounding Frequency</label>
                    <select
                      value={compoundingFrequency}
                      onChange={(e) => setCompoundingFrequency(e.target.value as CompoundingFrequency)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Half-Yearly">Half-Yearly</option>
                      <option value="Yearly">Yearly</option>
                      <option value="Simple">Simple Interest</option>
                    </select>
                  </div>
                  
                  {/* Realtime Yield Calculations */}
                  <div className="col-span-2 p-3 bg-violet-950/30 border border-violet-850 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wide">Dynamic Compound Simulator</span>
                    <div className="grid grid-cols-2 text-[11px] text-slate-350 pt-1">
                      <div>
                        Expected Interest: <span className="font-bold font-mono text-emerald-400">{formatCurrency(expectedInterest, currency)}</span>
                      </div>
                      <div className="text-right">
                        Maturity Amount: <span className="font-bold font-mono text-white">{formatCurrency(maturityAmount, currency)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="col-span-2 space-y-1">
                <label className="text-slate-400">Portfolio Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white h-20"
                />
              </div>

              <div className="col-span-2 pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold py-2.5 px-4 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 px-5 rounded-xl"
                >
                  Apply Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
