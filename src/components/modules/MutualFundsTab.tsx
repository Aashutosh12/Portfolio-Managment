import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import type { MutualFundAsset } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  X, 
  Award
} from 'lucide-react';

export const MutualFundsTab: React.FC = () => {
  const { data, addMutualFund, editMutualFund, deleteMutualFund } = usePortfolio();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState<MutualFundAsset | null>(null);

  // Form States
  const [fundName, setFundName] = useState('');
  const [schemeCode, setSchemeCode] = useState('');
  const [folioNumber, setFolioNumber] = useState('');
  const [category, setCategory] = useState('Equity');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [units, setUnits] = useState<number | ''>('');
  const [averageNav, setAverageNav] = useState<number | ''>('');
  const [currentNav, setCurrentNav] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // AMFI Search States
  const [mfSearchQuery, setMfSearchQuery] = useState('');
  const [mfApiSuggestions, setMfApiSuggestions] = useState<{ schemeCode: number; schemeName: string }[]>([]);
  const [isSearchingMf, setIsSearchingMf] = useState(false);

  useEffect(() => {
    if (mfSearchQuery.trim().length < 3) {
      setMfApiSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingMf(true);
      try {
        const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(mfSearchQuery)}`);
        if (res.ok) {
          const resultData = await res.json();
          setMfApiSuggestions(Array.isArray(resultData) ? resultData.slice(0, 8) : []);
        }
      } catch (e) {
        console.error('MF search error:', e);
      } finally {
        setIsSearchingMf(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [mfSearchQuery]);

  if (!data) return null;
  const currency = data.settings.currency;
  const mutualFundsList = data.mutualFunds || [];

  // Fetch NAV for selected fund and prefill
  const handleSelectMfSuggestion = async (code: string, name: string) => {
    setFundName(name);
    setSchemeCode(code);
    setMfApiSuggestions([]);
    setMfSearchQuery('');
    
    // Attempt to guess category
    const upperName = name.toUpperCase();
    if (upperName.includes('DEBT') || upperName.includes('GILT') || upperName.includes('LIQUID')) {
      setCategory('Debt');
    } else if (upperName.includes('HYBRID') || upperName.includes('BALANCED')) {
      setCategory('Hybrid');
    } else if (upperName.includes('INDEX') || upperName.includes('NIFTY') || upperName.includes('SENSEX')) {
      setCategory('Index');
    } else {
      setCategory('Equity');
    }

    try {
      const res = await fetch(`https://api.mfapi.in/mf/${code}`);
      if (res.ok) {
        const resJson = await res.json();
        const navVal = parseFloat(resJson?.data?.[0]?.nav);
        if (!isNaN(navVal) && navVal > 0) {
          setCurrentNav(navVal);
          setAverageNav(navVal);
        }
      }
    } catch (e) {
      console.warn('Could not fetch initial NAV:', e);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundName || !schemeCode || !units || !averageNav) return;

    addMutualFund({
      fundName,
      schemeCode,
      folioNumber,
      category,
      purchaseDate,
      units: Number(units) || 0,
      averageNav: Number(averageNav) || 0,
      currentNav: Number(currentNav) || Number(averageNav) || 0,
      notes
    });

    setIsAddOpen(false);
    resetForm();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFund || !fundName || !units || !averageNav) return;

    editMutualFund(selectedFund.id, {
      fundName,
      schemeCode,
      folioNumber,
      category,
      purchaseDate,
      units: Number(units) || 0,
      averageNav: Number(averageNav) || 0,
      currentNav: Number(currentNav) || Number(averageNav) || 0,
      notes
    });

    setIsEditOpen(false);
    resetForm();
  };

  const openEditModal = (fund: MutualFundAsset) => {
    setSelectedFund(fund);
    setFundName(fund.fundName);
    setSchemeCode(fund.schemeCode);
    setFolioNumber(fund.folioNumber || '');
    setCategory(fund.category);
    setPurchaseDate(fund.purchaseDate);
    setUnits(fund.units);
    setAverageNav(fund.averageNav);
    setCurrentNav(fund.currentNav);
    setNotes(fund.notes || '');
    setIsEditOpen(true);
  };

  const handleDuplicate = (fund: MutualFundAsset) => {
    addMutualFund({
      ...fund,
      fundName: `${fund.fundName} (Copy)`,
      folioNumber: fund.folioNumber ? `${fund.folioNumber} - copy` : ''
    });
  };

  const resetForm = () => {
    setFundName('');
    setSchemeCode('');
    setFolioNumber('');
    setCategory('Equity');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setUnits('');
    setAverageNav('');
    setCurrentNav('');
    setNotes('');
    setMfSearchQuery('');
    setMfApiSuggestions([]);
    setSelectedFund(null);
  };

  // Calculations
  const totalMfValue = mutualFundsList.reduce((sum, f) => sum + (f.units * f.currentNav), 0);
  const totalMfInvested = mutualFundsList.reduce((sum, f) => sum + (f.units * f.averageNav), 0);
  const totalProfit = totalMfValue - totalMfInvested;
  const returnPercentage = totalMfInvested > 0 ? (totalProfit / totalMfInvested) : 0;

  // Categories
  const categories = ['All', ...Array.from(new Set(mutualFundsList.map(f => f.category))).filter(Boolean)];

  // Filter list
  const filteredFunds = mutualFundsList.filter(f => {
    const matchesSearch = f.fundName.toLowerCase().includes(search.toLowerCase()) || 
                          (f.folioNumber && f.folioNumber.toLowerCase().includes(search.toLowerCase())) ||
                          f.schemeCode.includes(search);
    const matchesCategory = categoryFilter === 'All' || f.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* KPI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Mutual Funds Value</p>
          <p className="text-xl font-bold text-white mt-1">{formatCurrency(totalMfValue, currency)}</p>
          <span className="text-[9px] text-slate-400">Current market value of units</span>
        </div>
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Invested Principal</p>
          <p className="text-xl font-bold text-slate-100 mt-1">{formatCurrency(totalMfInvested, currency)}</p>
          <span className="text-[9px] text-slate-400">Total acquisition cost</span>
        </div>
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Net Profit/Loss</p>
          <p className={`text-xl font-bold mt-1 ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit, currency)}
          </p>
          <span className={`text-[10px] font-semibold flex items-center ${totalProfit >= 0 ? 'text-emerald-550' : 'text-red-500'}`}>
            {totalProfit >= 0 ? '▲' : '▼'} {formatPercent(returnPercentage)}
          </span>
        </div>
      </div>

      {/* Mutual Funds Asset Manager */}
      <div className="glass p-6 rounded-3xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-6 gap-4 border-b border-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-white">Mutual Funds Portfolio</h2>
            <p className="text-xs text-slate-400">Add schemes and track live NAVs directly using the official AMFI database.</p>
          </div>
          
          <button
            onClick={() => {
              resetForm();
              setIsAddOpen(true);
            }}
            className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-colors self-start lg:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Mutual Fund
          </button>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search scheme, folio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2">
            <span className="text-[10px] text-slate-500 uppercase px-1">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-200 py-1.5 px-2 focus:outline-none w-full"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Mutual Funds Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-450 uppercase font-black tracking-wider">
                <th className="py-3 px-4">Scheme Details</th>
                <th className="py-3 px-3">Folio / Code</th>
                <th className="py-3 px-3 text-right">Units Held</th>
                <th className="py-3 px-3 text-right">Purchase NAV</th>
                <th className="py-3 px-3 text-right">Current NAV</th>
                <th className="py-3 px-3 text-right">Current Value</th>
                <th className="py-3 px-3 text-right">Gain / Loss</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredFunds.length > 0 ? (
                filteredFunds.map((fund) => {
                  const fundVal = fund.units * fund.currentNav;
                  const fundCost = fund.units * fund.averageNav;
                  const fundPl = fundVal - fundCost;
                  const fundPlPct = fundCost > 0 ? (fundPl / fundCost) : 0;

                  return (
                    <tr key={fund.id} className="hover:bg-slate-900/60 transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="text-slate-100 font-bold max-w-[280px] truncate" title={fund.fundName}>
                          {fund.fundName}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] bg-slate-800 text-indigo-300 font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                            {fund.category}
                          </span>
                          {fund.notes && (
                            <span className="text-[9px] text-slate-450 truncate max-w-[120px] font-mono italic">
                              {fund.notes}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="text-slate-300 font-semibold font-mono text-xs">{fund.folioNumber || '--'}</div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">AMFI: {fund.schemeCode}</div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-200">
                        {fund.units.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-450">
                        {formatCurrency(fund.averageNav, currency)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-violet-300">
                        {formatCurrency(fund.currentNav, currency)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-100">
                        {formatCurrency(fundVal, currency)}
                      </td>
                      <td className={`py-3.5 px-3 text-right font-mono font-bold ${fundPl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        <div>{fundPl >= 0 ? '+' : ''}{formatCurrency(fundPl, currency)}</div>
                        <div className="text-[9px] font-semibold">{formatPercent(fundPlPct)}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(fund)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(fund)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete Mutual Fund transaction in ${fund.fundName}?`)) {
                                deleteMutualFund(fund.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No mutual fund entries found. Click 'Add Mutual Fund' to search and log holdings.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AMFI live status alert */}
      <div className="glass p-5 rounded-3xl border border-slate-800 flex items-start gap-4">
        <div className="p-3 bg-violet-950/40 border border-violet-500/20 rounded-2xl text-violet-400">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">AMFI API Integration</h4>
          <p className="text-xs text-slate-400 mt-1 leading-normal">
            ArthSetu is connected directly to the Association of Mutual Funds in India (AMFI) database. Live Net Asset Values (NAVs) are fetched and updated on application load, completely locally and without using paid API keys.
          </p>
        </div>
      </div>

      {/* ADD MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-dark rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Add Mutual Fund</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live search input */}
            <div className="space-y-1 relative">
              <label className="text-slate-400 text-xs">Search AMFI Fund Scheme</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Type 3+ letters to search (e.g. Parag Parikh, SBI, Quant...)"
                  value={mfSearchQuery}
                  onChange={(e) => setMfSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              {isSearchingMf && (
                <div className="text-[10px] text-slate-500 mt-1 italic animate-pulse">Searching AMFI Database...</div>
              )}

              {mfApiSuggestions.length > 0 && (
                <div className="absolute z-[60] left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-800 rounded-lg shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                  {mfApiSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.schemeCode}
                      type="button"
                      onClick={() => handleSelectMfSuggestion(suggestion.schemeCode.toString(), suggestion.schemeName)}
                      className="w-full text-left px-3 py-2.5 hover:bg-slate-900 text-xs border-b border-slate-900/60 last:border-0 transition-colors"
                    >
                      <span className="font-bold text-slate-200 block">{suggestion.schemeName}</span>
                      <span className="text-[9px] text-indigo-400 font-mono mt-0.5 block">Scheme Code: {suggestion.schemeCode}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleAddSubmit} className="grid grid-cols-2 gap-4 text-xs pt-2">
              <div className="col-span-2 space-y-1">
                <label className="text-slate-400">Fund Name</label>
                <input
                  type="text"
                  value={fundName}
                  onChange={(e) => setFundName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                  placeholder="Fund Name (autofilled from search)"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Scheme Code (AMFI)</label>
                <input
                  type="text"
                  value={schemeCode}
                  onChange={(e) => setSchemeCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  required
                  placeholder="Scheme Code"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Folio Number</label>
                <input
                  type="text"
                  value={folioNumber}
                  onChange={(e) => setFolioNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  placeholder="e.g. 1234567/89"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  <option value="Equity">Equity</option>
                  <option value="Debt">Debt</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Index">Index</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Purchase Date</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Units Purchased</label>
                <input
                  type="number"
                  step="any"
                  value={units}
                  onChange={(e) => setUnits(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  required
                  placeholder="e.g. 142.355"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Purchase NAV (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={averageNav}
                  onChange={(e) => setAverageNav(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  required
                  placeholder="e.g. 104.56"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-slate-400">Notes / Remarks</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white h-16"
                  placeholder="e.g. Monthly SIP"
                />
              </div>

              <div className="col-span-2 pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 hover:bg-slate-900 border border-slate-800 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-semibold"
                >
                  Save Investment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-dark rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Edit Mutual Fund</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="grid grid-cols-2 gap-4 text-xs">
              <div className="col-span-2 space-y-1">
                <label className="text-slate-400">Fund Name</label>
                <input
                  type="text"
                  value={fundName}
                  onChange={(e) => setFundName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Scheme Code (AMFI)</label>
                <input
                  type="text"
                  value={schemeCode}
                  onChange={(e) => setSchemeCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  required
                  disabled
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Folio Number</label>
                <input
                  type="text"
                  value={folioNumber}
                  onChange={(e) => setFolioNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  <option value="Equity">Equity</option>
                  <option value="Debt">Debt</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Index">Index</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Purchase Date</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Units Held</label>
                <input
                  type="number"
                  step="any"
                  value={units}
                  onChange={(e) => setUnits(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Purchase NAV (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={averageNav}
                  onChange={(e) => setAverageNav(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  required
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-slate-400">Notes / Remarks</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white h-16"
                />
              </div>

              <div className="col-span-2 pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 hover:bg-slate-900 border border-slate-800 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
