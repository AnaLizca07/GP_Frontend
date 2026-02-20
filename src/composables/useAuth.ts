import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import type { LoginCredentials, RegisterData } from '@/types/auth'

export const useAuth = () => {
  const authStore = useAuthStore()

  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    userRole,
    isManager,
    isEmployee,
    isSponsor
  } = storeToRefs(authStore)

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authStore.login(credentials)
      return response
    } catch (error) {
      throw error
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const response = await authStore.register(data)
      return response
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    await authStore.logout()
  }

  const requestPasswordReset = async (email: string) => {
    try {
      await authStore.requestPasswordReset(email)
    } catch (error) {
      throw error
    }
  }

  const refreshUser = async () => {
    try {
      const userData = await authStore.getCurrentUser()
      return userData
    } catch (error) {
      throw error
    }
  }

  const hasRole = (role: 'manager' | 'employee' | 'sponsor') => {
    return userRole.value === role
  }

  const hasAnyRole = (roles: Array<'manager' | 'employee' | 'sponsor'>) => {
    return userRole.value ? roles.includes(userRole.value) : false
  }

  const validateRole = async (role: 'manager' | 'employee' | 'sponsor') => {
    try {
      const response = await authStore.validateRole(role)
      return response
    } catch (error) {
      throw error
    }
  }

  const clearError = () => {
    authStore.clearError()
  }

  const initialize = () => {
    authStore.initializeAuth()
  }

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    userRole,
    isManager,
    isEmployee,
    isSponsor,

    // Actions
    login,
    register,
    logout,
    requestPasswordReset,
    refreshUser,
    hasRole,
    hasAnyRole,
    validateRole,
    clearError,
    initialize
  }
}