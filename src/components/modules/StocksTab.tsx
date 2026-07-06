import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import type { StockAsset } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { STOCK_SUGGESTIONS } from '../../utils/assetSuggestions';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  FileSpreadsheet, 
  Copy, 
  AlertCircle, 
  X, 
  Bookmark
} from 'lucide-react';

export const StocksTab: React.FC = () => {
  const { data, addStock, addStocksBulk, editStock, deleteStock, addToWatchlist, removeFromWatchlist } = usePortfolio();
  const watchlist = data.watchlist;

  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [brokerFilter, setBrokerFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'value' | 'profit' | 'ticker'>('value');

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCsvOpen, setIsCsvOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockAsset | null>(null);

  // Form States
  const [company, setCompany] = useState('');
  const [ticker, setTicker] = useState('');
  const [broker, setBroker] = useState('');
  const [exchange, setExchange] = useState('NSE');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState(0);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [dividend, setDividend] = useState(0);
  const [sector, setSector] = useState('');
  const [notes, setNotes] = useState('');
  
  // Autocomplete Suggestions States
  const [showStockSuggestions, setShowStockSuggestions] = useState(false);
  const [showTickerSuggestions, setShowTickerSuggestions] = useState(false);

  const stockSuggestions = company.trim()
    ? STOCK_SUGGESTIONS.filter(s =>
        s.name.toLowerCase().includes(company.toLowerCase()) ||
        s.ticker.toLowerCase().includes(company.toLowerCase())
      ).slice(0, 5)
    : [];

  const tickerSuggestions = ticker.trim()
    ? STOCK_SUGGESTIONS.filter(s =>
        s.ticker.toLowerCase().includes(ticker.toLowerCase()) ||
        s.name.toLowerCase().includes(ticker.toLowerCase())
      ).slice(0, 5)
    : [];

  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [yahooSuggestions, setYahooSuggestions] = useState<{ symbol: string; shortname?: string; longname?: string; exchDisp?: string; sector?: string }[]>([]);
  const [isSearchingYahoo, setIsSearchingYahoo] = useState(false);

  useEffect(() => {
    if (stockSearchQuery.trim().length < 2) {
      setYahooSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingYahoo(true);
      try {
        const queryUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(stockSearchQuery)}`;
        let responseData = null;
        let success = false;

        // Try corsproxy.io first
        try {
          const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(queryUrl)}`);
          if (res.ok) {
            responseData = await res.json();
            success = true;
          }
        } catch (err) {
          console.warn('corsproxy.io failed, trying allorigins', err);
        }

        // Fallback to allorigins if corsproxy fails
        if (!success) {
          try {
            const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(queryUrl)}`);
            if (res.ok) {
              const wrapper = await res.json();
              if (wrapper && wrapper.contents) {
                responseData = JSON.parse(wrapper.contents);
                success = true;
              }
            }
          } catch (err) {
            console.warn('allorigins fallback failed, trying codetabs', err);
          }
        }

        // Fallback to codetabs if both fail
        if (!success) {
          try {
            const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(queryUrl)}`);
            if (res.ok) {
              responseData = await res.json();
              success = true;
            }
          } catch (err) {
            console.warn('codetabs fallback failed', err);
          }
        }

        if (success && responseData) {
          const quotes = responseData?.quotes || [];
          const equities = quotes.filter((q: any) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF');
          setYahooSuggestions(equities.slice(0, 8));
        }
      } catch (e) {
        console.error('Yahoo stock search error:', e);
      } finally {
        setIsSearchingYahoo(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [stockSearchQuery]);

  const handleSelectYahooSuggestion = (suggestion: any) => {
    setCompany(suggestion.longname || suggestion.shortname || suggestion.symbol);
    setTicker(suggestion.symbol);
    
    // Set exchange
    const exch = suggestion.exchDisp || '';
    if (['NSE', 'BSE', 'NASDAQ', 'NYSE'].includes(exch.toUpperCase())) {
      setExchange(exch.toUpperCase());
    } else if (suggestion.symbol.endsWith('.NS')) {
      setExchange('NSE');
    } else if (suggestion.symbol.endsWith('.BO')) {
      setExchange('BSE');
    } else {
      setExchange('NSE');
    }

    setSector(suggestion.sector || 'Other');
    setYahooSuggestions([]);
    setStockSearchQuery('');
  };

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [csvError, setCsvError] = useState('');

  // Watchlist form
  const [watchlistSymbol, setWatchlistSymbol] = useState('');
  const [watchlistName, setWatchlistName] = useState('');

  if (!data) return null;
  const currency = data.settings.currency;

  // Calculators
  const totalEquitiesValue = data.stocks.reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0);
  const totalEquitiesInvested = data.stocks.reduce((sum, s) => sum + (s.quantity * s.purchasePrice), 0);
  const totalDividends = data.stocks.reduce((sum, s) => sum + s.dividend, 0);
  const totalProfit = totalEquitiesValue - totalEquitiesInvested;
  const returnPercentage = totalEquitiesInvested > 0 ? (totalProfit / totalEquitiesInvested) : 0;

  // Get unique sectors and brokers for filters
  const sectors = ['All', ...Array.from(new Set(data.stocks.map(s => s.sector))).filter(Boolean)];
  const brokers = ['All', ...Array.from(new Set(data.stocks.map(s => s.broker))).filter(Boolean)];

  // Filter & Sort Stocks
  const filteredStocks = data.stocks.filter(s => {
    const matchesSearch = s.company.toLowerCase().includes(search.toLowerCase()) || 
                          s.ticker.toLowerCase().includes(search.toLowerCase());
    const matchesSector = sectorFilter === 'All' || s.sector === sectorFilter;
    const matchesBroker = brokerFilter === 'All' || s.broker === brokerFilter;
    return matchesSearch && matchesSector && matchesBroker;
  }).sort((a, b) => {
    if (sortBy === 'value') {
      return (b.quantity * b.currentPrice) - (a.quantity * a.currentPrice);
    } else if (sortBy === 'profit') {
      const profitA = (a.currentPrice - a.purchasePrice) * a.quantity;
      const profitB = (b.currentPrice - b.purchasePrice) * b.quantity;
      return profitB - profitA;
    } else {
      return a.ticker.localeCompare(b.ticker);
    }
  });

  // Handle Add
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addStock({
      company,
      ticker: ticker.toUpperCase(),
      broker,
      exchange,
      purchaseDate,
      quantity,
      purchasePrice,
      currentPrice: currentPrice || purchasePrice,
      dividend,
      sector,
      notes
    });
    // Reset Form
    setIsAddOpen(false);
    resetForm();
  };

  // Handle Edit Setup
  const openEditModal = (stock: StockAsset) => {
    setSelectedStock(stock);
    setCompany(stock.company);
    setTicker(stock.ticker);
    setBroker(stock.broker);
    setExchange(stock.exchange);
    setPurchaseDate(stock.purchaseDate);
    setQuantity(stock.quantity);
    setPurchasePrice(stock.purchasePrice);
    setCurrentPrice(stock.currentPrice);
    setDividend(stock.dividend);
    setSector(stock.sector);
    setNotes(stock.notes || '');
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;
    editStock(selectedStock.id, {
      company,
      ticker: ticker.toUpperCase(),
      broker,
      exchange,
      purchaseDate,
      quantity,
      purchasePrice,
      currentPrice: currentPrice || purchasePrice,
      dividend,
      sector,
      notes
    });
    setIsEditOpen(false);
    resetForm();
  };

  const handleDuplicate = (stock: StockAsset) => {
    addStock({
      ...stock,
      ticker: `${stock.ticker}-COPY`,
      company: `${stock.company} (Copy)`
    });
  };

  const resetForm = () => {
    setCompany('');
    setTicker('');
    setBroker('');
    setExchange('NSE');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setQuantity(0);
    setPurchasePrice(0);
    setCurrentPrice(0);
    setDividend(0);
    setSector('');
    setNotes('');
    setSelectedStock(null);
    setStockSearchQuery('');
    setYahooSuggestions([]);
  };

  // CSV Import Parse Logic
  // Expects CSV Header: ticker,company,broker,exchange,quantity,purchasePrice,purchaseDate,sector
  const handleCsvImport = (e: React.FormEvent) => {
    e.preventDefault();
    setCsvError('');
    try {
      const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        setCsvError('CSV requires at least a header row and one data row.');
        return;
      }
      
      const header = lines[0].toLowerCase().split(',');
      const requiredFields = ['ticker', 'company', 'quantity', 'purchaseprice'];
      
      const missing = requiredFields.filter(f => !header.includes(f));
      if (missing.length > 0) {
        setCsvError(`Missing required headers: ${missing.join(', ')}`);
        return;
      }

      const parsedStocks: Omit<StockAsset, 'id'>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const rowData: Record<string, string> = {};
        header.forEach((h, index) => {
          rowData[h.trim()] = values[index]?.trim() || '';
        });

        const q = parseFloat(rowData['quantity']);
        const p = parseFloat(rowData['purchaseprice']);

        if (rowData['ticker'] && rowData['company'] && !isNaN(q) && !isNaN(p)) {
          parsedStocks.push({
            ticker: rowData['ticker'].toUpperCase(),
            company: rowData['company'],
            broker: rowData['broker'] || 'Direct',
            exchange: rowData['exchange'] || 'NSE',
            quantity: q,
            purchasePrice: p,
            currentPrice: p,
            purchaseDate: rowData['purchasedate'] || new Date().toISOString().split('T')[0],
            sector: rowData['sector'] || 'General',
            dividend: parseFloat(rowData['dividend'] || '0') || 0,
            notes: rowData['notes'] || ''
          });
        }
      }

      if (parsedStocks.length > 0) {
        addStocksBulk(parsedStocks);
      }

      setCsvText('');
      setIsCsvOpen(false);
      alert(`Successfully imported ${parsedStocks.length} stocks!`);
    } catch (err) {
      setCsvError('Parsing failed. Make sure your values are comma-separated.');
    }
  };

  const handleAddWatchlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!watchlistSymbol) return;
    addToWatchlist({
      symbol: watchlistSymbol.toUpperCase(),
      name: watchlistName || watchlistSymbol.toUpperCase(),
      assetType: 'Stock',
      notes: 'Added from Stocks tab'
    });
    setWatchlistSymbol('');
    setWatchlistName('');
  };

  return (
    <div className="space-y-6">
      {/* KPI Equities Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Equities Current Value</p>
          <p className="text-xl font-bold text-white mt-1">{formatCurrency(totalEquitiesValue, currency)}</p>
          <span className="text-[9px] text-slate-400">Total current holding value</span>
        </div>
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Net Invested Principal</p>
          <p className="text-xl font-bold text-slate-100 mt-1">{formatCurrency(totalEquitiesInvested, currency)}</p>
          <span className="text-[9px] text-slate-400">Initial purchase cost</span>
        </div>
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Profit/Loss</p>
          <p className={`text-xl font-bold mt-1 ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit, currency)}
          </p>
          <span className={`text-[10px] font-semibold flex items-center ${totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {totalProfit >= 0 ? '▲' : '▼'} {formatPercent(returnPercentage)}
          </span>
        </div>
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Dividends Cash</p>
          <p className="text-xl font-bold text-violet-400 mt-1">{formatCurrency(totalDividends, currency)}</p>
          <span className="text-[9px] text-slate-400">Passive dividend earnings</span>
        </div>
      </div>

      {/* Main Stock Asset Manager */}
      <div className="glass p-6 rounded-3xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-6 gap-4 border-b border-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-white">Stock Portfolio</h2>
            <p className="text-xs text-slate-400">Add, manage, and filter your equity holdings locally.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsCsvOpen(true)}
              className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-semibold py-2 px-3 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" /> Bulk Import CSV
            </button>
            <button
              onClick={() => {
                resetForm();
                setIsAddOpen(true);
              }}
              className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Stock
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 my-5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search ticker, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2">
            <span className="text-[10px] text-slate-500 uppercase px-1">Sector:</span>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-200 py-1.5 px-2 focus:outline-none w-full"
            >
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2">
            <span className="text-[10px] text-slate-500 uppercase px-1">Broker:</span>
            <select
              value={brokerFilter}
              onChange={(e) => setBrokerFilter(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-200 py-1.5 px-2 focus:outline-none w-full"
            >
              {brokers.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
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
              <option value="ticker">Symbol A-Z</option>
            </select>
          </div>
        </div>

        {/* Stock Holdings Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-900/40">
                <th className="py-3 px-4">Company / Exchange</th>
                <th className="py-3 px-3 text-right">Qty</th>
                <th className="py-3 px-3 text-right">Avg Cost</th>
                <th className="py-3 px-3 text-right">Live Price</th>
                <th className="py-3 px-3 text-right">Current Value</th>
                <th className="py-3 px-3 text-right">Total P/L</th>
                <th className="py-3 px-3 text-right">Port %</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredStocks.length > 0 ? (
                filteredStocks.map((stock) => {
                  const val = stock.quantity * stock.currentPrice;
                  const cost = stock.quantity * stock.purchasePrice;
                  const pl = val - cost;
                  const plPct = cost > 0 ? (pl / cost) : 0;
                  const weight = totalEquitiesValue > 0 ? (val / totalEquitiesValue) * 100 : 0;

                  return (
                    <tr key={stock.id} className="hover:bg-slate-900/60 transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          {stock.ticker}
                          <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700/60 px-1.5 py-0.5 rounded font-mono font-medium">
                            {stock.exchange}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 leading-tight max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">
                          {stock.company} • <span className="font-mono text-[9px]">{stock.broker}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-slate-200">{stock.quantity}</td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-400">{formatCurrency(stock.purchasePrice, currency)}</td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-violet-300">{formatCurrency(stock.currentPrice, currency)}</td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-100">{formatCurrency(val, currency)}</td>
                      <td className={`py-3.5 px-3 text-right font-mono font-bold ${pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        <div>{pl >= 0 ? '+' : ''}{formatCurrency(pl, currency)}</div>
                        <div className="text-[9px] font-semibold">{formatPercent(plPct)}</div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-400">{weight.toFixed(1)}%</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(stock)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                            title="Edit Holding"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(stock)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                            title="Duplicate Entry"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete holding ${stock.ticker}?`)) {
                                deleteStock(stock.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded transition-colors"
                            title="Delete Holding"
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
                    No holdings match your filters. Click 'Add Stock' to add a stock manually.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Watchlist & Technical Checklist Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Watchlist Panel */}
        <div className="lg:col-span-2 glass p-5 rounded-3xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-2">
              <Bookmark className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-bold text-slate-200">Personal Asset Watchlist</h3>
            </div>
            <p className="text-[10px] text-slate-400">Monitor tickers you are researching. Kept private.</p>
          </div>

          <div className="my-4 divide-y divide-slate-800 max-h-48 overflow-y-auto pr-1">
            {watchlist.filter((w: any) => w.assetType === 'Stock').length > 0 ? (
              watchlist
                .filter((w: any) => w.assetType === 'Stock')
                .map((item: any) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white font-mono">{item.symbol}</div>
                      <div className="text-[10px] text-slate-400">{item.name}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.targetPrice && (
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 block">TARGET</span>
                          <span className="font-mono text-slate-200 font-semibold">{formatCurrency(item.targetPrice, currency)}</span>
                        </div>
                      )}
                      <button
                        onClick={() => removeFromWatchlist(item.id)}
                        className="text-slate-500 hover:text-red-400 p-1"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">Your watchlist is empty.</p>
            )}
          </div>

          {/* Quick Add Watchlist Form */}
          <form onSubmit={handleAddWatchlist} className="grid grid-cols-3 gap-2 border-t border-slate-800/40 pt-3">
            <input
              type="text"
              placeholder="Symbol (e.g. INFY)"
              value={watchlistSymbol}
              onChange={(e) => setWatchlistSymbol(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-500"
              required
            />
            <input
              type="text"
              placeholder="Company Name"
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

        {/* Portfolio Rebalancing suggestions */}
        <div className="glass p-5 rounded-3xl border border-slate-800 shadow-md">
          <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-violet-400" /> Rebalancing Engine
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wide">IT Sector Concentrated</span>
              <p className="text-slate-200 mt-1 leading-relaxed">
                TCS constitutes over 30% of your stock allocation. Consider locking profits or redirecting future capital into energy, financials, or manufacturing to mitigate sector concentration.
              </p>
            </div>
            <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl">
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wide">US Equities Weighting</span>
              <p className="text-slate-200 mt-1 leading-relaxed">
                US Stocks (Apple, Tesla) represents 15% of equities. Adding a global index fund or building Apple/Tesla to 20% would diversify geographic risk.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- ADD STOCK MODAL --- */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-dark rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Add Stock Asset</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Search Input (Yahoo Finance API) */}
            <div className="space-y-1 relative">
              <label className="text-slate-400 text-xs">Search Stock Ticker / Company (Live Yahoo Finance)</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search Sterlite, Tata, Google, Apple..."
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              {isSearchingYahoo && (
                <div className="text-[10px] text-slate-500 mt-1 italic animate-pulse">Searching Yahoo Finance...</div>
              )}

              {yahooSuggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-800 rounded-lg shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                  {yahooSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.symbol}
                      type="button"
                      onClick={() => handleSelectYahooSuggestion(suggestion)}
                      className="w-full text-left px-3 py-2.5 hover:bg-slate-900 text-xs border-b border-slate-900/60 last:border-0 transition-colors flex justify-between items-center"
                    >
                      <div>
                        <span className="font-bold text-slate-200 block truncate w-48">{suggestion.longname || suggestion.shortname}</span>
                        <span className="text-[10px] text-slate-455 block truncate w-48">{suggestion.sector || 'Equity'}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono bg-slate-800 text-violet-300 px-1.5 py-0.5 rounded text-[10px] font-semibold">{suggestion.symbol}</span>
                        <span className="block text-[9px] text-slate-500 font-bold uppercase mt-0.5">{suggestion.exchDisp}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleAddSubmit} className="grid grid-cols-2 gap-4 text-xs">
              <div className="col-span-2 space-y-1 relative">
                <label className="text-slate-400">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Infosys Ltd."
                  value={company}
                  onChange={(e) => {
                    setCompany(e.target.value);
                    setShowStockSuggestions(true);
                  }}
                  onFocus={() => setShowStockSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowStockSuggestions(false), 200)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
                {showStockSuggestions && stockSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-800 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                    {stockSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCompany(suggestion.name);
                          setTicker(suggestion.ticker);
                          setSector(suggestion.sector);
                          setExchange(suggestion.exchange);
                          setShowStockSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-900 text-xs flex justify-between items-center transition-colors border-b border-slate-900/40 last:border-0"
                      >
                        <div>
                          <span className="font-bold text-white block">{suggestion.name}</span>
                          <span className="text-[10px] text-slate-400">{suggestion.sector}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono bg-slate-800 text-violet-300 px-1.5 py-0.5 rounded text-[10px] font-semibold">{suggestion.ticker}</span>
                          <span className="block text-[9px] text-slate-500 font-bold uppercase mt-0.5">{suggestion.exchange}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1 relative">
                <label className="text-slate-400">Ticker Symbol</label>
                <input
                  type="text"
                  placeholder="e.g. INFY.NS or INFY"
                  value={ticker}
                  onChange={(e) => {
                    setTicker(e.target.value);
                    setShowTickerSuggestions(true);
                  }}
                  onFocus={() => setShowTickerSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowTickerSuggestions(false), 200)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white uppercase font-mono"
                  required
                />
                {showTickerSuggestions && tickerSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-800 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto w-64">
                    {tickerSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCompany(suggestion.name);
                          setTicker(suggestion.ticker);
                          setSector(suggestion.sector);
                          setExchange(suggestion.exchange);
                          setShowTickerSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-900 text-xs flex justify-between items-center transition-colors border-b border-slate-900/40 last:border-0"
                      >
                        <div>
                          <span className="font-bold text-white block truncate w-32">{suggestion.name}</span>
                          <span className="text-[10px] text-slate-450 block truncate w-32">{suggestion.sector}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono bg-slate-800 text-violet-300 px-1.5 py-0.5 rounded text-[10px] font-semibold">{suggestion.ticker}</span>
                          <span className="block text-[9px] text-slate-500 font-bold uppercase mt-0.5">{suggestion.exchange}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Sector</label>
                <input
                  type="text"
                  placeholder="e.g. Technology"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Brokerage Account</label>
                <input
                  type="text"
                  placeholder="e.g. Zerodha, Groww"
                  value={broker}
                  onChange={(e) => setBroker(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Exchange</label>
                <select
                  value={exchange}
                  onChange={(e) => setExchange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                >
                  <option value="NSE">NSE</option>
                  <option value="BSE">BSE</option>
                  <option value="NASDAQ">NASDAQ</option>
                  <option value="NYSE">NYSE</option>
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
                <label className="text-slate-400">Avg Buy Price</label>
                <input
                  type="number"
                  step="any"
                  value={purchasePrice || ''}
                  onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Current Market Price</label>
                <input
                  type="number"
                  step="any"
                  placeholder="Defaults to Avg Buy Price"
                  value={currentPrice || ''}
                  onChange={(e) => setCurrentPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Dividends Received</label>
                <input
                  type="number"
                  step="any"
                  value={dividend || ''}
                  onChange={(e) => setDividend(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-slate-400">Portfolio Notes</label>
                <textarea
                  placeholder="Notes, targets, reasons for buying..."
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
                  Save Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT STOCK MODAL --- */}
      {isEditOpen && selectedStock && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-dark rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Modify Holding ({selectedStock.ticker})</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="grid grid-cols-2 gap-4 text-xs">
              <div className="col-span-2 space-y-1">
                <label className="text-slate-400">Company Name</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Ticker Symbol</label>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white uppercase font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Sector</label>
                <input
                  type="text"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Brokerage Account</label>
                <input
                  type="text"
                  value={broker}
                  onChange={(e) => setBroker(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Exchange</label>
                <select
                  value={exchange}
                  onChange={(e) => setExchange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                >
                  <option value="NSE">NSE</option>
                  <option value="BSE">BSE</option>
                  <option value="NASDAQ">NASDAQ</option>
                  <option value="NYSE">NYSE</option>
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
                <label className="text-slate-400">Avg Cost Price</label>
                <input
                  type="number"
                  step="any"
                  value={purchasePrice || ''}
                  onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Current Market Price</label>
                <input
                  type="number"
                  step="any"
                  value={currentPrice || ''}
                  onChange={(e) => setCurrentPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Dividends Cash</label>
                <input
                  type="number"
                  step="any"
                  value={dividend || ''}
                  onChange={(e) => setDividend(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
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

      {/* --- CSV IMPORT MODAL --- */}
      {isCsvOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-dark rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-violet-400" /> Bulk CSV Import
              </h3>
              <button onClick={() => setIsCsvOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {csvError && (
              <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{csvError}</span>
              </div>
            )}

            <form onSubmit={handleCsvImport} className="space-y-4 text-xs">
              <div className="space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-slate-400 leading-relaxed text-[11px]">
                <p className="font-bold text-slate-200">CSV Template Format:</p>
                <p className="font-mono text-slate-300 py-1 select-all">
                  ticker,company,broker,exchange,quantity,purchasePrice,purchaseDate,sector,dividend,notes
                </p>
                <p>Paste your comma-separated rows below, including the headers. The first row must define the headers exactly as shown. Minimum fields required: <em>ticker, company, quantity, purchasePrice</em>.</p>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Raw CSV Contents</label>
                <textarea
                  placeholder="ticker,company,broker,exchange,quantity,purchasePrice,purchaseDate,sector&#10;INFY.NS,Infosys,Zerodha,NSE,100,1650.00,2025-01-20,Technology&#10;NVDA,NVIDIA,Vested,NASDAQ,50,92.40,2024-11-15,Technology"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono h-48 focus:outline-none focus:border-violet-500 text-[11px]"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCsvOpen(false)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold py-2.5 px-4 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 px-5 rounded-xl"
                >
                  Process CSV Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
