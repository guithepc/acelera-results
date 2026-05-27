import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({ baseURL });

export const adminApi = axios.create({ baseURL });

adminApi.interceptors.request.use(config => {
  const token = sessionStorage.getItem('admin-token');
  if (token) config.headers['X-Admin-Token'] = token;
  return config;
});
