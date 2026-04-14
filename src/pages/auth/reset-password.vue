<template>
  <div class="min-h-screen flex">

    <!-- Panel izquierdo -->
    <div
      class="hidden lg:flex lg:w-2/5 flex-col items-center justify-center p-12 text-white"
      style="background-color: #003C68;"
    >
      <div class="w-20 h-20 rounded-2xl flex items-center justify-center mb-8" style="background-color: rgba(255,255,255,0.15);">
        <span class="text-4xl font-bold">PG</span>
      </div>
      <h1 class="text-4xl font-bold mb-3 tracking-tight">ProjeGest</h1>
      <p class="text-white/70 text-center text-base mb-14">Plataforma de Gestión de Proyectos</p>

      <div class="space-y-4 w-full max-w-xs">
        <div v-for="tip in securityTips" :key="tip" class="flex items-center gap-3">
          <div class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style="background-color: rgba(255,255,255,0.2);">
            <UIcon name="i-lucide-shield-check" class="w-3 h-3 text-white" />
          </div>
          <span class="text-sm text-white/80">{{ tip }}</span>
        </div>
      </div>
    </div>

    <!-- Panel derecho -->
    <div class="flex-1 flex items-center justify-center p-8 bg-white dark:bg-zinc-900">
      <div class="w-full max-w-sm">

        <!-- Logo móvil -->
        <div class="flex lg:hidden items-center gap-3 mb-10">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style="background-color: #003C68;">PG</div>
          <span class="text-xl font-bold">ProjeGest</span>
        </div>

        <!-- Cargando token -->
        <div v-if="isSettingUp" class="flex flex-col items-center gap-4 py-12">
          <UIcon name="i-lucide-loader-circle" class="w-10 h-10 text-primary animate-spin" />
          <p class="text-sm text-muted-foreground">Verificando enlace…</p>
        </div>

        <!-- Enlace inválido o expirado -->
        <div v-else-if="setupError" class="space-y-6">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-red-100 dark:bg-red-900/30">
              <UIcon name="i-lucide-link-2-off" class="w-5 h-5 text-red-600" />
            </div>
            <span class="text-xs font-semibold uppercase tracking-widest text-red-600">Enlace inválido</span>
          </div>
          <h2 class="text-2xl font-bold text-foreground">Enlace expirado o inválido</h2>
          <p class="text-sm text-muted-foreground">{{ setupError }}</p>
          <UButton block size="lg" color="primary" to="/auth/forgot-password">
            Solicitar nuevo enlace
          </UButton>
        </div>

        <!-- Éxito -->
        <div v-else-if="success" class="space-y-4">
          <div class="flex flex-col items-center gap-3 py-8 text-center">
            <div class="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <UIcon name="i-lucide-check-circle" class="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <p class="font-semibold text-foreground">¡Contraseña actualizada!</p>
            <p class="text-sm text-muted-foreground">Inicia sesión con tu nueva contraseña…</p>
          </div>
        </div>

        <!-- Formulario -->
        <template v-else>
          <div class="mb-8">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background-color: #DBEAFE;">
                <UIcon name="i-lucide-key-round" class="w-5 h-5" style="color: #1D4ED8;" />
              </div>
              <span class="text-xs font-semibold uppercase tracking-widest" style="color: #1D4ED8;">Recuperación de cuenta</span>
            </div>
            <h2 class="text-2xl font-bold text-foreground mb-1">Nueva contraseña</h2>
            <p class="text-sm text-muted-foreground">Elige una contraseña segura para tu cuenta.</p>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-5">

            <!-- Nueva contraseña -->
            <div class="space-y-1">
              <label class="text-sm font-medium text-foreground">
                Nueva contraseña <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Mínimo 8 caracteres"
                :disabled="isLoading"
                autocomplete="new-password"
                size="lg"
                icon="i-lucide-lock"
                class="w-full"
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
            </div>

            <!-- Confirmar contraseña -->
            <div class="space-y-1">
              <label class="text-sm font-medium text-foreground">
                Confirmar contraseña <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="form.confirm"
                :type="showConfirm ? 'text' : 'password'"
                placeholder="Repite tu contraseña"
                :disabled="isLoading"
                autocomplete="new-password"
                size="lg"
                icon="i-lucide-lock-keyhole"
                class="w-full"
                :ui="{ trailing: 'pe-1' }"
                @blur="touched.confirm = true"
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
            </div>

            <!-- Checklist de requisitos -->
            <div class="rounded-xl border border-default bg-elevated/30 p-4 space-y-2">
              <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Requisitos de seguridad</p>
              <div
                v-for="req in requirements"
                :key="req.label"
                class="flex items-center gap-2.5 text-sm transition-colors"
                :class="req.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'"
              >
                <UIcon
                  :name="req.met ? 'i-lucide-circle-check' : 'i-lucide-circle-dashed'"
                  class="w-4 h-4 flex-shrink-0 transition-all"
                />
                <span>{{ req.label }}</span>
              </div>
            </div>

            <!-- Error del servidor -->
            <UAlert
              v-if="serverError"
              color="error"
              variant="subtle"
              icon="i-lucide-alert-circle"
              :title="serverError"
            />

            <UButton
              type="submit"
              block
              size="lg"
              :loading="isLoading"
              :disabled="isLoading || !allRequirementsMet"
              color="primary"
              class="mt-1"
            >
              Establecer contraseña
            </UButton>
          </form>

          <div class="mt-8 pt-6 border-t border-default text-center">
            <span class="text-sm text-muted-foreground">¿Recuerdas tu contraseña? </span>
            <UButton variant="link" size="sm" class="p-0 font-medium" to="/login">
              Inicia sesión
            </UButton>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router = useRouter()

const isSettingUp = ref(true)
const setupError  = ref<string | null>(null)
const isLoading   = ref(false)
const serverError = ref<string | null>(null)
const success     = ref(false)

const showPassword = ref(false)
const showConfirm  = ref(false)
const form = reactive({ password: '', confirm: '' })
const touched = reactive({ password: false, confirm: false })

const securityTips = [
  'Usa una contraseña que no hayas usado antes',
  'Combina letras, números y símbolos',
  'No compartas tu contraseña con nadie',
  'Cierra sesión cuando uses equipos compartidos',
]

const requirements = computed(() => [
  { label: 'Mínimo 8 caracteres',         met: form.password.length >= 8 },
  { label: 'Al menos una letra mayúscula', met: /[A-Z]/.test(form.password) },
  { label: 'Al menos una letra minúscula', met: /[a-z]/.test(form.password) },
  { label: 'Al menos un número',           met: /\d/.test(form.password) },
  { label: 'Las contraseñas coinciden',    met: form.password.length > 0 && form.password === form.confirm },
])

const allRequirementsMet = computed(() => requirements.value.every(r => r.met))

onMounted(async () => {
  // Supabase pone el token en el hash: #access_token=...&refresh_token=...&type=recovery
  const hash = window.location.hash.substring(1)
  const params = new URLSearchParams(hash)

  const accessToken  = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  const type         = params.get('type')

  if (type !== 'recovery' || !accessToken || !refreshToken) {
    setupError.value = 'El enlace no es válido. Asegúrate de usar el botón del correo de recuperación.'
    isSettingUp.value = false
    return
  }

  const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })

  if (error) {
    setupError.value = 'El enlace expiró o ya fue utilizado. Solicita uno nuevo.'
  }

  isSettingUp.value = false
})

async function handleSubmit() {
  serverError.value = null
  isLoading.value = true

  try {
    const { error } = await supabase.auth.updateUser({ password: form.password })
    if (error) throw error

    success.value = true
    setTimeout(async () => {
      await supabase.auth.signOut()
      router.push('/login')
    }, 1500)
  } catch (err: any) {
    serverError.value = err.message || 'Error al actualizar la contraseña. Intenta de nuevo.'
  } finally {
    isLoading.value = false
  }
}
</script>
