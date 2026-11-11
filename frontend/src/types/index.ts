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
  current_level: string;
  timestamp: string;
  verified_stocks_count: number;
  notes: string;
}

export interface StockDMAInfo {
  symbol: string;
  companyName: string;
  eligiblePrice: number;
  dma5: number;
  dma10: number;
  dma20: number;
  dma50: number;
  dma100: number;
  dma200: number;
  score: number; // 0 to 6
  dist5: number;
  dist10: number;
  dist20: number;
  dist50: number;
  dist100: number;
  dist200: number;
  crossoverFresh: boolean;
  status: DataStatusLevel;
}
