import type { 
  BackendHealth, 
  DataStatusReport, 
  DailyScanResponse, 
  LiveScanResponse, 
  StockDetailsResponse, 
  ScanHistoryRecord,
  HeavyweightsReport
} from '../types';

const API_BASE = '/api/v1';

async function readApiError(response: Response): Promise<string> {
  const body = await response.json().catch(() => ({}));
  if (response.status === 401 || response.status === 403) {
    return `Upstox authentication failed (HTTP ${response.status}). Generate a valid read-only token and set UPSTOX_ACCESS_TOKEN on the backend service.`;
  }
  const detail = body?.detail;
  if (typeof detail === 'string') return detail;
  if (typeof detail?.message === 'string') return detail.message;
  if (typeof body?.message === 'string') return body.message;
  return `HTTP error ${response.status}: ${response.statusText}`;
}

export async function fetchHealth(): Promise<BackendHealth> {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchDataStatus(): Promise<DataStatusReport> {
  const response = await fetch(`${API_BASE}/data-status`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchDailyScan(): Promise<DailyScanResponse> {
  const response = await fetch(`${API_BASE}/scanner/daily`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function triggerDailyScanRun(): Promise<DailyScanResponse> {
  const response = await fetch(`${API_BASE}/scanner/daily/run`, { method: 'POST' });
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchLiveScan(): Promise<LiveScanResponse> {
  const response = await fetch(`${API_BASE}/scanner/live`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function triggerLiveScanRefresh(): Promise<LiveScanResponse> {
  const response = await fetch(`${API_BASE}/scanner/live/refresh`, { method: 'POST' });
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchStockDetails(symbol: string, timeframe: string = '1y'): Promise<StockDetailsResponse> {
  const response = await fetch(`${API_BASE}/stock-details/${encodeURIComponent(symbol)}?timeframe=${encodeURIComponent(timeframe)}`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchScanHistory(): Promise<ScanHistoryRecord[]> {
  const response = await fetch(`${API_BASE}/history/scans`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchTopHeavyweights(): Promise<HeavyweightsReport> {
  const response = await fetch(`${API_BASE}/heavyweights`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchAllVolumeAnalytics(): Promise<any> {
  const response = await fetch(`${API_BASE}/volume/all-50`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchMarketIntelligence(): Promise<any> {
  const response = await fetch(`${API_BASE}/market-intelligence`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = typeof body.detail === 'string' ? body.detail : body.detail?.message;
    if (response.status === 401 || response.status === 403) {
      return { detail: `Upstox authentication failed (HTTP ${response.status}). Generate a valid read-only token and set UPSTOX_ACCESS_TOKEN on the backend service.` };
    }
    return { detail: detail || `Upstox market data is unavailable (HTTP ${response.status}).` };
  }
  return response.json();
}

export async function triggerExcelGeneration(): Promise<any> {
  const response = await fetch(`${API_BASE}/export/generate`, { method: 'POST' });
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export function getExcelDownloadUrl(): string {
  return `${API_BASE}/export/download/latest`;
}

// Global Events Calendar APIs
export async function fetchGlobalEvents(params?: {
  category?: string;
  country_code?: string;
  importance?: string;
  search_query?: string;
  timeframe?: string;
}): Promise<any[]> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== 'ALL') query.append('category', params.category);
  if (params?.country_code && params.country_code !== 'ALL') query.append('country_code', params.country_code);
  if (params?.importance && params.importance !== 'ALL') query.append('importance', params.importance);
  if (params?.search_query) query.append('search_query', params.search_query);
  if (params?.timeframe) query.append('timeframe', params.timeframe);

  const qs = query.toString();
  const url = `${API_BASE}/global-events${qs ? `?${qs}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchGlobalEventsSummary(): Promise<any> {
  const response = await fetch(`${API_BASE}/global-events/summary`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchSubCalendar(subType: string): Promise<any[]> {
  const response = await fetch(`${API_BASE}/global-events/${subType}`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function triggerGlobalEventsRefresh(): Promise<any> {
  const response = await fetch(`${API_BASE}/global-events/refresh`, { method: 'POST' });
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchUserPreferences(): Promise<any> {
  const response = await fetch(`${API_BASE}/global-events/preferences`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function saveUserPreferences(prefs: any): Promise<any> {
  const response = await fetch(`${API_BASE}/global-events/preferences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs)
  });
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// Institutional Market Intelligence APIs (FII/DII, Macro, News, EMA)
export async function fetchFiiDiiCash(): Promise<any> {
  const response = await fetch(`${API_BASE}/market-intelligence/fii-dii/cash`);
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
  return response.json();
}

export async function fetchFiiDiiDerivatives(): Promise<any> {
  const response = await fetch(`${API_BASE}/market-intelligence/fii-dii/derivatives`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchMacroTopics(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/market-intelligence/macro-topics`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchMacroTopicDetail(topicId: string): Promise<any> {
  const response = await fetch(`${API_BASE}/market-intelligence/macro-topics/${topicId}`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchGlobalNews(category?: string): Promise<any[]> {
  const url = category && category !== 'ALL' 
    ? `${API_BASE}/market-intelligence/news?category=${category}` 
    : `${API_BASE}/market-intelligence/news`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchEmaScanner(
  rsiMin = 40.0,
  rsiMax = 60.0,
  emaPeriods: number[] = [5, 9, 10, 20, 21, 50, 100, 200]
): Promise<any> {
  const query = new URLSearchParams({ rsi_min: String(rsiMin), rsi_max: String(rsiMax),
    ema_periods: emaPeriods.join(',') });
  const response = await fetch(`${API_BASE}/scanner/ema?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchInflationAnalytics(): Promise<any> {
  const response = await fetch(`${API_BASE}/market-intelligence/inflation`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchGdpAnalytics(): Promise<any> {
  const response = await fetch(`${API_BASE}/market-intelligence/gdp`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchRbiMacro(): Promise<any> {
  const response = await fetch(`${API_BASE}/market-intelligence/rbi-macro`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchEconomicCalendar(): Promise<any> {
  const response = await fetch(`${API_BASE}/market-intelligence/calendar`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchMarketImpact(): Promise<any> {
  const response = await fetch(`${API_BASE}/market-intelligence/market-impact`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export function getMacroCsvDownloadUrl(section: string): string {
  return `${API_BASE}/market-intelligence/export/csv/${section}`;
}

// =========================================================================
// Institutional Live Options & Chart Engine API Clients
// =========================================================================

export async function fetchFoUniverse(): Promise<any> {
  const response = await fetch(`${API_BASE}/options/universe`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchOptionChain(
  symbol: string = 'NIFTY',
  strikeRange: number = 10,
  expiry?: string
): Promise<any> {
  const params = new URLSearchParams({
    symbol,
    strike_range: strikeRange.toString(),
  });
  if (expiry) params.append('expiry', expiry);

  const response = await fetch(`${API_BASE}/options/chain?${params.toString()}`);
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
  return response.json();
}

export async function fetchExpiries(symbol: string = 'NIFTY'): Promise<any> {
  const response = await fetch(`${API_BASE}/options/expiries?symbol=${encodeURIComponent(symbol)}`);
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
  return response.json();
}

export async function fetchStrategyPayoff(
  strategy: string = 'BULL_CALL_SPREAD',
  symbol: string = 'NIFTY',
  expiry?: string
): Promise<any> {
  const params = new URLSearchParams({ strategy, symbol });
  if (expiry) params.set('expiry', expiry);
  const response = await fetch(`${API_BASE}/options/strategy-payoff?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchMarketRegime(spot: number = 23532.70): Promise<any> {
  const response = await fetch(`${API_BASE}/options/market-regime?spot=${spot.toString()}`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchOptionsAlerts(): Promise<any> {
  const response = await fetch(`${API_BASE}/options/alerts`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchDataQualityReport(): Promise<any> {
  const response = await fetch(`${API_BASE}/options/data-quality`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchChartCandles(
  symbol: string = 'NIFTY',
  timeframe: string = '15m',
  chartType: string = 'CANDLESTICK',
  before?: string,
  instrumentKey?: string
): Promise<any> {
  const params = new URLSearchParams({
    symbol,
    timeframe,
    chart_type: chartType
  });
  if (before) params.set('before', before);
  if (instrumentKey) params.set('instrument_key', instrumentKey);
  const response = await fetch(`${API_BASE}/chart/candles?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export function getChartCsvDownloadUrl(
  symbol: string = 'NIFTY',
  timeframe: string = '15m',
  chartType: string = 'CANDLESTICK',
  instrumentKey?: string
): string {
  const params = new URLSearchParams({ symbol, timeframe, chart_type: chartType });
  if (instrumentKey) params.set('instrument_key', instrumentKey);
  return `${API_BASE}/chart/export/csv?${params.toString()}`;
}

