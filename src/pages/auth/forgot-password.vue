<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex flex-col items-center justify-center p-4">
    <AuthHeader />

    <AuthCard>
      <div class="text-center mb-6">
        <h2 class="text-xl font-semibold text-zinc-900 dark:text-white mb-2">Recuperar Contraseña</h2>
        <p class="text-zinc-600 dark:text-zinc-400 text-sm">Ingresa tu correo electrónico para recibir instrucciones de recuperación</p>
      </div>

      <UAlert
        v-if="emailSent"
        color="success"
        variant="subtle"
        title="Correo enviado"
        description="Se ha enviado un correo electrónico con las instrucciones de recuperación."
        class="mb-6"
      />

      <UForm
        v-else
        :schema="forgotPasswordSchema"
        :state="form"
        @submit="handleSubmit"
        class="space-y-4"
      >
        <UFormField
          name="email"
          label="Correo Electrónico"
          required
        >
          <UInput
            v-model="form.email"
            type="email"
            placeholder="tu@email.com"
            :disabled="isLoading"
            autocomplete="email"
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
          Enviar Instrucciones
        </UButton>
      </UForm>

      <div class="text-center mt-6 pt-4 border-t border-gray-200">
        <UButton
          to="/login"
          variant="link"
          size="sm"
          :disabled="isLoading"
          class="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          Volver al inicio de sesión
        </UButton>
      </div>
    </AuthCard>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { z } from 'zod'
import { useAuth } from '@/composables/useAuth'
import AuthHeader from '@/components/auth/AuthHeader.vue'
import AuthCard from '@/components/auth/AuthCard.vue'

const { requestPasswordReset, isLoading, error, clearError } = useAuth()

const emailSent = ref(false)

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