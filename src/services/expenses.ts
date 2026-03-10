import api from './api'

export interface ExpenseRecord {
  id: number
  concept: string
  amount: number
  date: string
  category_id: number | null
  category_name: string | null
  new_category?: string
  origin: string
  project_id: number | null
  project_name: string | null
  description?: string
  created_at: string
  updated_at: string
}

export interface ExpenseCategory {
  id: number
  name: string
  description?: string
  color?: string
  created_at: string
  updated_at: string
}

export interface CreateExpenseRequest {
  concept: string
  amount: number
  date: string
  category_id?: number
  new_category?: string
  origin: string
  project_id?: number
  description?: string
}

export interface UpdateExpenseRequest {
  concept?: string
  amount?: number
  date?: string
  category_id?: number
  origin?: string
  project_id?: number
  description?: string
}

export interface ExpenseFilters {
  start_date?: string
  end_date?: string
  category_id?: number
  project_id?: number
  min_amount?: number
  max_amount?: number
  origin?: string
  search?: string
}

export interface ExpenseListResponse {
  records: ExpenseRecord[]
  total: number
  page: number
  limit: number
  total_amount: number
  categories_summary: Array<{
    category_id: number
    category_name: string
    total_amount: number
    record_count: number
  }>
}

export interface ExpenseStatsResponse {
  total_expenses: number
  current_month: number
  previous_month: number
  month_growth: number
  average_transaction: number
  transaction_count: number
  top_categories: Array<{
    category_name: string
    total_amount: number
    percentage: number
  }>
  monthly_trend: Array<{
    month: string
    amount: number
    transaction_count: number
  }>
}

export const expenseService = {
  // Expense Records
  async createExpense(request: CreateExpenseRequest): Promise<ExpenseRecord> {
    const { data } = await api.post('/api/finance/expenses', request)
    return data
  },

  async getExpenseRecords(params?: ExpenseFilters & {
    page?: number
    limit?: number
    sort_by?: string
    sort_direction?: 'asc' | 'desc'
  }): Promise<ExpenseListResponse> {
    const { data } = await api.get('/api/finance/expenses', { params })
    return data
  },

  async getExpenseRecord(id: number): Promise<ExpenseRecord> {
    const { data } = await api.get(`/api/finance/expenses/${id}`)
    return data
  },

  async updateExpense(id: number, request: UpdateExpenseRequest): Promise<ExpenseRecord> {
    const { data } = await api.put(`/api/finance/expenses/${id}`, request)
    return data
  },

  async deleteExpense(id: number): Promise<{ message: string }> {
    const { data } = await api.delete(`/api/finance/expenses/${id}`)
    return data
  },

  // Expense Categories
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    const { data } = await api.get('/api/finance/expenses/categories')
    return data
  },

  async createExpenseCategory(request: {
    name: string
    description?: string
    color?: string
  }): Promise<ExpenseCategory> {
    const { data } = await api.post('/api/finance/expenses/categories', request)
    return data
  },

  async updateExpenseCategory(id: number, request: {
    name?: string
    description?: string
    color?: string
  }): Promise<ExpenseCategory> {
    const { data } = await api.put(`/api/finance/expenses/categories/${id}`, request)
    return data
  },

  async deleteExpenseCategory(id: number): Promise<{ message: string }> {
    const { data } = await api.delete(`/api/finance/expenses/categories/${id}`)
    return data
  },

  // Statistics and Analytics
  async getExpenseStats(params?: {
    start_date?: string
    end_date?: string
    category_id?: number
    project_id?: number
  }): Promise<ExpenseStatsResponse> {
    const { data } = await api.get('/api/finance/expenses/stats', { params })
    return data
  },

  async getMonthlyExpenses(params?: {
    year?: number
    months?: number
  }): Promise<Array<{
    month: string
    amount: number
    transaction_count: number
    categories: Array<{
      category_name: string
      amount: number
    }>
  }>> {
    const { data } = await api.get('/api/finance/expenses/monthly', { params })
    return data
  },

  async exportExpenseData(params?: ExpenseFilters & {
    format?: 'csv' | 'xlsx' | 'pdf'
    include_categories?: boolean
  }): Promise<{
    download_url: string
    filename: string
    format: string
  }> {
    const { data } = await api.post('/api/finance/expenses/export', params)
    return data
  }
}