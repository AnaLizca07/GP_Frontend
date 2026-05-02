<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from 'chart.js'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title)

const props = withDefaults(defineProps<{
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    color?: string
  }>
  title?: string
  height?: number
  horizontal?: boolean
  stacked?: boolean
  yLabel?: string
}>(), {
  height: 240,
  horizontal: false,
  stacked: false,
})

const PALETTE = ['#3B82F6', '#60A5FA', '#7DD3FC', '#6EE7B7', '#FCD34D', '#FCA5A5']

const chartData = computed(() => ({
  labels: props.labels,
  datasets: props.datasets.map((ds, i) => ({
    label: ds.label,
    data: ds.data,
    backgroundColor: ds.color || PALETTE[i % PALETTE.length],
    borderRadius: 4,
    borderSkipped: false,
  })),
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: props.horizontal ? ('y' as const) : ('x' as const),
  scales: {
    x: { stacked: props.stacked, grid: { display: false } },
    y: {
      stacked: props.stacked,
      beginAtZero: true,
      title: props.yLabel ? { display: true, text: props.yLabel } : undefined,
      grid: { color: 'rgba(0,0,0,0.06)' },
    },
  },
  plugins: {
    legend: {
      display: props.datasets.length > 1,
      position: 'top' as const,
      labels: { font: { size: 11 }, usePointStyle: true },
    },
    title: props.title
      ? { display: true, text: props.title, font: { size: 13 } }
      : { display: false },
    tooltip: { mode: 'index' as const, intersect: false },
  },
}))
</script>

<template>
  <div :style="{ height: height + 'px' }">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>
