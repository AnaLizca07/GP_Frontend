import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useStorage } from '@vueuse/core'

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

export const useNotificationsStore = defineStore('notifications', () => {
  // Persistir en localStorage — los objetos Date se serializan/deserializan manualmente
  const notifications = useStorage<AppNotification[]>('pmis-notifications', [], undefined, {
    serializer: {
      read: (raw: string) => {
        try {
          return (JSON.parse(raw) as any[]).map(n => ({ ...n, created_at: new Date(n.created_at) }))
        } catch { return [] }
      },
      write: (v: AppNotification[]) => JSON.stringify(v),
    },
  })

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

  const iconForType: Record<NotificationType, string> = {
    task: 'i-lucide-check-circle',
    deliverable: 'i-lucide-paperclip',
    project: 'i-lucide-folder',
    payroll: 'i-lucide-banknote',
    system: 'i-lucide-bell',
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
    if (notifications.value.length > 50) {
      notifications.value.splice(50)
    }
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

  return { notifications, unreadCount, add, markAsRead, markAllAsRead, remove }
})
