import type { StockAsset, CryptoAsset } from '../types';

// Deterministic daily change percentage based on ticker name and date
export function getSimulatedDailyChange(key: string): number {
  let hash = 0;
  const str = key + new Date().toDateString();
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Yields a stable daily percentage between -2.5% and +2.5%
  const pct = (Math.abs(hash) % 50 - 25) / 1000;
  return pct || 0.002; // default +0.2%
}

// Cache for last fetched prices
let cryptoPriceCache: Record<string, { price: number; previousClose: number }> = {
  BTC: { price: 68500, previousClose: 68500 / (1 + getSimulatedDailyChange('BTC')) },
  ETH: { price: 3540, previousClose: 3540 / (1 + getSimulatedDailyChange('ETH')) },
  SOL: { price: 145.80, previousClose: 145.80 / (1 + getSimulatedDailyChange('SOL')) },
};

let stockPriceCache: Record<string, { price: number; previousClose: number }> = {
  'RELIANCE.NS': { price: 2890.75, previousClose: 2875.00 },
  'TCS.NS': { price: 4125.40, previousClose: 4150.00 },
  'HDFCBANK.NS': { price: 1720.50, previousClose: 1715.00 },
  'AAPL': { price: 218.30, previousClose: 216.50 },
  'TSLA': { price: 248.50, previousClose: 242.10 },
};

/**
 * Fetch live Crypto prices from Coinbase public API
 */
export async function fetchLiveCryptoPrices(activeCryptos?: CryptoAsset[]): Promise<Record<string, { price: number; previousClose: number }>> {
  try {
    const coinsSet = new Set<string>(['BTC', 'ETH', 'SOL']);
    if (activeCryptos) {
      activeCryptos.forEach(c => coinsSet.add(c.coin.toUpperCase()));
    }
    const coins = Array.from(coinsSet);
    const prices: Record<string, { price: number; previousClose: number }> = { ...cryptoPriceCache };
    
    // We fetch in parallel from Coinbase USD spot prices (which has CORS support)
    const fetchPromises = coins.map(async (coin) => {
      try {
        const res = await fetch(`https://api.coinbase.com/v2/prices/${coin}-USD/spot`);
        if (res.ok) {
          const json = await res.json();
          const price = parseFloat(json?.data?.amount);
          if (!isNaN(price) && price > 0) {
            const dailyChange = getSimulatedDailyChange(coin);
            const prevClose = price / (1 + dailyChange);
            const data = { price, previousClose: prevClose };
            prices[coin] = data;
            cryptoPriceCache[coin] = data; // update cache
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
 * Helper function to fetch with a timeout
 */
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

export async function fetchLiveStockPrices(activeStocks?: StockAsset[]): Promise<Record<string, { price: number; previousClose: number }>> {
  const prices: Record<string, { price: number; previousClose: number }> = { ...stockPriceCache };
  
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

    const processResult = (data: any): boolean => {
      const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      const prevClose = data?.chart?.result?.[0]?.meta?.chartPreviousClose || data?.chart?.result?.[0]?.meta?.previousClose || price;
      if (price && !isNaN(price) && price > 0) {
        const item = { price, previousClose: prevClose || price / (1 + getSimulatedDailyChange(ticker)) };
        prices[ticker] = item;
        stockPriceCache[ticker] = item;
        return true;
      }
      return false;
    };

    // Try corsproxy.io first
    try {
      const res = await fetchWithTimeout(`https://corsproxy.io/?${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${cleanTicker}`)}`, 2000);
      if (res.ok) {
        const data = await res.json();
        priceFetched = processResult(data);
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
          priceFetched = processResult(data);
        }
      } catch (err) {
        console.warn(`allorigins failed for ${ticker}`, err);
      }
    }

    // Stable fallback
    if (!priceFetched) {
      const matchingStock = activeStocks?.find(s => s.ticker === ticker);
      const existingPrice = matchingStock?.currentPrice || matchingStock?.purchasePrice || stockPriceCache[ticker]?.price || 150.00;
      const existingPrevClose = matchingStock?.previousClose || stockPriceCache[ticker]?.previousClose || existingPrice / (1 + getSimulatedDailyChange(ticker));
      const item = { price: existingPrice, previousClose: existingPrevClose };
      prices[ticker] = item;
      stockPriceCache[ticker] = item;
    }
  });

  await Promise.all(fetchPromises);
  return prices;
}

/**
 * Gets currency conversion rate
 */
export function getConversionRate(from: string, to: string): number {
  if (from === to) return 1;
  
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
export function updateStockPrices(stocks: StockAsset[], livePrices: Record<string, { price: number; previousClose: number }>): StockAsset[] {
  return stocks.map(stock => {
    const liveData = livePrices[stock.ticker];
    if (liveData) {
      return {
        ...stock,
        currentPrice: liveData.price,
        previousClose: liveData.previousClose,
      };
    }
    return stock;
  });
}

/**
 * Updates a list of cryptos with their latest prices
 */
export function updateCryptoPrices(cryptos: CryptoAsset[], livePrices: Record<string, { price: number; previousClose: number }>): CryptoAsset[] {
  return cryptos.map(crypto => {
    const liveData = livePrices[crypto.coin];
    if (liveData) {
      return {
        ...crypto,
        currentPrice: liveData.price,
        previousClose: liveData.previousClose,
      };
    }
    return crypto;
  });
}
