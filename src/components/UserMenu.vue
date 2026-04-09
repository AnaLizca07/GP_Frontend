<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { DropdownMenuItem } from '@nuxt/ui'
import { useAuth } from '@/composables/useAuth'

defineProps<{
  collapsed?: boolean
}>()

const router = useRouter()
const { user: authUser, logout } = useAuth()

// Generar avatar basado en el email del usuario
const generateAvatarUrl = (email: string) => {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}&backgroundColor=3b82f6&color=ffffff`
}

const user = computed(() => ({
  name: authUser.value?.email || 'Usuario',
  avatar: {
    src: authUser.value ? generateAvatarUrl(authUser.value.email) : '',
    alt: authUser.value?.email || 'Usuario'
  }
}))

const handleLogout = async () => {
  try {
    await logout()
    await router.push('/login')
  } catch (error) {
    console.error('Error logging out:', error)
  }
}

const items = computed<DropdownMenuItem[][]>(() => ([[{
  type: 'label',
  label: user.value.name,
  avatar: user.value.avatar,
  subtitle: authUser.value?.role ? `Rol: ${authUser.value.role}` : undefined
}], [{
  label: 'Mi Perfil',
  icon: 'i-lucide-user'
}, {
  label: 'Configuración',
  icon: 'i-lucide-settings',
  to: '/settings'
}], [{
  label: 'Cerrar Sesión',
  icon: 'i-lucide-log-out',
  color: 'error' as const,
  onSelect: handleLogout
}]]))
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        ...user,
        label: collapsed ? undefined : user?.name,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      :chip="false"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
    />
  </UDropdownMenu>
</template>
