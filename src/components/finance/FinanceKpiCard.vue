<template>
  <UCard class="p-6">
    <div>
      <h3 class="text-sm font-medium text-muted-foreground mb-2">{{ title }}</h3>
      <p :class="[
        'text-3xl font-bold mb-1',
        color === 'green' ? 'text-success' :
        color === 'red' ? 'text-red-500' :
        color === 'blue' ? 'text-blue-500' : 'text-foreground'
      ]">
        {{ value }}
      </p>
      <p class="text-sm text-muted-foreground">{{ subtitle }}</p>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Props {
  title: string
  value: string
  subtitle: string
  color?: 'green' | 'red' | 'blue' | 'default'
}

withDefaults(defineProps<Props>(), {
  color: 'default'
})
</script>