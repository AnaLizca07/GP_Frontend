<script setup lang="ts">
withDefaults(defineProps<{
  value: number        // 0–100
  label?: string
  color?: string
  showPercent?: boolean
  height?: number
}>(), {
  color: '#003C68',
  showPercent: true,
  height: 8,
})
</script>

<template>
  <div>
    <div v-if="label || showPercent" class="flex justify-between items-center mb-1">
      <span v-if="label" class="text-xs text-muted-foreground">{{ label }}</span>
      <span v-if="showPercent" class="text-xs font-semibold ml-auto">{{ Math.round(value) }}%</span>
    </div>
    <div
      class="w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
      :style="{ height: height + 'px' }"
    >
      <div
        class="h-full rounded-full transition-all duration-500"
        :style="{
          width: Math.min(100, Math.max(0, value)) + '%',
          backgroundColor: color,
        }"
      />
    </div>
  </div>
</template>
