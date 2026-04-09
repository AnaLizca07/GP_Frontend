<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const showCurrent  = ref(false)
const showNew      = ref(false)
const showConfirm  = ref(false)
const success      = ref(false)
const serverError  = ref<string | null>(null)

const form = reactive({ current: '', password: '', confirm: '' })
const touched = reactive({ current: false, password: false, confirm: false })

// ─── Validaciones en tiempo real ──────────────────────────────────────────────
const currentError = computed(() => {
  if (!form.current) return 'La contraseña actual es obligatoria'
  if (form.current.length < 6) return 'Mínimo 6 caracteres'
  return null
})

const passwordError = computed(() => {
  if (!form.password) return 'La nueva contraseña es obligatoria'
  if (form.password.length < 8) return 'Mínimo 8 caracteres'
  if (form.current && form.password === form.current) return 'Debe ser diferente a la contraseña actual'
  return null
})

const confirmError = computed(() => {
  if (!form.confirm) return 'Confirma tu nueva contraseña'
  if (form.password !== form.confirm) return 'Las contraseñas no coinciden'
  return null
})

const passwordRequirements = computed(() => [
  { label: 'Mínimo 8 caracteres',          met: form.password.length >= 8 },
  { label: 'Al menos una letra mayúscula',  met: /[A-Z]/.test(form.password) },
  { label: 'Al menos una letra minúscula',  met: /[a-z]/.test(form.password) },
  { label: 'Al menos un número',            met: /\d/.test(form.password) },
  { label: 'Las contraseñas coinciden',     met: form.password.length > 0 && form.password === form.confirm },
])

const isFormValid = computed(() =>
  !currentError.value && !passwordError.value && !confirmError.value
)

const isLoading = computed(() => authStore.isLoading)

const handleSubmit = async () => {
  touched.current  = true
  touched.password = true
  touched.confirm  = true
  if (!isFormValid.value) return

  serverError.value = null
  try {
    await authStore.changePassword(form.password)
    success.value = true
    form.current  = ''
    form.password = ''
    form.confirm  = ''
    touched.current  = false
    touched.password = false
    touched.confirm  = false
    setTimeout(() => { success.value = false }, 4000)
  } catch (err: any) {
    serverError.value =
      err.response?.data?.detail?.message ||
      err.response?.data?.detail ||
      'Error al actualizar la contraseña. Intenta de nuevo.'
  }
}
</script>

<template>
  <UPageCard
    title="Cambiar contraseña"
    description="Confirma tu contraseña actual y establece una nueva."
    variant="subtle"
  >
    <!-- Éxito -->
    <div v-if="success" class="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 mb-4">
      <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
      <p class="text-sm font-medium text-green-700 dark:text-green-300">¡Contraseña actualizada correctamente!</p>
    </div>

    <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 max-w-xs">

      <!-- Contraseña actual -->
      <div>
        <label class="block text-sm font-medium mb-1">Contraseña actual <span class="text-red-500">*</span></label>
        <UInput
          v-model="form.current"
          :type="showCurrent ? 'text' : 'password'"
          placeholder="Tu contraseña actual"
          :disabled="isLoading"
          autocomplete="current-password"
          size="md"
          :color="touched.current && currentError ? 'error' : undefined"
          :ui="{ trailing: 'pe-1' }"
          @blur="touched.current = true"
        >
          <template #trailing>
            <UButton color="neutral" variant="link" size="sm"
              :icon="showCurrent ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              @click="showCurrent = !showCurrent" />
          </template>
        </UInput>
        <p v-if="touched.current && currentError" class="text-xs text-red-500 mt-1 flex items-center gap-1">
          <UIcon name="i-lucide-circle-alert" class="w-3 h-3 shrink-0" />
          {{ currentError }}
        </p>
      </div>

      <!-- Nueva contraseña -->
      <div>
        <label class="block text-sm font-medium mb-1">Nueva contraseña <span class="text-red-500">*</span></label>
        <UInput
          v-model="form.password"
          :type="showNew ? 'text' : 'password'"
          placeholder="Mínimo 8 caracteres"
          :disabled="isLoading"
          autocomplete="new-password"
          size="md"
          :color="touched.password && passwordError ? 'error' : undefined"
          :ui="{ trailing: 'pe-1' }"
          @blur="touched.password = true"
        >
          <template #trailing>
            <UButton color="neutral" variant="link" size="sm"
              :icon="showNew ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              @click="showNew = !showNew" />
          </template>
        </UInput>
        <p v-if="touched.password && passwordError" class="text-xs text-red-500 mt-1 flex items-center gap-1">
          <UIcon name="i-lucide-circle-alert" class="w-3 h-3 shrink-0" />
          {{ passwordError }}
        </p>
      </div>

      <!-- Checklist requisitos -->
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

      <!-- Confirmar nueva contraseña -->
      <div>
        <label class="block text-sm font-medium mb-1">Confirmar contraseña <span class="text-red-500">*</span></label>
        <UInput
          v-model="form.confirm"
          :type="showConfirm ? 'text' : 'password'"
          placeholder="Repite la nueva contraseña"
          :disabled="isLoading"
          autocomplete="new-password"
          size="md"
          :color="touched.confirm && confirmError ? 'error' : undefined"
          :ui="{ trailing: 'pe-1' }"
          @blur="touched.confirm = true"
        >
          <template #trailing>
            <UButton color="neutral" variant="link" size="sm"
              :icon="showConfirm ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              @click="showConfirm = !showConfirm" />
          </template>
        </UInput>
        <p v-if="touched.confirm && confirmError" class="text-xs text-red-500 mt-1 flex items-center gap-1">
          <UIcon name="i-lucide-circle-alert" class="w-3 h-3 shrink-0" />
          {{ confirmError }}
        </p>
        <p v-else-if="form.confirm && !confirmError" class="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
          <UIcon name="i-lucide-circle-check" class="w-3 h-3 shrink-0" />
          Las contraseñas coinciden
        </p>
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
        label="Actualizar contraseña"
        :loading="isLoading"
        :disabled="isLoading || !isFormValid"
        class="w-fit"
      />
    </form>
  </UPageCard>

  <UPageCard
    title="Eliminar cuenta"
    description="¿Ya no quieres usar el servicio? Puedes eliminar tu cuenta aquí. Esta acción no es reversible. Toda la información relacionada con esta cuenta se eliminará permanentemente."
    class="bg-gradient-to-tl from-error/10 from-5% to-default"
  >
    <template #footer>
      <UButton label="Eliminar cuenta" color="error" />
    </template>
  </UPageCard>
</template>
