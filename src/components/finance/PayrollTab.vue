<template>
  <div class="space-y-6">
    <!-- KPI Cards and Action Button -->
    <div class="flex flex-col lg:flex-row gap-6">
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
        <UCard v-for="kpi in kpiData" :key="kpi.title" class="p-6">
          <div>
            <h3 class="text-sm font-medium text-muted-foreground mb-2">{{ kpi.title }}</h3>
            <p :class="[
              'text-3xl font-bold mb-1',
              kpi.color === 'green' ? 'text-success' :
              kpi.color === 'blue' ? 'text-blue-500' : 'text-foreground'
            ]">
              {{ kpi.value }}
            </p>
            <p class="text-sm text-muted-foreground">{{ kpi.subtitle }}</p>
          </div>
        </UCard>
      </div>

      <!-- Process Payroll Button -->
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

    <!-- Payroll Records Table -->
    <UCard class="overflow-hidden">
      <div class="px-6 py-4 border-b border-border">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <UIcon name="i-lucide-users" class="w-5 h-5" />
          Registros de nómina
        </h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-muted/50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Empleado</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Período</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Salario base</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Deducciones</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Neto</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody class="bg-background divide-y divide-border">
            <tr v-for="item in payrollTableData" :key="item.id" class="hover:bg-muted/50">
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ item.empleado }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ item.periodo }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">${{ item.salario_base.toLocaleString() }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">${{ item.deducciones.toLocaleString() }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">${{ item.neto.toLocaleString() }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span :class="[
                  'px-2 py-1 text-xs font-medium rounded-full',
                  item.estado === 'Pagado' ? 'bg-green-100 text-green-800' :
                  item.estado === 'Procesado' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                ]">
                  {{ item.estado }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Process Payroll Modal -->
    <div
      v-if="showProcessModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="closeProcessModal"
    >
      <div class="bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-blue-900/20 to-indigo-900/20">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-blue-600 rounded-lg">
                <UIcon name="i-lucide-users" class="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 class="text-xl font-semibold text-white">Procesar Nómina</h2>
                <p class="text-sm text-slate-300">Procesa los pagos de nómina para el período seleccionado</p>
              </div>
            </div>
            <button
              @click="closeProcessModal"
              class="text-slate-400 hover:text-white transition-colors"
            >
              <UIcon name="i-lucide-x" class="w-6 h-6" />
            </button>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="p-6">
          <form @submit.prevent="submitProcessPayroll" class="space-y-6">
            <!-- Payment Date -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Fecha de pago</label>
              <input
                v-model="processForm.paymentDate"
                type="date"
                class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <!-- Employee Selection -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Empleados</label>
              <div class="space-y-3 max-h-48 overflow-y-auto border border-slate-600 rounded-lg p-4 bg-slate-800">
                <div
                  v-for="employee in availableEmployees"
                  :key="employee.id"
                  class="flex items-center gap-3"
                >
                  <input
                    :id="`employee-${employee.id}`"
                    v-model="processForm.selectedEmployees"
                    :value="employee.id"
                    type="checkbox"
                    class="w-4 h-4 text-blue-600 bg-slate-700 border-slate-500 rounded focus:ring-blue-500"
                  />
                  <label
                    :for="`employee-${employee.id}`"
                    class="flex-1 text-sm text-slate-300 cursor-pointer"
                  >
                    <span class="font-medium">{{ employee.name }}</span>
                    <span class="text-slate-400 ml-2">- ${{ employee.salary.toLocaleString() }}</span>
                  </label>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-slate-700 bg-slate-800/50">
          <div class="flex items-center justify-between">
            <div class="text-sm text-slate-400">
              {{ processForm.selectedEmployees.length }} empleado(s) seleccionado(s)
            </div>
            <div class="flex gap-3">
              <button
                type="button"
                @click="closeProcessModal"
                class="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                @click="submitProcessPayroll"
                class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
              >
                <UIcon name="i-lucide-save" class="w-4 h-4" />
                Procesar nómina
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// KPI data
const kpiData = ref([
  {
    title: 'Nómina total',
    value: '$12.500.000',
    subtitle: 'Mes actual (demo)',
    color: 'blue'
  },
  {
    title: 'Empleados activos',
    value: '15',
    subtitle: 'Personal en nómina',
    color: 'green'
  },
  {
    title: 'Procesados',
    value: '12',
    subtitle: 'Pagos completados',
    color: 'blue'
  }
])

// Mock payroll data
const payrollTableData = ref([
  {
    id: 1,
    empleado: 'Juan Pérez',
    periodo: 'Febrero 2026',
    salario_base: 2500000,
    deducciones: 500000,
    neto: 2000000,
    estado: 'Pagado'
  },
  {
    id: 2,
    empleado: 'María García',
    periodo: 'Febrero 2026',
    salario_base: 3000000,
    deducciones: 600000,
    neto: 2400000,
    estado: 'Procesado'
  },
  {
    id: 3,
    empleado: 'Carlos López',
    periodo: 'Febrero 2026',
    salario_base: 2800000,
    deducciones: 560000,
    neto: 2240000,
    estado: 'Pendiente'
  }
])

// Process payroll modal state
const showProcessModal = ref(false)

const processForm = ref({
  paymentDate: '',
  selectedEmployees: [] as number[]
})

// Available employees for processing
const availableEmployees = ref([
  { id: 1, name: 'Juan Pérez', salary: 2500000 },
  { id: 2, name: 'María García', salary: 3000000 },
  { id: 3, name: 'Carlos López', salary: 2800000 },
  { id: 4, name: 'Ana Martínez', salary: 3200000 },
  { id: 5, name: 'Luis Rodríguez', salary: 2700000 }
])

const openProcessModal = () => {
  showProcessModal.value = true
}

const closeProcessModal = () => {
  showProcessModal.value = false
  processForm.value = {
    paymentDate: '',
    selectedEmployees: []
  }
}

const submitProcessPayroll = () => {
  console.log('Processing payroll:', processForm.value)
  closeProcessModal()
}
</script>