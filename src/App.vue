<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStorage } from '@vueuse/core'
import type { NavigationMenuItem } from '@nuxt/ui'
import { useAuth } from '@/composables/useAuth'
import { useAuthStore } from '@/stores/auth'
import { useRealtime } from '@/composables/useRealtime'
import { useNotificationsStore } from '@/stores/notifications'

const toast = useToast()
const route = useRoute()
const router = useRouter()
const { logout } = useAuth()
const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()
const { start: startRealtime, stop: stopRealtime } = useRealtime()

// Iniciar/detener realtime según autenticación
watch(
  () => authStore.isAuthenticated,
  async (authenticated) => {
    if (authenticated) {
      await startRealtime()
    } else {
      stopRealtime()
    }
  },
  { immediate: true }
)

// Detectar si estamos en páginas de autenticación (sin sidebar)
const isAuthPage = computed(() => {
  return route.path.startsWith('/login') ||
         route.path.startsWith('/register') ||
         route.path.startsWith('/forgot-password') ||
         route.path.startsWith('/change-password') ||
         route.path.startsWith('/404') ||
         route.path.startsWith('/unauthorized')
})

const open = ref(false)

const handleLogout = async () => {
  stopRealtime()
  await logout()
  await router.push('/login')
}

// Links dinámicos según el rol del usuario
const links = computed(() => {
  if (authStore.isEmployee) {
    return [[{
      label: 'Inicio',
      icon: 'i-lucide-layout-dashboard',
      to: '/empleado',
      onSelect: () => { open.value = false }
    }, {
      label: 'Mis Tareas',
      icon: 'i-lucide-check-square',
      to: '/tareas',
      onSelect: () => { open.value = false }
    }, {
      label: 'Mi Equipo',
      icon: 'i-lucide-users',
      to: '/equipo',
      onSelect: () => { open.value = false }
    }, {
      label: 'Mi Perfil',
      icon: 'i-lucide-user',
      to: '/settings',
      onSelect: () => { open.value = false }
    }], []] satisfies NavigationMenuItem[][]
  }

  if (authStore.isSponsor) {
    return [[{
      label: 'Dashboard',
      icon: 'i-lucide-layout-dashboard',
      to: '/sponsor',
      onSelect: () => { open.value = false }
    }], []] satisfies NavigationMenuItem[][]
  }

  // Manager: acceso completo
  return [[{
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/',
    onSelect: () => { open.value = false }
  }, {
    label: 'Proyectos',
    icon: 'i-lucide-folder-open',
    to: '/proyectos',
    onSelect: () => { open.value = false }
  }, {
    label: 'Tareas',
    icon: 'i-lucide-check-square',
    to: '/tareas',
    onSelect: () => { open.value = false }
  }, {
    label: 'Equipo',
    icon: 'i-lucide-users',
    to: '/equipo',
    onSelect: () => { open.value = false }
  }, {
    label: 'Finanzas',
    icon: 'i-lucide-wallet',
    to: '/finanzas',
    onSelect: () => { open.value = false }
  }, {
    label: 'Mi Perfil',
    icon: 'i-lucide-user',
    to: '/settings',
    onSelect: () => { open.value = false }
  }], []] satisfies NavigationMenuItem[][]
})

const groups = computed(() => [{
  id: 'links',
  label: 'Navegación',
  items: links.value?.flat() || []
}])

// Cookie consent (solo una vez)
const cookie = useStorage('cookie-consent', 'pending')
if (cookie.value !== 'accepted') {
  toast.add({
    title: 'Usamos cookies propias para mejorar tu experiencia.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Aceptar',
      color: 'neutral',
      variant: 'outline',
      onClick: () => { cookie.value = 'accepted' }
    }, {
      label: 'Rechazar',
      color: 'neutral',
      variant: 'ghost'
    }]
  })
}
</script>

<template>
  <Suspense>
    <UApp>
      <template v-if="isAuthPage">
        <RouterView />
      </template>

      <template v-else>
        <UDashboardGroup unit="rem" storage="local">
          <UDashboardSidebar
            id="default"
            v-model:open="open"
            collapsible
            resizable
            class="bg-elevated/25"
            :ui="{ footer: 'lg:border-t lg:border-default' }"
          >
            <template #header="{ collapsed }">
              <TeamsMenu :collapsed="collapsed" />
            </template>

            <template #default="{ collapsed }">
              <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

              <UNavigationMenu
                :collapsed="collapsed"
                :items="links[0] || []"
                orientation="vertical"
                tooltip
                popover
              />

              <div class="mt-auto">
                <UButton
                  :label="collapsed ? undefined : 'Cerrar sesión'"
                  icon="i-lucide-log-out"
                  color="neutral"
                  variant="ghost"
                  block
                  :square="collapsed"
                  class="mb-2"
                  @click="handleLogout"
                />
              </div>
            </template>

            <template #footer="{ collapsed }">
              <UserMenu :collapsed="collapsed" />
            </template>
          </UDashboardSidebar>

          <UDashboardSearch :groups="groups" />

          <RouterView />

          <NotificationsSlideover />
        </UDashboardGroup>
      </template>
    </UApp>
  </Suspense>
</template>
