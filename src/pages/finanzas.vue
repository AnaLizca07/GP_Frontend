<template>
  <UDashboardPanel id="finanzas">
    <template #header>
      <UDashboardNavbar title="Finanzas" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <div class="hidden sm:flex flex-col">
            <span class="text-lg font-bold">ProjeGest</span>
            <span class="text-xs text-muted-foreground">Panel de Gerente</span>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>

      <!-- ── Alerta de saldo bajo (RF20) ── -->
      <div
        v-if="!loadingSummary && showLowBalanceAlert"
        class="mb-5 flex items-start gap-3 p-4 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30"
      >
        <UIcon name="i-lucide-triangle-alert" class="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-red-700 dark:text-red-300">Saldo por debajo del umbral de alerta</p>
          <p class="text-xs text-red-600 dark:text-red-400 mt-0.5">
            El saldo actual es <strong>{{ formatCOP(currentBalance) }}</strong>,
            por debajo del umbral configurado de <strong>{{ formatCOP(alertThreshold) }}</strong>.
          </p>
        </div>
        <div class="shrink-0 flex items-center gap-2">
          <button
            class="text-xs text-red-600 dark:text-red-400 underline hover:no-underline"
            @click="showThresholdEditor = !showThresholdEditor"
          >
            Cambiar umbral
          </button>
          <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" square @click="dismissAlert" />
        </div>
      </div>

      <!-- Editor de umbral -->
      <div
        v-if="showThresholdEditor"
        class="mb-5 flex items-center gap-3 p-4 rounded-xl border border-default bg-elevated/40"
      >
        <UIcon name="i-lucide-bell" class="w-4 h-4 text-muted-foreground shrink-0" />
        <span class="text-sm text-muted-foreground shrink-0">Umbral de alerta de saldo:</span>
        <div class="flex items-center gap-2 flex-1">
          <span class="text-sm text-muted-foreground">$</span>
          <input
            v-model.number="thresholdInput"
            type="number"
            min="0"
            step="100000"
            class="w-44 px-3 py-1.5 text-sm rounded-lg border border-default bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Ej: 500000"
          />
          <UButton label="Guardar" size="sm" color="primary" @click="saveThreshold" />
          <UButton label="Cancelar" size="sm" color="neutral" variant="ghost" @click="showThresholdEditor = false" />
        </div>
        <span class="text-xs text-muted-foreground">Se alerta cuando el saldo esté por debajo de este valor.</span>
      </div>

      <!-- Tabs Navigation -->
      <div class="mb-6">
        <div class="flex border-b border-default">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            @click="activeTab = tab.value"
            :class="[
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.value
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
            ]"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <component :is="activeTabComponent" @transaction-saved="refreshSummary" />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import IncomeTab from '@/components/finance/IncomeTab.vue'
import ExpenseTab from '@/components/finance/ExpenseTab.vue'
import PayrollTab from '@/components/finance/PayrollTab.vue'
import financeService from '@/services/finance'
import { formatCOP } from '@/utils'

// ── Tabs ─────────────────────────────────────────────────────────────────────
const activeTab = ref('Ingresos')
const tabs = [
  { label: 'Ingresos', value: 'Ingresos' },
  { label: 'Egresos', value: 'Egresos' },
  { label: 'Nómina', value: 'Nómina' }
]
const activeTabComponent = computed(() => {
  switch (activeTab.value) {
    case 'Ingresos': return IncomeTab
    case 'Egresos':  return ExpenseTab
    case 'Nómina':   return PayrollTab
    default:         return IncomeTab
  }
})

// ── Balance + alerta de saldo bajo (RF20) ────────────────────────────────────
const THRESHOLD_KEY = 'finance_alert_threshold'
const DISMISSED_KEY = 'finance_alert_dismissed_at'

const currentBalance  = ref(0)
const loadingSummary  = ref(true)
const alertDismissed  = ref(false)

// Threshold persisted in localStorage
const alertThreshold = ref<number>(
  Number(localStorage.getItem(THRESHOLD_KEY) ?? 0)
)
const thresholdInput    = ref(alertThreshold.value)
const showThresholdEditor = ref(false)

const showLowBalanceAlert = computed(
  () => !alertDismissed.value && alertThreshold.value > 0 && currentBalance.value < alertThreshold.value
)

async function fetchSummary() {
  loadingSummary.value = true
  try {
    const summary = await financeService.getSummary()
    currentBalance.value = summary.balance
    // If balance recovered above threshold, reset dismissal
    if (currentBalance.value >= alertThreshold.value) alertDismissed.value = false
  } catch (e) {
    console.error('Error cargando resumen financiero:', e)
  } finally {
    loadingSummary.value = false
  }
}

async function refreshSummary() {
  await fetchSummary()
}

function saveThreshold() {
  alertThreshold.value = thresholdInput.value
  localStorage.setItem(THRESHOLD_KEY, String(thresholdInput.value))
  alertDismissed.value = false
  showThresholdEditor.value = false
}

function dismissAlert() {
  alertDismissed.value = true
}


onMounted(fetchSummary)
</script>