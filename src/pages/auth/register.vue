<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <UPageCard
        title="Crear Cuenta"
        description="Sistema de Gestión de Proyectos"
        variant="subtle"
        class="mb-4"
      >
          <UForm
            :schema="registerSchema"
            :state="form"
            @submit="handleSubmit"
          >
            <UFormField
              name="email"
              label="Correo electrónico"
              required
              class="mb-4"
            >
              <UInput
                v-model="form.email"
                type="email"
                placeholder="tu@ejemplo.com"
                :disabled="isLoading"
                autocomplete="email"
              />
            </UFormField>

            <UFormField
              name="password"
              label="Contraseña"
              required
              class="mb-4"
            >
              <UInput
                v-model="form.password"
                type="password"
                placeholder="••••••••"
                :disabled="isLoading"
                autocomplete="new-password"
              />
            </UFormField>

            <UFormField
              name="confirmPassword"
              label="Confirmar Contraseña"
              required
              class="mb-4"
            >
              <UInput
                v-model="form.confirmPassword"
                type="password"
                placeholder="••••••••"
                :disabled="isLoading"
                autocomplete="new-password"
              />
            </UFormField>

            <UFormField
              name="role"
              label="Rol"
              required
              class="mb-6"
            >
              <USelect
                v-model="form.role"
                :options="roleOptions"
                :disabled="isLoading"
                placeholder="Selecciona tu rol"
              />
            </UFormField>

            <UAlert
              v-if="error"
              color="error"
              variant="subtle"
              :title="error"
              class="mb-4"
            />

            <UButton
              type="submit"
              block
              :loading="isLoading"
              :disabled="isLoading"
              class="mb-4"
            >
              Crear Cuenta
            </UButton>

            <div class="text-center">
              <UButton
                to="/login"
                variant="link"
                size="sm"
                :disabled="isLoading"
                class="p-0"
              >
                ¿Ya tienes cuenta? Inicia sesión
              </UButton>
            </div>
          </UForm>
        </UPageCard>
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

const registerSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirma tu contraseña'),
  role: z.enum(['manager', 'employee', 'sponsor']).catch('employee')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
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