<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  value: number       // 0–100
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
  label?: string
  sublabel?: string
}>(), {
  size: 80,
  strokeWidth: 7,
  color: '#003C68',
  trackColor: '#E5E7EB',
})

const radius = computed(() => (props.size - props.strokeWidth) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const offset = computed(() =>
  circumference.value - (Math.min(100, Math.max(0, props.value)) / 100) * circumference.value
)
</script>

<template>
  <div class="flex flex-col items-center gap-1">
    <svg :width="size" :height="size">
      <!-- Track -->
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke="trackColor"
        :stroke-width="strokeWidth"
      />
      <!-- Progress -->
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke="color"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
        transform="rotate(-90)"
        :transform-origin="`${size / 2} ${size / 2}`"
        style="transition: stroke-dashoffset 0.6s ease"
      />
      <!-- Center text -->
      <text
        :x="size / 2"
        :y="size / 2 + 5"
        text-anchor="middle"
        dominant-baseline="middle"
        :font-size="size * 0.2"
        font-weight="bold"
        :fill="color"
      >
        {{ Math.round(value) }}%
      </text>
    </svg>
    <p v-if="label" class="text-xs font-medium text-center">{{ label }}</p>
    <p v-if="sublabel" class="text-xs text-muted-foreground text-center">{{ sublabel }}</p>
  </div>
</template>
