import api from './api'

export type OkrStatus = 'active' | 'completed' | 'cancelled'

export interface Okr {
  id: number
  title: string
  description?: string
  progress: number
  project_id?: number
  project_name?: string
  target_date?: string
  status: OkrStatus
  created_by?: string
  created_at: string
  updated_at: string
}

export interface OkrCreate {
  title: string
  description?: string
  progress?: number
  project_id?: number | null
  target_date?: string | null
  status?: OkrStatus
}

export interface OkrUpdate {
  title?: string
  description?: string | null
  progress?: number
  project_id?: number | null
  target_date?: string | null
  status?: OkrStatus
}

const okrsService = {
  async getOkrs(params?: { project_id?: number; status?: OkrStatus }): Promise<Okr[]> {
    const { data } = await api.get('/api/okrs/', { params })
    return data
  },

  async getOkr(id: number): Promise<Okr> {
    const { data } = await api.get(`/api/okrs/${id}`)
    return data
  },

  async createOkr(okrData: OkrCreate): Promise<Okr> {
    const { data } = await api.post('/api/okrs/', okrData)
    return data
  },

  async updateOkr(id: number, okrData: OkrUpdate): Promise<Okr> {
    const { data } = await api.put(`/api/okrs/${id}`, okrData)
    return data
  },

  async deleteOkr(id: number): Promise<void> {
    await api.delete(`/api/okrs/${id}`)
  },
}

export default okrsService
