import api from './api'

export interface IncomeRecord {
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

export interface IncomeCategory {
  id: number
  name: string
  description?: string
  color?: string
  created_at: string
  updated_at: string
}

export interface CreateIncomeRequest {
  concept: string
  amount: number
  date: string
  category_id?: number
  new_category?: string
  origin: string
  project_id?: number
  description?: string
}

export interface UpdateIncomeRequest {
  concept?: string
  amount?: number
  date?: string
  category_id?: number
  origin?: string
  project_id?: number
  description?: string
}

export interface IncomeFilters {
  start_date?: string
  end_date?: string
  category_id?: number
  project_id?: number
  min_amount?: number
  max_amount?: number
  origin?: string
  search?: string
}

export interface IncomeListResponse {
  records: IncomeRecord[]
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

export interface IncomeStatsResponse {
  total_income: number
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

export const incomeService = {
  // Income Records
  async createIncome(request: CreateIncomeRequest): Promise<IncomeRecord> {
    const { data } = await api.post('/api/finance/income', request)
    return data
  },

  async getIncomeRecords(params?: IncomeFilters & {
    page?: number
    limit?: number
    sort_by?: string
    sort_direction?: 'asc' | 'desc'
  }): Promise<IncomeListResponse> {
    const { data } = await api.get('/api/finance/income', { params })
    return data
  },

  async getIncomeRecord(id: number): Promise<IncomeRecord> {
    const { data } = await api.get(`/api/finance/income/${id}`)
    return data
  },

  async updateIncome(id: number, request: UpdateIncomeRequest): Promise<IncomeRecord> {
    const { data } = await api.put(`/api/finance/income/${id}`, request)
    return data
  },

  async deleteIncome(id: number): Promise<{ message: string }> {
    const { data } = await api.delete(`/api/finance/income/${id}`)
    return data
  },

  // Income Categories
  async getIncomeCategories(): Promise<IncomeCategory[]> {
    const { data } = await api.get('/api/finance/income/categories')
    return data
  },

  async createIncomeCategory(request: {
    name: string
    description?: string
    color?: string
  }): Promise<IncomeCategory> {
    const { data } = await api.post('/api/finance/income/categories', request)
    return data
  },

  async updateIncomeCategory(id: number, request: {
    name?: string
    description?: string
    color?: string
  }): Promise<IncomeCategory> {
    const { data } = await api.put(`/api/finance/income/categories/${id}`, request)
    return data
  },

  async deleteIncomeCategory(id: number): Promise<{ message: string }> {
    const { data } = await api.delete(`/api/finance/income/categories/${id}`)
    return data
  },

  // Statistics and Analytics
  async getIncomeStats(params?: {
    start_date?: string
    end_date?: string
    category_id?: number
    project_id?: number
  }): Promise<IncomeStatsResponse> {
    const { data } = await api.get('/api/finance/income/stats', { params })
    return data
  },

  async getMonthlyIncome(params?: {
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
    const { data } = await api.get('/api/finance/income/monthly', { params })
    return data
  },

  async exportIncomeData(params?: IncomeFilters & {
    format?: 'csv' | 'xlsx' | 'pdf'
    include_categories?: boolean
  }): Promise<{
    download_url: string
    filename: string
    format: string
  }> {
    const { data } = await api.post('/api/finance/income/export', params)
    return data
  }
}