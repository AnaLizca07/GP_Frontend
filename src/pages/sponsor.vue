<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSlowLoad } from '@/composables/useSlowLoad'
import { useDashboard } from '@/composables/useDashboard'
import { useNotificationsStore } from '@/stores/notifications'
import projectsService from '@/services/projects'
import tasksService from '@/services/tasks'
import kpisService, { type MemberPerformance, type EmployeePerformance, type BudgetSummary } from '@/services/kpis'
import ratingsService, { type EmployeeRating } from '@/services/ratings'
import { payrollService } from '@/services/payroll'
import CircularProgress from '@/components/charts/CircularProgress.vue'
import { formatCOP } from '@/utils'

const authStore = useAuthStore()
const { isNotificationsSlideoverOpen } = useDashboard()
const notificationsStore = useNotificationsStore()

// ─── State ──────────────────────────────────────────────────────────────
const projects = ref<any[]>([])
const selectedProjectId = ref<number | null>(null)
const tasks = ref<any[]>([])
const loadingProjects = ref(true)
const loadingTasks = ref(false)
const { slowLoad, startTimer, clearTimer } = useSlowLoad()
const activeTab = ref<'tasks' | 'employees'>('tasks')

// Budget
const budgetSummary = ref<BudgetSummary | null>(null)
const loadingBudget = ref(false)

// Employees
const members = ref<MemberPerformance[]>([])
const loadingMembers = ref(false)
const membersLoaded = ref(false)

// Employee detail slideover
const selectedEmployee = ref<MemberPerformance | null>(null)
const employeeDetail = ref<EmployeePerformance | null>(null)
const loadingDetail = ref(false)
const showDetail = ref(false)
const ratings = ref<EmployeeRating[]>([])
const loadingRatings = ref(false)
const receipts = ref<Array<{ id: number; period_start: string; period_end: string; net_pay: number; receipt_url: string | null; paid_at: string | null; status: string }>>([])
const loadingReceipts = ref(false)

// ─── Load projects ────────────────────────────────────────────────────────
onMounted(async () => {
  startTimer()
  try {
    const res = await projectsService.getProjects()
    projects.value = res.projects ?? res ?? []
    if (projects.value.length > 0) {
      selectedProjectId.value = projects.value[0].id
      await Promise.all([loadTasks(projects.value[0].id), loadBudget(projects.value[0].id)])
    }
  } catch (err) {
    console.error('Error cargando proyectos:', err)
  } finally {
    clearTimer()
    loadingProjects.value = false
  }
})

async function loadTasks(projectId: number) {
  loadingTasks.value = true
  try {
    const res = await tasksService.getTasks({ project_id: projectId })
    tasks.value = res.tasks
  } catch (err) {
    console.error('Error cargando tareas:', err)
  } finally {
    loadingTasks.value = false
  }
}

async function loadMembers(projectId: number) {
  if (membersLoaded.value) return
  loadingMembers.value = true
  try {
    const res = await kpisService.getSponsorProjectEmployeePerformance(projectId)
    members.value = res.members ?? []
    membersLoaded.value = true
  } catch (err) {
    console.error('Error cargando empleados:', err)
  } finally {
    loadingMembers.value = false
  }
}

async function loadBudget(projectId: number) {
  loadingBudget.value = true
  budgetSummary.value = null
  try {
    budgetSummary.value = await kpisService.getBudgetSummary(projectId)
  } catch (err) {
    console.error('Error cargando presupuesto:', err)
  } finally {
    loadingBudget.value = false
  }
}

async function selectProject(id: number) {
  selectedProjectId.value = id
  activeTab.value = 'tasks'
  membersLoaded.value = false
  members.value = []
  await Promise.all([loadTasks(id), loadBudget(id)])
}

async function handleTabChange(tab: 'tasks' | 'employees') {
  activeTab.value = tab
  if (tab === 'employees' && selectedProjectId.value !== null && !membersLoaded.value) {
    await loadMembers(selectedProjectId.value)
  }
}

async function openEmployeeDetail(member: MemberPerformance) {
  selectedEmployee.value = member
  showDetail.value = true
  loadingDetail.value = true
  loadingRatings.value = true
  loadingReceipts.value = true
  employeeDetail.value = null
  ratings.value = []
  receipts.value = []
  try {
    const [detail, ratingList, receiptList] = await Promise.all([
      kpisService.getEmployeePerformanceForSponsor(member.employee_id),
      ratingsService.getRatings(member.employee_id),
      payrollService.getEmployeeReceipts(member.employee_id),
    ])
    employeeDetail.value = detail
    ratings.value = ratingList
    receipts.value = receiptList
  } catch (err) {
    console.error('Error cargando detalle:', err)
  } finally {
    loadingDetail.value = false
    loadingRatings.value = false
    loadingReceipts.value = false
  }
}

const selectedProject = computed(() =>
  projects.value.find(p => p.id === selectedProjectId.value)
)

// ─── KPIs derivados ──────────────────────────────────────────────────────
const totalTasks = computed(() => tasks.value.length)
const completedTasks = computed(() => tasks.value.filter(t => t.status === 'completed').length)
const inProgressTasks = computed(() => tasks.value.filter(t => t.status === 'in_progress').length)
const pendingTasks = computed(() => tasks.value.filter(t => t.status === 'pending').length)
const progress = computed(() =>
  totalTasks.value > 0 ? Math.round((completedTasks.value / totalTasks.value) * 100) : 0
)

// ─── Helpers ─────────────────────────────────────────────────────────────
const statusColor: Record<string, string> = {
  pending: 'neutral', in_progress: 'warning', completed: 'success', blocked: 'error',
}
const statusLabel: Record<string, string> = {
  pending: 'Por Hacer', in_progress: 'En Progreso', completed: 'Completada', blocked: 'Bloqueada',
}
const priorityColor: Record<string, string> = {
  low: 'success', medium: 'warning', high: 'error', urgent: 'error',
}
const priorityLabel: Record<string, string> = {
  low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente',
}

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

function completionColor(rate: number): string {
  if (rate >= 80) return 'text-green-600 dark:text-green-400'
  if (rate >= 50) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-500'
}
</script>

<template>
  <UDashboardPanel id="sponsor-dashboard" class="min-h-screen overflow-y-auto">
    <template #header>
      <UDashboardNavbar title="Dashboard" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <div class="hidden sm:flex flex-col">
            <span class="text-lg font-bold">ProjeGest</span>
            <span class="text-xs text-muted-foreground">Panel de Patrocinador</span>
          </div>
        </template>
        <template #right>
          <UTooltip text="Notificaciones">
            <UButton color="neutral" variant="ghost" square @click="isNotificationsSlideoverOpen = true">
              <UChip color="error" :show="notificationsStore.unreadCount > 0" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 md:p-6 lg:p-8 space-y-6">

        <!-- Encabezado -->
        <div>
          <h1 class="text-2xl font-bold mb-1">Seguimiento de Proyectos</h1>
          <p class="text-sm text-muted-foreground">Visualiza el avance de los proyectos en tiempo real</p>
        </div>

        <!-- Cargando -->
        <div v-if="loadingProjects" class="space-y-3">
          <USkeleton class="h-10 w-48 rounded-lg" />
          <USkeleton class="h-32 rounded-xl" />
          <p v-if="slowLoad" class="text-sm text-muted-foreground text-center">
            El servidor está iniciando. En el plan gratuito de hosting puede tardar hasta 40 segundos la primera vez del día.
          </p>
        </div>

        <!-- Sin proyectos -->
        <UCard v-else-if="projects.length === 0" class="text-center py-12">
          <UIcon name="i-lucide-folder-open" class="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p class="text-sm text-muted-foreground">No hay proyectos disponibles para tu cuenta</p>
        </UCard>

        <template v-else>
          <!-- Selector de proyecto -->
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="p in projects"
              :key="p.id"
              :variant="selectedProjectId === p.id ? 'solid' : 'outline'"
              :color="selectedProjectId === p.id ? 'primary' : 'neutral'"
              size="sm"
              @click="selectProject(p.id)"
            >
              {{ p.name }}
            </UButton>
          </div>

          <template v-if="selectedProject">
            <!-- Info del proyecto -->
            <UCard>
              <div class="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 class="text-xl font-bold mb-1">{{ selectedProject.name }}</h2>
                  <p v-if="selectedProject.description" class="text-sm text-muted-foreground max-w-xl">
                    {{ selectedProject.description }}
                  </p>
                </div>
                <div class="flex gap-4 text-sm text-muted-foreground">
                  <div v-if="selectedProject.start_date">
                    <p class="text-xs">Inicio</p>
                    <p class="font-medium text-foreground">{{ formatDate(selectedProject.start_date) }}</p>
                  </div>
                  <div v-if="selectedProject.end_date">
                    <p class="text-xs">Fecha estimada fin</p>
                    <p class="font-medium text-foreground">{{ formatDate(selectedProject.end_date) }}</p>
                  </div>
                </div>
              </div>
              <div class="mt-6">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium">Avance general</span>
                  <span class="text-sm font-bold" style="color: #003C68">{{ progress }}%</span>
                </div>
                <div class="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full"
                    style="background-color: #003C68; transition: none"
                    :style="{ width: `${progress}%` }"
                  />
                </div>
                <p class="text-xs text-muted-foreground mt-1">
                  {{ completedTasks }} de {{ totalTasks }} tareas completadas
                </p>
              </div>
            </UCard>

            <!-- KPIs de tareas -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <UCard class="p-5">
                <p class="text-xs text-muted-foreground mb-1">Total tareas</p>
                <p class="text-2xl font-bold">{{ totalTasks }}</p>
              </UCard>
              <UCard class="p-5">
                <p class="text-xs text-muted-foreground mb-1">Completadas</p>
                <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ completedTasks }}</p>
              </UCard>
              <UCard class="p-5">
                <p class="text-xs text-muted-foreground mb-1">En progreso</p>
                <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ inProgressTasks }}</p>
              </UCard>
              <UCard class="p-5">
                <p class="text-xs text-muted-foreground mb-1">Pendientes</p>
                <p class="text-2xl font-bold text-zinc-500">{{ pendingTasks }}</p>
              </UCard>
            </div>

            <!-- Presupuesto del proyecto -->
            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-circle-dollar-sign" class="w-4 h-4 text-primary" />
                  <h3 class="font-semibold">Presupuesto</h3>
                </div>
              </template>

              <div v-if="loadingBudget" class="space-y-3 py-1">
                <USkeleton v-for="i in 2" :key="i" class="h-7 rounded" />
              </div>

              <div v-else-if="!budgetSummary || budgetSummary.total_budget === 0" class="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <UIcon name="i-lucide-info" class="w-4 h-4 shrink-0" />
                Sin presupuesto definido para este proyecto.
              </div>

              <div v-else class="space-y-4 py-1">
                <!-- Barra de consumo -->
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-sm">Presupuesto consumido</span>
                    <span
                      class="text-sm font-bold"
                      :class="budgetSummary.consumed_percentage >= 90 ? 'text-red-500' : budgetSummary.consumed_percentage >= 70 ? 'text-amber-500' : 'text-green-600 dark:text-green-400'"
                    >
                      {{ budgetSummary.consumed_percentage.toFixed(1) }}%
                    </span>
                  </div>
                  <div class="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full"
                      style="transition: none"
                      :style="{
                        width: `${Math.min(budgetSummary.consumed_percentage, 100)}%`,
                        backgroundColor: budgetSummary.consumed_percentage >= 90 ? '#EF4444' : budgetSummary.consumed_percentage >= 70 ? '#F59E0B' : '#003C68'
                      }"
                    />
                  </div>
                </div>

                <!-- Métricas -->
                <div class="grid grid-cols-3 gap-2">
                  <div class="p-3 rounded-lg bg-muted/30 text-center">
                    <p class="text-xs text-muted-foreground mb-1">Presupuesto</p>
                    <p class="text-xs font-bold truncate">{{ formatCOP(budgetSummary.total_budget) }}</p>
                  </div>
                  <div class="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-center">
                    <p class="text-xs text-muted-foreground mb-1">Ingresos</p>
                    <p class="text-xs font-bold text-blue-600 dark:text-blue-400 truncate">{{ formatCOP(budgetSummary.income) }}</p>
                  </div>
                  <div class="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-center">
                    <p class="text-xs text-muted-foreground mb-1">Egresos</p>
                    <p class="text-xs font-bold text-red-600 dark:text-red-400 truncate">{{ formatCOP(budgetSummary.spent) }}</p>
                  </div>
                </div>
                <!-- Saldo real -->
                <div class="flex items-center justify-between text-xs border-t border-default pt-2 mt-2">
                  <span class="text-muted-foreground flex items-center gap-1">
                    <UIcon name="i-lucide-wallet" class="w-3.5 h-3.5" :class="budgetSummary.available_balance >= 0 ? 'text-green-500' : 'text-red-500'" />
                    Saldo disponible
                  </span>
                  <span class="font-bold" :class="budgetSummary.available_balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                    {{ formatCOP(budgetSummary.available_balance) }}
                  </span>
                </div>
              </div>
            </UCard>

            <!-- Tabs: Tareas / Empleados -->
            <div class="border-b border-default">
              <div class="flex gap-0">
                <button
                  class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
                  :class="activeTab === 'tasks'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'"
                  @click="handleTabChange('tasks')"
                >
                  <UIcon name="i-lucide-clipboard-list" class="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  Tareas
                </button>
                <button
                  class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
                  :class="activeTab === 'employees'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'"
                  @click="handleTabChange('employees')"
                >
                  <UIcon name="i-lucide-users" class="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  Empleados
                </button>
              </div>
            </div>

            <!-- Tab: Tareas -->
            <UCard v-if="activeTab === 'tasks'">
              <template #header>
                <h3 class="font-semibold">Tareas del proyecto</h3>
              </template>

              <div v-if="loadingTasks" class="space-y-3">
                <USkeleton v-for="i in 4" :key="i" class="h-12 rounded-lg" />
              </div>

              <div v-else-if="tasks.length === 0" class="text-center py-8">
                <p class="text-sm text-muted-foreground">No hay tareas registradas</p>
              </div>

              <div v-else class="space-y-2">
                <div
                  v-for="task in tasks"
                  :key="task.id"
                  class="flex items-center justify-between gap-3 p-3 rounded-lg border border-border"
                >
                  <div class="flex items-center gap-2 min-w-0 flex-1">
                    <UIcon
                      :name="task.status === 'completed' ? 'i-lucide-check-circle-2' : 'i-lucide-circle-dashed'"
                      class="w-4 h-4 flex-shrink-0"
                      :class="task.status === 'completed' ? 'text-green-500' : 'text-muted-foreground'"
                    />
                    <span class="text-sm truncate">{{ task.title }}</span>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <UBadge :color="priorityColor[task.priority]" variant="subtle" size="xs">
                      {{ priorityLabel[task.priority] }}
                    </UBadge>
                    <UBadge :color="statusColor[task.status]" size="xs">
                      {{ statusLabel[task.status] }}
                    </UBadge>
                    <span v-if="task.due_date" class="text-xs text-muted-foreground">
                      {{ formatDate(task.due_date) }}
                    </span>
                  </div>
                </div>
              </div>
            </UCard>

            <!-- Tab: Empleados -->
            <UCard v-else-if="activeTab === 'employees'">
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-users" class="w-4 h-4" />
                  <h3 class="font-semibold">Equipo del proyecto</h3>
                </div>
              </template>

              <div v-if="loadingMembers" class="space-y-3">
                <USkeleton v-for="i in 4" :key="i" class="h-16 rounded-lg" />
              </div>

              <div v-else-if="members.length === 0" class="text-center py-10">
                <UIcon name="i-lucide-user-x" class="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                <p class="text-sm text-muted-foreground">No hay empleados asignados a este proyecto</p>
              </div>

              <div v-else class="space-y-2">
                <button
                  v-for="member in members"
                  :key="member.employee_id"
                  class="w-full text-left p-4 rounded-lg border border-border hover:bg-muted/40 transition-colors group"
                  @click="openEmployeeDetail(member)"
                >
                  <div class="flex items-center justify-between gap-4">
                    <div class="flex items-center gap-3 min-w-0">
                      <!-- Avatar inicial -->
                      <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span class="text-sm font-bold text-primary">
                          {{ member.employee_name.charAt(0).toUpperCase() }}
                        </span>
                      </div>
                      <div class="min-w-0">
                        <p class="font-medium text-sm truncate">{{ member.employee_name }}</p>
                        <p class="text-xs text-muted-foreground truncate">{{ member.position || 'Sin cargo' }}</p>
                      </div>
                    </div>

                    <!-- Stats rápidos -->
                    <div class="flex items-center gap-4 shrink-0">
                      <div class="text-right hidden sm:block">
                        <p class="text-xs text-muted-foreground">Completitud</p>
                        <p class="text-sm font-bold" :class="completionColor(member.completion_rate)">
                          {{ member.completion_rate }}%
                        </p>
                      </div>
                      <div class="text-right hidden sm:block">
                        <p class="text-xs text-muted-foreground">Tareas</p>
                        <p class="text-sm font-medium">
                          {{ member.completed_tasks }}/{{ member.total_tasks }}
                        </p>
                      </div>
                      <UBadge
                        v-if="member.overdue_tasks > 0"
                        color="error"
                        variant="subtle"
                        size="xs"
                      >
                        {{ member.overdue_tasks }} vencida{{ member.overdue_tasks > 1 ? 's' : '' }}
                      </UBadge>
                      <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </div>

                  <!-- Mini barra de progreso -->
                  <div class="mt-3">
                    <div class="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all"
                        :style="`width: ${member.completion_rate}%; background-color: #003C68`"
                      />
                    </div>
                  </div>
                </button>
              </div>
            </UCard>

          </template>
        </template>

      </div>
    </template>
  </UDashboardPanel>

  <!-- Slide-over detalle del empleado -->
  <USlideover
    v-model:open="showDetail"
    :title="selectedEmployee?.employee_name ?? 'Empleado'"
    :description="selectedEmployee?.position ?? ''"
    side="right"
  >
    <template #body>
      <div class="p-4 space-y-5">

        <!-- Cargando -->
        <div v-if="loadingDetail" class="space-y-3">
          <USkeleton class="h-20 rounded-xl" />
          <USkeleton class="h-32 rounded-xl" />
          <USkeleton class="h-24 rounded-xl" />
        </div>

        <template v-else-if="employeeDetail">
          <!-- Tasa de completitud circular -->
          <UCard class="p-5">
            <div class="flex items-center gap-5">
              <CircularProgress
                :value="employeeDetail.completion_rate"
                :size="68"
                color="#003C68"
              />
              <div>
                <p class="text-sm font-semibold">Tasa de Completitud</p>
                <p class="text-xs text-muted-foreground mt-1">
                  {{ employeeDetail.completed_tasks }} de {{ employeeDetail.total_tasks }} tareas completadas
                </p>
                <p v-if="employeeDetail.overdue_tasks > 0" class="text-xs text-red-500 mt-1">
                  {{ employeeDetail.overdue_tasks }} tarea{{ employeeDetail.overdue_tasks > 1 ? 's' : '' }} vencida{{ employeeDetail.overdue_tasks > 1 ? 's' : '' }}
                </p>
              </div>
            </div>
          </UCard>

          <!-- Contadores de tareas -->
          <div class="grid grid-cols-2 gap-3">
            <UCard class="p-4">
              <p class="text-xs text-muted-foreground mb-1">En progreso</p>
              <p class="text-xl font-bold text-amber-600 dark:text-amber-400">{{ employeeDetail.in_progress_tasks }}</p>
            </UCard>
            <UCard class="p-4">
              <p class="text-xs text-muted-foreground mb-1">Pendientes</p>
              <p class="text-xl font-bold text-zinc-500">{{ employeeDetail.pending_tasks }}</p>
            </UCard>
            <UCard class="p-4">
              <p class="text-xs text-muted-foreground mb-1">Bloqueadas</p>
              <p class="text-xl font-bold text-red-500">{{ employeeDetail.blocked_tasks }}</p>
            </UCard>
            <UCard class="p-4">
              <p class="text-xs text-muted-foreground mb-1">Vencidas</p>
              <p class="text-xl font-bold" :class="employeeDetail.overdue_tasks > 0 ? 'text-red-500' : 'text-zinc-400'">
                {{ employeeDetail.overdue_tasks }}
              </p>
            </UCard>
          </div>

          <!-- Proyectos asignados -->
          <UCard v-if="employeeDetail.assigned_projects.length > 0">
            <template #header>
              <p class="text-sm font-semibold">Proyectos asignados</p>
            </template>
            <div class="space-y-2">
              <div
                v-for="proj in employeeDetail.assigned_projects"
                :key="proj.project_id"
                class="flex items-center justify-between text-sm py-1 border-b dark:border-gray-800 last:border-0"
              >
                <span class="truncate font-medium flex-1 mr-2">{{ proj.project_name }}</span>
                <span class="text-xs text-muted-foreground shrink-0">
                  {{ proj.dedication_percentage.toFixed(0) }}% dedicación
                </span>
              </div>
            </div>
          </UCard>

        </template>

        <!-- Error al cargar -->
        <div v-else class="text-center py-10">
          <UIcon name="i-lucide-alert-circle" class="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p class="text-sm text-muted-foreground">No se pudo cargar la información del empleado</p>
        </div>

        <!-- Comprobantes de Pago -->
        <div>
          <div class="flex items-center gap-2 mb-3">
            <UIcon name="i-lucide-file-text" class="w-4 h-4 text-primary" />
            <p class="text-sm font-semibold">Comprobantes de Pago</p>
          </div>

          <div v-if="loadingReceipts" class="space-y-2">
            <USkeleton v-for="i in 3" :key="i" class="h-12 rounded-lg" />
          </div>

          <div v-else-if="receipts.length === 0" class="text-center py-6 rounded-lg border border-dashed border-default">
            <UIcon name="i-lucide-file-x" class="w-6 h-6 text-muted-foreground mx-auto mb-1 opacity-30" />
            <p class="text-xs text-muted-foreground">Sin comprobantes registrados aún</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="receipt in receipts"
              :key="receipt.id"
              class="flex items-center justify-between gap-3 p-3 rounded-lg border border-default bg-elevated/30"
            >
              <div class="min-w-0 flex-1">
                <p class="text-xs font-medium">
                  {{ formatDate(receipt.period_start) }} — {{ formatDate(receipt.period_end) }}
                </p>
                <p class="text-xs text-muted-foreground mt-0.5">
                  Neto: <span class="font-semibold text-foreground">{{ formatCOP(receipt.net_pay) }}</span>
                </p>
              </div>
              <UButton
                v-if="receipt.receipt_url"
                :to="receipt.receipt_url"
                target="_blank"
                color="primary"
                variant="ghost"
                size="xs"
                icon="i-lucide-download"
              >
                PDF
              </UButton>
              <UBadge v-else color="neutral" variant="subtle" size="xs">Sin PDF</UBadge>
            </div>
          </div>
        </div>

        <!-- Historial de calificaciones -->
        <div>
          <div class="flex items-center gap-2 mb-3">
            <UIcon name="i-lucide-star" class="w-4 h-4 text-yellow-500" />
            <p class="text-sm font-semibold">Historial de Calificaciones</p>
          </div>

          <div v-if="loadingRatings" class="space-y-2">
            <USkeleton v-for="i in 3" :key="i" class="h-14 rounded-lg" />
          </div>

          <div v-else-if="ratings.length === 0" class="text-center py-6 rounded-lg border border-dashed border-default">
            <UIcon name="i-lucide-star" class="w-6 h-6 text-muted-foreground mx-auto mb-1 opacity-30" />
            <p class="text-xs text-muted-foreground">Sin calificaciones registradas aún</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="r in ratings"
              :key="r.id"
              class="p-3 rounded-lg border border-default bg-elevated/30"
            >
              <!-- Estrellas + fecha -->
              <div class="flex items-center justify-between mb-1">
                <div class="flex gap-0.5">
                  <UIcon
                    v-for="i in 5"
                    :key="i"
                    name="i-lucide-star"
                    class="w-4 h-4"
                    :class="i <= r.stars ? 'text-yellow-500' : 'text-muted-foreground opacity-30'"
                  />
                </div>
                <span class="text-xs text-muted-foreground">{{ formatDateTime(r.created_at) }}</span>
              </div>
              <!-- Comentario -->
              <p v-if="r.comment" class="text-xs text-foreground leading-relaxed">{{ r.comment }}</p>
              <p v-else class="text-xs text-muted-foreground italic">Sin comentario</p>
            </div>
          </div>
        </div>

      </div>
    </template>
  </USlideover>
</template>
