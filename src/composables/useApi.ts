import { ref } from 'vue'
import { authService } from '@/services/auth'

export const useApi = () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const execute = async <T>(apiCall: () => Promise<T>): Promise<T> => {
    isLoading.value = true
    error.value = null

    try {
      const result = await apiCall()
      return result
    } catch (err: any) {
      error.value = err.response?.data?.detail || err.message || 'Error desconocido'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    isLoading,
    error,
    execute,
    clearError,
    authService
  }
}