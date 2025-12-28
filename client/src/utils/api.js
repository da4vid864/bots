import axios from 'axios';

// Create a shared Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/',
  withCredentials: true,
});

export default api;