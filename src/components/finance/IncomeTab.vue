<template>
  <div class="space-y-6">
    <!-- KPI Cards and Action Button -->
    <div class="flex flex-col lg:flex-row gap-6">
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <UCard class="p-6">
          <div>
            <h3 class="text-sm font-medium text-muted-foreground mb-2">Total ingresos</h3>
            <p class="text-3xl font-bold text-success mb-1">
              {{ loading ? '...' : formatCOP(totalIncome) }}
            </p>
            <p class="text-sm text-muted-foreground">Suma de todos los ingresos</p>
          </div>
        </UCard>
        <UCard class="p-6">
          <div>
            <h3 class="text-sm font-medium text-muted-foreground mb-2">Transacciones</h3>
            <p class="text-3xl font-bold text-blue-500 mb-1">
              {{ loading ? '...' : transactions.length }}
            </p>
            <p class="text-sm text-muted-foreground">Registros de ingresos</p>
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

    <!-- Error state -->
    <div v-if="error" class="text-center py-4">
      <p class="text-red-500 mb-2">{{ error }}</p>
      <UButton label="Reintentar" size="sm" @click="fetchTransactions" />
    </div>

    <!-- Income List Table -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Listado de ingresos</h3>
        </div>
      </template>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-muted/50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Concepto</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Proyecto</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Categoría</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Monto</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-background divide-y divide-border">
            <tr v-if="loading">
              <td colspan="6" class="px-6 py-8 text-center text-muted-foreground">
                <div class="flex flex-col items-center gap-2">
                  <div>
                    <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin inline-block mr-2" />
                    Cargando ingresos...
                  </div>
                  <p v-if="slowLoad" class="text-xs text-muted-foreground">
                    El servidor está despertando, puede tardar ~40s la primera vez...
                  </p>
                </div>
              </td>
            </tr>
            <tr v-else-if="transactions.length === 0">
              <td colspan="6" class="px-6 py-8 text-center text-muted-foreground">
                No hay ingresos registrados
              </td>
            </tr>
            <tr v-for="item in transactions" :key="item.id" class="hover:bg-muted/50">
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ formatDate(item.transaction_date) }}</td>
              <td class="px-6 py-4 text-sm font-medium">{{ item.description }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                {{ item.project_id ? (projects.find(p => p.id === item.project_id)?.name ?? '—') : '—' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {{ item.category || '—' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                {{ formatCOP(item.amount) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <UButton
                  icon="i-lucide-trash-2"
                  variant="ghost"
                  size="sm"
                  color="red"
                  :loading="deletingId === item.id"
                  @click="deleteTransaction(item.id)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <template #footer>
        <div class="text-sm text-muted-foreground">
          {{ transactions.length }} registro(s)
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
                    step="1"
                    min="1"
                    placeholder="0"
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

            <!-- Category Field (RF19) -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium text-slate-300">Categoría *</label>
                <button
                  type="button"
                  class="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  @click="showNewCategoryInput = !showNewCategoryInput"
                >
                  <UIcon name="i-lucide-plus" class="w-3 h-3" />
                  Nueva categoría
                </button>
              </div>
              <!-- New category inline input -->
              <div v-if="showNewCategoryInput" class="flex gap-2 mb-2">
                <input
                  v-model="newCategoryInput"
                  type="text"
                  placeholder="Nombre de la nueva categoría"
                  class="flex-1 px-3 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  @keyup.enter="addNewCategory"
                />
                <button
                  type="button"
                  @click="addNewCategory"
                  class="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium"
                >Agregar</button>
              </div>
              <select
                v-model="incomeForm.category"
                :disabled="submittingIncome"
                class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">Seleccionar categoría</option>
                <option v-for="cat in availableCategories" :key="cat" :value="cat" class="bg-slate-800 text-white">
                  {{ cat }}
                </option>
              </select>
            </div>

            <!-- Project Field -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Proyecto *</label>
              <select
                v-model="incomeForm.projectId"
                :disabled="submittingIncome"
                class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
              >
                <option :value="null">Seleccionar proyecto</option>
                <option v-for="p in projects" :key="p.id" :value="p.id" class="bg-slate-800 text-white">
                  {{ p.name }}
                </option>
              </select>
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
          </form>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-slate-700 bg-slate-800/50">
          <div class="flex items-center justify-end gap-3">
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
              :disabled="submittingIncome || !isFormValid"
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import financeService, { type Transaction } from '@/services/finance'
import projectsService from '@/services/projects'
import { formatCOP } from '@/utils'

// ─── Proyectos ─────────────────────────────────────────────────────────────
const projects = ref<{ id: number; name: string }[]>([])
const fetchProjects = async () => {
  try {
    const res = await projectsService.getProjects()
    projects.value = res.projects.map(p => ({ id: p.id, name: p.name }))
  } catch (e) {
    console.error('Error cargando proyectos:', e)
  }
}

// ─── Estado ────────────────────────────────────────────────────────────────
const transactions = ref<Transaction[]>([])
const loading = ref(false)
const slowLoad = ref(false)
const error = ref<string | null>(null)
const deletingId = ref<number | null>(null)

// ─── KPIs calculados ───────────────────────────────────────────────────────
const totalIncome = computed(() =>
  transactions.value.reduce((sum, t) => sum + t.amount, 0)
)

// ─── Carga ─────────────────────────────────────────────────────────────────
const fetchTransactions = async () => {
  loading.value = true
  slowLoad.value = false
  error.value = null
  const slowTimer = setTimeout(() => { slowLoad.value = true }, 8000)
  try {
    transactions.value = await financeService.getTransactions('income')
  } catch (e: any) {
    error.value = 'Error al cargar ingresos'
    console.error(e)
  } finally {
    clearTimeout(slowTimer)
    loading.value = false
    slowLoad.value = false
  }
}

onMounted(() => { fetchTransactions(); fetchProjects() })

// ─── Formateo ──────────────────────────────────────────────────────────────

  

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-CO')
}

// ─── Eliminar ──────────────────────────────────────────────────────────────
const deleteTransaction = async (id: number) => {
  if (!confirm('¿Eliminar este ingreso?')) return
  deletingId.value = id
  try {
    await financeService.deleteTransaction(id)
    transactions.value = transactions.value.filter(t => t.id !== id)
  } catch (e) {
    console.error('Error eliminando ingreso:', e)
    alert('Error al eliminar el ingreso')
  } finally {
    deletingId.value = null
  }
}

// ─── Modal ─────────────────────────────────────────────────────────────────
const incomeModalOpen = ref(false)
const submittingIncome = ref(false)

// RF19: categorías dinámicas, persistidas en localStorage
const INCOME_CATS_KEY = 'finance_income_categories'
const defaultIncomeCategories = ['Servicios', 'Productos', 'Consultoría', 'Contratos', 'Otros']
const availableCategories = ref<string[]>((() => {
  try {
    const stored = localStorage.getItem(INCOME_CATS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as string[]
      return [...new Set([...defaultIncomeCategories, ...parsed])]
    }
  } catch {}
  return [...defaultIncomeCategories]
})())

const newCategoryInput = ref('')
const showNewCategoryInput = ref(false)

function addNewCategory() {
  const name = newCategoryInput.value.trim()
  if (!name || availableCategories.value.includes(name)) return
  availableCategories.value.push(name)
  // persist custom categories (only the extra ones)
  const extras = availableCategories.value.filter(c => !defaultIncomeCategories.includes(c))
  localStorage.setItem(INCOME_CATS_KEY, JSON.stringify(extras))
  incomeForm.value.category = name
  newCategoryInput.value = ''
  showNewCategoryInput.value = false
}

const incomeForm = ref({
  concept: '',
  amount: null as number | null,
  date: '',
  category: '',
  origin: '',
  projectId: null as number | null,
})

const isFormValid = computed(() =>
  !!incomeForm.value.concept.trim() &&
  !!incomeForm.value.amount && incomeForm.value.amount > 0 &&
  !!incomeForm.value.date &&
  !!incomeForm.value.category &&
  !!incomeForm.value.origin.trim() &&
  !!incomeForm.value.projectId
)

const openIncomeModal = () => {
  incomeModalOpen.value = true
}

const closeIncomeModal = () => {
  incomeModalOpen.value = false
  incomeForm.value = { concept: '', amount: null, date: '', category: '', origin: '', projectId: null }
}

const submitIncome = async () => {
  if (!isFormValid.value) return
  submittingIncome.value = true
  try {
    const description = incomeForm.value.origin.trim()
      ? `${incomeForm.value.concept} — Origen: ${incomeForm.value.origin}`
      : incomeForm.value.concept

    const created = await financeService.createTransaction({
      type: 'income',
      amount: incomeForm.value.amount!,
      category: incomeForm.value.category,
      description,
      transaction_date: incomeForm.value.date,
      project_id: incomeForm.value.projectId ?? undefined,
    })
    transactions.value.unshift(created)
    closeIncomeModal()
  } catch (e: any) {
    console.error('Error guardando ingreso:', e)
    const msg = e?.response?.data?.detail || 'Error al guardar el ingreso'
    alert(msg)
  } finally {
    submittingIncome.value = false
  }
}
</script>
