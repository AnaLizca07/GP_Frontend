import api from './api'

export interface PayrollCalculation {
  employee_id: number
  employee_name: string
  employee_identification: string
  employee_type: 'employee' | 'contractor'
  pay_period: 'weekly' | 'biweekly' | 'monthly'
  period_start: string
  period_end: string
  base_salary: number
  worked_hours: number | null
  hourly_rate: number | null
  additional_income: number
  gross_income: number
  social_security_deductions: {
    health: number
    pension: number
    solidarity_fund: number
    total: number
  }
  employer_contributions: {
    health: number
    pension: number
    arl: number
    family_compensation: number
    icbf: number
    sena: number
    total: number
  }
  benefits: {
    vacation_days: number
    vacation_amount: number
    severance: number
    severance_interest: number
    service_bonus: number
    total_benefits: number
  }
  special_deductions: number
  total_deductions: number
  net_salary: number
  employer_cost: number
  calculation_date: string
  risk_level: string
  current_minimum_wage: number
}

export interface PayrollCalculationRequest {
  employee_id: number
  pay_period: 'weekly' | 'biweekly' | 'monthly'
  period_start: string
  period_end: string
  worked_hours?: number
  base_salary?: number
  additional_income?: number
  deductions?: number
  risk_level?: 'I' | 'II' | 'III' | 'IV' | 'V'
}

export interface PayrollRecord {
  id: number
  employee_id: number
  employee_name: string
  period_start: string
  period_end: string
  base_salary: number
  deductions: any
  employer_contributions: any
  benefits: any
  net_pay: number
  status: 'pending' | 'processed' | 'paid'
  receipt_url: string | null
  created_at: string
  paid_at: string | null
}

export interface PayrollHistoryResponse {
  employee_id: number
  filters: {
    year?: number
    month?: number
  }
  pagination: {
    page: number
    limit: number
    total_records: number
  }
  payroll_records: PayrollRecord[]
  summary: {
    total_records: number
    total_base_salary: number
    total_deductions: number
    total_net_pay: number
  }
}

export interface PayrollConfig {
  health_employee: number
  health_employer: number
  pension_employee: number
  pension_employer: number
  solidarity_fund: number
  family_compensation: number
  icbf: number
  sena: number
  arl_rates: {
    I: number
    II: number
    III: number
    IV: number
    V: number
  }
  contractor_health: number
  contractor_pension: number
  contractor_base_percentage: number
}

export const payrollService = {
  async calculatePayroll(request: PayrollCalculationRequest): Promise<PayrollCalculation> {
    const { data } = await api.post('/api/payroll/calculate', request)
    return data
  },

  async calculateBulkPayroll(request: {
    employee_ids: number[]
    pay_period: 'weekly' | 'biweekly' | 'monthly'
    period_start: string
    period_end: string
    risk_level?: 'I' | 'II' | 'III' | 'IV' | 'V'
  }): Promise<{
    successful_calculations: number
    errors: number
    results: PayrollCalculation[]
    error_details: Array<{
      employee_id: number
      error: string
    }>
  }> {
    const { data } = await api.post('/api/payroll/calculate/bulk', request)
    return data
  },

  async getCalculationSummary(
    employeeId: number,
    params: {
      pay_period: 'weekly' | 'biweekly' | 'monthly'
      period_start: string
      period_end: string
    }
  ): Promise<PayrollCalculation> {
    const { data } = await api.get(`/api/payroll/calculation/${employeeId}/summary`, { params })
    return data
  },

  async getEmployeeBreakdown(
    employeeId: number,
    params: {
      monthly_salary: number
      risk_level: 'I' | 'II' | 'III' | 'IV' | 'V'
    }
  ): Promise<any> {
    const { data } = await api.get(`/api/payroll/employee/${employeeId}/breakdown`, { params })
    return data
  },

  async getContractorBreakdown(
    employeeId: number,
    params: {
      fees_amount: number
    }
  ): Promise<any> {
    const { data } = await api.get(`/api/payroll/contractor/${employeeId}/breakdown`, { params })
    return data
  },

  async processPayroll(request: {
    employee_id: number
    pay_period: 'weekly' | 'biweekly' | 'monthly'
    period_start: string
    period_end: string
    project_id?: number
  }): Promise<PayrollRecord> {
    const { data } = await api.post('/api/payroll/process', request)
    return data
  },

  async generateVoucher(
    employeeId: number,
    params: {
      pay_period: 'weekly' | 'biweekly' | 'monthly'
      period_start: string
      period_end: string
    }
  ): Promise<any> {
    const { data } = await api.get(`/api/payroll/voucher/${employeeId}`, { params })
    return data
  },

  async getEmployeeHistory(
    employeeId: number,
    params?: {
      year?: number
      month?: number
      page?: number
      limit?: number
    }
  ): Promise<PayrollHistoryResponse> {
    const { data } = await api.get(`/api/payroll/employee/${employeeId}/history`, { params })
    return data
  },

  async getPayrollRecord(payrollId: number): Promise<PayrollRecord> {
    const { data } = await api.get(`/api/payroll/records/${payrollId}`)
    return data
  },

  async markAsPaid(payrollId: number, receiptUrl?: string): Promise<{
    message: string
    payroll_id: number
    receipt_url?: string
  }> {
    const { data } = await api.put(`/api/payroll/records/${payrollId}/mark-as-paid`, {
      receipt_url: receiptUrl
    })
    return data
  },

  async getAllPayrollRecords(params?: {
    status_filter?: 'pending' | 'processed' | 'paid'
    year?: number
    month?: number
    page?: number
    limit?: number
  }): Promise<{
    records: PayrollRecord[]
    total: number
    page: number
    limit: number
  }> {
    const { data } = await api.get('/api/payroll/records', { params })
    return data
  },

  async getPeriodSummary(params: {
    period_start: string
    period_end: string
  }): Promise<any> {
    const { data } = await api.get('/api/payroll/summary/period', { params })
    return data
  },

  async deletePayrollRecord(payrollId: number): Promise<{ message: string }> {
    const { data } = await api.delete(`/api/payroll/records/${payrollId}`)
    return data
  },

  async getConfig(): Promise<PayrollConfig> {
    const { data } = await api.get('/api/payroll/config')
    return data
  },

  async updateConfig(config: Partial<PayrollConfig>): Promise<{ message: string }> {
    const { data } = await api.put('/api/payroll/config', config)
    return data
  },

  async updateMinimumWage(params: {
    amount: number
    effective_date?: string
  }): Promise<{
    message: string
    amount: number
    effective_date: string
    previous_amount: number
  }> {
    const { data } = await api.put('/api/payroll/minimum-wage', params)
    return data
  }
}