<template>
  <div class="min-h-screen flex">

    <!-- Panel izquierdo: marca -->
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
        <div v-for="tip in tips" :key="tip" class="flex items-center gap-3">
          <div class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style="background-color: rgba(255,255,255,0.2);">
            <UIcon name="i-lucide-info" class="w-3 h-3 text-white" />
          </div>
          <span class="text-sm text-white/80">{{ tip }}</span>
        </div>
      </div>
    </div>

    <!-- Panel derecho: formulario -->
    <div class="flex-1 flex items-center justify-center bg-white dark:bg-zinc-900">
      <div class="w-full max-w-md px-8 py-12">

        <!-- Logo móvil -->
        <div class="flex lg:hidden items-center gap-3 mb-10">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style="background-color: #003C68;">PG</div>
          <span class="text-xl font-bold">ProjeGest</span>
        </div>

        <div class="mb-8">
          <h2 class="text-2xl font-bold text-foreground mb-1">Recuperar contraseña</h2>
          <p class="text-sm text-muted-foreground">Ingresa tu correo y te enviaremos las instrucciones</p>
        </div>

        <!-- Éxito -->
        <div v-if="emailSent" class="space-y-6">
          <div class="flex flex-col items-center gap-3 py-8 text-center">
            <div class="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <UIcon name="i-lucide-mail-check" class="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <p class="font-semibold text-foreground">¡Correo enviado!</p>
            <p class="text-sm text-muted-foreground">Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.</p>
          </div>
        </div>

        <!-- Formulario -->
        <UForm
          v-else
          :schema="forgotPasswordSchema"
          :state="form"
          @submit="handleSubmit"
          class="space-y-5"
        >
          <UFormField name="email" label="Correo electrónico" required class="w-full">
            <UInput
              v-model="form.email"
              type="email"
              placeholder="tu@email.com"
              :disabled="isLoading"
              autocomplete="email"
              size="lg"
              icon="i-lucide-mail"
              class="w-full"
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
            class="w-full"
          >
            Enviar instrucciones
          </UButton>
        </UForm>

        <div class="mt-8 pt-6 border-t border-default text-center">
          <span class="text-sm text-muted-foreground">¿Recordaste tu contraseña? </span>
          <UButton to="/login" variant="link" size="sm" class="p-0 font-medium">
            Inicia sesión
          </UButton>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { z } from 'zod'
import { useAuth } from '@/composables/useAuth'

const { requestPasswordReset, isLoading, error, clearError } = useAuth()

const emailSent = ref(false)

const tips = [
  'Revisa también tu carpeta de spam',
  'El enlace de recuperación expira en 24 horas',
  'Usa una contraseña segura y única',
  'Nunca compartas tu contraseña con nadie',
]

const forgotPasswordSchema = z.object({
  email: z.string().email('Ingresa un email válido')
})

const form = reactive({
  email: ''
})

const handleSubmit = async () => {
  clearError()
  try {
    await requestPasswordReset(form.email)
    emailSent.value = true
  } catch (err) {
    console.error('Error al solicitar reseteo:', err)
  }
}
</script>
