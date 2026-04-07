export interface MiembroEquipo {
  id: number
  nombre: string
  iniciales: string
  rol: string
  disponibilidad: 'Activo' | 'Inactivo'
  identification: string
  telefono: string
  calificacion: number | null
  fechaCalificacion: string | null
  comentario: string
  user_id?: string
  salary_type?: 'monthly' | 'hourly' | 'biweekly'
  salary_monthly?: number | null
  salary_hourly?: number | null
  salary_biweekly?: number | null
  resume_url?: string | null
  status?: 'active' | 'inactive'
}

export interface NewMemberForm {
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
  status: 'active'
}
