import api from './api'

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface TaskDeliverable {
  id: number
  task_id: number
  file_name: string
  file_url: string
  file_size: number
  uploaded_at: string
}

export interface AllDeliverable {
  id: number
  task_id: number
  task_title: string
  task_status: string
  project_name: string
  employee_name: string
  file_name: string
  file_url: string
  file_size: number
  uploaded_at: string
}

export interface Task {
  id: number
  code?: string
  project_id: number
  project_name: string
  employee_id: number
  employee_name: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  due_date?: string
  completed_at?: string
  created_at: string
  updated_at: string
  deliverables: TaskDeliverable[]
}

export interface TaskCreate {
  project_id: number
  employee_id: number
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  due_date?: string
}

export interface TasksResponse {
  tasks: Task[]
  total: number
}

const tasksService = {
  async getTasks(params?: {
    project_id?: number
    employee_id?: number
    status?: TaskStatus
  }): Promise<TasksResponse> {
    const { data } = await api.get('/api/tasks/', { params })
    return data
  },

  async getTask(id: number): Promise<Task> {
    const { data } = await api.get(`/api/tasks/${id}`)
    return data
  },

  async createTask(taskData: TaskCreate): Promise<Task> {
    const { data } = await api.post('/api/tasks/', taskData)
    return data
  },

  async updateTask(id: number, taskData: Partial<TaskCreate>): Promise<Task> {
    const { data } = await api.put(`/api/tasks/${id}`, taskData)
    return data
  },

  async deleteTask(id: number): Promise<void> {
    await api.delete(`/api/tasks/${id}`)
  },

  async updateTaskStatus(
    id: number,
    status: TaskStatus
  ): Promise<{ id: number; status: string; completed_at?: string }> {
    const { data } = await api.patch(`/api/tasks/${id}/status`, { status })
    return data
  },

  async getAllDeliverables(): Promise<AllDeliverable[]> {
    const { data } = await api.get('/api/tasks/deliverables')
    return data
  },

  async getDeliverables(taskId: number): Promise<TaskDeliverable[]> {
    const { data } = await api.get(`/api/tasks/${taskId}/deliverables`)
    return data
  },

  async uploadDeliverable(taskId: number, file: File): Promise<TaskDeliverable> {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post(`/api/tasks/${taskId}/deliverables`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async deleteDeliverable(taskId: number, deliverableId: number): Promise<void> {
    await api.delete(`/api/tasks/${taskId}/deliverables/${deliverableId}`)
  },
}

export default tasksService
