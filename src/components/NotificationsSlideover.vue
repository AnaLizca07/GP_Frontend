<script setup lang="ts">
import { formatTimeAgo } from '@vueuse/core'
import { useDashboard } from '../composables/useDashboard'
import { useNotificationsStore } from '../stores/notifications'

const { isNotificationsSlideoverOpen } = useDashboard()
const store = useNotificationsStore()
</script>

<template>
  <USlideover
    v-model:open="isNotificationsSlideoverOpen"
    title="Notificaciones"
  >
    <template #body>
      <!-- Sin notificaciones -->
      <div
        v-if="store.notifications.length === 0"
        class="flex flex-col items-center justify-center py-12 gap-3 text-center"
      >
        <UIcon name="i-lucide-bell-off" class="size-10 text-muted" />
        <p class="text-sm text-muted">No tienes notificaciones</p>
      </div>

      <!-- Lista de notificaciones -->
      <template v-else>
        <!-- Acciones globales -->
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs text-muted">
            {{ store.unreadCount }} sin leer
          </span>
          <UButton
            v-if="store.unreadCount > 0"
            variant="ghost"
            size="xs"
            label="Marcar todas como leídas"
            @click="store.markAllAsRead()"
          />
        </div>

        <!-- Notificación individual -->
        <div
          v-for="n in store.notifications"
          :key="n.id"
          class="px-3 py-3 rounded-md flex items-start gap-3 relative -mx-3 cursor-pointer transition-colors"
          :class="n.read ? 'opacity-60 hover:bg-elevated/30' : 'hover:bg-elevated/50'"
          @click="store.markAsRead(n.id)"
        >
          <!-- Indicador no leído -->
          <span
            v-if="!n.read"
            class="absolute top-3.5 right-3 size-2 rounded-full bg-primary"
          />

          <!-- Ícono del tipo -->
          <div class="mt-0.5 size-8 rounded-full bg-elevated flex items-center justify-center shrink-0">
            <UIcon :name="n.icon" class="size-4 text-primary" />
          </div>

          <!-- Contenido -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-highlighted truncate">{{ n.title }}</p>
            <p class="text-xs text-dimmed mt-0.5 leading-relaxed">{{ n.description }}</p>
            <time class="text-xs text-muted mt-1 block">
              {{ formatTimeAgo(new Date(n.created_at)) }}
            </time>
          </div>

          <!-- Botón eliminar -->
          <UButton
            icon="i-lucide-x"
            variant="ghost"
            size="xs"
            color="neutral"
            class="shrink-0 opacity-0 group-hover:opacity-100"
            @click.stop="store.remove(n.id)"
          />
        </div>
      </template>
    </template>
  </USlideover>
</template>
