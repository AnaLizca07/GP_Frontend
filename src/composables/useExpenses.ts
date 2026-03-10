import { ref, computed, type ComputedRef } from 'vue'
import { expenseService } from '@/services/expenses'
import type {
  ExpenseRecord,
  ExpenseCategory,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseFilters,
  ExpenseListResponse,
  ExpenseStatsResponse
} from '@/services/expenses'

interface UseExpensesReturn {
  // State
  expenseRecords: ComputedRef<ExpenseRecord[]>
  expenseCategories: ComputedRef<ExpenseCategory[]>
  expenseStats: ComputedRef<ExpenseStatsResponse | null>
  loading: ComputedRef<boolean>
  error: ComputedRef<string | null>

  // Pagination and filtering
  currentPage: ComputedRef<number>
  totalRecords: ComputedRef<number>
  totalPages: ComputedRef<number>

  // Methods
  createExpense: (data: CreateExpenseRequest) => Promise<ExpenseRecord>
  updateExpense: (id: number, data: UpdateExpenseRequest) => Promise<ExpenseRecord>
  deleteExpense: (id: number) => Promise<void>
  fetchExpenseRecords: (filters?: ExpenseFilters) => Promise<void>
  fetchExpenseStats: (filters?: any) => Promise<void>
  fetchCategories: () => Promise<void>
  createCategory: (name: string, description?: string) => Promise<ExpenseCategory>
  clearError: () => void
  refreshData: () => Promise<void>
}

const expenseRecords = ref<ExpenseRecord[]>([])
const expenseCategories = ref<ExpenseCategory[]>([])
const expenseStats = ref<ExpenseStatsResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Pagination state
const currentPage = ref(1)
const totalRecords = ref(0)
const limit = ref(10)

export function useExpenses(): UseExpensesReturn {
  const totalPages = computed(() => {
    return Math.ceil(totalRecords.value / limit.value)
  })

  const clearError = () => {
    error.value = null
  }

  const handleError = (err: any) => {
    console.error('Expense operation error:', err)
    error.value = err.response?.data?.message || err.message || 'Error desconocido'
  }

  // Fetch expense records
  const fetchExpenseRecords = async (filters?: ExpenseFilters) => {
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

      const response: ExpenseListResponse = await expenseService.getExpenseRecords(params)

      expenseRecords.value = response.records
      totalRecords.value = response.total

    } catch (err) {
      handleError(err)
      expenseRecords.value = []
    } finally {
      loading.value = false
    }
  }

  // Fetch expense categories
  const fetchCategories = async () => {
    try {
      const categories = await expenseService.getExpenseCategories()
      expenseCategories.value = categories
    } catch (err) {
      handleError(err)
      expenseCategories.value = []
    }
  }

  // Fetch expense statistics
  const fetchExpenseStats = async (filters?: any) => {
    try {
      const stats = await expenseService.getExpenseStats(filters)
      expenseStats.value = stats
    } catch (err) {
      handleError(err)
      expenseStats.value = null
    }
  }

  // Create new expense record
  const createExpense = async (data: CreateExpenseRequest): Promise<ExpenseRecord> => {
    try {
      loading.value = true
      error.value = null

      const newRecord = await expenseService.createExpense(data)

      // Add to the beginning of the list
      expenseRecords.value.unshift(newRecord)
      totalRecords.value += 1

      // Refresh stats
      await fetchExpenseStats()

      return newRecord
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update expense record
  const updateExpense = async (id: number, data: UpdateExpenseRequest): Promise<ExpenseRecord> => {
    try {
      loading.value = true
      error.value = null

      const updatedRecord = await expenseService.updateExpense(id, data)

      // Update in the list
      const index = expenseRecords.value.findIndex(record => record.id === id)
      if (index !== -1) {
        expenseRecords.value[index] = updatedRecord
      }

      // Refresh stats
      await fetchExpenseStats()

      return updatedRecord
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete expense record
  const deleteExpense = async (id: number): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      await expenseService.deleteExpense(id)

      // Remove from the list
      expenseRecords.value = expenseRecords.value.filter(record => record.id !== id)
      totalRecords.value -= 1

      // Refresh stats
      await fetchExpenseStats()

    } catch (err) {
      handleError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create new category
  const createCategory = async (name: string, description?: string): Promise<ExpenseCategory> => {
    try {
      const newCategory = await expenseService.createExpenseCategory({
        name,
        description
      })

      // Add to categories list
      expenseCategories.value.push(newCategory)

      return newCategory
    } catch (err) {
      handleError(err)
      throw err
    }
  }

  // Refresh all data
  const refreshData = async () => {
    await Promise.all([
      fetchExpenseRecords(),
      fetchCategories(),
      fetchExpenseStats()
    ])
  }

  return {
    // State
    expenseRecords: computed(() => expenseRecords.value),
    expenseCategories: computed(() => expenseCategories.value),
    expenseStats: computed(() => expenseStats.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),

    // Pagination
    currentPage: computed(() => currentPage.value),
    totalRecords: computed(() => totalRecords.value),
    totalPages,

    // Methods
    createExpense,
    updateExpense,
    deleteExpense,
    fetchExpenseRecords,
    fetchExpenseStats,
    fetchCategories,
    createCategory,
    clearError,
    refreshData
  }
}