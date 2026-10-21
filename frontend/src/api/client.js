import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true, // Send HTTP-only session cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error unpacking
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorData = error.response?.data || {
      success: false,
      message: error.message || 'An unexpected network error occurred.',
      code: 'NETWORK_ERROR',
    };
    return Promise.reject(errorData);
  }
);

export default api;
