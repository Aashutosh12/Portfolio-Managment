export interface StockSuggestion {
  name: string;
  ticker: string;
  sector: string;
  exchange: 'NSE' | 'BSE' | 'NASDAQ' | 'NYSE';
}

export interface CryptoSuggestion {
  name: string;
  coin: string;
}

export const STOCK_SUGGESTIONS: StockSuggestion[] = [
  // Indian Stocks (NSE)
  { name: 'Reliance Industries Ltd.', ticker: 'RELIANCE.NS', sector: 'Energy & Petrochemicals', exchange: 'NSE' },
  { name: 'Tata Consultancy Services Ltd.', ticker: 'TCS.NS', sector: 'Technology', exchange: 'NSE' },
  { name: 'HDFC Bank Ltd.', ticker: 'HDFCBANK.NS', sector: 'Banking & Finance', exchange: 'NSE' },
  { name: 'Infosys Ltd.', ticker: 'INFY.NS', sector: 'Technology', exchange: 'NSE' },
  { name: 'ICICI Bank Ltd.', ticker: 'ICICIBANK.NS', sector: 'Banking & Finance', exchange: 'NSE' },
  { name: 'Hindustan Unilever Ltd.', ticker: 'HINDUNILVR.NS', sector: 'Consumer Goods', exchange: 'NSE' },
  { name: 'State Bank of India', ticker: 'SBIN.NS', sector: 'Banking & Finance', exchange: 'NSE' },
  { name: 'Bharti Airtel Ltd.', ticker: 'BHARTARTL.NS', sector: 'Telecommunications', exchange: 'NSE' },
  { name: 'ITC Ltd.', ticker: 'ITC.NS', sector: 'Consumer Goods', exchange: 'NSE' },
  { name: 'Larsen & Toubro Ltd.', ticker: 'LT.NS', sector: 'Infrastructure & Engineering', exchange: 'NSE' },
  { name: 'Wipro Ltd.', ticker: 'WIPRO.NS', sector: 'Technology', exchange: 'NSE' },
  { name: 'HCL Technologies Ltd.', ticker: 'HCLTECH.NS', sector: 'Technology', exchange: 'NSE' },
  { name: 'Kotak Mahindra Bank Ltd.', ticker: 'KOTAKBANK.NS', sector: 'Banking & Finance', exchange: 'NSE' },
  { name: 'Axis Bank Ltd.', ticker: 'AXISBANK.NS', sector: 'Banking & Finance', exchange: 'NSE' },
  { name: 'Asian Paints Ltd.', ticker: 'ASIANPAINT.NS', sector: 'Consumer Goods', exchange: 'NSE' },
  { name: 'Maruti Suzuki India Ltd.', ticker: 'MARUTI.NS', sector: 'Automotive', exchange: 'NSE' },
  { name: 'Bajaj Finance Ltd.', ticker: 'BAJFINANCE.NS', sector: 'Financial Services', exchange: 'NSE' },
  { name: 'Sun Pharmaceutical Industries Ltd.', ticker: 'SUNPHARMA.NS', sector: 'Healthcare & Pharma', exchange: 'NSE' },
  { name: 'Tata Motors Ltd.', ticker: 'TATAMOTORS.NS', sector: 'Automotive', exchange: 'NSE' },
  { name: 'UltraTech Cement Ltd.', ticker: 'ULTRACEMCO.NS', sector: 'Materials & Cement', exchange: 'NSE' },
  { name: 'NTPC Ltd.', ticker: 'NTPC.NS', sector: 'Power & Energy', exchange: 'NSE' },
  { name: 'Power Grid Corporation of India Ltd.', ticker: 'POWERGRID.NS', sector: 'Power & Energy', exchange: 'NSE' },
  { name: 'Adani Enterprises Ltd.', ticker: 'ADANIENT.NS', sector: 'Conglomerates', exchange: 'NSE' },
  { name: 'Coal India Ltd.', ticker: 'COALINDIA.NS', sector: 'Mining & Materials', exchange: 'NSE' },
  { name: 'Oil & Natural Gas Corporation Ltd.', ticker: 'ONGC.NS', sector: 'Energy & Oil', exchange: 'NSE' },
  { name: 'Titan Company Ltd.', ticker: 'TITAN.NS', sector: 'Consumer Goods', exchange: 'NSE' },
  { name: 'Tata Steel Ltd.', ticker: 'TATASTEEL.NS', sector: 'Metals & Mining', exchange: 'NSE' },
  { name: 'JSW Steel Ltd.', ticker: 'JSWSTEEL.NS', sector: 'Metals & Mining', exchange: 'NSE' },
  { name: 'Mahindra & Mahindra Ltd.', ticker: 'M&M.NS', sector: 'Automotive', exchange: 'NSE' },
  { name: 'LTIMindtree Ltd.', ticker: 'LTIM.NS', sector: 'Technology', exchange: 'NSE' },

  // US Stocks (NASDAQ/NYSE)
  { name: 'Apple Inc.', ticker: 'AAPL', sector: 'Technology', exchange: 'NASDAQ' },
  { name: 'Microsoft Corporation', ticker: 'MSFT', sector: 'Technology', exchange: 'NASDAQ' },
  { name: 'NVIDIA Corporation', ticker: 'NVDA', sector: 'Semiconductors', exchange: 'NASDAQ' },
  { name: 'Alphabet Inc. (Google)', ticker: 'GOOGL', sector: 'Technology & Internet', exchange: 'NASDAQ' },
  { name: 'Amazon.com Inc.', ticker: 'AMZN', sector: 'E-commerce', exchange: 'NASDAQ' },
  { name: 'Meta Platforms Inc. (Facebook)', ticker: 'META', sector: 'Social Media', exchange: 'NASDAQ' },
  { name: 'Tesla Inc.', ticker: 'TSLA', sector: 'Automotive & Energy', exchange: 'NASDAQ' },
  { name: 'Berkshire Hathaway Inc.', ticker: 'BRK-B', sector: 'Financial Services', exchange: 'NYSE' },
  { name: 'Eli Lilly and Company', ticker: 'LLY', sector: 'Healthcare & Pharma', exchange: 'NYSE' },
  { name: 'Broadcom Inc.', ticker: 'AVGO', sector: 'Semiconductors', exchange: 'NASDAQ' },
  { name: 'JPMorgan Chase & Co.', ticker: 'JPM', sector: 'Banking & Finance', exchange: 'NYSE' },
  { name: 'Visa Inc.', ticker: 'V', sector: 'Financial Services', exchange: 'NYSE' },
  { name: 'UnitedHealth Group Inc.', ticker: 'UNH', sector: 'Healthcare', exchange: 'NYSE' },
  { name: 'Mastercard Incorporated', ticker: 'MA', sector: 'Financial Services', exchange: 'NYSE' },
  { name: 'Exxon Mobil Corporation', ticker: 'XOM', sector: 'Energy & Oil', exchange: 'NYSE' },
  { name: 'Johnson & Johnson', ticker: 'JNJ', sector: 'Healthcare', exchange: 'NYSE' },
  { name: 'Walmart Inc.', ticker: 'WMT', sector: 'Retail', exchange: 'NYSE' },
  { name: 'Procter & Gamble Company', ticker: 'PG', sector: 'Consumer Goods', exchange: 'NYSE' },
  { name: 'Home Depot Inc.', ticker: 'HD', sector: 'Retail', exchange: 'NYSE' },
  { name: 'Netflix Inc.', ticker: 'NFLX', sector: 'Entertainment', exchange: 'NASDAQ' },
  { name: 'Advanced Micro Devices Inc.', ticker: 'AMD', sector: 'Semiconductors', exchange: 'NASDAQ' },
  { name: 'Salesforce Inc.', ticker: 'CRM', sector: 'Software & Technology', exchange: 'NYSE' },
  { name: 'Adobe Inc.', ticker: 'ADBE', sector: 'Software & Technology', exchange: 'NASDAQ' },
  { name: 'Oracle Corporation', ticker: 'ORCL', sector: 'Software & Technology', exchange: 'NYSE' },
  { name: 'Chevron Corporation', ticker: 'CVX', sector: 'Energy & Oil', exchange: 'NYSE' },
  { name: 'Cisco Systems Inc.', ticker: 'CSCO', sector: 'Networking', exchange: 'NASDAQ' }
];

export const CRYPTO_SUGGESTIONS: CryptoSuggestion[] = [
  { name: 'Bitcoin', coin: 'BTC' },
  { name: 'Ethereum', coin: 'ETH' },
  { name: 'Solana', coin: 'SOL' },
  { name: 'Cardano', coin: 'ADA' },
  { name: 'Ripple', coin: 'XRP' },
  { name: 'Binance Coin', coin: 'BNB' },
  { name: 'Dogecoin', coin: 'DOGE' },
  { name: 'Shiba Inu', coin: 'SHIB' },
  { name: 'Avalanche', coin: 'AVAX' },
  { name: 'Chainlink', coin: 'LINK' },
  { name: 'Polkadot', coin: 'DOT' },
  { name: 'Polygon', coin: 'MATIC' },
  { name: 'Litecoin', coin: 'LTC' },
  { name: 'Uniswap', coin: 'UNI' },
  { name: 'Stellar Lumens', coin: 'XLM' },
  { name: 'Near Protocol', coin: 'NEAR' },
  { name: 'Cosmos', coin: 'ATOM' },
  { name: 'Ethereum Classic', coin: 'ETC' },
  { name: 'Filecoin', coin: 'FIL' },
  { name: 'Hedera Hashgraph', coin: 'HBAR' },
  { name: 'Optimism', coin: 'OP' },
  { name: 'Arbitrum', coin: 'ARB' },
  { name: 'Render Token', coin: 'RNDR' },
  { name: 'Internet Computer', coin: 'ICP' },
  { name: 'Aptos', coin: 'APT' },
  { name: 'Sui', coin: 'SUI' }
];
