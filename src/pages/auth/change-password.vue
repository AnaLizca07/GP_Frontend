<template>
  <div class="min-h-screen flex">

    <!-- Panel izquierdo: marca + contexto de seguridad -->
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
        <div
          v-for="tip in securityTips"
          :key="tip"
          class="flex items-center gap-3"
        >
          <div class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style="background-color: rgba(255,255,255,0.2);">
            <UIcon name="i-lucide-shield-check" class="w-3 h-3 text-white" />
          </div>
          <span class="text-sm text-white/80">{{ tip }}</span>
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

        <!-- Ícono de alerta + título -->
        <div class="mb-8">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background-color: #FEF3C7;">
              <UIcon name="i-lucide-lock-keyhole" class="w-5 h-5" style="color: #D97706;" />
            </div>
            <span class="text-xs font-semibold uppercase tracking-widest" style="color: #D97706;">Acción requerida</span>
          </div>
          <h2 class="text-2xl font-bold text-foreground mb-1">Establece tu contraseña</h2>
          <p class="text-sm text-muted-foreground">
            Tu cuenta fue creada con una contraseña temporal. Debes definir una contraseña permanente para continuar.
          </p>
        </div>

        <!-- Éxito -->
        <div v-if="success" class="space-y-4">
          <div class="flex flex-col items-center gap-3 py-8 text-center">
            <div class="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <UIcon name="i-lucide-check-circle" class="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <p class="font-semibold text-foreground">¡Contraseña actualizada!</p>
            <p class="text-sm text-muted-foreground">Inicia sesión con tu nueva contraseña…</p>
          </div>
        </div>

        <!-- Formulario -->
        <UForm
          v-else
          :schema="schema"
          :state="form"
          @submit="handleSubmit"
          class="space-y-5"
        >
          <UFormField name="password" label="Nueva contraseña" required>
            <UInput
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Mínimo 8 caracteres"
              :disabled="isLoading"
              autocomplete="new-password"
              size="lg"
              icon="i-lucide-lock"
              :ui="{ trailing: 'pe-1' }"
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
          </UFormField>

          <UFormField name="confirm" label="Confirmar contraseña" required>
            <UInput
              v-model="form.confirm"
              :type="showConfirm ? 'text' : 'password'"
              placeholder="Repite tu contraseña"
              :disabled="isLoading"
              autocomplete="new-password"
              size="lg"
              icon="i-lucide-lock-keyhole"
              :ui="{ trailing: 'pe-1' }"
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
          </UFormField>

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
        </UForm>

        <!-- Logout -->
        <div class="mt-8 pt-6 border-t border-default text-center">
          <span class="text-sm text-muted-foreground">¿No eres tú? </span>
          <UButton
            variant="link"
            size="sm"
            class="p-0 font-medium"
            :disabled="isLoading"
            @click="handleLogout"
          >
            Cerrar sesión
          </UButton>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const showPassword = ref(false)
const showConfirm  = ref(false)
const success      = ref(false)
const serverError  = ref<string | null>(null)

const form = reactive({ password: '', confirm: '' })

const schema = z
  .object({
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirm: z.string(),
  })
  .refine(d => d.password === d.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  })

const securityTips = [
  'Usa una contraseña que no hayas usado antes',
  'Combina letras, números y símbolos',
  'No compartas tu contraseña con nadie',
  'Cierra sesión cuando uses equipos compartidos',
]

const requirements = computed(() => [
  { label: 'Mínimo 8 caracteres',          met: form.password.length >= 8 },
  { label: 'Al menos una letra mayúscula',  met: /[A-Z]/.test(form.password) },
  { label: 'Al menos una letra minúscula',  met: /[a-z]/.test(form.password) },
  { label: 'Al menos un número',            met: /\d/.test(form.password) },
  { label: 'Las contraseñas coinciden',     met: form.password.length > 0 && form.password === form.confirm },
])

const allRequirementsMet = computed(() => requirements.value.every(r => r.met))
const isLoading = computed(() => authStore.isLoading)

async function handleSubmit() {
  serverError.value = null
  try {
    await authStore.changePassword(form.password)
    success.value = true
    // Cerrar sesión y redirigir al login para que el usuario ingrese con su nueva contraseña
    setTimeout(async () => {
      await authStore.logout()
      router.push('/login')
    }, 1500)
  } catch (err: any) {
    serverError.value =
      err.response?.data?.detail?.message ||
      err.response?.data?.detail ||
      'Error al actualizar la contraseña. Intenta de nuevo.'
  }
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>
