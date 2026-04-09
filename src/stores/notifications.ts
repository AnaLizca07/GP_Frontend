import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export type NotificationType = 'task' | 'deliverable' | 'project' | 'payroll' | 'system'

export interface AppNotification {
  id: string
  title: string
  description: string
  type: NotificationType
  icon: string
  read: boolean
  created_at: Date
  link?: string
}

const storageKey = (userId: string) => `pmis-notifications-${userId}`

const deserialize = (raw: string | null): AppNotification[] => {
  if (!raw) return []
  try {
    return (JSON.parse(raw) as any[]).map(n => ({ ...n, created_at: new Date(n.created_at) }))
  } catch { return [] }
}

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<AppNotification[]>([])
  let _userId: string | null = null

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

  const iconForType: Record<NotificationType, string> = {
    task:        'i-lucide-check-circle',
    deliverable: 'i-lucide-paperclip',
    project:     'i-lucide-folder',
    payroll:     'i-lucide-banknote',
    system:      'i-lucide-bell',
  }

  // Persistir cambios en el localStorage del usuario activo
  watch(notifications, (v) => {
    if (_userId) {
      localStorage.setItem(storageKey(_userId), JSON.stringify(v))
    }
  }, { deep: true })

  /** Llamar tras login: carga las notificaciones propias del usuario */
  function initForUser(userId: string) {
    _userId = userId
    notifications.value = deserialize(localStorage.getItem(storageKey(userId)))
  }

  /** Llamar tras logout: descarta las notificaciones de memoria sin tocar el localStorage */
  function clearSession() {
    _userId = null
    notifications.value = []
  }

  function add(n: Omit<AppNotification, 'id' | 'read' | 'created_at' | 'icon'> & { icon?: string }) {
    notifications.value.unshift({
      ...n,
      id: crypto.randomUUID(),
      icon: n.icon ?? iconForType[n.type] ?? 'i-lucide-bell',
      read: false,
      created_at: new Date(),
    })
    // Máximo 50 notificaciones en memoria
    if (notifications.value.length > 50) notifications.value.splice(50)
  }

  function markAsRead(id: string) {
    const n = notifications.value.find(n => n.id === id)
    if (n) n.read = true
  }

  function markAllAsRead() {
    notifications.value.forEach(n => (n.read = true))
  }

  function remove(id: string) {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  return { notifications, unreadCount, add, markAsRead, markAllAsRead, remove, initForUser, clearSession }
})
