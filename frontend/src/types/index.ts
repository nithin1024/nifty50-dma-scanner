export type NavTab = 
  | 'overview' 
  | 'dma-scanner' 
  | 'all-volume' 
  | 'heavyweights' 
  | 'volume-analytics' 
  | 'historical' 
  | 'data-quality';

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

export interface SixSessionVolumeRecord {
  session_index: number;
  trading_date: string;
  traded_volume: number;
  close_price: number;
  price_change_pct: number;
}

export interface CombinedSignal {
  signal: 'STRONG_BULLISH' | 'BULLISH_WATCHLIST' | 'FRESH_BREAKOUT' | 'WEAKENING' | 'NO_CONFIRMED_SIGNAL';
  label: string;
  badge_color: string;
  description: string;
  confidence: string;
}

export interface StockScanResult {
  symbol: string;
  company_name: string;
  sector?: string;
  industry: string;
  weightage: number;
  status: string;
  latest_close: number;
  price_change_pct?: number;
  latest_trading_date: string;
  score: number;
  classification: string;
  is_6_6: boolean;
  is_5_6: boolean;
  transition_type?: string;
  transition_description?: string;
  prev_score?: number;
  failed_dma?: string | null;
  failed_dma_label?: string | null;
  failed_dma_value?: number | null;
  failed_dma_distance_pct?: number | null;
  closest_support_dma?: string | null;
  closest_support_value?: number | null;
  closest_resistance_dma?: string | null;
  closest_resistance_value?: number | null;
  volume?: number;
  six_session_avg_volume?: number | null;
  rvol?: number | null;
  volume_change_pct?: number | null;
  volume_trend?: string;
  volume_classification?: string;
  price_volume_confirmation?: { signal: string; label: string; detail?: string };
  six_session_history?: SixSessionVolumeRecord[];
  combined_signal?: CombinedSignal;
  comparisons: Record<string, boolean>;
  smas: Record<string, number | null>;
  distances: Record<string, number | null>;
  fresh_crossovers: CrossoverItem[];
  approaching_crossovers?: any[];
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
  strong_bullish_stocks?: StockScanResult[];
  bullish_watchlist_stocks?: StockScanResult[];
  fresh_breakout_stocks?: StockScanResult[];
  weakening_stocks?: StockScanResult[];
  no_signal_stocks?: StockScanResult[];
  maintaining_6_6?: StockScanResult[];
  upgraded_5_to_6?: StockScanResult[];
  downgraded_6_to_5?: StockScanResult[];
  lost_alignment?: StockScanResult[];
  approaching_crossovers?: any[];
  fresh_crossovers: CrossoverItem[];
  all_results: StockScanResult[];
}

export interface LiveScanResult {
  symbol: string;
  company_name: string;
  sector?: string;
  industry: string;
  weightage: number;
  live_price: number;
  completed_close: number;
  price_change_pct: number;
  live_score: number;
  live_classification: string;
  is_6_6: boolean;
  is_5_6: boolean;
  is_provisional: boolean;
  status: string;
  feed_status?: string;
  update_timestamp?: string;
  completed_smas: Record<string, number | null>;
  live_distances: Record<string, number | null>;
  failed_dma?: string | null;
  failed_dma_label?: string | null;
  cumulative_volume?: number;
  previous_session_volume?: number;
  previous_five_volumes?: number[];
  six_session_avg_volume?: number | null;
  volume_change_pct?: number | null;
  rvol?: number | null;
  volume_trend?: string;
  volume_classification?: string;
  price_volume_confirmation?: { signal: string; label: string; detail?: string };
  six_session_history?: SixSessionVolumeRecord[];
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
  provisional_crossings: any[];
  all_results: LiveScanResult[];
  notice: string;
}

export interface HeavyweightStock {
  symbol: string;
  company_name: string;
  sector: string;
  industry: string;
  isin: string;
  weightage: number;
  market_data: {
    ltp: number;
    open: number;
    high: number;
    low: number;
    previous_close: number;
    price_change: number;
    price_change_pct: number;
    cumulative_volume: number;
    traded_value_rupees: number;
    update_timestamp: string;
  };
  six_session_history: SixSessionVolumeRecord[];
  volume_analytics: {
    six_session_avg_volume: number | null;
    latest_volume: number;
    rvol: number | null;
    volume_change_pct: number | null;
    volume_trend: string;
    volume_classification: string;
    price_volume_confirmation: { signal: string; label: string; detail?: string };
  };
  technical_analytics: {
    smas: Record<string, number | null>;
    distances: Record<string, number | null>;
    score: number;
    classification: string;
    is_6_6: boolean;
    is_5_6: boolean;
    failed_dma: string | null;
    failed_dma_label: string | null;
    closest_support_dma: string | null;
    closest_support_value: number | null;
    fresh_crossovers: CrossoverItem[];
  };
  weightage_impact: {
    index_weightage_pct: number;
    stock_price_change_pct: number;
    approx_index_contribution_pts: number;
    label: string;
    impact_status: 'SUPPORTING' | 'DRAGGING' | 'NEUTRAL';
  };
}

export interface HeavyweightsReport {
  timestamp: string;
  heavyweight_count: number;
  combined_weightage_pct: number;
  combined_estimated_contribution_pts: number;
  top_supporter: {
    symbol: string;
    company_name: string;
    contribution_pts: number;
    price_change_pct: number;
  } | null;
  top_dragger: {
    symbol: string;
    company_name: string;
    contribution_pts: number;
    price_change_pct: number;
  } | null;
  concentration_ratio_top2_pct: number;
  concentration_analysis: string;
  supporters_count: number;
  draggers_count: number;
  heavyweights: HeavyweightStock[];
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

export interface CpiInflationCategory {
  category: string;
  yoy_inflation_pct: number;
  breaches_rbi_ceiling: boolean;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
}

export interface MarketIntelligenceReport {
  timestamp: string;
  report_date: string;
  market_closing_levels: {
    nifty_50: { level: number; change_pct: number; date: string };
    sensex: { level: number; change_pct: number; date: string };
    usd_inr: { rate: number; source: string };
    crude_oil_brent: { price_usd: number; source: string; geopolitical_context: string };
    market_read_between_lines: string;
  };
  fii_dii_cash_activity: {
    session_date: string;
    fii_net_crores: number;
    fii_sentiment: string;
    dii_net_crores: number;
    dii_sentiment: string;
    net_institutional_crores: number;
    recent_fii_history: { date: string; fii_net_cr: number; status: string }[];
    source: string;
  };
  fii_derivatives_positioning: {
    session_date: string;
    net_index_futures_contracts: number;
    contracts_change: number;
    change_description: string;
    sentiment: string;
    status: string;
    historical_peak_shorts: number;
    trend_analysis: string;
    instrument_coverage: string;
  };
  cpi_inflation_breakdown: {
    headline: string;
    rbi_tolerance_ceiling_pct: number;
    source: string;
    key_highlights: string[];
    categories: CpiInflationCategory[];
  };
}
