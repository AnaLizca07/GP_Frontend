<template>
  <div class="min-h-screen flex">

    <!-- Panel izquierdo: marca -->
    <div
      class="hidden lg:flex lg:w-5/12 flex-col items-center justify-center p-12 text-white relative overflow-hidden"
      style="background-color: #003C68;"
    >
      <div class="absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-10" style="background-color: white;" />
      <div class="absolute -bottom-16 -right-16 w-56 h-56 rounded-full opacity-10" style="background-color: white;" />

      <div class="relative z-10 flex flex-col items-center text-center">
        <div class="w-20 h-20 rounded-2xl flex items-center justify-center mb-8" style="background-color: rgba(255,255,255,0.18);">
          <span class="text-4xl font-bold">PG</span>
        </div>
        <h1 class="text-4xl font-bold mb-3 tracking-tight">ProjeGest</h1>
        <p class="text-white/65 text-base mb-14">Plataforma de Gestión de Proyectos</p>

        <div class="space-y-4 w-full max-w-xs text-left">
          <div v-for="feature in features" :key="feature" class="flex items-center gap-3">
            <div class="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center" style="background-color: rgba(255,255,255,0.18);">
              <UIcon name="i-lucide-check" class="w-3.5 h-3.5 text-white" />
            </div>
            <span class="text-sm text-white/80">{{ feature }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel derecho: formulario -->
    <div class="flex-1 flex items-center justify-center bg-white dark:bg-zinc-900 overflow-y-auto">
      <div class="w-full max-w-md px-8 py-12">

        <!-- Logo móvil -->
        <div class="flex lg:hidden items-center gap-3 mb-10">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style="background-color: #003C68;">PG</div>
          <span class="text-xl font-bold">ProjeGest</span>
        </div>

        <!-- LOGIN -->
        <div v-if="activeTab === 'login'">
          <div class="mb-8">
            <h2 class="text-2xl font-bold text-foreground mb-1">Bienvenido de vuelta</h2>
            <p class="text-sm text-muted-foreground">Ingresa tus credenciales para continuar</p>
          </div>

          <UForm
            :schema="loginSchema"
            :state="loginForm"
            @submit="handleLogin"
            class="space-y-5"
          >
            <UFormField name="email" label="Correo electrónico" required class="w-full">
              <UInput
                v-model="loginForm.email"
                type="email"
                placeholder="tu@email.com"
                :disabled="isLoading"
                autocomplete="email"
                size="lg"
                icon="i-lucide-mail"
                class="w-full"
              />
            </UFormField>

            <UFormField name="password" label="Contraseña" required class="w-full">
              <UInput
                v-model="loginForm.password"
                type="password"
                placeholder="••••••••"
                :disabled="isLoading"
                autocomplete="current-password"
                size="lg"
                icon="i-lucide-lock"
                class="w-full"
              />
            </UFormField>

            <div class="flex justify-end -mt-2">
              <UButton
                to="/forgot-password"
                variant="link"
                size="xs"
                :disabled="isLoading"
                class="p-0 text-muted-foreground"
              >
                ¿Olvidaste tu contraseña?
              </UButton>
            </div>

            <UAlert v-if="error" color="error" variant="subtle" :title="error" />

            <UButton
              type="submit"
              block
              size="lg"
              :loading="isLoading"
              :disabled="isLoading"
              color="primary"
              class="w-full"
            >
              Iniciar Sesión
            </UButton>
          </UForm>

          <div class="mt-8 pt-6 border-t border-default text-center">
            <span class="text-sm text-muted-foreground">¿No tienes cuenta? </span>
            <button class="text-sm font-semibold text-primary hover:underline" @click="activeTab = 'register'">
              Regístrate
            </button>
          </div>
        </div>

        <!-- REGISTER -->
        <div v-else>
          <div class="mb-8">
            <h2 class="text-2xl font-bold text-foreground mb-1">Crear cuenta</h2>
            <p class="text-sm text-muted-foreground">Completa los datos para registrarte</p>
          </div>

          <UForm
            :schema="registerSchema"
            :state="registerForm"
            @submit="handleRegister"
            class="space-y-4"
          >
            <UFormField name="name" label="Nombre completo" required class="w-full">
              <UInput
                v-model="registerForm.name"
                type="text"
                placeholder="Juan Pérez"
                :disabled="isLoading"
                autocomplete="name"
                size="lg"
                icon="i-lucide-user"
                class="w-full"
              />
            </UFormField>

            <UFormField name="email" label="Correo electrónico" required class="w-full">
              <UInput
                v-model="registerForm.email"
                type="email"
                placeholder="juan@empresa.com"
                :disabled="isLoading"
                autocomplete="email"
                size="lg"
                icon="i-lucide-mail"
                class="w-full"
              />
            </UFormField>

            <UFormField name="password" label="Contraseña" required class="w-full">
              <UInput
                v-model="registerForm.password"
                type="password"
                placeholder="••••••••"
                :disabled="isLoading"
                autocomplete="new-password"
                size="lg"
                icon="i-lucide-lock"
                class="w-full"
              />
            </UFormField>

            <UFormField name="role" label="Rol" required class="w-full">
              <USelect
                v-model="registerForm.role"
                :items="roleOptions"
                :disabled="isLoading"
                placeholder="Selecciona tu rol"
                size="lg"
                icon="i-lucide-user-cog"
                class="w-full"
              />
            </UFormField>

            <UAlert v-if="error" color="error" variant="subtle" :title="error" />

            <UButton
              type="submit"
              block
              size="lg"
              :loading="isLoading"
              :disabled="isLoading"
              color="primary"
              class="w-full"
            >
              Crear Cuenta
            </UButton>
          </UForm>

          <div class="mt-8 pt-6 border-t border-default text-center">
            <span class="text-sm text-muted-foreground">¿Ya tienes cuenta? </span>
            <button class="text-sm font-semibold text-primary hover:underline" @click="activeTab = 'login'">
              Inicia sesión
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { z } from 'zod'
import { useAuth } from '@/composables/useAuth'
import type { LoginCredentials, RegisterData } from '@/types/auth'

const router = useRouter()
const route = useRoute()
const { login, register, isLoading, error, clearError } = useAuth()

const activeTab = ref<'login' | 'register'>(
  route.name === 'register' ? 'register' : 'login'
)

const features = [
  'Gestión de proyectos en tiempo real',
  'Control de equipos y tareas',
  'Nómina y finanzas integradas',
  'Reportes y seguimiento de OKRs',
]

const loginSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
})

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['manager', 'sponsor'])
})

const loginForm = reactive<LoginCredentials>({
  email: '',
  password: ''
})

const registerForm = reactive<RegisterData & { name: string }>({
  email: '',
  password: '',
  role: 'manager',
  name: ''
})

const roleOptions = [
  { label: 'Gerente', value: 'manager' },
  { label: 'Patrocinador', value: 'sponsor' }
]

const handleLogin = async (event: any) => {
  clearError()
  try {
    await login(event.data)
    await router.push('/')
  } catch (err) {
    console.error('Error de login:', err)
  }
}

const handleRegister = async (event: any) => {
  clearError()
  try {
    const { name, ...registerData } = event.data
    await register(registerData)
    await router.push('/')
  } catch (err) {
    console.error('Error de registro:', err)
  }
}
</script>
