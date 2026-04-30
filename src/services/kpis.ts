import api from './api'

export interface ProjectKpis {
  project_id: number
  project_name: string
  status: string
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  pending_tasks: number
  blocked_tasks: number
  progress_percentage: number
  overdue_tasks: number
  start_date: string | null
  end_date: string | null
  days_elapsed: number
  total_days: number
  days_remaining: number
  team_size: number
  budget: number
}

export interface MemberPerformance {
  employee_id: number
  employee_name: string
  position: string
  dedication_percentage: number
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  pending_tasks: number
  overdue_tasks: number
  completion_rate: number
}

export interface ProjectEmployeePerformance {
  project_id: number
  project_name: string
  members: MemberPerformance[]
}

export interface PerformanceIndex {
  id: number
  name: string
  status: string
  cpi: number
  spi: number
  progress_pct: number
  budget: number
  spent: number
  total_tasks: number
  completed_tasks: number
}

export interface BudgetSummary {
  project_id: number
  project_name: string
  total_budget: number
  spent: number
  income: number
  available_balance: number  // ingresos recibidos - egresos (saldo real)
  remaining: number          // presupuesto total - egresos (referencia contractual)
  consumed_percentage: number
}

export interface EmployeePerformance {
  employee_id: number
  employee_name: string
  position: string
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  pending_tasks: number
  blocked_tasks: number
  overdue_tasks: number
  completion_rate: number
  assigned_projects: Array<{
    project_id: number
    project_name: string
    project_status: string
    dedication_percentage: number
  }>
}

const kpisService = {
  async getProjectKpis(projectId: number): Promise<ProjectKpis> {
    const { data } = await api.get(`/api/projects/${projectId}/kpis`)
    return data
  },

  async getProjectEmployeePerformance(projectId: number): Promise<ProjectEmployeePerformance> {
    const { data } = await api.get(`/api/projects/${projectId}/employee-performance`)
    return data
  },

  async getEmployeePerformance(employeeId: number): Promise<EmployeePerformance> {
    const { data } = await api.get(`/api/employees/${employeeId}/performance`)
    return data
  },

  async getSponsorProgress(projectId: number): Promise<ProjectKpis> {
    const { data } = await api.get(`/api/projects/${projectId}/sponsor-progress`)
    return data
  },

  async getSponsorProjectEmployeePerformance(projectId: number): Promise<ProjectEmployeePerformance> {
    const { data } = await api.get(`/api/projects/${projectId}/employee-performance`)
    return data
  },

  async getEmployeePerformanceForSponsor(employeeId: number): Promise<EmployeePerformance> {
    const { data } = await api.get(`/api/employees/${employeeId}/performance/sponsor`)
    return data
  },

  async getBudgetSummary(projectId: number): Promise<BudgetSummary> {
    const { data } = await api.get(`/api/projects/${projectId}/budget-summary`)
    return data
  },

  async getPerformanceIndices(): Promise<PerformanceIndex[]> {
    const { data } = await api.get('/api/kpis/performance-indices')
    return data
  },
}

export default kpisService
