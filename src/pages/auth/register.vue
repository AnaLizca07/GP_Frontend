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

        <form @submit.prevent="handleSubmit" class="space-y-4">

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium mb-1">Correo electrónico <span class="text-red-500">*</span></label>
            <UInput
              v-model="form.email"
              type="email"
              placeholder="tu@cue.edu.co"
              :disabled="isLoading"
              autocomplete="email"
              size="lg"
              icon="i-lucide-mail"
              :color="touched.email && emailError ? 'error' : undefined"
              @blur="touched.email = true"
            />
            <p v-if="touched.email && emailError" class="text-xs text-red-500 mt-1 flex items-center gap-1">
              <UIcon name="i-lucide-circle-alert" class="w-3 h-3 shrink-0" />
              {{ emailError }}
            </p>
            <p v-else-if="!touched.email || !form.email" class="text-xs text-muted-foreground mt-1">
              Solo correos institucionales (@cue.edu.co o @unihumboldt.edu.co)
            </p>
          </div>

          <!-- Contraseña -->
          <div>
            <label class="block text-sm font-medium mb-1">Contraseña <span class="text-red-500">*</span></label>
            <UInput
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Mínimo 8 caracteres"
              :disabled="isLoading"
              autocomplete="new-password"
              size="lg"
              icon="i-lucide-lock"
              :color="touched.password && passwordError ? 'error' : undefined"
              :ui="{ trailing: 'pe-1' }"
              @blur="touched.password = true"
            >
              <template #trailing>
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  @click="showPassword = !showPassword"
                />
              </template>
            </UInput>
            <p v-if="touched.password && passwordError" class="text-xs text-red-500 mt-1 flex items-center gap-1">
              <UIcon name="i-lucide-circle-alert" class="w-3 h-3 shrink-0" />
              {{ passwordError }}
            </p>
          </div>

          <!-- Checklist requisitos contraseña -->
          <div v-if="form.password || touched.password" class="rounded-xl border border-default bg-elevated/30 p-3 space-y-1.5">
            <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Requisitos</p>
            <div
              v-for="req in passwordRequirements"
              :key="req.label"
              class="flex items-center gap-2 text-xs transition-colors"
              :class="req.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'"
            >
              <UIcon
                :name="req.met ? 'i-lucide-circle-check' : 'i-lucide-circle-dashed'"
                class="w-3.5 h-3.5 flex-shrink-0"
              />
              <span>{{ req.label }}</span>
            </div>
          </div>

          <!-- Confirmar contraseña -->
          <div>
            <label class="block text-sm font-medium mb-1">Confirmar contraseña <span class="text-red-500">*</span></label>
            <UInput
              v-model="form.confirmPassword"
              :type="showConfirm ? 'text' : 'password'"
              placeholder="Repite tu contraseña"
              :disabled="isLoading"
              autocomplete="new-password"
              size="lg"
              icon="i-lucide-lock-keyhole"
              :color="touched.confirmPassword && confirmError ? 'error' : undefined"
              :ui="{ trailing: 'pe-1' }"
              @blur="touched.confirmPassword = true"
            >
              <template #trailing>
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showConfirm ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  @click="showConfirm = !showConfirm"
                />
              </template>
            </UInput>
            <p v-if="touched.confirmPassword && confirmError" class="text-xs text-red-500 mt-1 flex items-center gap-1">
              <UIcon name="i-lucide-circle-alert" class="w-3 h-3 shrink-0" />
              {{ confirmError }}
            </p>
            <p v-else-if="form.confirmPassword && !confirmError" class="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
              <UIcon name="i-lucide-circle-check" class="w-3 h-3 shrink-0" />
              Las contraseñas coinciden
            </p>
          </div>

          <!-- Rol -->
          <div>
            <label class="block text-sm font-medium mb-1">Rol <span class="text-red-500">*</span></label>
            <USelect
              v-model="form.role"
              :options="roleOptions"
              :disabled="isLoading"
              placeholder="Selecciona tu rol"
              size="lg"
              icon="i-lucide-user-cog"
              :color="touched.role && roleError ? 'error' : undefined"
              @blur="touched.role = true"
            />
            <p v-if="touched.role && roleError" class="text-xs text-red-500 mt-1 flex items-center gap-1">
              <UIcon name="i-lucide-circle-alert" class="w-3 h-3 shrink-0" />
              {{ roleError }}
            </p>
          </div>

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
            :disabled="isLoading || !isFormValid"
            color="primary"
            class="mt-2"
          >
            Crear Cuenta
          </UButton>
        </form>

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
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import type { RegisterData } from '@/types/auth'

const router = useRouter()
const { register, isLoading, error, clearError } = useAuth()

const showPassword = ref(false)
const showConfirm  = ref(false)

const features = [
  'Gestión de proyectos en tiempo real',
  'Control de equipos y tareas',
  'Nómina y finanzas integradas',
  'Reportes y seguimiento de OKRs',
]

const roleOptions = [
  { label: 'Manager',       value: 'manager' },
  { label: 'Empleado',      value: 'employee' },
  { label: 'Patrocinador',  value: 'sponsor' },
]

const INSTITUTIONAL_DOMAINS = ['@cue.edu.co', '@unihumboldt.edu.co']
const isInstitutional = (email: string) =>
  INSTITUTIONAL_DOMAINS.some(d => email.toLowerCase().endsWith(d))

// ─── Form state ───────────────────────────────────────────────────────────────
const form = reactive<RegisterData & { confirmPassword: string }>({
  email: '',
  password: '',
  confirmPassword: '',
  role: 'employee',
})

// ─── Touched state (mostrar errores solo tras interacción) ────────────────────
const touched = reactive({ email: false, password: false, confirmPassword: false, role: false })

// ─── Validaciones en tiempo real ──────────────────────────────────────────────
const emailError = computed(() => {
  if (!form.email) return 'El correo es obligatorio'
  if (!form.email.includes('@')) return 'Ingresa un correo válido con @'
  if (!isInstitutional(form.email)) return 'Solo correos @cue.edu.co o @unihumboldt.edu.co'
  return null
})

const passwordError = computed(() => {
  if (!form.password) return 'La contraseña es obligatoria'
  if (form.password.length < 8) return 'Mínimo 8 caracteres'
  return null
})

const passwordRequirements = computed(() => [
  { label: 'Mínimo 8 caracteres',         met: form.password.length >= 8 },
  { label: 'Al menos una letra mayúscula', met: /[A-Z]/.test(form.password) },
  { label: 'Al menos una letra minúscula', met: /[a-z]/.test(form.password) },
  { label: 'Al menos un número',           met: /\d/.test(form.password) },
])

const confirmError = computed(() => {
  if (!form.confirmPassword) return 'Confirma tu contraseña'
  if (form.password !== form.confirmPassword) return 'Las contraseñas no coinciden'
  return null
})

const roleError = computed(() => {
  if (!form.role) return 'Selecciona un rol'
  return null
})

const isFormValid = computed(() =>
  !emailError.value &&
  !passwordError.value &&
  !confirmError.value &&
  !roleError.value
)

// ─── Submit ───────────────────────────────────────────────────────────────────
const handleSubmit = async () => {
  // Marcar todos como tocados para mostrar errores pendientes
  touched.email           = true
  touched.password        = true
  touched.confirmPassword = true
  touched.role            = true
  if (!isFormValid.value) return

  clearError()
  try {
    const { confirmPassword, ...registerData } = form
    await register(registerData)
    await router.push('/')
  } catch (err) {
    console.error('Error de registro:', err)
  }
}
</script>
