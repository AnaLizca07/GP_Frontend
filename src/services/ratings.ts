import api from './api'

export interface EmployeeRating {
  id: number
  stars: number
  comment: string | null
  created_at: string
  rated_by_email: string | null
}

const ratingsService = {
  async createRating(employeeId: number, stars: number, comment: string): Promise<EmployeeRating> {
    const { data } = await api.post(`/api/employees/${employeeId}/ratings`, { stars, comment })
    return data
  },

  async getRatings(employeeId: number): Promise<EmployeeRating[]> {
    const { data } = await api.get(`/api/employees/${employeeId}/ratings`)
    return data
  },
}

export default ratingsService
