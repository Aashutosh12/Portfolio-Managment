import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import type { CryptoAsset } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  X, 
  Bookmark, 
  Wallet, 
  Server,
  Coins
} from 'lucide-react';

export const CryptoTab: React.FC = () => {
  const { data, addCrypto, editCrypto, deleteCrypto, addToWatchlist, removeFromWatchlist } = usePortfolio();
  const watchlist = data.watchlist;

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'value' | 'profit' | 'coin'>('value');

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoAsset | null>(null);

  // Form States
  const [coin, setCoin] = useState('');
  const [exchange, setExchange] = useState('');
  const [wallet, setWallet] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState(0);
  const [averageCost, setAverageCost] = useState(0);
  const [notes, setNotes] = useState('');

  // Watchlist form
  const [watchlistSymbol, setWatchlistSymbol] = useState('');
  const [watchlistName, setWatchlistName] = useState('');

  if (!data) return null;

  // Calculators
  const totalCryptoValue = data.crypto.reduce((sum, c) => sum + (c.quantity * c.currentPrice), 0);
  const totalCryptoInvested = data.crypto.reduce((sum, c) => sum + (c.quantity * c.averageCost), 0);
  const totalProfit = totalCryptoValue - totalCryptoInvested;
  const returnPercentage = totalCryptoInvested > 0 ? (totalProfit / totalCryptoInvested) : 0;

  // Filter & Sort Cryptos
  const filteredCryptos = data.crypto.filter(c => {
    const matchesSearch = c.coin.toLowerCase().includes(search.toLowerCase()) || 
                          c.wallet.toLowerCase().includes(search.toLowerCase()) ||
                          c.exchange.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'value') {
      return (b.quantity * b.currentPrice) - (a.quantity * a.currentPrice);
    } else if (sortBy === 'profit') {
      const profitA = (a.currentPrice - a.averageCost) * a.quantity;
      const profitB = (b.currentPrice - b.averageCost) * b.quantity;
      return profitB - profitA;
    } else {
      return a.coin.localeCompare(b.coin);
    }
  });

  // Handle Add
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCrypto({
      coin: coin.toUpperCase(),
      exchange,
      wallet,
      purchaseDate,
      quantity,
      averageCost,
      currentPrice: averageCost, // Initial price set to cost
      notes
    });
    setIsAddOpen(false);
    resetForm();
  };

  // Handle Edit Setup
  const openEditModal = (c: CryptoAsset) => {
    setSelectedCrypto(c);
    setCoin(c.coin);
    setExchange(c.exchange);
    setWallet(c.wallet);
    setPurchaseDate(c.purchaseDate);
    setQuantity(c.quantity);
    setAverageCost(c.averageCost);
    setNotes(c.notes || '');
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrypto) return;
    editCrypto(selectedCrypto.id, {
      coin: coin.toUpperCase(),
      exchange,
      wallet,
      purchaseDate,
      quantity,
      averageCost,
      notes
    });
    setIsEditOpen(false);
    resetForm();
  };

  const handleDuplicate = (c: CryptoAsset) => {
    addCrypto({
      ...c,
      coin: `${c.coin}2`
    });
  };

  const resetForm = () => {
    setCoin('');
    setExchange('');
    setWallet('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setQuantity(0);
    setAverageCost(0);
    setNotes('');
    setSelectedCrypto(null);
  };

  const handleAddWatchlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!watchlistSymbol) return;
    addToWatchlist({
      symbol: watchlistSymbol.toUpperCase(),
      name: watchlistName || watchlistSymbol.toUpperCase(),
      assetType: 'Crypto',
      notes: 'Added from Crypto tab'
    });
    setWatchlistSymbol('');
    setWatchlistName('');
  };

  return (
    <div className="space-y-6">
      {/* KPI Crypto Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Crypto Current Value (USD)</p>
          <p className="text-xl font-bold text-white mt-1">
            {formatCurrency(totalCryptoValue, 'USD')}
          </p>
          <span className="text-[9px] text-slate-400">Total valuation in USD</span>
        </div>
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Invested Principal</p>
          <p className="text-xl font-bold text-slate-100 mt-1">
            {formatCurrency(totalCryptoInvested, 'USD')}
          </p>
          <span className="text-[9px] text-slate-400">Initial purchase cost</span>
        </div>
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Net Gains</p>
          <p className={`text-xl font-bold mt-1 ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit, 'USD')}
          </p>
          <span className={`text-[10px] font-semibold flex items-center ${totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {totalProfit >= 0 ? '▲' : '▼'} {formatPercent(returnPercentage)}
          </span>
        </div>
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Aggregate Assets</p>
          <p className="text-xl font-bold text-sky-400 mt-1">{data.crypto.length}</p>
          <span className="text-[9px] text-slate-400">Unique digital tokens</span>
        </div>
      </div>

      {/* Main Crypto Asset Manager */}
      <div className="glass p-6 rounded-3xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 gap-4 border-b border-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" /> Cryptocurrency Ledger
            </h2>
            <p className="text-xs text-slate-400">Encrypted records of your hardware wallets and holdings.</p>
          </div>
          
          <button
            onClick={() => {
              resetForm();
              setIsAddOpen(true);
            }}
            className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-center"
          >
            <Plus className="w-4 h-4" /> Add Crypto Asset
          </button>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search coin, exchange, wallet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2">
            <span className="text-[10px] text-slate-500 uppercase px-1">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-none text-xs text-slate-200 py-1.5 px-2 focus:outline-none w-full"
            >
              <option value="value">Highest Value</option>
              <option value="profit">Highest Gains</option>
              <option value="coin">Symbol A-Z</option>
            </select>
          </div>
        </div>

        {/* Crypto Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-900/40">
                <th className="py-3 px-4">Coin Token</th>
                <th className="py-3 px-3">Exchange & Storage Wallet</th>
                <th className="py-3 px-3 text-right">Holdings</th>
                <th className="py-3 px-3 text-right">Avg Cost</th>
                <th className="py-3 px-3 text-right">Live Price (USD)</th>
                <th className="py-3 px-3 text-right">Market Value</th>
                <th className="py-3 px-3 text-right">Total Gain/Loss</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredCryptos.length > 0 ? (
                filteredCryptos.map((c) => {
                  const val = c.quantity * c.currentPrice;
                  const cost = c.quantity * c.averageCost;
                  const pl = val - cost;
                  const plPct = cost > 0 ? (pl / cost) : 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-900/60 transition-colors group">
                      <td className="py-3.5 px-4 font-black text-white font-mono text-sm tracking-wide">
                        {c.coin}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="text-slate-200 font-semibold flex items-center gap-1">
                          <Server className="w-3 h-3 text-indigo-400" /> {c.exchange}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Wallet className="w-3 h-3 text-slate-500" /> {c.wallet}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-200">
                        {c.quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-400">${c.averageCost.toLocaleString()}</td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-yellow-400">${c.currentPrice.toLocaleString()}</td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-100">${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className={`py-3.5 px-3 text-right font-mono font-bold ${pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        <div>{pl >= 0 ? '+' : ''}${pl.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <div className="text-[9px] font-semibold">{formatPercent(plPct)}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(c)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete coin transaction ${c.coin}?`)) {
                                deleteCrypto(c.id);
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
                    No crypto entries found. Click 'Add Crypto Asset' to log holdings.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Crypto Watchlist and Security warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Watchlist Panel */}
        <div className="lg:col-span-2 glass p-5 rounded-3xl border border-slate-800 shadow-md">
          <div className="flex items-center gap-2 pb-2">
            <Bookmark className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold text-slate-200">Crypto Watchlist</h3>
          </div>
          <p className="text-[10px] text-slate-400">Track digital token prices privately.</p>

          <div className="my-4 divide-y divide-slate-800 max-h-48 overflow-y-auto pr-1">
            {watchlist.filter((w: any) => w.assetType === 'Crypto').length > 0 ? (
              watchlist
                .filter((w: any) => w.assetType === 'Crypto')
                .map((item: any) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white font-mono">{item.symbol}</div>
                      <div className="text-[10px] text-slate-400">{item.name}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.targetPrice && (
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 block">ALERT AT</span>
                          <span className="font-mono text-slate-200 font-semibold">${item.targetPrice.toLocaleString()}</span>
                        </div>
                      )}
                      <button
                        onClick={() => removeFromWatchlist(item.id)}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">Crypto watchlist is empty.</p>
            )}
          </div>

          <form onSubmit={handleAddWatchlist} className="grid grid-cols-3 gap-2 border-t border-slate-800/40 pt-3">
            <input
              type="text"
              placeholder="Symbol (e.g. DOGE)"
              value={watchlistSymbol}
              onChange={(e) => setWatchlistSymbol(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-500"
              required
            />
            <input
              type="text"
              placeholder="Asset Name"
              value={watchlistName}
              onChange={(e) => setWatchlistName(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-500"
            />
            <button
              type="submit"
              className="bg-violet-600/20 text-violet-300 border border-violet-500/30 font-semibold text-xs py-2 px-3 rounded-lg hover:bg-violet-600/30 transition-all flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </form>
        </div>

        {/* Cold Storage Checklist */}
        <div className="glass p-5 rounded-3xl border border-slate-800 shadow-md">
          <h3 className="text-sm font-bold text-slate-200 mb-3">Crypto Self-Custody Guide</h3>
          <div className="space-y-3.5 text-xs text-slate-350 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-violet-950 text-violet-400 flex items-center justify-center font-bold font-mono text-[10px] flex-shrink-0 mt-0.5">1</span>
              <p>Verify that large holdings (&gt;$5,000 equivalent) are stored on a physical hardware wallet (like Ledger, Trezor) rather than exchanges.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-violet-950 text-violet-400 flex items-center justify-center font-bold font-mono text-[10px] flex-shrink-0 mt-0.5">2</span>
              <p>Keep your 24-word seed phrase completely offline. Never input it into any digital note, vault card, or online text file.</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- ADD CRYPTO MODAL --- */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-dark rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Log Crypto Investment</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400">Coin Ticker</label>
                  <input
                    type="text"
                    placeholder="e.g. BTC, ETH"
                    value={coin}
                    onChange={(e) => setCoin(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white uppercase font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Exchange Purchased</label>
                  <input
                    type="text"
                    placeholder="e.g. Binance, Coinbase"
                    value={exchange}
                    onChange={(e) => setExchange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400">Storage Wallet</label>
                  <input
                    type="text"
                    placeholder="e.g. Ledger Nano X, MetaMask"
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                    required
                  />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400">Quantity Purchased</label>
                  <input
                    type="number"
                    step="any"
                    value={quantity || ''}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Average Buy Cost (USD)</label>
                  <input
                    type="number"
                    step="any"
                    value={averageCost || ''}
                    onChange={(e) => setAverageCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Transaction Notes</label>
                <textarea
                  placeholder="Notes, buy targets, block confirmations..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white h-20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
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
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT CRYPTO MODAL --- */}
      {isEditOpen && selectedCrypto && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-dark rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Modify Crypto Holding ({selectedCrypto.coin})</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400">Coin Ticker</label>
                  <input
                    type="text"
                    value={coin}
                    onChange={(e) => setCoin(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white uppercase font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Exchange</label>
                  <input
                    type="text"
                    value={exchange}
                    onChange={(e) => setExchange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400">Storage Wallet</label>
                  <input
                    type="text"
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                    required
                  />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    value={quantity || ''}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Average Buy Cost (USD)</label>
                  <input
                    type="number"
                    step="any"
                    value={averageCost || ''}
                    onChange={(e) => setAverageCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Transaction Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white h-20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
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
