import { apiClient } from '../lib/apiClient.js';

export async function registerCompany({ companyName, fullName, email, phone, password }) {
  const { data } = await apiClient.post('/auth/register', {
    companyName,
    fullName,
    email,
    phone,
    password,
  });
  return data.data;
}

export async function login({ email, password }) {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data.data;
}

export async function fetchCurrentUser() {
  const { data } = await apiClient.get('/auth/me');
  return data.data;
}

export async function logout(refreshToken) {
  await apiClient.post('/auth/logout', { refreshToken });
}
