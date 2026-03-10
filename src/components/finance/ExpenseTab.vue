<template>
  <div class="space-y-6">
    <!-- KPI Cards and Action Button -->
    <div class="flex flex-col lg:flex-row gap-6">
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <UCard v-for="kpi in kpiData" :key="kpi.title" class="p-6">
          <div>
            <h3 class="text-sm font-medium text-muted-foreground mb-2">{{ kpi.title }}</h3>
            <p :class="[
              'text-3xl font-bold mb-1',
              kpi.color === 'red' ? 'text-red-500' :
              kpi.color === 'blue' ? 'text-blue-500' : 'text-foreground'
            ]">
              {{ kpi.value }}
            </p>
            <p class="text-sm text-muted-foreground">{{ kpi.subtitle }}</p>
          </div>
        </UCard>
      </div>

      <!-- Register Expense Button -->
      <div class="flex items-center">
        <UButton
          icon="i-lucide-plus"
          label="Registrar egreso"
          color="neutral"
          variant="solid"
          class="bg-red-600 hover:bg-red-700 text-white"
          @click="openExpenseModal"
        />
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Expense Chart -->
      <UCard class="lg:col-span-2 p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <UIcon name="i-lucide-trending-down" class="w-5 h-5 text-red-600" />
          Egresos por mes
        </h3>
        <div class="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
          <div class="text-center">
            <UIcon name="i-lucide-bar-chart-3" class="w-12 h-12 text-muted-foreground mb-2" />
            <p class="text-muted-foreground">Gráfico de egresos mensuales</p>
          </div>
        </div>
      </UCard>

      <!-- Expense Categories -->
      <UCard class="p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <UIcon name="i-lucide-pie-chart" class="w-5 h-5 text-orange-600" />
          Categorías de gastos
        </h3>
        <div class="space-y-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-red-600">85%</div>
            <div class="text-sm text-muted-foreground">gastos operativos</div>
          </div>
          <div class="space-y-3">
            <div v-for="category in expenseCategories" :key="category.name" class="flex items-center justify-between">
              <span class="text-sm">{{ category.name }}</span>
              <span class="text-sm font-medium">{{ category.percentage }}%</span>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Expense Records Table -->
    <FinanceDataTable
      title="Registro de egresos"
      icon="i-lucide-arrow-up-right"
      :data="expenseTableData"
      :columns="expenseColumns"
      :loading="loading"
      empty-message="No hay egresos registrados"
      empty-icon="i-lucide-credit-card"
    />

    <!-- Expense Registration Modal -->
    <FinanceModal
      :is-open="expenseModalOpen"
      type="expense"
      title="Registrar Egreso"
      subtitle="Registra un nuevo gasto o egreso"
      icon="i-lucide-minus-circle"
      :submitting="submittingExpense"
      :is-form-valid="isExpenseFormValid"
      submit-text="Guardar egreso"
      submit-loading-text="Guardando..."
      @close="closeExpenseModal"
      @submit="submitExpense"
    >
      <template #form-fields>
        <!-- Concept Field -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Concepto *</label>
          <input
            v-model="expenseForm.concept"
            type="text"
            placeholder="Ej: Compra de equipos"
            :disabled="submittingExpense"
            class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        <!-- Amount and Date Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Monto *</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
              <input
                v-model.number="expenseForm.amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                :disabled="submittingExpense"
                class="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Fecha *</label>
            <input
              v-model="expenseForm.date"
              type="date"
              :disabled="submittingExpense"
              class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
            />
          </div>
        </div>

        <!-- Description Field -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Descripción (opcional)</label>
          <textarea
            v-model="expenseForm.description"
            rows="3"
            placeholder="Descripción adicional del gasto"
            :disabled="submittingExpense"
            class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 resize-none"
          ></textarea>
        </div>

        <!-- Category Field -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Categoría</label>
          <select
            v-model="expenseForm.category_id"
            :disabled="submittingExpense"
            class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
          >
            <option value="">Seleccionar categoría</option>
            <option
              v-for="category in availableExpenseCategories"
              :key="category.value"
              :value="category.value"
              class="bg-slate-800 text-white"
            >
              {{ category.label }}
            </option>
          </select>
        </div>

        <!-- Origin Field -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Origen *</label>
          <input
            v-model="expenseForm.origin"
            type="text"
            placeholder="Ej: Proveedor / Compra directa"
            :disabled="submittingExpense"
            class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        <!-- Project Field -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Proyecto (opcional)</label>
          <input
            v-model="expenseForm.project"
            type="text"
            placeholder="Ej: Portal de Clientes"
            :disabled="submittingExpense"
            class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
          />
        </div>
      </template>
    </FinanceModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// KPI data
const kpiData = ref([
  {
    title: 'Total egresos',
    value: '$3.200.000',
    subtitle: 'Mes actual (demo)',
    color: 'red' as const
  },
  {
    title: 'Transacciones',
    value: '8',
    subtitle: 'Registros de egresos',
    color: 'blue' as const
  }
])

// Expense categories for the chart
const expenseCategories = ref([
  { name: 'Operativos', percentage: 45 },
  { name: 'Personal', percentage: 30 },
  { name: 'Tecnología', percentage: 15 },
  { name: 'Otros', percentage: 10 }
])

// Table configuration
const expenseColumns = [
  { key: 'concept', label: 'Concepto', type: 'text' as const },
  { key: 'amount', label: 'Monto', type: 'currency' as const },
  { key: 'origin', label: 'Origen', type: 'text' as const },
  { key: 'date', label: 'Fecha', type: 'date' as const },
  { key: 'project', label: 'Proyecto', type: 'text' as const }
]

// Mock data for demo
const expenseTableData = ref([
  {
    id: 1,
    concept: 'Compra equipos oficina',
    amount: 850000,
    origin: 'Proveedor TechCorp',
    date: '2026-02-03',
    project: 'Oficina Principal'
  },
  {
    id: 2,
    concept: 'Pago servicios hosting',
    amount: 120000,
    origin: 'AWS',
    date: '2026-02-01',
    project: 'Portal Web'
  },
  {
    id: 3,
    concept: 'Materiales construcción',
    amount: 450000,
    origin: 'Ferretería ABC',
    date: '2026-02-10',
    project: 'Renovación oficina'
  }
])

const loading = ref(false)

// Expense modal state
const expenseModalOpen = ref(false)
const submittingExpense = ref(false)

const expenseForm = ref({
  concept: '',
  amount: null as number | null,
  date: '',
  description: '',
  category_id: '',
  origin: '',
  project: ''
})

const availableExpenseCategories = ref([
  { value: 'operativos', label: 'Gastos operativos' },
  { value: 'personal', label: 'Personal' },
  { value: 'tecnologia', label: 'Tecnología' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'otros', label: 'Otros' }
])

// Removed computed for now to avoid errors

const openExpenseModal = () => {
  expenseModalOpen.value = true
}

const closeExpenseModal = () => {
  expenseModalOpen.value = false
  expenseForm.value = {
    concept: '',
    amount: null,
    date: '',
    description: '',
    category_id: '',
    origin: '',
    project: ''
  }
}

const submitExpense = () => {
  console.log('Submitting expense:', expenseForm.value)
  closeExpenseModal()
}
</script>