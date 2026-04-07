<script setup lang="ts">
import { ref } from 'vue'
import api from '@/services/api'

const props = defineProps<{
  url: string          // e.g. /api/projects/3/report/pdf
  filename?: string
  label?: string
  variant?: 'button' | 'menu-item'
}>()

const loading = ref(false)
const error = ref<string | null>(null)

async function exportPdf() {
  loading.value = true
  error.value = null
  try {
    const response = await api.get(props.url, {
      responseType: 'blob',
    })

    const blob = new Blob([response.data], { type: 'application/pdf' })
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = props.filename ?? 'reporte.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(objectUrl)
  } catch (e: any) {
    error.value = 'Error al generar el PDF'
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <button
    v-if="variant !== 'menu-item'"
    @click="exportPdf"
    :disabled="loading"
    class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors"
    style="background-color: #003C68;"
  >
    <UIcon
      :name="loading ? 'i-lucide-loader-2' : 'i-lucide-file-down'"
      class="w-4 h-4"
      :class="{ 'animate-spin': loading }"
    />
    {{ loading ? 'Generando...' : (label ?? 'Exportar PDF') }}
  </button>

  <!-- For use inside dropdown menus -->
  <span v-else @click="exportPdf" class="flex items-center gap-2 w-full cursor-pointer">
    <UIcon
      :name="loading ? 'i-lucide-loader-2' : 'i-lucide-file-down'"
      class="w-4 h-4"
      :class="{ 'animate-spin': loading }"
    />
    {{ loading ? 'Generando...' : (label ?? 'Exportar PDF') }}
  </span>
</template>
