import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  updatePreferences: (payload) => api.put('/auth/preferences', payload).then((r) => r.data),
};

export const routeApi = {
  search: (payload) => api.post('/routes/search', payload).then((r) => r.data),
  get: (id) => api.get(`/routes/${id}`).then((r) => r.data),
  history: () => api.get('/routes/history').then((r) => r.data),
  chat: (id, question) => api.post(`/routes/${id}/chat`, { question }).then((r) => r.data),
  favorite: (id, routeOptionId, note) =>
    api.post(`/routes/${id}/favorite`, { routeOptionId, note }).then((r) => r.data),
  listFavorites: () => api.get('/routes/favorites').then((r) => r.data),
};

export default api;
