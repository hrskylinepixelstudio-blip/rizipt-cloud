import { apiClient } from '../lib/apiClient.js';

export async function searchCustomers(search = '') {
  const { data } = await apiClient.get('/customers', { params: search ? { search } : {} });
  return data.data;
}

export async function createCustomer(payload) {
  const { data } = await apiClient.post('/customers', payload);
  return data.data;
}
