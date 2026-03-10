<template>
  <div class="space-y-6">
    <!-- KPI Cards and Action Button -->
    <div class="flex flex-col lg:flex-row gap-6">
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <UCard v-for="kpi in ingresosKpis" :key="kpi.titulo" class="p-6">
          <div>
            <h3 class="text-sm font-medium text-muted-foreground mb-2">{{ kpi.titulo }}</h3>
            <p class="text-3xl font-bold text-success mb-1">{{ kpi.valor }}</p>
            <p class="text-sm text-muted-foreground">{{ kpi.subtexto }}</p>
          </div>
        </UCard>
      </div>

      <!-- Register Income Button -->
      <div class="flex items-center">
        <UButton
          icon="i-lucide-plus"
          label="Registrar ingreso"
          color="neutral"
          size="lg"
          class="h-fit"
          @click="openIncomeModal"
        />
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Income by Month Chart -->
      <UCard class="lg:col-span-2">
        <template #header>
          <h3 class="text-lg font-semibold">Ingresos por mes</h3>
        </template>

        <div class="h-64 flex items-center justify-center">
          <div class="text-center">
            <UIcon name="i-lucide-bar-chart-3" class="w-12 h-12 text-green-500 mb-2" />
            <p class="text-sm text-muted-foreground">Gráfico de barras de ingresos</p>
            <p class="text-xs text-muted-foreground mt-1">Datos de Enero a Junio 2026</p>
          </div>
        </div>

        <template #footer>
          <div class="text-xs text-muted-foreground">
            Promedio mensual: ${{ Math.round(ingresosChartData.reduce((sum, item) => sum + item.ingresos, 0) / ingresosChartData.length).toLocaleString() }}
          </div>
        </template>
      </UCard>

      <!-- Budget Utilization Chart -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Utilización del presupuesto</h3>
        </template>

        <div class="h-64 flex items-center justify-center">
          <div class="relative w-32 h-32">
            <svg class="transform -rotate-90 w-32 h-32">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                stroke-width="8"
                fill="transparent"
                class="text-muted"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                stroke-width="8"
                fill="transparent"
                stroke-dasharray="351.86"
                :stroke-dashoffset="351.86 - (351.86 * budgetUtilization) / 100"
                class="text-blue-500"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-2xl font-bold">{{ budgetUtilization }}%</span>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Income List Table -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Listado de ingresos</h3>
          <div class="flex gap-2">
            <UButton icon="i-lucide-filter" variant="outline" size="sm" />
            <UButton icon="i-lucide-download" variant="outline" size="sm" />
          </div>
        </div>
      </template>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-muted/50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Concepto</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Categoría</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Origen</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Proyecto</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Monto</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-background divide-y divide-border">
            <tr v-for="item in incomeTableData" :key="item.id" class="hover:bg-muted/50">
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ formatDate(item.date) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">{{ item.concept }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {{ item.category }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ item.origin }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ item.project || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">${{ item.amount.toLocaleString() }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <div class="flex gap-2">
                  <UButton icon="i-lucide-eye" variant="ghost" size="sm" />
                  <UButton icon="i-lucide-edit" variant="ghost" size="sm" />
                  <UButton icon="i-lucide-trash-2" variant="ghost" size="sm" color="red" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <template #footer>
        <div class="flex items-center justify-between">
          <div class="text-sm text-muted-foreground">
            Mostrando 1-{{ incomeTableData.length }} de {{ incomeTableData.length }} registros
          </div>
          <div class="flex items-center gap-2">
            <UButton icon="i-lucide-chevron-left" variant="outline" size="sm" disabled />
            <UButton variant="outline" size="sm">1</UButton>
            <UButton icon="i-lucide-chevron-right" variant="outline" size="sm" disabled />
          </div>
        </div>
      </template>
    </UCard>

    <!-- Income Registration Modal -->
    <div
      v-if="incomeModalOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="closeIncomeModal"
    >
      <div class="bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-emerald-900/20 to-green-900/20">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-emerald-600 rounded-lg">
                <UIcon name="i-lucide-plus-circle" class="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 class="text-xl font-semibold text-white">Registrar Ingreso</h2>
                <p class="text-sm text-slate-300">Registra un nuevo ingreso</p>
              </div>
            </div>
            <button
              @click="closeIncomeModal"
              :disabled="submittingIncome"
              class="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <UIcon name="i-lucide-x" class="w-6 h-6" />
            </button>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form @submit.prevent="submitIncome" class="space-y-6">
            <!-- Concept Field -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Concepto *</label>
              <input
                v-model="incomeForm.concept"
                type="text"
                placeholder="Ej: Pago cliente / Venta producto"
                :disabled="submittingIncome"
                class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
              />
            </div>

            <!-- Amount and Date Row -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Monto *</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
                  <input
                    v-model.number="incomeForm.amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    :disabled="submittingIncome"
                    class="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Fecha *</label>
                <input
                  v-model="incomeForm.date"
                  type="date"
                  :disabled="submittingIncome"
                  class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
                />
              </div>
            </div>

            <!-- Description Field -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Descripción (opcional)</label>
              <textarea
                v-model="incomeForm.description"
                rows="3"
                placeholder="Descripción adicional del ingreso"
                :disabled="submittingIncome"
                class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 resize-none"
              ></textarea>
            </div>

            <!-- Category Field -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Categoría</label>
              <select
                v-model="incomeForm.category_id"
                :disabled="submittingIncome"
                class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">Seleccionar categoría</option>
                <option
                  v-for="category in availableCategories"
                  :key="category.value"
                  :value="category.value"
                  class="bg-slate-800 text-white"
                >
                  {{ category.label }}
                </option>
              </select>
            </div>

            <!-- New Category Field -->
            <div class="flex items-end gap-3">
              <div class="flex-1">
                <label class="block text-sm font-medium text-slate-300 mb-2">Nueva categoría (opcional)</label>
                <input
                  v-model="incomeForm.new_category"
                  type="text"
                  placeholder="Nombre de nueva categoría"
                  :disabled="submittingIncome"
                  class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
                />
              </div>
              <button
                type="button"
                :disabled="!incomeForm.new_category.trim() || submittingIncome"
                @click="() => {
                  if (incomeForm.new_category.trim()) {
                    console.log('Creating category:', incomeForm.new_category.trim())
                  }
                }"
                class="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-400 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                Agregar
              </button>
            </div>

            <!-- Origin Field -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Origen *</label>
              <input
                v-model="incomeForm.origin"
                type="text"
                placeholder="Ej: Cliente / Contrato"
                :disabled="submittingIncome"
                class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
              />
            </div>

            <!-- Project Field -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Proyecto (opcional)</label>
              <input
                v-model="incomeForm.project"
                type="text"
                placeholder="Ej: Portal de Clientes"
                :disabled="submittingIncome"
                class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
              />
            </div>
          </form>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-slate-700 bg-slate-800/50">
          <div class="flex items-center justify-between">
            <div class="text-sm text-slate-400">
              <span v-if="incomeForm.amount">
                Complete los campos obligatorios
              </span>
              <span v-else>Complete los campos obligatorios</span>
            </div>
            <div class="flex gap-3">
              <button
                type="button"
                @click="closeIncomeModal"
                :disabled="submittingIncome"
                class="px-4 py-2 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                @click="submitIncome"
                :disabled="submittingIncome || !incomeForm.concept.trim() || !incomeForm.amount || !incomeForm.date || !incomeForm.origin.trim()"
                class="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 flex items-center gap-2"
              >
                <UIcon v-if="submittingIncome" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
                <UIcon v-else name="i-lucide-save" class="w-4 h-4" />
                {{ submittingIncome ? 'Guardando...' : 'Guardar ingreso' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// KPIs for Ingresos tab
const ingresosKpis = ref([
  {
    titulo: 'Total ingresos',
    valor: '$5.500.000',
    subtexto: 'Mes actual (demo)',
    color: 'green'
  },
  {
    titulo: 'Transacciones',
    valor: '3',
    subtexto: 'Registros de ingresos',
    color: 'blue'
  }
])

// Chart data for income by month
const ingresosChartData = ref([
  { mes: 'Ene', ingresos: 300000 },
  { mes: 'Feb', ingresos: 600000 },
  { mes: 'Mar', ingresos: 500000 },
  { mes: 'Abr', ingresos: 700000 },
  { mes: 'May', ingresos: 450000 },
  { mes: 'Jun', ingresos: 800000 }
])

// Budget utilization percentage
const budgetUtilization = ref(65)

// Mock data for demo
const incomeTableData = ref([
  {
    id: 1,
    concept: 'Pago Cliente ABC',
    amount: 2500000,
    origin: 'Cliente ABC Corp',
    date: '2026-02-01',
    project: 'Portal Web',
    category: 'Servicios',
    description: 'Pago por desarrollo de portal web'
  },
  {
    id: 2,
    concept: 'Consultoría TI',
    amount: 1800000,
    origin: 'Empresa XYZ',
    date: '2026-02-15',
    project: 'Sistema ERP',
    category: 'Consultoría',
    description: 'Consultoría en implementación ERP'
  },
  {
    id: 3,
    concept: 'Desarrollo App',
    amount: 3200000,
    origin: 'Startup DEF',
    date: '2026-02-20',
    project: 'App Móvil',
    category: 'Productos',
    description: 'Desarrollo de aplicación móvil'
  }
])

// Income modal state
const incomeModalOpen = ref(false)
const submittingIncome = ref(false)

const incomeForm = ref({
  concept: '',
  amount: null as number | null,
  date: '',
  description: '',
  category_id: '',
  new_category: '',
  origin: '',
  project: ''
})

const availableCategories = ref([
  { value: 'servicios', label: 'Servicios' },
  { value: 'productos', label: 'Productos' },
  { value: 'consultoria', label: 'Consultoría' },
  { value: 'otros', label: 'Otros' }
])

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-CO')
}

const openIncomeModal = () => {
  incomeModalOpen.value = true
}

const closeIncomeModal = () => {
  incomeModalOpen.value = false
  incomeForm.value = {
    concept: '',
    amount: null,
    date: '',
    description: '',
    category_id: '',
    new_category: '',
    origin: '',
    project: ''
  }
}

const submitIncome = async () => {
  if (!incomeForm.value.concept.trim() || !incomeForm.value.amount || !incomeForm.value.date || !incomeForm.value.origin.trim()) return

  submittingIncome.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Submitting income:', incomeForm.value)
    closeIncomeModal()
  } catch (error) {
    console.error('Error creating income:', error)
  } finally {
    submittingIncome.value = false
  }
}
</script>