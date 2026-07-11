import { apiClient } from '../lib/apiClient.js';

export async function fetchCompanyProfile() {
  const { data } = await apiClient.get('/company/profile');
  return data.data;
}

export async function updateCompanyProfile(payload) {
  const { data } = await apiClient.put('/company/profile', payload);
  return data.data;
}

export async function uploadCompanyLogo(file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post('/uploads/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function fetchCompanyUsers() {
  const { data } = await apiClient.get('/company/users');
  return data.data;
}
