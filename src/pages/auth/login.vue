<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex flex-col items-center justify-center p-4">
    <AuthHeader />

    <AuthCard>
      <AuthToggle v-model:active-tab="activeTab" />

      <div v-show="activeTab === 'login'">
        <UForm
          :schema="loginSchema"
          :state="form"
          @submit.prevent="handleSubmit(form)"
          class="space-y-4"
        >
          <UFormField
            name="email"
            label="Correo Electrónico"
            required
          >
            <UInput
              v-model="form.email"
              type="email"
              placeholder="tu@email.com"
              :disabled="isLoading"
              autocomplete="email"
              size="lg"
              class="h-12"
            />
          </UFormField>

          <UFormField
            name="password"
            label="Contraseña"
            required
          >
            <UInput
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              :disabled="isLoading"
              autocomplete="current-password"
              size="lg"
              class="h-12"
            />
          </UFormField>

          <UAlert
            v-if="error"
            color="error"
            variant="subtle"
            :title="error"
            class="mt-4"
          />

          <UButton
            type="submit"
            block
            size="lg"
            :loading="isLoading"
            :disabled="isLoading"
            class="mt-6 h-12"
            color="primary"
          >
            Iniciar Sesión
          </UButton>

          <div class="text-center mt-4">
            <p class="text-sm text-zinc-500 dark:text-zinc-400">
              Tip demo: usa correos que contengan "gerente" o "cliente"<br>
              Ej: <span class="font-mono text-zinc-700 dark:text-zinc-300">gerente@demo.com / cliente@demo.com</span>
            </p>
          </div>

          <div class="text-center mt-6">
            <UButton
              to="/forgot-password"
              variant="link"
              size="sm"
              :disabled="isLoading"
              class="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              ¿Olvidaste tu contraseña?
            </UButton>
          </div>
        </UForm>
      </div>
    </AuthCard>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'
import { useAuth } from '@/composables/useAuth'
import type { LoginCredentials } from '@/types/auth'
import AuthHeader from '@/components/auth/AuthHeader.vue'
import AuthCard from '@/components/auth/AuthCard.vue'
import AuthToggle from '@/components/auth/AuthToggle.vue'

const router = useRouter()
const { login, isLoading, error, clearError } = useAuth()

const activeTab = ref<'login' | 'register'>('login')

const loginSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
})

const form = reactive<LoginCredentials>({
  email: '',
  password: ''
})

const handleSubmit = async (data: LoginCredentials) => {
  clearError()

  try {
    await login(data)
    await router.push('/')
  } catch (err) {
    console.error('Error de login:', err)
  }
}
</script>