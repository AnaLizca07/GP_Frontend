import api from './api'

export interface Employee {
  id: number
  user_id: string
  name: string
  identification: string
  position: string
  phone: string
  address: string
  salary_type: 'monthly' | 'hourly' | 'biweekly'
  salary_monthly: number | null
  salary_hourly: number | null
  salary_biweekly: number | null
  resume_url: string | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string | null
}

export interface CreateEmployeeData {
  email: string
  name: string
  identification: string
  position: string
  phone: string
  address: string
  salary_type: 'monthly' | 'hourly' | 'biweekly'
  salary_monthly?: number | null
  salary_hourly?: number | null
  salary_biweekly?: number | null
  status: 'active' | 'inactive'
}

export interface UpdateEmployeeData {
  name?: string
  phone?: string
  address?: string
  salary_monthly?: number
  position?: string
  identification?: string
  salary_type?: 'monthly' | 'hourly' | 'biweekly'
  salary_hourly?: number | null
  salary_biweekly?: number | null
  status?: 'active' | 'inactive'
}

export interface EmployeesResponse {
  employees: Employee[]
  total: number
  page: number
  limit: number
}

export const employeeService = {
  async getEmployees(params?: {
    page?: number
    limit?: number
    status_filter?: 'active' | 'inactive'
  }): Promise<EmployeesResponse> {
    const { data } = await api.get('/api/employees/', { params })
    return data
  },

  async getEmployee(id: number): Promise<Employee> {
    const { data } = await api.get(`/api/employees/${id}`)
    return data
  },

  async getMyProfile(): Promise<Employee> {
    const { data } = await api.get('/api/employees/me/profile')
    return data
  },

  async getEmployeeByUserId(userId: string): Promise<Employee> {
    const { data } = await api.get(`/api/employees/by-user/${userId}`)
    return data
  },

  async createEmployee(employee: CreateEmployeeData): Promise<Employee> {
    const { data } = await api.post('/api/employees/', employee)
    return data
  },

  async createEmployeeProfileOnly(profileData: Omit<CreateEmployeeData, 'email'> & { user_id: string }): Promise<Employee> {
    const { data } = await api.post('/api/employees/profile-only', profileData)
    return data
  },

  async updateEmployee(id: number, updates: UpdateEmployeeData): Promise<Employee> {
    const { data } = await api.put(`/api/employees/${id}`, updates)
    return data
  },

  async deactivateEmployee(id: number): Promise<{ message: string }> {
    const { data } = await api.delete(`/api/employees/${id}`)
    return data
  },

  async uploadResume(id: number, file: File): Promise<{
    message: string
    file_url: string
    employee: Employee
  }> {
    const formData = new FormData()
    formData.append('file', file)

    const { data } = await api.post(`/api/employees/${id}/resume`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return data
  },

  async deleteResume(id: number): Promise<{
    message: string
    employee: Employee
  }> {
    const { data } = await api.delete(`/api/employees/${id}/resume`)
    return data
  }
}