export type NavTab = 
  | 'dashboard' 
  | 'daily-scanner' 
  | 'live-scanner' 
  | 'stock-details' 
  | 'scan-history' 
  | 'data-status';

export type DataStatusLevel = 
  | 'VERIFIED' 
  | 'DELAYED' 
  | 'UNAVAILABLE' 
  | 'INSUFFICIENT_HISTORY' 
  | 'VALIDATION_FAILED'
  | 'INITIALIZING';

export interface BackendHealth {
  status: string;
  app_name: string;
  app_env: string;
  version: string;
  timestamp: string;
  data_provider_status?: string;
}

export interface DataStatusReport {
  provider: string;
  status: string;
  completed_session_date?: string;
  current_level: string;
  timestamp: string;
  total_constituents: number;
  verified_stocks_count: number;
  adjustment_policy?: string;
  notes: string;
}

export interface CrossoverItem {
  symbol: string;
  company_name: string;
  period: number;
  label: string;
  crossover_date: string;
  previous_close: number;
  previous_sma: number;
  latest_close: number;
  latest_sma: number;
  distance_pct: number;
  is_fresh: boolean;
}

export interface StockScanResult {
  symbol: string;
  company_name: string;
  industry: string;
  status: string;
  latest_close: number;
  latest_trading_date: string;
  score: number;
  classification: string;
  is_6_6: boolean;
  is_5_6: boolean;
  comparisons: Record<string, boolean>;
  smas: Record<string, number | null>;
  distances: Record<string, number | null>;
  fresh_crossovers: CrossoverItem[];
}

export interface DailyScanResponse {
  scan_timestamp: string;
  completed_session_date: string;
  total_constituents: number;
  verified_constituents: number;
  count_6_6: number;
  count_5_6: number;
  stocks_6_6: StockScanResult[];
  stocks_5_6: StockScanResult[];
  fresh_crossovers: CrossoverItem[];
  all_results: StockScanResult[];
}

export interface LiveScanResult {
  symbol: string;
  company_name: string;
  industry: string;
  live_price: number;
  completed_close: number;
  live_score: number;
  live_classification: string;
  is_6_6: boolean;
  is_5_6: boolean;
  is_provisional: boolean;
  status: string;
  completed_smas: Record<string, number | null>;
  live_distances: Record<string, number | null>;
}

export interface LiveScanResponse {
  type: string;
  feed_timestamp: string;
  feed_status: string;
  completed_daily_session_date: string;
  total_constituents: number;
  live_count_6_6: number;
  live_count_5_6: number;
  stocks_6_6: LiveScanResult[];
  stocks_5_6: LiveScanResult[];
  all_results: LiveScanResult[];
  notice: string;
}

export interface ChartCandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  dma5: number | null;
  dma10: number | null;
  dma20: number | null;
  dma50: number | null;
  dma100: number | null;
  dma200: number | null;
}

export interface StockDetailsResponse {
  symbol: string;
  company_name: string;
  industry: string;
  isin: string;
  upstox_instrument_key?: string;
  status: string;
  latest_close: number;
  latest_trading_date: string;
  total_sessions: number;
  score: number;
  classification: string;
  is_6_6: boolean;
  is_5_6: boolean;
  comparisons: Record<string, boolean>;
  smas: Record<string, number | null>;
  distances: Record<string, number | null>;
  fresh_crossovers: CrossoverItem[];
  chart_data: ChartCandle[];
}

export interface ScanHistoryRecord {
  id: number;
  scan_timestamp: string;
  completed_session_date: string;
  total_constituents: number;
  verified_count: number;
  count_6_6: number;
  count_5_6: number;
}
