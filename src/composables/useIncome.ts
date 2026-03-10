import { ref, computed, type ComputedRef } from 'vue'
import { incomeService } from '@/services/income'
import type {
  IncomeRecord,
  IncomeCategory,
  CreateIncomeRequest,
  UpdateIncomeRequest,
  IncomeFilters,
  IncomeListResponse,
  IncomeStatsResponse
} from '@/services/income'

interface UseIncomeReturn {
  // State
  incomeRecords: ComputedRef<IncomeRecord[]>
  incomeCategories: ComputedRef<IncomeCategory[]>
  incomeStats: ComputedRef<IncomeStatsResponse | null>
  loading: ComputedRef<boolean>
  error: ComputedRef<string | null>

  // Pagination and filtering
  currentPage: ComputedRef<number>
  totalRecords: ComputedRef<number>
  totalPages: ComputedRef<number>

  // Methods
  createIncome: (data: CreateIncomeRequest) => Promise<IncomeRecord>
  updateIncome: (id: number, data: UpdateIncomeRequest) => Promise<IncomeRecord>
  deleteIncome: (id: number) => Promise<void>
  fetchIncomeRecords: (filters?: IncomeFilters) => Promise<void>
  fetchIncomeStats: (filters?: any) => Promise<void>
  fetchCategories: () => Promise<void>
  createCategory: (name: string, description?: string) => Promise<IncomeCategory>
  clearError: () => void
  refreshData: () => Promise<void>
}

const incomeRecords = ref<IncomeRecord[]>([])
const incomeCategories = ref<IncomeCategory[]>([])
const incomeStats = ref<IncomeStatsResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Pagination state
const currentPage = ref(1)
const totalRecords = ref(0)
const limit = ref(10)

export function useIncome(): UseIncomeReturn {
  const totalPages = computed(() => {
    return Math.ceil(totalRecords.value / limit.value)
  })

  const clearError = () => {
    error.value = null
  }

  const handleError = (err: any) => {
    console.error('Income operation error:', err)
    error.value = err.response?.data?.message || err.message || 'Error desconocido'
  }

  // Fetch income records
  const fetchIncomeRecords = async (filters?: IncomeFilters) => {
    try {
      loading.value = true
      error.value = null

      const params = {
        ...filters,
        page: currentPage.value,
        limit: limit.value,
        sort_by: 'date',
        sort_direction: 'desc' as 'desc'
      }

      const response: IncomeListResponse = await incomeService.getIncomeRecords(params)

      incomeRecords.value = response.records
      totalRecords.value = response.total

    } catch (err) {
      handleError(err)
      incomeRecords.value = []
    } finally {
      loading.value = false
    }
  }

  // Fetch income categories
  const fetchCategories = async () => {
    try {
      const categories = await incomeService.getIncomeCategories()
      incomeCategories.value = categories
    } catch (err) {
      handleError(err)
      incomeCategories.value = []
    }
  }

  // Fetch income statistics
  const fetchIncomeStats = async (filters?: any) => {
    try {
      const stats = await incomeService.getIncomeStats(filters)
      incomeStats.value = stats
    } catch (err) {
      handleError(err)
      incomeStats.value = null
    }
  }

  // Create new income record
  const createIncome = async (data: CreateIncomeRequest): Promise<IncomeRecord> => {
    try {
      loading.value = true
      error.value = null

      const newRecord = await incomeService.createIncome(data)

      // Add to the beginning of the list
      incomeRecords.value.unshift(newRecord)
      totalRecords.value += 1

      // Refresh stats
      await fetchIncomeStats()

      return newRecord
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update income record
  const updateIncome = async (id: number, data: UpdateIncomeRequest): Promise<IncomeRecord> => {
    try {
      loading.value = true
      error.value = null

      const updatedRecord = await incomeService.updateIncome(id, data)

      // Update in the list
      const index = incomeRecords.value.findIndex(record => record.id === id)
      if (index !== -1) {
        incomeRecords.value[index] = updatedRecord
      }

      // Refresh stats
      await fetchIncomeStats()

      return updatedRecord
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete income record
  const deleteIncome = async (id: number): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      await incomeService.deleteIncome(id)

      // Remove from the list
      incomeRecords.value = incomeRecords.value.filter(record => record.id !== id)
      totalRecords.value -= 1

      // Refresh stats
      await fetchIncomeStats()

    } catch (err) {
      handleError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create new category
  const createCategory = async (name: string, description?: string): Promise<IncomeCategory> => {
    try {
      const newCategory = await incomeService.createIncomeCategory({
        name,
        description
      })

      // Add to categories list
      incomeCategories.value.push(newCategory)

      return newCategory
    } catch (err) {
      handleError(err)
      throw err
    }
  }

  // Refresh all data
  const refreshData = async () => {
    await Promise.all([
      fetchIncomeRecords(),
      fetchCategories(),
      fetchIncomeStats()
    ])
  }

  return {
    // State
    incomeRecords: computed(() => incomeRecords.value),
    incomeCategories: computed(() => incomeCategories.value),
    incomeStats: computed(() => incomeStats.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),

    // Pagination
    currentPage: computed(() => currentPage.value),
    totalRecords: computed(() => totalRecords.value),
    totalPages,

    // Methods
    createIncome,
    updateIncome,
    deleteIncome,
    fetchIncomeRecords,
    fetchIncomeStats,
    fetchCategories,
    createCategory,
    clearError,
    refreshData
  }
}