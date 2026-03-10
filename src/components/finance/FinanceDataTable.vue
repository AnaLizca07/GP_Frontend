<template>
  <UCard class="overflow-hidden">
    <div class="px-6 py-4 border-b border-border">
      <h3 class="text-lg font-semibold flex items-center gap-2">
        <UIcon :name="icon" class="w-5 h-5" />
        {{ title }}
      </h3>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-muted/50">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-background divide-y divide-border">
          <tr v-if="loading" class="hover:bg-muted/50">
            <td :colspan="columns.length" class="px-6 py-8 text-center text-muted-foreground">
              <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin mx-auto mb-2" />
              <p>Cargando datos...</p>
            </td>
          </tr>
          <tr v-else-if="!data || data.length === 0" class="hover:bg-muted/50">
            <td :colspan="columns.length" class="px-6 py-8 text-center text-muted-foreground">
              <UIcon :name="emptyIcon" class="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>{{ emptyMessage }}</p>
            </td>
          </tr>
          <tr
            v-else
            v-for="(item, index) in paginatedData"
            :key="item.id || index"
            class="hover:bg-muted/50"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-4 whitespace-nowrap text-sm"
            >
              <slot
                :name="`cell-${column.key}`"
                :item="item"
                :value="getNestedValue(item, column.key)"
              >
                <span v-if="column.type === 'currency'" class="font-medium">
                  {{ formatCurrency(getNestedValue(item, column.key)) }}
                </span>
                <span v-else-if="column.type === 'date'">
                  {{ formatDate(getNestedValue(item, column.key)) }}
                </span>
                <span
                  v-else-if="column.type === 'status'"
                  :class="getStatusClass(getNestedValue(item, column.key))"
                  class="px-2 py-1 text-xs font-medium rounded-full"
                >
                  {{ getNestedValue(item, column.key) }}
                </span>
                <span v-else>
                  {{ getNestedValue(item, column.key) }}
                </span>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="data && data.length > itemsPerPage" class="px-6 py-4 border-t border-border">
      <div class="flex items-center justify-between">
        <div class="text-sm text-muted-foreground">
          Mostrando {{ startIndex + 1 }} - {{ endIndex }} de {{ totalItems }} registros
        </div>
        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-chevron-left"
            variant="outline"
            size="sm"
            :disabled="currentPage === 1"
            @click="currentPage--"
          />
          <span class="text-sm px-2">{{ currentPage }} de {{ totalPages }}</span>
          <UButton
            icon="i-lucide-chevron-right"
            variant="outline"
            size="sm"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          />
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Column {
  key: string
  label: string
  type?: 'text' | 'currency' | 'date' | 'status'
}

interface Props {
  title: string
  icon: string
  data: any[]
  columns: Column[]
  loading?: boolean
  emptyMessage?: string
  emptyIcon?: string
  itemsPerPage?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyMessage: 'No hay datos disponibles',
  emptyIcon: 'i-lucide-inbox',
  itemsPerPage: 10
})

const currentPage = ref(1)

const totalItems = computed(() => props.data?.length || 0)
const totalPages = computed(() => Math.ceil(totalItems.value / props.itemsPerPage))
const startIndex = computed(() => (currentPage.value - 1) * props.itemsPerPage)
const endIndex = computed(() => Math.min(startIndex.value + props.itemsPerPage, totalItems.value))

const paginatedData = computed(() => {
  if (!props.data) return []
  return props.data.slice(startIndex.value, endIndex.value)
})

const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

const formatCurrency = (value: number) => {
  if (typeof value !== 'number') return value
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(value)
}

const formatDate = (value: string) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('es-CO')
}

const getStatusClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pagado':
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'pendiente':
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'procesado':
    case 'processed':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
</script>