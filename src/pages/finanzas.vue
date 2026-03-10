<template>
  <UDashboardPanel id="finanzas">
    <template #header>
      <UDashboardNavbar title="Finanzas" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <div class="flex flex-col">
            <span class="text-xl font-bold">Finanzas</span>
            <span class="text-sm text-muted-foreground">Ingresos, egresos y nómina en un solo lugar</span>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <!-- Content with proper scrolling -->
    <div class="flex-1 overflow-y-auto">
      <div class="p-6">
        <!-- Tabs Navigation -->
        <div class="mb-6">
          <div class="flex border-b border-border">
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
        <component :is="activeTabComponent" />
      </div>
    </div>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import IncomeTab from '@/components/finance/IncomeTab.vue'
import ExpenseTab from '@/components/finance/ExpenseTab.vue'
import PayrollTab from '@/components/finance/PayrollTab.vue'

// Active tab state
const activeTab = ref('Ingresos')

// Tabs configuration
const tabs = [
  { label: 'Ingresos', value: 'Ingresos' },
  { label: 'Egresos', value: 'Egresos' },
  { label: 'Nómina', value: 'Nómina' }
]

// Compute active component based on selected tab
const activeTabComponent = computed(() => {
  switch (activeTab.value) {
    case 'Ingresos':
      return IncomeTab
    case 'Egresos':
      return ExpenseTab
    case 'Nómina':
      return PayrollTab
    default:
      return IncomeTab
  }
})
</script>