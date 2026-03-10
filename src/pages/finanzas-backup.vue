<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { usePayroll } from '@/composables/usePayroll'
import { useEmployees } from '@/composables/useEmployees'
import { useIncome } from '@/composables/useIncome'
import { useExpenses } from '@/composables/useExpenses'

// Active tab
const activeTab = ref('Ingresos')

// Tabs configuration
const tabs = [
  { label: 'Ingresos', value: 'Ingresos' },
  { label: 'Egresos', value: 'Egresos' },
  { label: 'Nómina', value: 'Nómina' }
]

// Payroll composable
const { getAllPayrollRecords, markAsPaid, processPayroll, payrollRecords, loading: payrollLoading } = usePayroll()

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

// Transform payroll records for display
const nominaRecords = computed(() => {
  if (!payrollRecords.value || payrollRecords.value.length === 0) {
    return []
  }

  return payrollRecords.value.map(record => ({
    id: record.id,
    empleado: record.employee_name,
    periodo: formatPeriod(record.period_start, record.period_end),
    salario_base: record.base_salary,
    deducciones: typeof record.deductions === 'object' ? (record.deductions?.total || 0) : (record.deductions || 0),
    neto: record.net_pay,
    estado: mapStatus(record.status),
    fecha_pago: record.paid_at ? formatDate(record.paid_at) : null
  }))
})

// Helper functions for data transformation
const formatPeriod = (start: string, _end: string) => {
  const startDate = new Date(start)
  const month = startDate.toLocaleString('es', { month: 'long' })
  const year = startDate.getFullYear()
  return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`
}

const mapStatus = (status: string) => {
  switch (status) {
    case 'paid': return 'Pagado'
    case 'processed': return 'Procesado'
    case 'pending': return 'Pendiente'
    default: return 'Desconocido'
  }
}

// Process payroll modal state
const showProcessModal = ref(false)
const processingPayroll = ref(false)

// Process payroll form
const processForm = ref({
  payrollType: 'Quincenal',
  period: 'Febrero 2026',
  paymentDate: '',
  observation: '',
  selectedEmployees: []
})

// Employee interface for payroll processing
interface AvailableEmployee {
  id: number
  name: string
  position: string
  salary: number
  deductions: number
  netPay: number
  selected: boolean
}

// Available employees with payroll info (loaded from backend)
const availableEmployees = ref<AvailableEmployee[]>([])

// Employee composable
const { fetchEmployees, activeEmployees } = useEmployees()

// Income composable
const {
  incomeRecords,
  incomeCategories,
  createIncome,
  fetchIncomeRecords,
  fetchCategories,
  createCategory,
  clearError: clearIncomeError
} = useIncome()

// Expenses composable
const {
  expenseRecords,
  expenseCategories,
  createExpense,
  fetchExpenseRecords,
  fetchCategories: fetchExpenseCategories,
  createCategory: createExpenseCategory,
  clearError: clearExpenseError
} = useExpenses()

// Income registration modal state
const showIncomeModal = ref(false)
const submittingIncome = ref(false)
const incomeSuccess = ref(false)
const incomeSubmissionError = ref('')

// Income registration form
const incomeForm = ref({
  concept: '',
  amount: '',
  date: '',
  category_id: null as number | null,
  new_category: '',
  origin: '',
  project: ''
})

// Expense registration modal state
const showExpenseModal = ref(false)
const submittingExpense = ref(false)
const expenseSuccess = ref(false)
const expenseSubmissionError = ref('')

// Expense registration form
const expenseForm = ref({
  concept: '',
  amount: '',
  date: '',
  category_id: null as number | null,
  new_category: '',
  origin: '',
  project: ''
})

// Available categories for dropdown (will be populated from API)
const availableCategories = computed(() => {
  return incomeCategories.value.map(cat => ({
    label: cat.name,
    value: cat.id
  }))
})

// Available expense categories for dropdown
const availableExpenseCategories = computed(() => {
  return expenseCategories.value.map(cat => ({
    label: cat.name,
    value: cat.id
  }))
})

// Reset income form
const resetIncomeForm = () => {
  incomeForm.value = {
    concept: '',
    amount: '',
    date: '',
    category_id: null,
    new_category: '',
    origin: '',
    project: ''
  }
  incomeSuccess.value = false
  incomeSubmissionError.value = ''
  clearIncomeError()
}

// Open income modal
const openIncomeModal = () => {
  resetIncomeForm()
  showIncomeModal.value = true
}

// Close income modal
const closeIncomeModal = () => {
  showIncomeModal.value = false
  resetIncomeForm()
}

// Handle income form submission
const submitIncome = async () => {
  try {
    submittingIncome.value = true
    incomeSubmissionError.value = ''

    // Validate required fields
    if (!incomeForm.value.concept.trim()) {
      throw new Error('El concepto es obligatorio')
    }
    if (!incomeForm.value.amount || parseFloat(incomeForm.value.amount) <= 0) {
      throw new Error('El monto debe ser mayor a 0')
    }
    if (!incomeForm.value.date) {
      throw new Error('La fecha es obligatoria')
    }
    if (!incomeForm.value.origin.trim()) {
      throw new Error('El origen es obligatorio')
    }

    // If new category is provided, create it first
    let categoryId = incomeForm.value.category_id
    if (incomeForm.value.new_category.trim()) {
      try {
        const newCategory = await createCategory(incomeForm.value.new_category.trim())
        categoryId = newCategory.id
      } catch (categoryError) {
        console.warn('Error creating category, proceeding without it:', categoryError)
      }
    }

    // Create income record
    await createIncome({
      concept: incomeForm.value.concept.trim(),
      amount: parseFloat(incomeForm.value.amount),
      date: incomeForm.value.date,
      category_id: categoryId || undefined,
      origin: incomeForm.value.origin.trim(),
      project_id: undefined, // For now, we'll handle projects later
      description: incomeForm.value.project.trim() || undefined
    })

    // Mark as successful
    incomeSuccess.value = true

    // Auto-close modal after 2 seconds
    setTimeout(() => {
      closeIncomeModal()
    }, 2000)

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al registrar el ingreso'
    incomeSubmissionError.value = errorMessage
    console.error('Error al registrar ingreso:', error)
  } finally {
    submittingIncome.value = false
  }
}

// Reset expense form
const resetExpenseForm = () => {
  expenseForm.value = {
    concept: '',
    amount: '',
    date: '',
    category_id: null,
    new_category: '',
    origin: '',
    project: ''
  }
  expenseSuccess.value = false
  expenseSubmissionError.value = ''
  clearExpenseError()
}

// Open expense modal
const openExpenseModal = () => {
  resetExpenseForm()
  showExpenseModal.value = true
}

// Close expense modal
const closeExpenseModal = () => {
  showExpenseModal.value = false
  resetExpenseForm()
}

// Handle expense form submission
const submitExpense = async () => {
  try {
    submittingExpense.value = true
    expenseSubmissionError.value = ''

    // Validate required fields
    if (!expenseForm.value.concept.trim()) {
      throw new Error('El concepto es obligatorio')
    }
    if (!expenseForm.value.amount || parseFloat(expenseForm.value.amount) <= 0) {
      throw new Error('El monto debe ser mayor a 0')
    }
    if (!expenseForm.value.date) {
      throw new Error('La fecha es obligatoria')
    }
    if (!expenseForm.value.origin.trim()) {
      throw new Error('El origen es obligatorio')
    }

    // If new category is provided, create it first
    let categoryId = expenseForm.value.category_id
    if (expenseForm.value.new_category.trim()) {
      try {
        const newCategory = await createExpenseCategory(expenseForm.value.new_category.trim())
        categoryId = newCategory.id
      } catch (categoryError) {
        console.warn('Error creating category, proceeding without it:', categoryError)
      }
    }

    // Create expense record
    await createExpense({
      concept: expenseForm.value.concept.trim(),
      amount: parseFloat(expenseForm.value.amount),
      date: expenseForm.value.date,
      category_id: categoryId || undefined,
      origin: expenseForm.value.origin.trim(),
      project_id: undefined, // For now, we'll handle projects later
      description: expenseForm.value.project.trim() || undefined
    })

    // Mark as successful
    expenseSuccess.value = true

    // Auto-close modal after 2 seconds
    setTimeout(() => {
      closeExpenseModal()
    }, 2000)

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al registrar el egreso'
    expenseSubmissionError.value = errorMessage
    console.error('Error al registrar egreso:', error)
  } finally {
    submittingExpense.value = false
  }
}

// Format currency for display
const formatCurrencyValue = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '$0'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(num)
}

// Mock data for demonstration (will be replaced with real data from API)
const mockIncomeRecords = ref([
  {
    id: 1,
    concept: 'Pago cliente - Sistema ERP',
    category_name: 'Servicios',
    project_name: 'Sistema de Gestión Empresarial',
    date: '2026-02-05',
    origin: 'Transferencia',
    amount: 2500000,
    description: 'Desarrollo completo del sistema'
  },
  {
    id: 2,
    concept: 'Pago cliente - Portal Web',
    category_name: 'Desarrollo',
    project_name: 'Portal de Clientes',
    date: '2026-02-10',
    origin: 'Consignación',
    amount: 1800000,
    description: 'Portal web corporativo'
  },
  {
    id: 3,
    concept: 'Anticipo mantenimiento',
    category_name: 'Mantenimiento',
    project_name: 'Sistema de Reportería',
    date: '2026-02-14',
    origin: 'Transferencia',
    amount: 1200000,
    description: 'Mantenimiento mensual'
  }
])

// Use mock data if no real data is available
const displayIncomeRecords = computed(() => {
  return incomeRecords.value && incomeRecords.value.length > 0
    ? incomeRecords.value
    : mockIncomeRecords.value
})

// Mock expense data for demonstration
const mockExpenseRecords = ref([
  {
    id: 1,
    concept: 'Alquiler oficina',
    category_name: 'Oficina',
    project_name: 'Operaciones generales',
    date: '2026-02-01',
    origin: 'Transferencia',
    amount: 450000,
    description: 'Alquiler mensual oficina'
  },
  {
    id: 2,
    concept: 'Servicios públicos',
    category_name: 'Servicios',
    project_name: null,
    date: '2026-02-05',
    origin: 'Débito automático',
    amount: 280000,
    description: 'Luz, agua, internet'
  },
  {
    id: 3,
    concept: 'Software licencias',
    category_name: 'Tecnología',
    project_name: 'Desarrollo',
    date: '2026-02-10',
    origin: 'Tarjeta crédito',
    amount: 350000,
    description: 'Licencias mensuales'
  },
  {
    id: 4,
    concept: 'Materiales oficina',
    category_name: 'Oficina',
    project_name: null,
    date: '2026-02-15',
    origin: 'Efectivo',
    amount: 310000,
    description: 'Papelería y suministros'
  }
])

// Use mock expense data if no real data is available
const displayExpenseRecords = computed(() => {
  return expenseRecords.value && expenseRecords.value.length > 0
    ? expenseRecords.value
    : mockExpenseRecords.value
})

// KPIs for Expenses tab
const expensesKpis = computed(() => {
  const total = displayExpenseRecords.value.reduce((sum, item) => sum + item.amount, 0)
  const count = displayExpenseRecords.value.length

  return [
    {
      titulo: 'Total egresos',
      valor: formatCurrency(total),
      subtexto: 'Mes actual (demo)',
      color: 'red'
    },
    {
      titulo: 'Transacciones',
      valor: count.toString(),
      subtexto: 'Registros de egresos',
      color: 'blue'
    }
  ]
})

// Chart data for expenses by month
const expensesChartData = ref([
  { mes: 'Ene', egresos: 1200000 },
  { mes: 'Feb', egresos: 1350000 },
  { mes: 'Mar', egresos: 980000 },
  { mes: 'Abr', egresos: 1100000 },
  { mes: 'May', egresos: 1050000 },
  { mes: 'Jun', egresos: 1400000 }
])

// Expense budget utilization percentage
const expenseBudgetUtilization = ref(75)

// Mock payroll data for demonstration
const mockPayrollRecords = ref([
  {
    id: 1,
    empleado: 'Ana García',
    cargo: 'Desarrolladora',
    periodo: 'Quincena 1 - Febrero',
    salario_base: 2100000,
    deducciones: 168000,
    neto: 1932000,
    estado: 'Pendiente',
    fecha_pago: null
  },
  {
    id: 2,
    empleado: 'Laura Sánchez',
    cargo: 'QA',
    periodo: 'Quincena 1 - Febrero',
    salario_base: 1800000,
    deducciones: 144000,
    neto: 1656000,
    estado: 'Pendiente',
    fecha_pago: null
  },
  {
    id: 3,
    empleado: 'Carlos Ríos',
    cargo: 'Backend',
    periodo: 'Quincena 1 - Febrero',
    salario_base: 2400000,
    deducciones: 192000,
    neto: 2208000,
    estado: 'Pendiente',
    fecha_pago: null
  }
])

// Use mock payroll data if no real data is available
const displayPayrollRecords = computed(() => {
  return nominaRecords.value && nominaRecords.value.length > 0
    ? nominaRecords.value.map(record => ({
      ...record,
      cargo: 'Empleado' // Add default cargo since API might not have it
    }))
    : mockPayrollRecords.value
})

// Load data from backend
onMounted(async () => {
  // Check if user is authenticated
  const token = localStorage.getItem('auth_token')
  if (!token) {
    console.warn('No authentication token found')
    return
  }

  await loadPayrollData()
  await loadAvailableEmployees()
  await loadIncomeData()
  await loadExpenseData()
})

// Load income data
const loadIncomeData = async () => {
  try {
    await Promise.all([
      fetchCategories(),
      fetchIncomeRecords()
    ])
  } catch (error) {
    console.error('Error loading income data:', error)
  }
}

// Load expense data
const loadExpenseData = async () => {
  try {
    await Promise.all([
      fetchExpenseCategories(),
      fetchExpenseRecords()
    ])
  } catch (error) {
    console.error('Error loading expense data:', error)
  }
}

// Load payroll records
const loadPayrollData = async () => {
  try {
    await getAllPayrollRecords({
      limit: 50
    })
  } catch (error) {
    console.error('Error loading payroll records:', error)
  }
}

// Load employees for payroll processing
const loadAvailableEmployees = async () => {
  try {
    await fetchEmployees({
      status_filter: 'active',
      limit: 100
    })

    if (activeEmployees.value && activeEmployees.value.length > 0) {
      availableEmployees.value = activeEmployees.value.map(emp => ({
        id: emp.id,
        name: emp.name,
        position: emp.position,
        salary: emp.salary_monthly || emp.salary_biweekly || emp.salary_hourly || 0,
        deductions: calculateEstimatedDeductions(emp.salary_monthly || 0),
        netPay: calculateEstimatedNetPay(emp.salary_monthly || 0),
        selected: false
      }))
    } else {
      availableEmployees.value = []
    }
  } catch (error) {
    console.error('Error loading employees:', error)
    // Fallback to empty array on error
    availableEmployees.value = []
  }
}

// Helper functions for salary calculations
const calculateEstimatedDeductions = (salary: number) => {
  // Basic calculation: 8% (4% health + 4% pension)
  const basic = salary * 0.08
  // Add solidarity fund if salary > 4 minimum wages (approx 5.2M)
  const solidarity = salary > 5200000 ? salary * 0.01 : 0
  return Math.round(basic + solidarity)
}

const calculateEstimatedNetPay = (salary: number) => {
  return salary - calculateEstimatedDeductions(salary)
}

// Toggle employee selection
const toggleEmployeeSelection = (employeeId: number) => {
  const employee = availableEmployees.value.find(emp => emp.id === employeeId)
  if (employee) {
    employee.selected = !employee.selected
  }
}

// Success and error states
const processingSuccess = ref(false)
const processingError = ref('')

// Process payroll function
const processPayrollPayments = async () => {
  processingPayroll.value = true
  processingError.value = ''

  try {
    const selectedEmployees = availableEmployees.value.filter(emp => emp.selected)

    if (selectedEmployees.length === 0) {
      throw new Error('Debe seleccionar al menos un empleado')
    }

    if (!processForm.value.paymentDate) {
      throw new Error('La fecha de pago es obligatoria')
    }

    // Process each selected employee
    for (const employee of selectedEmployees) {
      try {
        // Calculate period dates based on payroll type and payment date
        const paymentDate = new Date(processForm.value.paymentDate)
        let periodStart: string
        let periodEnd: string

        if (processForm.value.payrollType === 'Quincenal') {
          // For biweekly, calculate based on which half of month
          const day = paymentDate.getDate()
          if (day <= 15) {
            periodStart = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString().split('T')[0]
            periodEnd = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 15).toISOString().split('T')[0]
          } else {
            periodStart = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 16).toISOString().split('T')[0]
            periodEnd = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, 0).toISOString().split('T')[0]
          }
        } else {
          // Monthly payroll
          periodStart = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString().split('T')[0]
          periodEnd = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, 0).toISOString().split('T')[0]
        }

        // Use the payroll service to process payment
        const payrollRecord = await processPayroll({
          employee_id: employee.id,
          pay_period: processForm.value.payrollType.toLowerCase() === 'quincenal' ? 'biweekly' : 'monthly',
          period_start: periodStart,
          period_end: periodEnd
        })

        // Mark as paid if payment date is provided
        if (processForm.value.paymentDate && payrollRecord.id) {
          await markAsPaid(payrollRecord.id)
        }

      } catch (employeeError: any) {
        console.error(`Error procesando empleado ${employee.name}:`, employeeError)
        const errorMessage = employeeError instanceof Error ? employeeError.message : String(employeeError)
        throw new Error(`Error procesando ${employee.name}: ${errorMessage}`)
      }
    }

    // Reload payroll data to reflect changes
    await loadPayrollData()

    // Mark as successful
    processingSuccess.value = true

    // Auto-close modal after 2 seconds
    setTimeout(() => {
      resetModalAndClose()
    }, 2000)

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al procesar la nómina'
    processingError.value = errorMessage
    console.error('Error al procesar nómina:', error)
  } finally {
    processingPayroll.value = false
  }
}

// Reset modal and close
const resetModalAndClose = () => {
  processForm.value = {
    payrollType: 'Quincenal',
    period: 'Febrero 2026',
    paymentDate: '',
    observation: '',
    selectedEmployees: []
  }
  availableEmployees.value.forEach(emp => emp.selected = false)
  processingSuccess.value = false
  processingError.value = ''
  showProcessModal.value = false
}

// Format date for display
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-CO')
}

// Get selected employees count
const selectedEmployeesCount = ref(0)

// Watch for employee selection changes
const updateSelectedCount = () => {
  selectedEmployeesCount.value = availableEmployees.value.filter(emp => emp.selected).length
}

// Cancel process
const cancelProcess = () => {
  resetModalAndClose()
}

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount)
}

// Get status color
const getStatusColor = (estado: string): 'success' | 'primary' | 'warning' | 'neutral' => {
  switch (estado) {
    case 'Pagado':
      return 'success'
    case 'Procesado':
      return 'primary'
    case 'Pendiente':
      return 'warning'
    default:
      return 'neutral'
  }
}

// Calculate totals for nomina
const nominaTotales = computed(() => {
  const records = displayPayrollRecords.value
  return {
    totalSalarios: records.reduce((sum, record) => sum + record.salario_base, 0),
    totalDeducciones: records.reduce((sum, record) => sum + record.deducciones, 0),
    totalNeto: records.reduce((sum, record) => sum + record.neto, 0)
  }
})
</script>

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

    <template #body>
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

      <!-- Ingresos Tab Content -->
      <div v-if="activeTab === 'Ingresos'" class="space-y-6">
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
                <UButton
                  icon="i-lucide-download"
                  label="Exportar"
                  color="neutral"
                  variant="outline"
                  size="sm"
                />
                <UButton
                  icon="i-lucide-filter"
                  label="Filtrar"
                  color="neutral"
                  variant="outline"
                  size="sm"
                />
              </div>
            </div>
          </template>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-border">
                <tr>
                  <th class="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Concepto</th>
                  <th class="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Categoría</th>
                  <th class="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Proyecto</th>
                  <th class="text-center py-3 px-4 font-medium text-sm text-muted-foreground">Fecha</th>
                  <th class="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Origen</th>
                  <th class="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Monto</th>
                  <th class="text-center py-3 px-4 font-medium text-sm text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="record in displayIncomeRecords" :key="record.id" class="hover:bg-muted/50">
                  <td class="py-3 px-4">
                    <div class="font-medium">{{ record.concept }}</div>
                    <div v-if="record.description" class="text-sm text-muted-foreground">{{ record.description }}</div>
                  </td>
                  <td class="py-3 px-4">
                    <span v-if="record.category_name" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                      {{ record.category_name }}
                    </span>
                    <span v-else class="text-sm text-muted-foreground">Sin categoría</span>
                  </td>
                  <td class="py-3 px-4 text-sm text-muted-foreground">
                    {{ record.project_name || record.description || '-' }}
                  </td>
                  <td class="py-3 px-4 text-center text-sm">{{ formatDate(record.date) }}</td>
                  <td class="py-3 px-4 text-sm">{{ record.origin }}</td>
                  <td class="py-3 px-4 text-right font-semibold text-success">{{ formatCurrency(record.amount) }}</td>
                  <td class="py-3 px-4 text-center">
                    <div class="flex items-center gap-1 justify-center">
                      <UTooltip text="Editar">
                        <UButton
                          icon="i-lucide-edit"
                          size="sm"
                          color="neutral"
                          variant="ghost"
                          square
                        />
                      </UTooltip>
                      <UTooltip text="Eliminar">
                        <UButton
                          icon="i-lucide-trash-2"
                          size="sm"
                          color="red"
                          variant="ghost"
                          square
                        />
                      </UTooltip>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-muted-foreground">
                Mostrando {{ displayIncomeRecords.length }} registro(s)
              </div>
              <div class="flex items-center gap-2">
                <UButton
                  icon="i-lucide-chevron-left"
                  size="sm"
                  color="neutral"
                  variant="outline"
                  square
                  disabled
                />
                <span class="text-sm text-muted-foreground">Página 1 de 1</span>
                <UButton
                  icon="i-lucide-chevron-right"
                  size="sm"
                  color="neutral"
                  variant="outline"
                  square
                  disabled
                />
              </div>
            </div>
          </template>
        </UCard>
      </div>

      <!-- Egresos Tab Content -->
      <div v-if="activeTab === 'Egresos'" class="space-y-6">
        <!-- KPI Cards and Action Button -->
        <div class="flex flex-col lg:flex-row gap-6">
          <!-- KPI Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            <UCard v-for="kpi in expensesKpis" :key="kpi.titulo" class="p-6">
              <div>
                <h3 class="text-sm font-medium text-muted-foreground mb-2">{{ kpi.titulo }}</h3>
                <p class="text-3xl font-bold text-red-600 mb-1">{{ kpi.valor }}</p>
                <p class="text-sm text-muted-foreground">{{ kpi.subtexto }}</p>
              </div>
            </UCard>
          </div>

          <!-- Register Expense Button -->
          <div class="flex items-center">
            <UButton
              icon="i-lucide-plus"
              label="Registrar egreso"
              color="neutral"
              size="lg"
              class="h-fit"
              @click="openExpenseModal"
            />
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Expenses by Month Chart -->
          <UCard class="lg:col-span-2">
            <template #header>
              <h3 class="text-lg font-semibold">Egresos por mes</h3>
            </template>

            <div class="h-64 flex items-center justify-center">
              <div class="text-center">
                <UIcon name="i-lucide-bar-chart-3" class="w-12 h-12 text-red-500 mb-2" />
                <p class="text-sm text-muted-foreground">Gráfico de barras de egresos</p>
                <p class="text-xs text-muted-foreground mt-1">Datos de Enero a Junio 2026</p>
              </div>
            </div>

            <template #footer>
              <div class="text-xs text-muted-foreground">
                Promedio mensual: ${{ Math.round(expensesChartData.reduce((sum, item) => sum + item.egresos, 0) / expensesChartData.length).toLocaleString() }}
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
                    :stroke-dashoffset="351.86 - (351.86 * expenseBudgetUtilization) / 100"
                    class="text-blue-500"
                  />
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-2xl font-bold">{{ expenseBudgetUtilization }}%</span>
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Expenses List Table -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Listado de egresos</h3>
              <div class="flex gap-2">
                <UButton
                  icon="i-lucide-download"
                  label="Exportar"
                  color="neutral"
                  variant="outline"
                  size="sm"
                />
                <UButton
                  icon="i-lucide-filter"
                  label="Filtrar"
                  color="neutral"
                  variant="outline"
                  size="sm"
                />
              </div>
            </div>
          </template>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-border">
                <tr>
                  <th class="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Concepto</th>
                  <th class="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Categoría</th>
                  <th class="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Proyecto</th>
                  <th class="text-center py-3 px-4 font-medium text-sm text-muted-foreground">Fecha</th>
                  <th class="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Origen</th>
                  <th class="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Monto</th>
                  <th class="text-center py-3 px-4 font-medium text-sm text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="record in displayExpenseRecords" :key="record.id" class="hover:bg-muted/50">
                  <td class="py-3 px-4">
                    <div class="font-medium">{{ record.concept }}</div>
                    <div v-if="record.description" class="text-sm text-muted-foreground">{{ record.description }}</div>
                  </td>
                  <td class="py-3 px-4">
                    <span v-if="record.category_name" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                      {{ record.category_name }}
                    </span>
                    <span v-else class="text-sm text-muted-foreground">Sin categoría</span>
                  </td>
                  <td class="py-3 px-4 text-sm text-muted-foreground">
                    {{ record.project_name || record.description || '-' }}
                  </td>
                  <td class="py-3 px-4 text-center text-sm">{{ formatDate(record.date) }}</td>
                  <td class="py-3 px-4 text-sm">{{ record.origin }}</td>
                  <td class="py-3 px-4 text-right font-semibold text-red-600">{{ formatCurrency(record.amount) }}</td>
                  <td class="py-3 px-4 text-center">
                    <div class="flex items-center gap-1 justify-center">
                      <UTooltip text="Editar">
                        <UButton
                          icon="i-lucide-edit"
                          size="sm"
                          color="neutral"
                          variant="ghost"
                          square
                        />
                      </UTooltip>
                      <UTooltip text="Eliminar">
                        <UButton
                          icon="i-lucide-trash-2"
                          size="sm"
                          color="red"
                          variant="ghost"
                          square
                        />
                      </UTooltip>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-muted-foreground">
                Mostrando {{ displayExpenseRecords.length }} registro(s)
              </div>
              <div class="flex items-center gap-2">
                <UButton
                  icon="i-lucide-chevron-left"
                  size="sm"
                  color="neutral"
                  variant="outline"
                  square
                  disabled
                />
                <span class="text-sm text-muted-foreground">Página 1 de 1</span>
                <UButton
                  icon="i-lucide-chevron-right"
                  size="sm"
                  color="neutral"
                  variant="outline"
                  square
                  disabled
                />
              </div>
            </div>
          </template>
        </UCard>
      </div>

      <!-- Nómina Tab Content -->
      <div v-if="activeTab === 'Nómina'" class="space-y-6">
        <!-- KPI Cards and Action Button -->
        <div class="flex flex-col lg:flex-row gap-6">
          <!-- KPI Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
            <UCard class="p-6">
              <div>
                <h3 class="text-sm font-medium text-muted-foreground mb-2">Total bruto</h3>
                <p class="text-3xl font-bold text-foreground mb-1">{{ formatCurrency(nominaTotales.totalSalarios) }}</p>
                <p class="text-sm text-muted-foreground">Período demo</p>
              </div>
            </UCard>
            <UCard class="p-6">
              <div>
                <h3 class="text-sm font-medium text-muted-foreground mb-2">Deducciones</h3>
                <p class="text-3xl font-bold text-red-600 mb-1">{{ formatCurrency(nominaTotales.totalDeducciones) }}</p>
                <p class="text-sm text-muted-foreground">Salud, pensión, etc.</p>
              </div>
            </UCard>
            <UCard class="p-6">
              <div>
                <h3 class="text-sm font-medium text-muted-foreground mb-2">Total neto</h3>
                <p class="text-3xl font-bold text-success mb-1">{{ formatCurrency(nominaTotales.totalNeto) }}</p>
                <p class="text-sm text-muted-foreground">A pagar</p>
              </div>
            </UCard>
          </div>

          <!-- Process Button -->
          <div class="flex items-center">
            <UButton
              icon="i-lucide-play"
              label="Procesar"
              color="neutral"
              size="lg"
              class="h-fit"
              @click="showProcessModal = true"
            />
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Payroll by Period Chart -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Nómina por período</h3>
            </template>

            <div class="h-64 flex items-center justify-center">
              <div class="text-center">
                <UIcon name="i-lucide-bar-chart-3" class="w-12 h-12 text-blue-500 mb-2" />
                <p class="text-sm text-muted-foreground">Gráfico de barras de nómina</p>
                <p class="text-xs text-muted-foreground mt-1">Datos por quincenas</p>
              </div>
            </div>

            <template #footer>
              <div class="text-xs text-muted-foreground">
                Ene-1, Ene-2, Feb-1, Feb-2 • Total nómina por período
              </div>
            </template>
          </UCard>

          <!-- Payroll Composition Chart -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Composición de nómina</h3>
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
                  <!-- Green section (Neto) - about 92% -->
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#10b981"
                    stroke-width="8"
                    fill="transparent"
                    stroke-dasharray="351.86"
                    :stroke-dashoffset="351.86 - (351.86 * 92) / 100"
                    class="text-green-500"
                  />
                  <!-- Red section (Deducciones) - about 8% -->
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#ef4444"
                    stroke-width="8"
                    fill="transparent"
                    stroke-dasharray="351.86"
                    :stroke-dashoffset="351.86 - (351.86 * 8) / 100"
                    :style="{ transform: `rotate(${(92 * 360) / 100}deg)` }"
                    transform-origin="64px 64px"
                  />
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="text-center">
                    <div class="text-xs text-muted-foreground">Neto</div>
                    <div class="text-sm font-bold">92%</div>
                  </div>
                </div>
              </div>
            </div>

            <template #footer>
              <div class="flex items-center justify-center gap-4 text-xs">
                <div class="flex items-center gap-1">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Neto (92%)</span>
                </div>
                <div class="flex items-center gap-1">
                  <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Deducciones (8%)</span>
                </div>
              </div>
            </template>
          </UCard>
        </div>

        <!-- Payroll Records Table -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Listado de nómina</h3>
              <div class="flex gap-2">
                <UButton
                  icon="i-lucide-play"
                  label="Procesar"
                  color="primary"
                  size="sm"
                  @click="showProcessModal = true"
                />
                <UButton
                  icon="i-lucide-download"
                  label="Exportar"
                  color="neutral"
                  variant="outline"
                  size="sm"
                />
                <UButton
                  icon="i-lucide-filter"
                  label="Filtrar"
                  color="neutral"
                  variant="outline"
                  size="sm"
                />
              </div>
            </div>
          </template>

          <div v-if="payrollLoading" class="flex items-center justify-center py-12">
            <div class="text-center">
              <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-gray-500 mx-auto mb-2" />
              <p class="text-sm text-gray-500">Cargando registros de nómina...</p>
            </div>
          </div>

          <div v-else-if="displayPayrollRecords.length === 0" class="flex items-center justify-center py-12">
            <div class="text-center">
              <UIcon name="i-lucide-file-x" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No hay registros de nómina</h3>
              <p class="text-gray-500 mb-4">Aún no se han procesado nóminas. Comienza creando un nuevo procesamiento.</p>
              <UButton
                icon="i-lucide-play"
                label="Procesar Primera Nómina"
                color="primary"
                @click="showProcessModal = true"
              />
            </div>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-border">
                <tr>
                  <th class="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Empleado</th>
                  <th class="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Cargo</th>
                  <th class="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Período</th>
                  <th class="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Bruto</th>
                  <th class="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Deducciones</th>
                  <th class="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Neto</th>
                  <th class="text-center py-3 px-4 font-medium text-sm text-muted-foreground">Estado</th>
                  <th class="text-center py-3 px-4 font-medium text-sm text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="record in displayPayrollRecords" :key="record.id" class="hover:bg-muted/50">
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-2">
                      <UAvatar
                        :text="record.empleado.split(' ').map(n => n[0]).join('')"
                        size="sm"
                      />
                      <span class="font-medium">{{ record.empleado }}</span>
                    </div>
                  </td>
                  <td class="py-3 px-4 text-sm">{{ record.cargo }}</td>
                  <td class="py-3 px-4 text-sm text-muted-foreground">{{ record.periodo }}</td>
                  <td class="py-3 px-4 text-right font-medium">{{ formatCurrency(record.salario_base) }}</td>
                  <td class="py-3 px-4 text-right text-red-600">{{ formatCurrency(record.deducciones) }}</td>
                  <td class="py-3 px-4 text-right font-semibold text-success">{{ formatCurrency(record.neto) }}</td>
                  <td class="py-3 px-4 text-center">
                    <UBadge
                      :label="record.estado"
                      :color="getStatusColor(record.estado)"
                      variant="solid"
                      size="sm"
                    />
                  </td>
                  <td class="py-3 px-4 text-center">
                    <div class="flex items-center gap-1 justify-center">
                      <UTooltip text="Ver comprobante">
                        <UButton
                          icon="i-lucide-file-text"
                          size="sm"
                          color="neutral"
                          variant="ghost"
                          square
                        />
                      </UTooltip>
                      <UTooltip text="Editar" v-if="record.estado !== 'Pagado'">
                        <UButton
                          icon="i-lucide-edit"
                          size="sm"
                          color="neutral"
                          variant="ghost"
                          square
                        />
                      </UTooltip>
                      <UTooltip text="Eliminar" v-if="record.estado !== 'Pagado'">
                        <UButton
                          icon="i-lucide-trash-2"
                          size="sm"
                          color="red"
                          variant="ghost"
                          square
                        />
                      </UTooltip>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-muted-foreground">
                Mostrando {{ displayPayrollRecords.length }} registro(s)
              </div>
              <div class="flex items-center gap-2">
                <UButton
                  icon="i-lucide-chevron-left"
                  size="sm"
                  color="neutral"
                  variant="outline"
                  square
                  disabled
                />
                <span class="text-sm text-muted-foreground">Página 1 de 1</span>
                <UButton
                  icon="i-lucide-chevron-right"
                  size="sm"
                  color="neutral"
                  variant="outline"
                  square
                  disabled
                />
              </div>
            </div>
          </template>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Process Payroll Modal -->
  <div
    v-if="showProcessModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    @click.self="cancelProcess"
  >
    <div class="bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden border border-slate-700">
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-slate-700">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-white">Procesar Nómina</h2>
          <button
            @click="cancelProcess"
            class="text-slate-400 hover:text-white transition-colors p-1"
          >
            <UIcon name="i-lucide-x" class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Modal Body -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
        <!-- Success Message -->
        <div v-if="processingSuccess" class="mb-6 p-4 bg-green-900/50 border border-green-700 rounded-lg">
          <div class="flex items-center">
            <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-green-400 mr-2" />
            <div>
              <h3 class="text-green-300 font-medium">¡Nómina procesada exitosamente!</h3>
              <p class="text-green-400 text-sm">Los pagos han sido registrados correctamente. Esta ventana se cerrará automáticamente.</p>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="processingError" class="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
          <div class="flex items-center">
            <UIcon name="i-lucide-alert-circle" class="w-5 h-5 text-red-400 mr-2" />
            <div>
              <h3 class="text-red-300 font-medium">Error al procesar nómina</h3>
              <p class="text-red-400 text-sm">{{ processingError }}</p>
            </div>
          </div>
        </div>

        <div v-if="!processingSuccess" class="space-y-6">
          <!-- Form Fields in Grid Layout -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Tipo de período -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Tipo de período *</label>
              <select
                v-model="processForm.payrollType"
                class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-no-repeat bg-right pr-10"
                style="background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNkw4IDEwTDEyIDYiIHN0cm9rZT0iIzk0QTNCOCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+'); background-position: right 12px center;"
              >
                <option value="Quincenal" class="bg-slate-800 text-white">Quincenal</option>
                <option value="Mensual" class="bg-slate-800 text-white">Mensual</option>
              </select>
            </div>

            <!-- Período -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Período *</label>
              <input
                v-model="processForm.period"
                type="text"
                placeholder="Febrero 2026"
                class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <!-- Fecha de pago -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Fecha de pago *</label>
              <input
                v-model="processForm.paymentDate"
                type="date"
                class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>

            <!-- Observación -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Observación (opcional)</label>
              <textarea
                v-model="processForm.observation"
                placeholder="Ej: Incluye horas extra"
                rows="3"
                class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              ></textarea>
            </div>
          </div>

          <!-- Employee Selection Section -->
          <div>
            <h3 class="text-lg font-medium text-white mb-4">Seleccionar empleados a pagar *</h3>

            <div v-if="availableEmployees.length === 0" class="text-center py-12 bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-600">
              <UIcon name="i-lucide-users-x" class="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h4 class="text-lg font-medium text-white mb-2">No hay empleados disponibles</h4>
              <p class="text-sm text-slate-400 mb-4">
                Primero necesitas agregar empleados al sistema antes de procesar nómina.
              </p>
              <button
                @click="$router.push('/equipo')"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ir a Equipo
              </button>
            </div>

            <div v-else class="space-y-3 max-h-80 overflow-y-auto border border-slate-600 rounded-lg p-4 bg-slate-800/30">
              <div
                v-for="employee in availableEmployees"
                :key="employee.id"
                class="border border-slate-600 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:bg-slate-700/50"
                :class="{
                  'bg-blue-900/50 border-blue-600': employee.selected,
                  'bg-slate-800/50': !employee.selected
                }"
                @click="toggleEmployeeSelection(employee.id); updateSelectedCount()"
              >
                <div class="flex items-start justify-between">
                  <div class="flex items-start gap-3">
                    <div class="w-5 h-5 border-2 border-slate-500 rounded flex items-center justify-center transition-colors mt-0.5"
                         :class="{
                           'bg-blue-600 border-blue-600': employee.selected,
                           'border-slate-500': !employee.selected
                         }">
                      <UIcon v-if="employee.selected" name="i-lucide-check" class="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <h4 class="font-semibold text-white">{{ employee.name }}</h4>
                      <div class="text-sm text-slate-300 mt-1">
                        <div>Bruto: {{ formatCurrency(employee.salary) }} • Neto: {{ formatCurrency(employee.netPay) }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="w-5 h-5 border-2 rounded"
                       :class="{
                         'bg-slate-900 border-slate-900': employee.selected,
                         'border-slate-500': !employee.selected
                       }">
                    <UIcon v-if="employee.selected" name="i-lucide-check" class="w-3 h-3 text-white m-0.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-4 border-t border-slate-700 bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div class="text-sm text-slate-400">
            <span v-if="availableEmployees.filter(emp => emp.selected).length > 0">
              {{ availableEmployees.filter(emp => emp.selected).length }} empleado(s) seleccionado(s) •
              Total a pagar: {{ formatCurrency(availableEmployees.filter(emp => emp.selected).reduce((sum, emp) => sum + emp.netPay, 0)) }}
            </span>
            <span v-else>Seleccione al menos un empleado para procesar</span>
          </div>
          <div class="flex gap-3">
            <button
              type="button"
              @click="cancelProcess"
              :disabled="processingPayroll"
              class="px-4 py-2 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              @click="processPayrollPayments"
              :disabled="processingPayroll || availableEmployees.filter(emp => emp.selected).length === 0 || !processForm.paymentDate"
              class="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 flex items-center gap-2"
            >
              <UIcon v-if="processingPayroll" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
              <UIcon v-else name="i-lucide-play" class="w-4 h-4" />
              {{ processingPayroll ? 'Procesando...' : 'Procesar Nómina' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Income Registration Modal -->
  <div
    v-if="showIncomeModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    @click.self="closeIncomeModal"
  >
    <div class="bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-slate-700">
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-slate-700">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-white">Registrar Ingreso</h2>
          <button
            @click="closeIncomeModal"
            class="text-slate-400 hover:text-white transition-colors p-1"
          >
            <UIcon name="i-lucide-x" class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Modal Body -->
      <div class="p-6 space-y-4">
        <!-- Success Message -->
        <div v-if="incomeSuccess" class="p-4 bg-green-900/50 border border-green-700 rounded-lg">
          <div class="flex items-center">
            <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-green-400 mr-2" />
            <div>
              <h3 class="text-green-300 font-medium">¡Ingreso registrado exitosamente!</h3>
              <p class="text-green-400 text-sm">El ingreso ha sido agregado correctamente.</p>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="incomeSubmissionError" class="p-4 bg-red-900/50 border border-red-700 rounded-lg">
          <div class="flex items-center">
            <UIcon name="i-lucide-alert-circle" class="w-5 h-5 text-red-400 mr-2" />
            <div>
              <h3 class="text-red-300 font-medium">Error al registrar ingreso</h3>
              <p class="text-red-400 text-sm">{{ incomeSubmissionError }}</p>
            </div>
          </div>
        </div>

        <form @submit.prevent="submitIncome" v-if="!incomeSuccess" class="space-y-4">
          <!-- Concept Field -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Concepto *</label>
            <input
              v-model="incomeForm.concept"
              type="text"
              placeholder="Ej: Pago cliente Sprint 2"
              :disabled="submittingIncome"
              class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
          </div>

          <!-- Amount and Date Row -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Monto (COP) *</label>
              <input
                v-model="incomeForm.amount"
                type="number"
                step="1"
                min="1"
                placeholder="Ej: 4500000"
                :disabled="submittingIncome"
                class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Fecha *</label>
              <input
                v-model="incomeForm.date"
                type="date"
                :disabled="submittingIncome"
                class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>
          </div>

          <!-- Category Selection -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Categoría *</label>
            <select
              v-model="incomeForm.category_id"
              :disabled="submittingIncome"
              class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 appearance-none bg-no-repeat bg-right pr-10"
              style="background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNkw4IDEwTDEyIDYiIHN0cm9rZT0iIzk0QTNCOCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+'); background-position: right 12px center;"
            >
              <option :value="null" class="bg-slate-800 text-white">Selecciona...</option>
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
                class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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
              class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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
              class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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

  <!-- Expenses Registration Modal -->
  <div
    v-if="expenseModalOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click.self="closeExpenseModal"
  >
    <div class="bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl">
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-red-900/20 to-orange-900/20">
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

          <!-- New Category Field -->
          <div class="flex items-end gap-3">
            <div class="flex-1">
              <label class="block text-sm font-medium text-slate-300 mb-2">Nueva categoría (opcional)</label>
              <input
                v-model="expenseForm.new_category"
                type="text"
                placeholder="Nombre de nueva categoría"
                :disabled="submittingExpense"
                class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
              />
            </div>
            <button
              type="button"
              :disabled="!expenseForm.new_category.trim() || submittingExpense"
              @click="() => {
                if (expenseForm.new_category.trim()) {
                  console.log('Creating category:', expenseForm.new_category.trim())
                }
              }"
              class="px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:text-slate-400 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Agregar
            </button>
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
        </form>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-4 border-t border-slate-700 bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div class="text-sm text-slate-400">
            <span v-if="expenseForm.amount">
              Complete los campos obligatorios
            </span>
            <span v-else>Complete los campos obligatorios</span>
          </div>
          <div class="flex gap-3">
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
              :disabled="submittingExpense || !expenseForm.concept.trim() || !expenseForm.amount || !expenseForm.date || !expenseForm.origin.trim()"
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