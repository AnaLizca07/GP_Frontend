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
          <h2 class="text-2xl font-bold text-foreground mb-1">Bienvenido de vuelta</h2>
          <p class="text-sm text-muted-foreground">Ingresa tus credenciales para continuar</p>
        </div>

        <form @submit.prevent="handleSubmit(form)" class="space-y-5">
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
              type="password"
              placeholder="••••••••"
              :disabled="isLoading"
              autocomplete="current-password"
              size="lg"
              icon="i-lucide-lock"
              :color="touched.password && passwordError ? 'error' : undefined"
              @blur="touched.password = true"
            />
            <p v-if="touched.password && passwordError" class="text-xs text-red-500 mt-1 flex items-center gap-1">
              <UIcon name="i-lucide-circle-alert" class="w-3 h-3 shrink-0" />
              {{ passwordError }}
            </p>
          </div>

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
            :disabled="isLoading || !isFormValid"
            color="primary"
            class="mt-2"
          >
            Iniciar Sesión
          </UButton>
        </form>

        <div class="mt-8 pt-6 border-t border-default text-center">
          <span class="text-sm text-muted-foreground">¿No tienes cuenta? </span>
          <UButton to="/register" variant="link" size="sm" class="p-0 font-medium">
            Regístrate
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
import type { LoginCredentials } from '@/types/auth'

const router = useRouter()
const { login, isLoading, error, clearError } = useAuth()

const features = [
  'Gestión de proyectos en tiempo real',
  'Control de equipos y tareas',
  'Nómina y finanzas integradas',
  'Reportes y seguimiento de OKRs',
]

const INSTITUTIONAL_DOMAINS = ['@cue.edu.co', '@unihumboldt.edu.co']
const isInstitutional = (email: string) =>
  INSTITUTIONAL_DOMAINS.some(d => email.toLowerCase().endsWith(d))

const form = reactive<LoginCredentials>({ email: '', password: '' })

// ─── Touched state (mostrar errores solo tras interacción) ────────────────
const touched = reactive({ email: false, password: false })

// ─── Validaciones en tiempo real ──────────────────────────────────────────
const emailError = computed(() => {
  if (!form.email) return 'El correo es obligatorio'
  if (!form.email.includes('@')) return 'Ingresa un correo válido con @'
  if (!isInstitutional(form.email)) return 'Solo correos @cue.edu.co o @unihumboldt.edu.co'
  return null
})

const passwordError = computed(() => {
  if (!form.password) return 'La contraseña es obligatoria'
  if (form.password.length < 6) return 'Mínimo 6 caracteres'
  return null
})

const isFormValid = computed(() => !emailError.value && !passwordError.value)

// ─── Submit ───────────────────────────────────────────────────────────────
const handleSubmit = async (data: LoginCredentials) => {
  // Marcar todos como tocados para mostrar errores pendientes
  touched.email = true
  touched.password = true
  if (!isFormValid.value) return

  clearError()
  try {
    await login(data)
    await router.push('/')
  } catch (err) {
    console.error('Error de login:', err)
  }
}
</script>
