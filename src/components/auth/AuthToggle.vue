<template>
  <div class="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 mb-6">
    <button
      :class="[
        'flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-colors duration-200',
        activeTab === 'login'
          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
      ]"
      @click="$emit('update:activeTab', 'login')"
    >
      Iniciar Sesión
    </button>
    <button
      :class="[
        'flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-colors duration-200',
        activeTab === 'register'
          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
      ]"
      @click="$emit('update:activeTab', 'register')"
    >
      Registrarse
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  activeTab: 'login' | 'register'
}>()

defineEmits<{
  'update:activeTab': [value: 'login' | 'register']
}>()
</script>