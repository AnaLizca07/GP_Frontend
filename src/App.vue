<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStorage } from '@vueuse/core'
import type { NavigationMenuItem } from '@nuxt/ui'
import { useAuth } from '@/composables/useAuth'

const toast = useToast()
const route = useRoute()
const router = useRouter()
const { logout } = useAuth()

// Detectar si estamos en páginas de autenticación
const isAuthPage = computed(() => {
  return route.path.startsWith('/login') ||
         route.path.startsWith('/register') ||
         route.path.startsWith('/forgot-password') ||
         route.path.startsWith('/404') ||
         route.path.startsWith('/unauthorized')
})

const open = ref(false)

const handleLogout = async () => {
  await logout()
  await router.push('/login')
}

const links = [[{
  label: 'Dashboard',
  icon: 'i-lucide-layout-dashboard',
  to: '/',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Proyectos',
  icon: 'i-lucide-folder-open',
  to: '/proyectos',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Tareas',
  icon: 'i-lucide-check-square',
  to: '/tareas',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Equipo',
  icon: 'i-lucide-users',
  to: '/equipo',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Finanzas',
  icon: 'i-lucide-wallet',
  to: '/finanzas',
  onSelect: () => {
    open.value = false
  }
}], []] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.flat()
}, {
  id: 'code',
  label: 'Code',
  items: [{
    id: 'source',
    label: 'View page source',
    icon: 'simple-icons:github',
    to: `https://github.com/nuxt-ui-templates/dashboard-vue/blob/main/src/pages${route.path === '/' ? '/index' : route.path}.vue`,
    target: '_blank'
  }]
}])

const cookie = useStorage('cookie-consent', 'pending')
if (cookie.value !== 'accepted') {
  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Accept',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cookie.value = 'accepted'
      }
    }, {
      label: 'Opt out',
      color: 'neutral',
      variant: 'ghost'
    }]
  })
}
</script>

<template>
  <Suspense>
    <UApp>
      <!-- Layout para páginas de autenticación -->
      <template v-if="isAuthPage">
        <RouterView />
      </template>

      <!-- Layout para dashboard -->
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
                :items="links[0]"
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
