import { apiClient } from '../lib/apiClient.js';

export async function listBills({ docType, page = 1, pageSize = 20 } = {}) {
  const { data } = await apiClient.get('/bills', { params: { docType, page, pageSize } });
  return data;
}

export async function getBill(id) {
  const { data } = await apiClient.get(`/bills/${id}`);
  return data.data;
}

export async function createBill(payload) {
  const { data } = await apiClient.post('/bills', payload);
  return data.data;
}

export async function updateBill(id, payload) {
  const { data } = await apiClient.put(`/bills/${id}`, payload);
  return data.data;
}

export async function updateBillStatus(id, status) {
  const { data } = await apiClient.patch(`/bills/${id}/status`, { status });
  return data.data;
}

export async function deleteBill(id) {
  await apiClient.delete(`/bills/${id}`);
}
