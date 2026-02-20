import api from './api'
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
  EmployeeProfile
} from '@/types/auth'

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post('/api/auth/login', credentials)
    return data
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const { data: response } = await api.post('/api/auth/register', data)
    return response
  },

  async getCurrentUser(): Promise<User> {
    const { data } = await api.get('/api/auth/me')
    return data
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/logout')
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const { data } = await api.post('/api/auth/password-reset', { email })
    return data
  },

  async validateRole(role: 'manager' | 'employee' | 'sponsor'): Promise<{
    message: string
    role: string
    user_id: string
  }> {
    const { data } = await api.get(`/api/auth/validate-${role}`)
    return data
  },

  async createEmployeeProfile(profile: EmployeeProfile): Promise<EmployeeProfile> {
    const { data } = await api.post('/api/auth/employee-profile', profile)
    return data
  },

  async getRateLimitStatus(): Promise<{
    status: string
    rate_limiting: any
  }> {
    const { data } = await api.get('/api/auth/rate-limit-status')
    return data
  },

  async healthCheck(): Promise<{ message: string }> {
    const { data } = await api.get('/')
    return data
  }
}