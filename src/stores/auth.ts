import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, AuthState, LoginCredentials, RegisterData, AuthResponse } from '@/types/auth'
import { authService } from '@/services/auth'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userRole = computed(() => user.value?.role)
  const isManager = computed(() => user.value?.role === 'manager')
  const isEmployee = computed(() => user.value?.role === 'employee')
  const isSponsor = computed(() => user.value?.role === 'sponsor')

  // Actions
  const setAuth = (authData: AuthResponse) => {
    user.value = authData.user
    token.value = authData.access_token

    // Persistir en localStorage
    localStorage.setItem('auth_token', authData.access_token)
    localStorage.setItem('user_data', JSON.stringify(authData.user))
  }

  const clearAuth = () => {
    user.value = null
    token.value = null
    error.value = null

    // Limpiar localStorage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
  }

  const login = async (credentials: LoginCredentials) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await authService.login(credentials)
      setAuth(response)
      return response
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al iniciar sesión'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const register = async (data: RegisterData) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await authService.register(data)
      setAuth(response)
      return response
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al registrarse'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    isLoading.value = true

    try {
      await authService.logout()
    } catch (err: any) {
      console.error('Error al cerrar sesión:', err)
    } finally {
      clearAuth()
      isLoading.value = false
    }
  }

  const getCurrentUser = async () => {
    if (!token.value) return null

    isLoading.value = true

    try {
      const userData = await authService.getCurrentUser()
      user.value = userData
      return userData
    } catch (err: any) {
      if (err.response?.status === 401) {
        clearAuth()
      }
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const requestPasswordReset = async (email: string) => {
    isLoading.value = true
    error.value = null

    try {
      await authService.requestPasswordReset(email)
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al solicitar reseteo de contraseña'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const validateRole = async (role: 'manager' | 'employee' | 'sponsor') => {
    try {
      const response = await authService.validateRole(role)
      return response
    } catch (err: any) {
      throw err
    }
  }

  const initializeAuth = () => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('user_data')

    if (savedToken && savedUser) {
      try {
        token.value = savedToken
        user.value = JSON.parse(savedUser)

        // Validar token en background
        getCurrentUser().catch(() => {
          clearAuth()
        })
      } catch (err) {
        clearAuth()
      }
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    user,
    token,
    isLoading,
    error,

    // Getters
    isAuthenticated,
    userRole,
    isManager,
    isEmployee,
    isSponsor,

    // Actions
    setAuth,
    clearAuth,
    login,
    register,
    logout,
    getCurrentUser,
    requestPasswordReset,
    validateRole,
    initializeAuth,
    clearError
  }
})