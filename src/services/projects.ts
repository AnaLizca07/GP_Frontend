import api from './api'

export interface ProjectEmployee {
  id: number
  employee_id: number
  employee_name: string
  employee_position?: string
  employee_phone?: string
  employee_identification?: string
  dedication_percentage: number
  assigned_at: string
}

export interface Project {
  id: number
  code?: string
  name: string
  description?: string
  start_date: string
  end_date?: string
  budget?: number
  status: string
  sponsor_id?: string
  sponsor_email?: string
  created_at: string
  updated_at?: string
  assigned_employees: ProjectEmployee[]
}

export interface ProjectCreate {
  name: string
  description?: string
  start_date: string
  end_date?: string
  budget?: number
  sponsor_id?: string
}

export interface ProjectsResponse {
  projects: Project[]
  total: number
  page: number
  limit: number
}

const projectsService = {
  async getProjects(params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
  }): Promise<ProjectsResponse> {
    const { data } = await api.get('/api/projects/', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 50,
        status_filter: params?.status,
        search: params?.search,
      },
    })
    return data
  },

  async getProject(id: number): Promise<Project> {
    const { data } = await api.get(`/api/projects/${id}`)
    return data
  },

  async createProject(projectData: ProjectCreate): Promise<Project> {
    const { data } = await api.post('/api/projects/', projectData)
    return data
  },

  async updateProject(
    id: number,
    projectData: Partial<ProjectCreate & { status: string }>
  ): Promise<Project> {
    const { data } = await api.put(`/api/projects/${id}`, projectData)
    return data
  },

  async deleteProject(id: number): Promise<void> {
    await api.delete(`/api/projects/${id}`)
  },

  async getProjectEmployees(projectId: number): Promise<ProjectEmployee[]> {
    const { data } = await api.get(`/api/projects/${projectId}/employees`)
    return data
  },

  async assignEmployee(
    projectId: number,
    employeeId: number,
    dedication: number
  ): Promise<void> {
    await api.post(`/api/projects/${projectId}/employees`, {
      employee_id: employeeId,
      dedication_percentage: dedication,
    })
  },

  async updateEmployeeDedication(
    projectId: number,
    employeeId: number,
    dedication: number
  ): Promise<void> {
    await api.put(`/api/projects/${projectId}/employees/${employeeId}`, {
      employee_id: employeeId,
      dedication_percentage: dedication,
    })
  },

  async removeEmployee(projectId: number, employeeId: number): Promise<void> {
    await api.delete(`/api/projects/${projectId}/employees/${employeeId}`)
  },
}

export default projectsService
