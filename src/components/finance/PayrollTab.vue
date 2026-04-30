<template>
  <div class="space-y-6">
    <!-- KPI Cards and Action Button -->
    <div class="flex flex-col lg:flex-row gap-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        <UCard class="p-6">
          <div>
            <h3 class="text-sm font-medium text-muted-foreground mb-2">Costo total empresa</h3>
            <p class="text-3xl font-bold text-blue-500 mb-1">
              {{ loadingRecords ? '...' : formatCOP(totalEmployerCost) }}
            </p>
            <p class="text-sm text-muted-foreground">Netos + aportes patronales</p>
          </div>
        </UCard>
        <UCard class="p-6">
          <div>
            <h3 class="text-sm font-medium text-muted-foreground mb-2">Neto pagado empleados</h3>
            <p class="text-3xl font-bold text-success mb-1">
              {{ loadingRecords ? '...' : formatCOP(totalNetPay) }}
            </p>
            <p class="text-sm text-muted-foreground">Lo que reciben los empleados</p>
          </div>
        </UCard>
        <UCard class="p-6">
          <div>
            <h3 class="text-sm font-medium text-muted-foreground mb-2">Registros procesados</h3>
            <p class="text-3xl font-bold text-blue-500 mb-1">
              {{ loadingRecords ? '...' : processedCount }}
            </p>
            <p class="text-sm text-muted-foreground">Pagos registrados</p>
          </div>
        </UCard>
      </div>

      <div class="flex items-center">
        <UButton
          icon="i-lucide-users"
          label="Procesar nómina"
          color="neutral"
          variant="solid"
          class="bg-blue-600 hover:bg-blue-700 text-white"
          @click="openProcessModal"
        />
      </div>
    </div>

    <!-- Error state -->
    <div v-if="errorRecords" class="text-center py-4">
      <p class="text-red-500 mb-2">{{ errorRecords }}</p>
      <UButton label="Reintentar" size="sm" @click="fetchRecords" />
    </div>

    <!-- Payroll Records Table -->
    <UCard class="overflow-hidden">
      <template #header>
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <UIcon name="i-lucide-users" class="w-5 h-5" />
          Registros de nómina
        </h3>
      </template>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-muted/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Empleado</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Período</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Salario base</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-red-500 uppercase tracking-wider">Desc. empleado</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-green-600 uppercase tracking-wider">Neto empleado</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-orange-500 uppercase tracking-wider">Aportes patronales</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-blue-500 uppercase tracking-wider">Costo empresa</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-background divide-y divide-border">
            <tr v-if="loadingRecords">
              <td colspan="9" class="px-6 py-8 text-center text-muted-foreground">
                <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin inline-block mr-2" />
                Cargando registros...
              </td>
            </tr>
            <tr v-else-if="payrollRecords.length === 0">
              <td colspan="9" class="px-6 py-8 text-center text-muted-foreground">
                No hay registros de nómina
              </td>
            </tr>
            <tr v-for="item in payrollRecords" :key="item.id" class="hover:bg-muted/50">
              <td class="px-4 py-4 whitespace-nowrap text-sm font-medium">{{ item.employee_name }}</td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                {{ formatDate(item.period_start) }} – {{ formatDate(item.period_end) }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-right">{{ formatCOP(item.base_salary) }}</td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-right text-red-500">
                -{{ formatCOP(sumObject(item.deductions)) }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                {{ formatCOP(item.net_pay) }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-right text-orange-500">
                {{ formatCOP(sumObject(item.employer_contributions)) }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-right font-semibold text-blue-500">
                {{ formatCOP(item.net_pay + sumObject(item.employer_contributions)) }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm">
                <span :class="[
                  'px-2 py-1 text-xs font-medium rounded-full',
                  item.status === 'paid' ? 'bg-green-100 text-green-800' :
                  item.status === 'processed' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                ]">
                  {{ statusLabel(item.status) }}
                </span>
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm">
                <div class="flex items-center gap-2">
                  <UButton
                    v-if="item.status === 'processed'"
                    label="Marcar pagado"
                    size="xs"
                    color="neutral"
                    variant="outline"
                    :loading="markingPaidId === item.id"
                    @click="markAsPaid(item.id)"
                  />
                  <a
                    v-if="item.receipt_url"
                    :href="item.receipt_url"
                    target="_blank"
                    rel="noopener"
                    class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Ver comprobante PDF"
                  >
                    <UIcon name="i-lucide-file-text" class="w-3.5 h-3.5" />
                    Comprobante
                  </a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <template #footer>
        <div class="text-sm text-muted-foreground">{{ payrollRecords.length }} registro(s)</div>
      </template>
    </UCard>

    <!-- Process Payroll Modal — 2 steps -->
    <div
      v-if="showProcessModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="step === 1 && !submittingPayroll ? closeProcessModal() : undefined"
    >
      <div
        class="bg-slate-900 rounded-xl w-full max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl transition-all duration-200"
        :class="step === 2 ? 'max-w-4xl' : 'max-w-2xl'"
      >
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-blue-900/20 to-indigo-900/20">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-blue-600 rounded-lg">
                <UIcon name="i-lucide-users" class="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 class="text-xl font-semibold text-white">Procesar Nómina</h2>
                <p class="text-sm text-slate-400">
                  {{ step === 1 ? 'Paso 1 de 2 — Seleccionar período y empleados' : 'Paso 2 de 2 — Vista previa de costos' }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <!-- Step indicator -->
              <div class="flex items-center gap-1.5">
                <div class="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <div class="w-8 h-0.5 transition-colors duration-300" :class="step >= 2 ? 'bg-blue-500' : 'bg-slate-600'" />
                <div class="w-2.5 h-2.5 rounded-full transition-colors duration-300" :class="step >= 2 ? 'bg-blue-500' : 'bg-slate-600'" />
              </div>
              <button
                @click="closeProcessModal"
                :disabled="submittingPayroll"
                class="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <UIcon name="i-lucide-x" class="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <!-- ── Step 1: Configurar ── -->
        <div v-if="step === 1" class="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
          <!-- Period type -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Tipo de período *</label>
            <select
              v-model="processForm.payPeriod"
              class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="biweekly">Quincenal</option>
              <option value="monthly">Mensual</option>
            </select>
          </div>

          <!-- Quick period presets -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Período rápido</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="preset in periodPresets"
                :key="preset.label"
                type="button"
                @click="applyPreset(preset)"
                :class="[
                  'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                  processForm.periodStart === preset.start && processForm.periodEnd === preset.end
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-blue-500'
                ]"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>

          <!-- Manual date range -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Fecha inicio *</label>
              <input
                v-model="processForm.periodStart"
                type="date"
                class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Fecha fin *</label>
              <input
                v-model="processForm.periodEnd"
                type="date"
                class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Employee selection -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-slate-300">
                Empleados *
                <span v-if="loadingEmployees" class="text-slate-400 ml-1">(cargando...)</span>
              </label>
              <button
                type="button"
                @click="toggleSelectAll"
                class="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                {{ processForm.selectedEmployees.length === employees.length && employees.length > 0 ? 'Deseleccionar todos' : 'Seleccionar todos' }}
              </button>
            </div>
            <div class="space-y-3 max-h-52 overflow-y-auto border border-slate-600 rounded-lg p-4 bg-slate-800">
              <div v-if="employees.length === 0" class="text-slate-400 text-sm text-center py-2">
                No hay empleados activos
              </div>
              <div v-for="emp in employees" :key="emp.id" class="flex items-center gap-3">
                <input
                  :id="`emp-${emp.id}`"
                  v-model="processForm.selectedEmployees"
                  :value="emp.id"
                  type="checkbox"
                  class="w-4 h-4 text-blue-600 bg-slate-700 border-slate-500 rounded focus:ring-blue-500"
                />
                <label :for="`emp-${emp.id}`" class="flex-1 text-sm text-slate-300 cursor-pointer flex items-center gap-2">
                  <span class="font-medium text-white">{{ emp.name }}</span>
                  <span class="text-slate-400">— {{ emp.position }}</span>
                  <span class="ml-auto text-slate-500 text-xs">{{ formatCOP(emp.salary_monthly || emp.salary_biweekly || 0) }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Step 2: Vista previa ── -->
        <div v-if="step === 2" class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <!-- Loading preview -->
          <div v-if="loadingPreview" class="flex items-center justify-center py-16">
            <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-blue-400 mr-3" />
            <span class="text-slate-300">Calculando nómina para {{ processForm.selectedEmployees.length }} empleado(s)...</span>
          </div>

          <div v-else class="space-y-5">
            <!-- Summary KPIs -->
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-slate-800 rounded-lg p-4 text-center">
                <p class="text-xs text-slate-400 mb-1">Neto total empleados</p>
                <p class="text-xl font-bold text-green-400">{{ formatCOP(previewTotals.net) }}</p>
                <p class="text-xs text-slate-500 mt-1">Lo que reciben</p>
              </div>
              <div class="bg-slate-800 rounded-lg p-4 text-center">
                <p class="text-xs text-slate-400 mb-1">Aportes patronales</p>
                <p class="text-xl font-bold text-orange-400">{{ formatCOP(previewTotals.employer) }}</p>
                <p class="text-xs text-slate-500 mt-1">Salud, pensión, ARL, parafiscales</p>
              </div>
              <div class="bg-slate-800 rounded-lg p-4 text-center border border-blue-500/40">
                <p class="text-xs text-slate-400 mb-1">Costo total empresa</p>
                <p class="text-xl font-bold text-blue-400">{{ formatCOP(previewTotals.total) }}</p>
                <p class="text-xs text-slate-500 mt-1">Neto + aportes patronales</p>
              </div>
            </div>

            <!-- Insufficient funds warning -->
            <div
              v-if="!loadingPreview && previewTotals.total > currentBalance"
              class="flex items-start gap-2 p-3 rounded-lg bg-amber-900/30 border border-amber-600/50"
            >
              <UIcon name="i-lucide-triangle-alert" class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div class="text-xs text-amber-300">
                <span class="font-semibold">Fondos insuficientes.</span>
                El costo total de la nómina (<strong>{{ formatCOP(previewTotals.total) }}</strong>)
                supera el saldo disponible de <strong>{{ formatCOP(currentBalance) }}</strong>.
                Puedes continuar, pero quedarás en números rojos.
              </div>
            </div>

            <!-- Preview errors -->
            <div v-if="previewErrors.length > 0" class="p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
              <p class="text-yellow-400 text-xs font-medium mb-1">Empleados que no se pudieron calcular:</p>
              <ul class="text-yellow-300 text-xs space-y-0.5">
                <li v-for="err in previewErrors" :key="err">• {{ err }}</li>
              </ul>
            </div>

            <!-- Preview table -->
            <div class="overflow-x-auto rounded-lg border border-slate-700">
              <table class="w-full text-sm">
                <thead class="bg-slate-800">
                  <tr>
                    <th class="px-4 py-2.5 text-left text-xs text-slate-400 uppercase">Empleado</th>
                    <th class="px-4 py-2.5 text-right text-xs text-slate-400 uppercase">Bruto</th>
                    <th class="px-4 py-2.5 text-right text-xs text-red-400 uppercase">Desc. empleado</th>
                    <th class="px-4 py-2.5 text-right text-xs text-green-400 uppercase">Neto empleado</th>
                    <th class="px-4 py-2.5 text-right text-xs text-orange-400 uppercase">Aportes patronales</th>
                    <th class="px-4 py-2.5 text-right text-xs text-blue-400 uppercase">Costo empresa</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-700/50">
                  <tr v-for="calc in previewResults" :key="calc.employee_id" class="hover:bg-slate-800/40">
                    <td class="px-4 py-3">
                      <div class="font-medium text-white">{{ calc.employee_name }}</div>
                      <div class="text-xs text-slate-400 mt-0.5">
                        {{ calc.employee_type === 'employee' ? 'Empleado' : 'Contratista' }}
                      </div>
                    </td>
                    <td class="px-4 py-3 text-right text-slate-300">{{ formatCOP(calc.gross_income) }}</td>
                    <td class="px-4 py-3 text-right text-red-400">-{{ formatCOP(calc.social_security_deductions.total) }}</td>
                    <td class="px-4 py-3 text-right text-green-400 font-medium">{{ formatCOP(calc.net_salary) }}</td>
                    <td class="px-4 py-3 text-right text-orange-400">{{ formatCOP(calc.employer_contributions.total) }}</td>
                    <td class="px-4 py-3 text-right text-blue-400 font-semibold">{{ formatCOP(calc.employer_cost) }}</td>
                  </tr>
                </tbody>
                <tfoot class="border-t-2 border-slate-600 bg-slate-800/70">
                  <tr class="font-semibold">
                    <td class="px-4 py-3 text-slate-300">Total ({{ previewResults.length }} empleado(s))</td>
                    <td class="px-4 py-3 text-right text-slate-300">{{ formatCOP(previewTotals.gross) }}</td>
                    <td class="px-4 py-3 text-right text-red-400">-{{ formatCOP(previewTotals.deductions) }}</td>
                    <td class="px-4 py-3 text-right text-green-400">{{ formatCOP(previewTotals.net) }}</td>
                    <td class="px-4 py-3 text-right text-orange-400">{{ formatCOP(previewTotals.employer) }}</td>
                    <td class="px-4 py-3 text-right text-blue-400">{{ formatCOP(previewTotals.total) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Process errors (after confirm attempt) -->
            <div v-if="processErrors.length > 0" class="p-3 bg-red-900/20 border border-red-700 rounded-lg">
              <p class="text-red-400 text-xs font-medium mb-1">Errores al procesar:</p>
              <ul class="text-red-300 text-xs space-y-0.5">
                <li v-for="err in processErrors" :key="err">• {{ err }}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-slate-700 bg-slate-800/50">
          <div class="flex items-center justify-between">
            <div class="text-sm text-slate-400">
              <span v-if="step === 1">{{ processForm.selectedEmployees.length }} empleado(s) seleccionado(s)</span>
              <span v-else-if="!loadingPreview">
                {{ formatDate(processForm.periodStart) }} – {{ formatDate(processForm.periodEnd) }}
              </span>
            </div>
            <div class="flex gap-3">
              <button
                type="button"
                @click="step === 1 ? closeProcessModal() : goBack()"
                :disabled="submittingPayroll"
                class="px-4 py-2 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
              >
                {{ step === 1 ? 'Cancelar' : '← Volver' }}
              </button>

              <!-- Step 1 → Preview -->
              <button
                v-if="step === 1"
                type="button"
                @click="goToPreview"
                :disabled="!isStep1Valid || loadingEmployees"
                class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
              >
                <UIcon name="i-lucide-eye" class="w-4 h-4" />
                Ver vista previa
              </button>

              <!-- Step 2 → Confirm -->
              <button
                v-else
                type="button"
                @click="submitProcessPayroll"
                :disabled="submittingPayroll || loadingPreview || previewResults.length === 0"
                class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
              >
                <UIcon v-if="submittingPayroll" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
                <UIcon v-else name="i-lucide-check" class="w-4 h-4" />
                {{ submittingPayroll ? 'Procesando...' : 'Confirmar y procesar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { payrollService, type PayrollRecord, type PayrollCalculation } from '@/services/payroll'
import { employeeService, type Employee } from '@/services/employees'
import financeService from '@/services/finance'
import { formatCOP } from '@/utils'

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

// ─── Estado: registros ─────────────────────────────────────────────────────
const payrollRecords = ref<PayrollRecord[]>([])
const loadingRecords = ref(false)
const errorRecords = ref<string | null>(null)
const markingPaidId = ref<number | null>(null)

// ─── Estado: empleados ─────────────────────────────────────────────────────
const employees = ref<Employee[]>([])
const loadingEmployees = ref(false)

// ─── KPIs ──────────────────────────────────────────────────────────────────
const sumObject = (obj: Record<string, any> | null | undefined): number =>
  Object.values(obj || {}).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0)

const totalNetPay = computed(() =>
  payrollRecords.value.reduce((sum, r) => sum + r.net_pay, 0)
)

const totalEmployerCost = computed(() =>
  payrollRecords.value.reduce((sum, r) => sum + r.net_pay + sumObject(r.employer_contributions), 0)
)

const processedCount = computed(() =>
  payrollRecords.value.filter(r => r.status === 'processed' || r.status === 'paid').length
)

// ─── Carga ─────────────────────────────────────────────────────────────────
const fetchRecords = async () => {
  loadingRecords.value = true
  errorRecords.value = null
  try {
    const response = await payrollService.getAllPayrollRecords()
    payrollRecords.value = (response as any).payroll_records ?? []
  } catch (e: any) {
    errorRecords.value = 'Error al cargar registros de nómina'
    console.error(e)
  } finally {
    loadingRecords.value = false
  }
}

const fetchEmployees = async () => {
  loadingEmployees.value = true
  try {
    const response = await employeeService.getEmployees({ status_filter: 'active', limit: 100 })
    employees.value = response.employees
  } catch (e) {
    console.error('Error cargando empleados:', e)
  } finally {
    loadingEmployees.value = false
  }
}

onMounted(() => {
  fetchRecords()
  fetchEmployees()
  fetchBalance()
})

// ─── Helpers ───────────────────────────────────────────────────────────────

  

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-CO')
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = { pending: 'Pendiente', processed: 'Procesado', paid: 'Pagado' }
  return map[status] ?? status
}

// ─── Marcar como pagado ────────────────────────────────────────────────────
const markAsPaid = async (id: number) => {
  if (!confirm('¿Marcar este pago como pagado? Se generará y enviará un comprobante al empleado.')) return
  markingPaidId.value = id
  try {
    const response = await payrollService.markAsPaid(id)
    const record = payrollRecords.value.find(r => r.id === id)
    if (record) {
      record.status = 'paid'
      if (response.receipt_url) record.receipt_url = response.receipt_url
    }
  } catch (e) {
    console.error('Error marcando como pagado:', e)
    alert('Error al actualizar el estado')
  } finally {
    markingPaidId.value = null
  }
}

// ─── Period presets ────────────────────────────────────────────────────────
interface PeriodPreset {
  label: string
  period: 'biweekly' | 'monthly'
  start: string
  end: string
}

const periodPresets = computed((): PeriodPreset[] => {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()      // 0-indexed
  const d = now.getDate()
  const pad = (n: number) => String(n).padStart(2, '0')
  const lastDay = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate()
  const fmt = (year: number, month: number, day: number) =>
    `${year}-${pad(month + 1)}-${pad(day)}`

  const firstHalf = d <= 15

  // Current biweekly
  const bwStart = firstHalf ? fmt(y, m, 1) : fmt(y, m, 16)
  const bwEnd   = firstHalf ? fmt(y, m, 15) : fmt(y, m, lastDay(y, m))

  // Previous biweekly
  let prevBwStart: string, prevBwEnd: string
  if (firstHalf) {
    const pm = m === 0 ? 11 : m - 1
    const py = m === 0 ? y - 1 : y
    prevBwStart = fmt(py, pm, 16)
    prevBwEnd   = fmt(py, pm, lastDay(py, pm))
  } else {
    prevBwStart = fmt(y, m, 1)
    prevBwEnd   = fmt(y, m, 15)
  }

  // Current month
  const mStart = fmt(y, m, 1)
  const mEnd   = fmt(y, m, lastDay(y, m))

  // Previous month
  const pm = m === 0 ? 11 : m - 1
  const py = m === 0 ? y - 1 : y
  const pmStart = fmt(py, pm, 1)
  const pmEnd   = fmt(py, pm, lastDay(py, pm))

  return [
    { label: 'Esta quincena',     period: 'biweekly', start: bwStart,   end: bwEnd   },
    { label: 'Quincena anterior', period: 'biweekly', start: prevBwStart, end: prevBwEnd },
    { label: 'Este mes',          period: 'monthly',  start: mStart,    end: mEnd    },
    { label: 'Mes anterior',      period: 'monthly',  start: pmStart,   end: pmEnd   },
  ]
})

const applyPreset = (preset: PeriodPreset) => {
  processForm.value.payPeriod = preset.period
  processForm.value.periodStart = preset.start
  processForm.value.periodEnd = preset.end
}

const toggleSelectAll = () => {
  if (processForm.value.selectedEmployees.length === employees.value.length) {
    processForm.value.selectedEmployees = []
  } else {
    processForm.value.selectedEmployees = employees.value.map(e => e.id)
  }
}

// ─── Modal state ───────────────────────────────────────────────────────────
const showProcessModal = ref(false)
const step = ref<1 | 2>(1)
const submittingPayroll = ref(false)
const processErrors = ref<string[]>([])

const loadingPreview = ref(false)
const previewResults = ref<PayrollCalculation[]>([])
const previewErrors = ref<string[]>([])

const processForm = ref({
  payPeriod: 'monthly' as 'biweekly' | 'monthly',
  periodStart: '',
  periodEnd: '',
  selectedEmployees: [] as number[],
})

const isStep1Valid = computed(() =>
  !!processForm.value.periodStart &&
  !!processForm.value.periodEnd &&
  processForm.value.selectedEmployees.length > 0
)

const previewTotals = computed(() => ({
  gross:      previewResults.value.reduce((s, c) => s + c.gross_income, 0),
  deductions: previewResults.value.reduce((s, c) => s + c.social_security_deductions.total, 0),
  net:        previewResults.value.reduce((s, c) => s + c.net_salary, 0),
  employer:   previewResults.value.reduce((s, c) => s + c.employer_contributions.total, 0),
  total:      previewResults.value.reduce((s, c) => s + c.employer_cost, 0),
}))

// ─── Navigation ────────────────────────────────────────────────────────────
const openProcessModal = () => {
  showProcessModal.value = true
  step.value = 1
  processErrors.value = []
  previewResults.value = []
  previewErrors.value = []
}

const closeProcessModal = () => {
  showProcessModal.value = false
  step.value = 1
  processForm.value = { payPeriod: 'monthly', periodStart: '', periodEnd: '', selectedEmployees: [] }
  processErrors.value = []
  previewResults.value = []
  previewErrors.value = []
}

const goBack = () => {
  step.value = 1
  previewResults.value = []
  previewErrors.value = []
  processErrors.value = []
}

const goToPreview = async () => {
  if (!isStep1Valid.value) return
  step.value = 2
  loadingPreview.value = true
  previewResults.value = []
  previewErrors.value = []

  for (const empId of processForm.value.selectedEmployees) {
    try {
      const calc = await payrollService.calculatePayroll({
        employee_id: empId,
        pay_period: processForm.value.payPeriod,
        period_start: processForm.value.periodStart,
        period_end: processForm.value.periodEnd,
      })
      previewResults.value.push(calc)
    } catch (e: any) {
      const emp = employees.value.find(em => em.id === empId)
      const name = emp?.name ?? `Empleado #${empId}`
      previewErrors.value.push(`${name}: ${e?.response?.data?.detail ?? 'Error de cálculo'}`)
    }
  }

  loadingPreview.value = false
}

// ─── Confirmar y procesar ──────────────────────────────────────────────────
const submitProcessPayroll = async () => {
  submittingPayroll.value = true
  processErrors.value = []

  const errors: string[] = []
  const newRecords: PayrollRecord[] = []

  for (const empId of processForm.value.selectedEmployees) {
    try {
      const record = await payrollService.processPayroll({
        employee_id: empId,
        pay_period: processForm.value.payPeriod,
        period_start: processForm.value.periodStart,
        period_end: processForm.value.periodEnd,
      })
      newRecords.push(record)
    } catch (e: any) {
      const emp = employees.value.find(em => em.id === empId)
      const name = emp?.name ?? `Empleado #${empId}`
      errors.push(`${name}: ${e?.response?.data?.detail ?? 'Error desconocido'}`)
    }
  }

  processErrors.value = errors
  if (newRecords.length > 0) {
    await fetchRecords()
    if (errors.length === 0) closeProcessModal()
  }

  submittingPayroll.value = false
}
</script>
