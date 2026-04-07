<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = withDefaults(defineProps<{
  labels: string[]
  values: number[]
  colors?: string[]
  title?: string
  height?: number
}>(), {
  colors: () => ['#003C68', '#0070C0', '#00B0F0', '#92D050', '#FFC000', '#FF4B4B'],
  height: 220,
})

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      data: props.values,
      backgroundColor: props.colors.slice(0, props.values.length),
      borderWidth: 2,
      borderColor: '#fff',
      hoverOffset: 6,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 12,
        font: { size: 11 },
        usePointStyle: true,
        pointStyleWidth: 8,
      },
    },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed}`,
      },
    },
  },
}))
</script>

<template>
  <div>
    <p v-if="title" class="text-sm font-medium text-center mb-2">{{ title }}</p>
    <div :style="{ height: height + 'px' }">
      <Doughnut :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
