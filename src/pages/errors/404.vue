<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md text-center">
      <UPageCard
        variant="subtle"
        class="mb-4"
      >
          <div class="space-y-6">
            <div>
              <h1 class="text-6xl font-bold text-dimmed">404</h1>
              <h2 class="mt-4 text-2xl font-bold">
                Página No Encontrada
              </h2>
              <p class="mt-2 text-dimmed">
                La página que buscas no existe o ha sido movida.
              </p>
            </div>

            <UButton
              to="/"
              size="md"
              block
            >
              Volver al Dashboard
            </UButton>
          </div>
        </UPageCard>
      </div>
    </div>
</template>

<script setup lang="ts">
// Página de error 404
</script>