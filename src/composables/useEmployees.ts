import { ref, computed } from 'vue'
import { employeeService, type Employee, type CreateEmployeeData, type UpdateEmployeeData } from '@/services/employees'

export function useEmployees() {
  const employees = ref<Employee[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const currentPage = ref(1)
  const itemsPerPage = ref(50)

  // Getters
  const activeEmployees = computed(() =>
    employees.value.filter(emp => emp.status === 'active')
  )

  const inactiveEmployees = computed(() =>
    employees.value.filter(emp => emp.status === 'inactive')
  )

  // Actions
  const fetchEmployees = async (params?: {
    page?: number
    limit?: number
    status_filter?: 'active' | 'inactive'
  }) => {
    loading.value = true
    error.value = null

    try {
      const response = await employeeService.getEmployees(params)
      employees.value = response.employees
      total.value = response.total
      currentPage.value = response.page
      itemsPerPage.value = response.limit
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al cargar empleados'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchEmployee = async (id: number): Promise<Employee> => {
    loading.value = true
    error.value = null

    try {
      return await employeeService.getEmployee(id)
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al cargar empleado'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createEmployee = async (employeeData: CreateEmployeeData): Promise<Employee> => {
    loading.value = true
    error.value = null

    try {
      const newEmployee = await employeeService.createEmployee(employeeData)
      employees.value.unshift(newEmployee)
      total.value++
      return newEmployee
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al crear empleado'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateEmployee = async (id: number, updates: UpdateEmployeeData): Promise<Employee> => {
    loading.value = true
    error.value = null

    try {
      const updatedEmployee = await employeeService.updateEmployee(id, updates)
      const index = employees.value.findIndex(emp => emp.id === id)
      if (index !== -1) {
        employees.value[index] = updatedEmployee
      }
      return updatedEmployee
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al actualizar empleado'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deactivateEmployee = async (id: number): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      await employeeService.deactivateEmployee(id)
      const index = employees.value.findIndex(emp => emp.id === id)
      if (index !== -1) {
        employees.value[index].status = 'inactive'
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al desactivar empleado'
      throw err
    } finally {
      loading.value = false
    }
  }

  const uploadResume = async (id: number, file: File): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const response = await employeeService.uploadResume(id, file)
      const index = employees.value.findIndex(emp => emp.id === id)
      if (index !== -1) {
        employees.value[index] = response.employee
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al subir hoja de vida'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteResume = async (id: number): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const response = await employeeService.deleteResume(id)
      const index = employees.value.findIndex(emp => emp.id === id)
      if (index !== -1) {
        employees.value[index] = response.employee
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al eliminar hoja de vida'
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
    employees,
    loading,
    error,
    total,
    currentPage,
    itemsPerPage,

    // Getters
    activeEmployees,
    inactiveEmployees,

    // Actions
    fetchEmployees,
    fetchEmployee,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
    uploadResume,
    deleteResume,
    clearError
  }
}