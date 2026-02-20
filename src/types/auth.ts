export interface User {
  id: string
  email: string
  role: 'manager' | 'employee' | 'sponsor'
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  role: 'manager' | 'employee' | 'sponsor'
}

export interface EmployeeProfile {
  id?: string
  user_id: string
  name: string
  identification: string
  position?: string
  phone?: string
  address?: string
  salary_type?: 'hourly' | 'biweekly' | 'monthly'
  salary_hourly?: number
  salary_biweekly?: number
  salary_monthly?: number
  resume_url?: string
  status?: 'active' | 'inactive'
  created_at?: string
  updated_at?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}