import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Request interceptor para agregar token de autorización
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Token expirado o inválido - limpiar auth
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')

      // Redirigir al login si estamos en el frontend
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }

      return Promise.reject(error)
    }

    // Rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after']
      if (retryAfter) {
        console.warn(`Rate limited. Retry after ${retryAfter} seconds`)
      }
    }

    return Promise.reject(error)
  }
)

export default api