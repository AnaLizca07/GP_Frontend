import api from './api'

export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: number
  type: TransactionType
  amount: number
  category: string
  description: string
  project_id?: number
  transaction_date: string
  created_at: string
}

export interface TransactionCreate {
  type: TransactionType
  amount: number
  category: string
  description: string
  project_id?: number
  transaction_date: string
}

export interface FinanceSummary {
  total_income: number
  total_expense: number
  balance: number
  income_count: number
  expense_count: number
}

const financeService = {
  async getTransactions(type?: TransactionType): Promise<Transaction[]> {
    const { data } = await api.get('/api/finance/transactions/', {
      params: type ? { type } : {},
    })
    return data
  },

  async createTransaction(txData: TransactionCreate): Promise<Transaction> {
    const { data } = await api.post('/api/finance/transactions/', txData)
    return data
  },

  async deleteTransaction(id: number): Promise<void> {
    await api.delete(`/api/finance/transactions/${id}`)
  },

  async getSummary(): Promise<FinanceSummary> {
    const { data } = await api.get('/api/finance/summary/')
    return data
  },
}

export default financeService
