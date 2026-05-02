<template>
  <div class="space-y-6">
    <!-- KPI Cards and Action Button -->
    <div class="flex flex-col lg:flex-row gap-6">
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <UCard class="p-6">
          <div>
            <h3 class="text-sm font-medium text-muted-foreground mb-2">Total egresos</h3>
            <p class="text-3xl font-bold text-red-500 mb-1">
              {{ loading ? '...' : formatCOP(totalExpense) }}
            </p>
            <p class="text-sm text-muted-foreground">Suma de todos los egresos</p>
          </div>
        </UCard>
        <UCard class="p-6">
          <div>
            <h3 class="text-sm font-medium text-muted-foreground mb-2">Transacciones</h3>
            <p class="text-3xl font-bold text-blue-500 mb-1">
              {{ loading ? '...' : transactions.length }}
            </p>
            <p class="text-sm text-muted-foreground">Registros de egresos</p>
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

    <!-- Error state -->
    <div v-if="error" class="text-center py-4">
      <p class="text-red-500 mb-2">{{ error }}</p>
      <UButton label="Reintentar" size="sm" @click="fetchTransactions" />
    </div>

    <!-- Expense Records Table -->
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <UIcon name="i-lucide-arrow-up-right" class="w-5 h-5 text-red-600" />
          Registro de egresos
        </h3>
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
                    Cargando egresos...
                  </div>
                  <p v-if="slowLoad" class="text-xs text-muted-foreground">
                    El servidor está iniciando. En el plan gratuito de hosting puede tardar hasta 40 segundos la primera vez del día.
                  </p>
                </div>
              </td>
            </tr>
            <tr v-else-if="transactions.length === 0">
              <td colspan="6" class="px-6 py-8 text-center text-muted-foreground">
                No hay egresos registrados
              </td>
            </tr>
            <tr v-for="item in transactions" :key="item.id" class="hover:bg-muted/50">
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ formatDate(item.transaction_date) }}</td>
              <td class="px-6 py-4 text-sm font-medium">{{ item.description }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                {{ item.project_id ? (projects.find(p => p.id === item.project_id)?.name ?? '—') : '—' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                  {{ item.category || '—' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
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

    <!-- Expense Registration Modal -->
    <div
      v-if="expenseModalOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="closeExpenseModal"
    >
      <div class="bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-red-900/20 to-rose-900/20">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-red-600 rounded-lg">
                <UIcon name="i-lucide-minus-circle" class="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 class="text-xl font-semibold text-white">Registrar Egreso</h2>
                <p class="text-sm text-slate-300">Registra un nuevo gasto o egreso</p>
              </div>
            </div>
            <button
              @click="closeExpenseModal"
              :disabled="submittingExpense"
              class="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <UIcon name="i-lucide-x" class="w-6 h-6" />
            </button>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form @submit.prevent="submitExpense" class="space-y-6">
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

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Monto *</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
                  <input
                    v-model.number="expenseForm.amount"
                    type="number"
                    step="1"
                    min="1"
                    placeholder="0"
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

            <!-- Category Field (RF19) -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium text-slate-300">Categoría *</label>
                <button
                  type="button"
                  class="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  @click="showNewCategoryInput = !showNewCategoryInput"
                >
                  <UIcon name="i-lucide-plus" class="w-3 h-3" />
                  Nueva categoría
                </button>
              </div>
              <div v-if="showNewCategoryInput" class="flex gap-2 mb-2">
                <input
                  v-model="newCategoryInput"
                  type="text"
                  placeholder="Nombre de la nueva categoría"
                  class="flex-1 px-3 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  @keyup.enter="addNewCategory"
                />
                <button
                  type="button"
                  @click="addNewCategory"
                  class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                >Agregar</button>
              </div>
              <select
                v-model="expenseForm.category"
                :disabled="submittingExpense"
                class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
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
                v-model="expenseForm.projectId"
                :disabled="submittingExpense"
                class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
              >
                <option :value="null">Seleccionar proyecto</option>
                <option v-for="p in projects" :key="p.id" :value="p.id" class="bg-slate-800 text-white">
                  {{ p.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Proveedor / Origen *</label>
              <input
                v-model="expenseForm.origin"
                type="text"
                placeholder="Ej: Proveedor / Compra directa"
                :disabled="submittingExpense"
                class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
              />
            </div>
          </form>
        </div>

        <!-- Insufficient funds warning -->
        <div
          v-if="insufficientFunds"
          class="mx-6 mb-2 flex items-start gap-2 p-3 rounded-lg bg-amber-900/30 border border-amber-600/50"
        >
          <UIcon name="i-lucide-triangle-alert" class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div class="text-xs text-amber-300">
            <span class="font-semibold">Fondos insuficientes.</span>
            El egreso de <strong>{{ formatCOP(expenseForm.amount!) }}</strong> supera el saldo disponible de
            <strong>{{ formatCOP(currentBalance) }}</strong>. Puedes continuar, pero quedarás en números rojos.
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-slate-700 bg-slate-800/50">
          <div class="flex items-center justify-end gap-3">
            <button
              type="button"
              @click="closeExpenseModal"
              :disabled="submittingExpense"
              class="px-4 py-2 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              @click="submitExpense"
              :disabled="submittingExpense || !isExpenseFormValid"
              class="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:text-slate-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center gap-2"
            >
              <UIcon v-if="submittingExpense" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
              <UIcon v-else name="i-lucide-save" class="w-4 h-4" />
              {{ submittingExpense ? 'Guardando...' : 'Guardar egreso' }}
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
import { useSlowLoad } from '@/composables/useSlowLoad'

// ─── Balance actual ─────────────────────────────────────────────────────────
const currentBalance = ref(0)
const fetchBalance = async () => {
  try {
    const summary = await financeService.getSummary()
    currentBalance.value = summary.balance
  } catch (e) {
    console.error('Error cargando saldo:', e)
  }
}

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
const error = ref<string | null>(null)
const { slowLoad, startTimer, clearTimer } = useSlowLoad()
const deletingId = ref<number | null>(null)

const totalExpense = computed(() =>
  transactions.value.reduce((sum, t) => sum + t.amount, 0)
)

// ─── Carga ─────────────────────────────────────────────────────────────────
const fetchTransactions = async () => {
  loading.value = true
  error.value = null
  startTimer()
  try {
    transactions.value = await financeService.getTransactions('expense')
  } catch (e: any) {
    error.value = 'Error al cargar egresos'
    console.error(e)
  } finally {
    clearTimer()
    loading.value = false
  }
}

onMounted(() => { fetchTransactions(); fetchProjects(); fetchBalance() })

// ─── Formateo ──────────────────────────────────────────────────────────────

  

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-CO')
}

// ─── Eliminar ──────────────────────────────────────────────────────────────
const deleteTransaction = async (id: number) => {
  if (!confirm('¿Eliminar este egreso?')) return
  deletingId.value = id
  try {
    await financeService.deleteTransaction(id)
    transactions.value = transactions.value.filter(t => t.id !== id)
  } catch (e) {
    console.error('Error eliminando egreso:', e)
    alert('Error al eliminar el egreso')
  } finally {
    deletingId.value = null
  }
}

// ─── Modal ─────────────────────────────────────────────────────────────────
const expenseModalOpen = ref(false)
const submittingExpense = ref(false)

// RF19: categorías dinámicas, persistidas en localStorage
const EXPENSE_CATS_KEY = 'finance_expense_categories'
const defaultExpenseCategories = ['Nómina', 'Operativos', 'Tecnología', 'Marketing', 'Materiales', 'Servicios', 'Otros']
const availableCategories = ref<string[]>((() => {
  try {
    const stored = localStorage.getItem(EXPENSE_CATS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as string[]
      return [...new Set([...defaultExpenseCategories, ...parsed])]
    }
  } catch {}
  return [...defaultExpenseCategories]
})())

const newCategoryInput = ref('')
const showNewCategoryInput = ref(false)

function addNewCategory() {
  const name = newCategoryInput.value.trim()
  if (!name || availableCategories.value.includes(name)) return
  availableCategories.value.push(name)
  const extras = availableCategories.value.filter(c => !defaultExpenseCategories.includes(c))
  localStorage.setItem(EXPENSE_CATS_KEY, JSON.stringify(extras))
  expenseForm.value.category = name
  newCategoryInput.value = ''
  showNewCategoryInput.value = false
}

const expenseForm = ref({
  concept: '',
  amount: null as number | null,
  date: '',
  category: '',
  origin: '',
  projectId: null as number | null,
})

const isExpenseFormValid = computed(() =>
  !!expenseForm.value.concept.trim() &&
  !!expenseForm.value.amount && expenseForm.value.amount > 0 &&
  !!expenseForm.value.date &&
  !!expenseForm.value.category &&
  !!expenseForm.value.origin.trim() &&
  !!expenseForm.value.projectId
)

const insufficientFunds = computed(() =>
  !!expenseForm.value.amount &&
  expenseForm.value.amount > 0 &&
  expenseForm.value.amount > currentBalance.value
)

const openExpenseModal = () => { expenseModalOpen.value = true }

const closeExpenseModal = () => {
  expenseModalOpen.value = false
  expenseForm.value = { concept: '', amount: null, date: '', category: '', origin: '', projectId: null }
}

const submitExpense = async () => {
  if (!isExpenseFormValid.value) return
  submittingExpense.value = true
  try {
    const description = expenseForm.value.origin.trim()
      ? `${expenseForm.value.concept} — Proveedor: ${expenseForm.value.origin}`
      : expenseForm.value.concept

    const created = await financeService.createTransaction({
      type: 'expense',
      amount: expenseForm.value.amount!,
      category: expenseForm.value.category,
      description,
      transaction_date: expenseForm.value.date,
      project_id: expenseForm.value.projectId ?? undefined,
    })
    transactions.value.unshift(created)
    currentBalance.value = Math.max(0, currentBalance.value - created.amount)
    closeExpenseModal()
  } catch (e: any) {
    console.error('Error guardando egreso:', e)
    const msg = e?.response?.data?.detail || 'Error al guardar el egreso'
    alert(msg)
  } finally {
    submittingExpense.value = false
  }
}
</script>
