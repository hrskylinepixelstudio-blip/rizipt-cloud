import { apiClient } from '../lib/apiClient.js';

// Leads
export async function listLeads({ status } = {}) {
  const { data } = await apiClient.get('/leads', { params: status ? { status } : {} });
  return data.data;
}

export async function getLead(id) {
  const { data } = await apiClient.get(`/leads/${id}`);
  return data.data;
}

export async function createLead(payload) {
  const { data } = await apiClient.post('/leads', payload);
  return data.data;
}

export async function updateLead(id, payload) {
  const { data } = await apiClient.put(`/leads/${id}`, payload);
  return data.data;
}

export async function updateLeadStatus(id, status) {
  const { data } = await apiClient.patch(`/leads/${id}/status`, { status });
  return data.data;
}

export async function addLeadNote(id, note) {
  const { data } = await apiClient.post(`/leads/${id}/notes`, { note });
  return data.data;
}

export async function convertLead(id) {
  const { data } = await apiClient.post(`/leads/${id}/convert`);
  return data.data;
}

export async function deleteLead(id) {
  await apiClient.delete(`/leads/${id}`);
}

// Follow-ups
export async function listFollowUps({ status, upcoming } = {}) {
  const { data } = await apiClient.get('/follow-ups', { params: { status, upcoming } });
  return data.data;
}

export async function createFollowUp(payload) {
  const { data } = await apiClient.post('/follow-ups', payload);
  return data.data;
}

export async function updateFollowUpStatus(id, status) {
  const { data } = await apiClient.patch(`/follow-ups/${id}/status`, { status });
  return data.data;
}

export async function deleteFollowUp(id) {
  await apiClient.delete(`/follow-ups/${id}`);
}
