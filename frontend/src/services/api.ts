import type { BackendHealth, DataStatusReport } from '../types';

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
