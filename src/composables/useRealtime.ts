/**
 * useRealtime — suscripciones a Supabase Realtime según rol del usuario
 *
 * Manager recibe:
 *   - Tareas marcadas como completadas
 *   - Nuevos entregables subidos
 *
 * Empleado recibe:
 *   - Nuevas tareas asignadas a él/ella
 *   - Cambios en sus tareas existentes (fecha límite)
 *   - Nuevas calificaciones recibidas
 *
 * Sponsor recibe:
 *   - Tareas completadas en sus proyectos
 *   - Nuevas tareas creadas en sus proyectos
 */
import { ref } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useNotificationsStore } from '@/stores/notifications'
import { useAuthStore } from '@/stores/auth'
import { employeeService } from '@/services/employees'
import projectsService from '@/services/projects'

export function useRealtime() {
  const notificationsStore = useNotificationsStore()
  const authStore = useAuthStore()
  const channels = ref<RealtimeChannel[]>([])

  // ─── Manager ──────────────────────────────────────────────────────────
  function setupManagerChannels() {
    const ch = supabase
      .channel('manager-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks' },
        (payload) => {
          const prev = payload.old as any
          const next = payload.new as any
          if (next.status === 'completed' && prev.status !== 'completed') {
            notificationsStore.add({
              title: 'Tarea completada',
              description: `"${next.title}" fue marcada como completada`,
              type: 'task',
              link: '/tareas',
            })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'task_deliverables' },
        (payload) => {
          const row = payload.new as any
          notificationsStore.add({
            title: 'Nuevo entregable subido',
            description: `Se cargó "${row.file_name ?? 'un archivo'}" en una tarea`,
            type: 'deliverable',
            link: '/tareas',
          })
        }
      )
      .subscribe()

    channels.value.push(ch)
  }

  // ─── Empleado ─────────────────────────────────────────────────────────
  async function setupEmployeeChannels() {
    try {
      const profile = await employeeService.getMyProfile()
      if (!profile) return

      const employeeId = profile.id

      const taskChannel = supabase
        .channel(`employee-tasks-${employeeId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'tasks',
            filter: `employee_id=eq.${employeeId}`,
          },
          (payload) => {
            const row = payload.new as any
            notificationsStore.add({
              title: 'Nueva tarea asignada',
              description: `Se te asignó: "${row.title}"`,
              type: 'task',
              link: '/tareas',
            })
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'tasks',
            filter: `employee_id=eq.${employeeId}`,
          },
          (payload) => {
            const prev = payload.old as any
            const next = payload.new as any
            if (prev.due_date !== next.due_date) {
              notificationsStore.add({
                title: 'Tarea actualizada',
                description: `La fecha límite de "${next.title}" fue modificada`,
                type: 'task',
                link: '/tareas',
              })
            }
          }
        )
        .subscribe()

      channels.value.push(taskChannel)

      // Notificaciones de calificaciones recibidas
      const ratingsChannel = supabase
        .channel(`employee-ratings-${employeeId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'employee_ratings',
            filter: `employee_id=eq.${employeeId}`,
          },
          () => {
            notificationsStore.add({
              title: 'Nueva calificación recibida',
              description: 'Tu gerente ha registrado una nueva evaluación de desempeño',
              type: 'system',
              icon: 'i-lucide-star',
              link: '/settings',
            })
          }
        )
        .subscribe()

      channels.value.push(ratingsChannel)
    } catch (err) {
      console.warn('[Realtime] No se pudo configurar canal de empleado:', err)
    }
  }

  // ─── Sponsor ──────────────────────────────────────────────────────────
  async function setupSponsorChannels() {
    try {
      const res = await projectsService.getProjects()
      const projectIds: number[] = (res.projects ?? res ?? []).map((p: any) => p.id)
      if (!projectIds.length) return

      const ch = supabase
        .channel('sponsor-realtime')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'tasks' },
          (payload) => {
            const prev = payload.old as any
            const next = payload.new as any
            if (!projectIds.includes(next.project_id)) return
            if (next.status === 'completed' && prev.status !== 'completed') {
              notificationsStore.add({
                title: 'Tarea completada',
                description: `"${next.title}" fue completada en tu proyecto`,
                type: 'task',
                link: '/sponsor',
              })
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'tasks' },
          (payload) => {
            const row = payload.new as any
            if (!projectIds.includes(row.project_id)) return
            notificationsStore.add({
              title: 'Nueva tarea creada',
              description: `Se creó "${row.title}" en uno de tus proyectos`,
              type: 'task',
              link: '/sponsor',
            })
          }
        )
        .subscribe()

      channels.value.push(ch)
    } catch (err) {
      console.warn('[Realtime] No se pudo configurar canal de patrocinador:', err)
    }
  }

  // ─── Público ──────────────────────────────────────────────────────────
  async function start() {
    if (!authStore.isAuthenticated) return

    if (authStore.isManager) {
      setupManagerChannels()
    } else if (authStore.isEmployee) {
      await setupEmployeeChannels()
    } else if (authStore.isSponsor) {
      await setupSponsorChannels()
    }
  }

  function stop() {
    channels.value.forEach(ch => supabase.removeChannel(ch))
    channels.value = []
  }

  return { start, stop }
}
