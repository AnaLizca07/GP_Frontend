<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md text-center">
      <UPageCard
        variant="subtle"
        class="mb-4"
      >
          <div class="space-y-6">
            <div>
              <h1 class="text-6xl font-bold text-error">403</h1>
              <h2 class="mt-4 text-2xl font-bold">
                Acceso No Autorizado
              </h2>
              <p class="mt-2 text-dimmed">
                No tienes permisos para acceder a esta página.
              </p>
            </div>

            <div class="space-y-3">
              <UButton
                to="/"
                size="md"
                block
              >
                Volver al Dashboard
              </UButton>

              <UButton
                variant="outline"
                size="md"
                block
                @click="handleLogout"
              >
                Cerrar Sesión
              </UButton>
            </div>
          </div>
        </UPageCard>
      </div>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { logout } = useAuth()

const handleLogout = async () => {
  await logout()
  await router.push('/login')
}
</script>