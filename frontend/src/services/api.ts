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

export async function fetchStockDetails(symbol: string): Promise<StockDetailsResponse> {
  const response = await fetch(`${API_BASE}/stock-details/${encodeURIComponent(symbol)}`);
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
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
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

