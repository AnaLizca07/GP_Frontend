<template>
  <div class="min-h-screen flex">

    <!-- Panel izquierdo: marca -->
    <div class="hidden lg:flex lg:w-2/5 flex-col items-center justify-center p-12 text-white" style="background-color: #003C68;">
      <div class="w-20 h-20 rounded-2xl flex items-center justify-center mb-8" style="background-color: rgba(255,255,255,0.15);">
        <span class="text-4xl font-bold">PG</span>
      </div>
      <h1 class="text-4xl font-bold mb-3 tracking-tight">ProjeGest</h1>
      <p class="text-white/70 text-center text-base mb-14">Plataforma de Gestión de Proyectos</p>

      <div class="space-y-4 w-full max-w-xs">
        <div v-for="feature in features" :key="feature" class="flex items-center gap-3">
          <div class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style="background-color: rgba(255,255,255,0.2);">
            <UIcon name="i-lucide-check" class="w-3 h-3 text-white" />
          </div>
          <span class="text-sm text-white/80">{{ feature }}</span>
        </div>
      </div>
    </div>

    <!-- Panel derecho: formulario -->
    <div class="flex-1 flex items-center justify-center p-8 bg-white dark:bg-zinc-900">
      <div class="w-full max-w-sm">

        <!-- Logo móvil -->
        <div class="flex lg:hidden items-center gap-3 mb-10">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style="background-color: #003C68;">PG</div>
          <span class="text-xl font-bold">ProjeGest</span>
        </div>

        <div class="mb-8">
          <h2 class="text-2xl font-bold text-foreground mb-1">Crear cuenta</h2>
          <p class="text-sm text-muted-foreground">Completa los datos para registrarte</p>
        </div>

        <UForm
          :schema="registerSchema"
          :state="form"
          @submit="handleSubmit"
          class="space-y-4"
        >
          <UFormField name="email" label="Correo electrónico" required>
            <UInput
              v-model="form.email"
              type="email"
              placeholder="tu@ejemplo.com"
              :disabled="isLoading"
              autocomplete="email"
              size="lg"
              icon="i-lucide-mail"
            />
          </UFormField>

          <UFormField name="password" label="Contraseña" required>
            <UInput
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              :disabled="isLoading"
              autocomplete="new-password"
              size="lg"
              icon="i-lucide-lock"
            />
          </UFormField>

          <UFormField name="confirmPassword" label="Confirmar contraseña" required>
            <UInput
              v-model="form.confirmPassword"
              type="password"
              placeholder="••••••••"
              :disabled="isLoading"
              autocomplete="new-password"
              size="lg"
              icon="i-lucide-lock-keyhole"
            />
          </UFormField>

          <UFormField name="role" label="Rol" required>
            <USelect
              v-model="form.role"
              :options="roleOptions"
              :disabled="isLoading"
              placeholder="Selecciona tu rol"
              size="lg"
              icon="i-lucide-user-cog"
            />
          </UFormField>

          <UAlert
            v-if="error"
            color="error"
            variant="subtle"
            :title="error"
          />

          <UButton
            type="submit"
            block
            size="lg"
            :loading="isLoading"
            :disabled="isLoading"
            color="primary"
            class="mt-2"
          >
            Crear Cuenta
          </UButton>
        </UForm>

        <div class="mt-8 pt-6 border-t border-default text-center">
          <span class="text-sm text-muted-foreground">¿Ya tienes cuenta? </span>
          <UButton to="/login" variant="link" size="sm" class="p-0 font-medium">
            Inicia sesión
          </UButton>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'
import { useAuth } from '@/composables/useAuth'
import type { RegisterData } from '@/types/auth'

const router = useRouter()
const { register, isLoading, error, clearError } = useAuth()

const features = [
  'Gestión de proyectos en tiempo real',
  'Control de equipos y tareas',
  'Nómina y finanzas integradas',
  'Reportes y seguimiento de OKRs',
]

const registerSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirma tu contraseña'),
  role: z.enum(['manager', 'employee', 'sponsor']).catch('employee')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

const roleOptions = [
  { label: 'Manager', value: 'manager' },
  { label: 'Empleado', value: 'employee' },
  { label: 'Patrocinador', value: 'sponsor' }
]

const form = reactive<RegisterData & { confirmPassword: string }>({
  email: '',
  password: '',
  confirmPassword: '',
  role: 'employee'
})

const handleSubmit = async (event: any) => {
  clearError()
  try {
    const { confirmPassword, ...registerData } = event.data
    await register(registerData)
    await router.push('/')
  } catch (err) {
    console.error('Error de registro:', err)
  }
}
</script>
