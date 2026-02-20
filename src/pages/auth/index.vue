<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex flex-col items-center justify-center p-4">
    <AuthHeader />

    <AuthCard>
      <AuthToggle v-model:active-tab="activeTab" />

      <!-- Login Form -->
      <div v-show="activeTab === 'login'">
        <UForm
          :schema="loginSchema"
          :state="loginForm"
          @submit="handleLogin"
          class="space-y-4"
        >
          <UFormField
            name="email"
            label="Correo Electrónico"
            required
          >
            <UInput
              v-model="loginForm.email"
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
              v-model="loginForm.password"
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
        </UForm>
      </div>

      <!-- Register Form -->
      <div v-show="activeTab === 'register'">
        <UForm
          :schema="registerSchema"
          :state="registerForm"
          @submit="handleRegister"
          class="space-y-4"
        >
          <UFormField
            name="name"
            label="Nombre Completo"
            required
          >
            <UInput
              v-model="registerForm.name"
              type="text"
              placeholder="Juan Pérez"
              :disabled="isLoading"
              autocomplete="name"
              size="lg"
              class="h-12"
            />
          </UFormField>

          <UFormField
            name="email"
            label="Correo Electrónico"
            required
          >
            <UInput
              v-model="registerForm.email"
              type="email"
              placeholder="juan@empresa.com"
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
              v-model="registerForm.password"
              type="password"
              placeholder="••••••••"
              :disabled="isLoading"
              autocomplete="new-password"
              size="lg"
              class="h-12"
            />
          </UFormField>

          <UFormField
            name="role"
            label="Rol"
            required
          >
            <USelect
              v-model="registerForm.role"
              :options="roleOptions"
              :disabled="isLoading"
              placeholder="Empleado"
              size="lg"
              class="h-12"
            />
          </UFormField>

          <UFormField
            name="department"
            label="Departamento"
          >
            <USelect
              v-model="registerForm.department"
              :options="departmentOptions"
              :disabled="isLoading"
              placeholder="Seleccionar departamento"
              size="lg"
              class="h-12"
            />
          </UFormField>

          <UFormField
            name="position"
            label="Cargo"
          >
            <UInput
              v-model="registerForm.position"
              type="text"
              placeholder="Desarrollador Senior"
              :disabled="isLoading"
              size="lg"
              class="h-12"
            />
          </UFormField>

          <UFormField
            name="phone"
            label="Teléfono"
          >
            <UInput
              v-model="registerForm.phone"
              type="tel"
              placeholder="+34 600 000 000"
              :disabled="isLoading"
              autocomplete="tel"
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
            Crear Cuenta
          </UButton>
        </UForm>
      </div>

      <div class="text-center mt-6 pt-4 border-t border-gray-200">
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
    </AuthCard>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { z } from 'zod'
import { useAuth } from '@/composables/useAuth'
import type { LoginCredentials, RegisterData } from '@/types/auth'
import AuthHeader from '@/components/auth/AuthHeader.vue'
import AuthCard from '@/components/auth/AuthCard.vue'
import AuthToggle from '@/components/auth/AuthToggle.vue'

const router = useRouter()
const route = useRoute()
const { login, register, isLoading, error, clearError } = useAuth()

// Determinar tab activo basado en la ruta
const activeTab = ref<'login' | 'register'>(
  route.name === 'register' ? 'register' : 'login'
)

// Esquemas de validación
const loginSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
})

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['manager', 'employee', 'sponsor']).refine(val => val, {
    message: 'Selecciona un rol'
  }),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional()
})

// Formularios
const loginForm = reactive<LoginCredentials>({
  email: '',
  password: ''
})

const registerForm = reactive<RegisterData & {
  name: string
  department?: string
  position?: string
  phone?: string
}>({
  email: '',
  password: '',
  role: 'employee',
  name: '',
  department: '',
  position: '',
  phone: ''
})

// Opciones
const roleOptions = [
  { label: 'Manager', value: 'manager' },
  { label: 'Empleado', value: 'employee' },
  { label: 'Patrocinador', value: 'sponsor' }
]

const departmentOptions = [
  { label: 'Desarrollo', value: 'development' },
  { label: 'Diseño', value: 'design' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Ventas', value: 'sales' },
  { label: 'Recursos Humanos', value: 'hr' },
  { label: 'Finanzas', value: 'finance' }
]

// Manejadores
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
    const { name, department, position, phone, ...registerData } = event.data
    await register(registerData)
    await router.push('/')
  } catch (err) {
    console.error('Error de registro:', err)
  }
}
</script>