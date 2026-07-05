import type { StockAsset, CryptoAsset } from '../types';

// Cache for last fetched prices
let cryptoPriceCache: Record<string, number> = {
  BTC: 68500,
  ETH: 3540,
  SOL: 145.80,
};

let stockPriceCache: Record<string, number> = {
  'RELIANCE.NS': 2890.75,
  'TCS.NS': 4125.40,
  'HDFCBANK.NS': 1720.50,
  'AAPL': 218.30,
  'TSLA': 248.50,
};

/**
 * Fetch live Crypto prices from Binance public API
 * Binance returns prices in USD (e.g. BTCUSDT)
 */
export async function fetchLiveCryptoPrices(activeCryptos?: CryptoAsset[]): Promise<Record<string, number>> {
  try {
    const coinsSet = new Set<string>(['BTC', 'ETH', 'SOL']);
    if (activeCryptos) {
      activeCryptos.forEach(c => coinsSet.add(c.coin.toUpperCase()));
    }
    const coins = Array.from(coinsSet);
    const prices: Record<string, number> = { ...cryptoPriceCache };
    
    // We fetch in parallel from Coinbase USD spot prices (which has CORS support)
    const fetchPromises = coins.map(async (coin) => {
      try {
        const res = await fetch(`https://api.coinbase.com/v2/prices/${coin}-USD/spot`);
        if (res.ok) {
          const json = await res.json();
          const price = parseFloat(json?.data?.amount);
          if (!isNaN(price) && price > 0) {
            prices[coin] = price;
            cryptoPriceCache[coin] = price; // update cache
          }
        }
      } catch (err) {
        console.warn(`Could not fetch live Coinbase price for ${coin}, using cache`, err);
      }
    });

    await Promise.all(fetchPromises);
    return prices;
  } catch (error) {
    console.error('Failed fetching crypto prices, returning cache:', error);
    return cryptoPriceCache;
  }
}

/**
 * Fetch live Stock prices. Since Yahoo/Finnhub require API keys or CORS proxies,
 * we use a simulated volatility update that slightly shifts the prices to create
 * a premium, live-updating feel on the dashboard, plus try fetching if a proxy exists.
 */
// Helper function to fetch with a timeout (in milliseconds)
const fetchWithTimeout = async (url: string, timeoutMs = 2500): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return response;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
};

export let usdToInrRate = 83.50; // default baseline

export async function fetchUsdInrRate(): Promise<number> {
  try {
    const res = await fetchWithTimeout(`https://corsproxy.io/?${encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/USDINR=X')}`, 2000);
    if (res.ok) {
      const data = await res.json();
      const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (price && !isNaN(price) && price > 50) {
        usdToInrRate = price;
        return price;
      }
    }
  } catch (err) {
    try {
      const res = await fetchWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/USDINR=X')}`, 2500);
      if (res.ok) {
        const wrapper = await res.json();
        const data = JSON.parse(wrapper.contents);
        const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
        if (price && !isNaN(price) && price > 50) {
          usdToInrRate = price;
          return price;
        }
      }
    } catch (fallbackErr) {
      console.warn('Could not fetch live USD-INR rate, using cache', fallbackErr);
    }
  }
  return usdToInrRate;
}

export async function fetchLiveStockPrices(activeStocks?: StockAsset[]): Promise<Record<string, number>> {
  const prices: Record<string, number> = { ...stockPriceCache };
  
  // Get all unique tickers from active stocks plus defaults
  const tickersSet = new Set<string>(Object.keys(stockPriceCache));
  if (activeStocks) {
    activeStocks.forEach(s => tickersSet.add(s.ticker));
  }
  const tickers = Array.from(tickersSet);

  const fetchPromises = tickers.map(async (ticker) => {
    let priceFetched = false;
    let cleanTicker = ticker;

    if (!ticker.includes('.')) {
      const matchingStock = activeStocks?.find(s => s.ticker === ticker);
      if (matchingStock) {
        if (matchingStock.exchange === 'NSE') {
          cleanTicker = `${ticker}.NS`;
        } else if (matchingStock.exchange === 'BSE') {
          cleanTicker = `${ticker}.BO`;
        }
      }
    }

    // Try corsproxy.io first (fast Cloudflare Workers proxy)
    try {
      const res = await fetchWithTimeout(`https://corsproxy.io/?${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${cleanTicker}`)}`, 2000);
      if (res.ok) {
        const data = await res.json();
        const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
        if (price && !isNaN(price) && price > 0) {
          prices[ticker] = price;
          stockPriceCache[ticker] = price; // update cache
          priceFetched = true;
        }
      }
    } catch (err) {
      console.warn(`corsproxy.io failed for ${ticker}, trying allorigins`, err);
    }

    // If corsproxy.io fails, try allorigins.win
    if (!priceFetched) {
      try {
        const res = await fetchWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${cleanTicker}`)}`, 2000);
        if (res.ok) {
          const data = await res.json();
          const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
          if (price && !isNaN(price) && price > 0) {
            prices[ticker] = price;
            stockPriceCache[ticker] = price; // update cache
            priceFetched = true;
          }
        }
      } catch (err) {
        console.warn(`allorigins failed for ${ticker}`, err);
      }
    }

    // Stable fallback: keep existing price as-is to avoid wild random jumps
    if (!priceFetched) {
      const matchingStock = activeStocks?.find(s => s.ticker === ticker);
      const existingPrice = matchingStock?.currentPrice || matchingStock?.purchasePrice || stockPriceCache[ticker] || 150.00;
      prices[ticker] = existingPrice;
      stockPriceCache[ticker] = existingPrice;
    }
  });

  await Promise.all(fetchPromises);
  return prices;
}

/**
 * Gets currency conversion rate (USD/EUR to INR)
 * Static standard conversions that can be updated or fetched
 */
export function getConversionRate(from: string, to: string): number {
  if (from === to) return 1;
  
  // Base is INR (1 USD = 83.5 INR, 1 EUR = 90.2 INR)
  const ratesToINR: Record<string, number> = {
    INR: 1,
    USD: 83.5,
    EUR: 90.2,
  };
  
  const fromRate = ratesToINR[from] || 1;
  const toRate = ratesToINR[to] || 1;
  
  return fromRate / toRate;
}

/**
 * Updates a list of stocks with their latest prices
 */
export function updateStockPrices(stocks: StockAsset[], livePrices: Record<string, number>): StockAsset[] {
  return stocks.map(stock => {
    const livePrice = livePrices[stock.ticker];
    if (livePrice) {
      return {
        ...stock,
        currentPrice: livePrice,
      };
    }
    return stock;
  });
}

/**
 * Updates a list of cryptos with their latest prices
 */
export function updateCryptoPrices(cryptos: CryptoAsset[], livePrices: Record<string, number>): CryptoAsset[] {
  return cryptos.map(crypto => {
    const livePrice = livePrices[crypto.coin];
    if (livePrice) {
      return {
        ...crypto,
        currentPrice: livePrice,
      };
    }
    return crypto;
  });
}
