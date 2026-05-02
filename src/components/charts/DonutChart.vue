<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip)

const props = withDefaults(defineProps<{
  labels: string[]
  values: number[]
  colors?: string[]
  title?: string
  height?: number
}>(), {
  colors: () => ['#3B82F6', '#60A5FA', '#7DD3FC', '#6EE7B7', '#FCD34D', '#FCA5A5'],
  height: 220,
})

const total = computed(() => props.values.reduce((s, v) => s + v, 0))

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      data: props.values,
      backgroundColor: props.colors.slice(0, props.values.length),
      borderWidth: 0,
      hoverOffset: 6,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '72%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed}`,
      },
    },
  },
}))

const legendItems = computed(() =>
  props.labels.map((label, i) => ({
    label,
    value: props.values[i] ?? 0,
    color: (props.colors[i] ?? props.colors[0]),
    pct: total.value > 0 ? Math.round(((props.values[i] ?? 0) / total.value) * 100) : 0,
  }))
)
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center gap-6 px-2 py-1">
    <!-- Donut -->
    <div class="relative shrink-0" style="width: 160px; height: 160px;">
      <Doughnut :data="chartData" :options="chartOptions" />
      <!-- Center label -->
      <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span class="text-2xl font-bold text-foreground leading-none">{{ total }}</span>
        <span class="text-xs text-muted-foreground mt-0.5">{{ title || 'Total' }}</span>
      </div>
    </div>

    <!-- Legend / stats -->
    <div class="flex-1 w-full space-y-2.5">
      <div
        v-for="item in legendItems"
        :key="item.label"
        class="flex items-center gap-3"
      >
        <!-- Color dot -->
        <span class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: item.color }" />
        <!-- Label -->
        <span class="text-sm text-muted-foreground flex-1 truncate">{{ item.label }}</span>
        <!-- Bar -->
        <div class="w-20 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
          <div
            class="h-full rounded-full transition-all duration-500"
            :style="{ width: item.pct + '%', backgroundColor: item.color }"
          />
        </div>
        <!-- Value + % -->
        <span class="text-sm font-semibold text-foreground w-8 text-right shrink-0">{{ item.value }}</span>
        <span class="text-xs text-muted-foreground w-8 text-right shrink-0">{{ item.pct }}%</span>
      </div>
    </div>
  </div>
</template>
