import { apiClient } from '../lib/apiClient.js';

export async function fetchDashboardSummary() {
  const { data } = await apiClient.get('/dashboard/summary');
  return data.data;
}
