import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, AuthState, LoginCredentials, RegisterData, AuthResponse } from '@/types/auth'
import { authService } from '@/services/auth'
import { supabase } from '@/lib/supabase'
import { useNotificationsStore } from '@/stores/notifications'

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
  const mustChangePassword = computed(() => !!user.value?.must_change_password)

  // Actions
  const setAuth = (authData: AuthResponse) => {
    user.value = authData.user
    token.value = authData.access_token

    // Persistir en localStorage
    localStorage.setItem('auth_token', authData.access_token)
    localStorage.setItem('user_data', JSON.stringify(authData.user))

    // Autenticar el cliente Supabase Realtime con el JWT del usuario
    supabase.realtime.setAuth(authData.access_token)

    // Cargar las notificaciones propias del usuario (segregadas por ID)
    useNotificationsStore().initForUser(authData.user.id)
  }

  const clearAuth = () => {
    // Limpiar notificaciones de memoria antes de borrar el usuario
    useNotificationsStore().clearSession()

    user.value = null
    token.value = null
    error.value = null

    // Limpiar localStorage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')

    // Desautenticar Realtime
    supabase.realtime.setAuth(null)
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

  // In-flight deduplication: if a request is already pending, reuse it
  let _currentUserPromise: Promise<any> | null = null

  const getCurrentUser = async () => {
    if (!token.value) return null
    if (_currentUserPromise) return _currentUserPromise

    isLoading.value = true
    _currentUserPromise = authService.getCurrentUser()
      .then(userData => {
        user.value = userData
        return userData
      })
      .catch((err: any) => {
        if (err.response?.status === 401) clearAuth()
        throw err
      })
      .finally(() => {
        isLoading.value = false
        _currentUserPromise = null
      })

    return _currentUserPromise
  }

  const changePassword = async (newPassword: string) => {
    isLoading.value = true
    error.value = null

    try {
      await authService.changePassword(newPassword)
      // Limpiar el flag localmente y en localStorage
      if (user.value) {
        user.value = { ...user.value, must_change_password: false }
        localStorage.setItem('user_data', JSON.stringify(user.value))
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail?.message || err.response?.data?.detail || 'Error al cambiar la contraseña'
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

        // Autenticar Realtime con el token guardado
        supabase.realtime.setAuth(savedToken)

        // Cargar las notificaciones del usuario que tenía sesión activa
        if (user.value) {
          useNotificationsStore().initForUser(user.value.id)
        }

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
    mustChangePassword,

    // Actions
    setAuth,
    clearAuth,
    login,
    register,
    logout,
    getCurrentUser,
    changePassword,
    requestPasswordReset,
    validateRole,
    initializeAuth,
    clearError
  }
})