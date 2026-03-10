import { ref } from 'vue'
import { payrollService, type PayrollCalculation, type PayrollCalculationRequest, type PayrollRecord } from '@/services/payroll'

export function usePayroll() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const calculation = ref<PayrollCalculation | null>(null)
  const payrollRecords = ref<PayrollRecord[]>([])

  // Actions
  const calculatePayroll = async (request: PayrollCalculationRequest): Promise<PayrollCalculation> => {
    loading.value = true
    error.value = null

    try {
      const result = await payrollService.calculatePayroll(request)
      calculation.value = result
      return result
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al calcular nómina'
      throw err
    } finally {
      loading.value = false
    }
  }

  const calculateBulkPayroll = async (request: {
    employee_ids: number[]
    pay_period: 'weekly' | 'biweekly' | 'monthly'
    period_start: string
    period_end: string
    risk_level?: 'I' | 'II' | 'III' | 'IV' | 'V'
  }) => {
    loading.value = true
    error.value = null

    try {
      return await payrollService.calculateBulkPayroll(request)
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al calcular nóminas masivas'
      throw err
    } finally {
      loading.value = false
    }
  }

  const processPayroll = async (request: {
    employee_id: number
    pay_period: 'weekly' | 'biweekly' | 'monthly'
    period_start: string
    period_end: string
    project_id?: number
  }): Promise<PayrollRecord> => {
    loading.value = true
    error.value = null

    try {
      const record = await payrollService.processPayroll(request)
      payrollRecords.value.unshift(record)
      return record
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al procesar nómina'
      throw err
    } finally {
      loading.value = false
    }
  }

  const generateVoucher = async (
    employeeId: number,
    params: {
      pay_period: 'weekly' | 'biweekly' | 'monthly'
      period_start: string
      period_end: string
    }
  ) => {
    loading.value = true
    error.value = null

    try {
      return await payrollService.generateVoucher(employeeId, params)
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al generar comprobante'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getEmployeeHistory = async (
    employeeId: number,
    params?: {
      year?: number
      month?: number
      page?: number
      limit?: number
    }
  ) => {
    loading.value = true
    error.value = null

    try {
      return await payrollService.getEmployeeHistory(employeeId, params)
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al cargar historial'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getAllPayrollRecords = async (params?: {
    status_filter?: 'pending' | 'processed' | 'paid'
    year?: number
    month?: number
    page?: number
    limit?: number
  }) => {
    loading.value = true
    error.value = null

    try {
      const response = await payrollService.getAllPayrollRecords(params)
      payrollRecords.value = response.records
      return response
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al cargar registros de nómina'
      throw err
    } finally {
      loading.value = false
    }
  }

  const markAsPaid = async (payrollId: number, receiptUrl?: string) => {
    loading.value = true
    error.value = null

    try {
      const result = await payrollService.markAsPaid(payrollId, receiptUrl)
      const index = payrollRecords.value.findIndex(record => record.id === payrollId)
      if (index !== -1) {
        payrollRecords.value[index].status = 'paid'
        if (receiptUrl) {
          payrollRecords.value[index].receipt_url = receiptUrl
        }
      }
      return result
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al marcar como pagado'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getPeriodSummary = async (params: {
    period_start: string
    period_end: string
  }) => {
    loading.value = true
    error.value = null

    try {
      return await payrollService.getPeriodSummary(params)
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al cargar resumen del período'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getPayrollConfig = async () => {
    loading.value = true
    error.value = null

    try {
      return await payrollService.getConfig()
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al cargar configuración'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateMinimumWage = async (params: {
    amount: number
    effective_date?: string
  }) => {
    loading.value = true
    error.value = null

    try {
      return await payrollService.updateMinimumWage(params)
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al actualizar salario mínimo'
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    loading,
    error,
    calculation,
    payrollRecords,

    // Actions
    calculatePayroll,
    calculateBulkPayroll,
    processPayroll,
    generateVoucher,
    getEmployeeHistory,
    getAllPayrollRecords,
    markAsPaid,
    getPeriodSummary,
    getPayrollConfig,
    updateMinimumWage,
    clearError
  }
}