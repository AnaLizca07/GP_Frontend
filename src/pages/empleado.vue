<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDashboard } from '@/composables/useDashboard'
import { useNotificationsStore } from '@/stores/notifications'
import api from '@/services/api'
import tasksService, { type Task } from '@/services/tasks'
import { employeeService } from '@/services/employees'
import kpisService, { type EmployeePerformance } from '@/services/kpis'
import okrsService, { type Okr } from '@/services/okrs'
import CircularProgress from '@/components/charts/CircularProgress.vue'
import ProgressBar from '@/components/charts/ProgressBar.vue'
import ExportPdfButton from '@/components/ui/ExportPdfButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const { isNotificationsSlideoverOpen } = useDashboard()
const notificationsStore = useNotificationsStore()

// ─── State ──────────────────────────────────────────────────────────────
const tasks = ref<Task[]>([])
const loading = ref(true)
const showCompleteModal = ref(false)
const selectedTask = ref<Task | null>(null)
const performance = ref<EmployeePerformance | null>(null)
const employeeId = ref<number | null>(null)
const okrs = ref<Okr[]>([])
const loadingOkrs = ref(false)

// ─── Load data ───────────────────────────────────────────────────────────
onMounted(async () => {
  loadingOkrs.value = true
  try {
    // Tasks, profile and OKRs all start in parallel
    const [tasksRes, profileRes] = await Promise.all([
      tasksService.getTasks(),
      employeeService.getMyProfile(),
      okrsService.getOkrs({ status: 'active' })
        .then(data => { okrs.value = data })
        .catch(e => console.error('Error cargando OKRs:', e))
        .finally(() => { loadingOkrs.value = false }),
    ])
    tasks.value = tasksRes.tasks
    if (profileRes) {
      employeeId.value = profileRes.id
    }
  } catch (err) {
    console.error('Error cargando datos del empleado:', err)
    loadingOkrs.value = false
  } finally {
    // Show main content as soon as tasks + profile are ready
    loading.value = false
  }

  // Load performance in background (non-blocking for initial render)
  if (employeeId.value) {
    kpisService.getEmployeePerformance(employeeId.value)
      .then(data => { performance.value = data })
      .catch(e => console.error('Error cargando performance:', e))
  }
})

// ─── KPIs derivados ──────────────────────────────────────────────────────
const totalTasks = computed(() => tasks.value.length)
const inProgressTasks = computed(() => tasks.value.filter(t => t.status === 'in_progress').length)
const pendingTasks = computed(() => tasks.value.filter(t => t.status === 'pending').length)
const completedTasks = computed(() => tasks.value.filter(t => t.status === 'completed').length)
const completionRate = computed(() =>
  totalTasks.value > 0 ? Math.round((completedTasks.value / totalTasks.value) * 100) : 0
)

// Tareas urgentes o vencidas
const urgentTasks = computed(() =>
  tasks.value.filter(t => {
    if (t.status === 'completed') return false
    if (t.priority === 'urgent') return true
    if (t.due_date) {
      return new Date(t.due_date) < new Date()
    }
    return false
  })
)

// ─── Helpers ─────────────────────────────────────────────────────────────
const statusLabel: Record<string, string> = {
  pending: 'Por Hacer',
  in_progress: 'En Progreso',
  completed: 'Completada',
  blocked: 'Bloqueada',
}

const statusColor: Record<string, string> = {
  pending: 'neutral',
  in_progress: 'warning',
  completed: 'success',
  blocked: 'error',
}

const priorityLabel: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
}

const priorityColor: Record<string, string> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  urgent: 'error',
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const isOverdue = (task: Task) => {
  if (task.status === 'completed') return false
  return task.due_date ? new Date(task.due_date) < new Date() : false
}

// ─── RF16: Enviar informe por email ──────────────────────────────────────
const sendingReport = ref(false)
const reportSent = ref(false)

const sendReportByEmail = async () => {
  if (!employeeId.value) return
  sendingReport.value = true
  reportSent.value = false
  try {
    await api.post(`/api/employees/${employeeId.value}/report/send-email`)
    reportSent.value = true
    setTimeout(() => { reportSent.value = false }, 4000)
  } catch (e) {
    console.error('Error enviando informe:', e)
  } finally {
    sendingReport.value = false
  }
}

// ─── Acciones ────────────────────────────────────────────────────────────
const openCompleteModal = (task: Task) => {
  selectedTask.value = task
  showCompleteModal.value = true
}

const onTaskCompleted = () => {
  if (selectedTask.value) {
    const t = tasks.value.find(t => t.id === selectedTask.value!.id)
    if (t) t.status = 'completed'
  }
  showCompleteModal.value = false
}
</script>

<template>
  <UDashboardPanel id="employee-dashboard" class="min-h-screen overflow-y-auto">
    <template #header>
      <UDashboardNavbar title="Dashboard" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <div class="hidden sm:flex flex-col">
            <span class="text-lg font-bold">ProjeGest</span>
            <span class="text-xs text-muted-foreground">Panel de Empleado</span>
          </div>
        </template>

        <template #right>
          <UTooltip text="Notificaciones">
            <UButton color="neutral" variant="ghost" square @click="isNotificationsSlideoverOpen = true">
              <UChip
                color="error"
                :show="notificationsStore.unreadCount > 0"
                :text="notificationsStore.unreadCount > 0 ? String(notificationsStore.unreadCount) : undefined"
                inset
              >
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 md:p-6 lg:p-8 space-y-6">

        <!-- Bienvenida -->
        <div>
          <h1 class="text-2xl font-bold mb-1">
            Bienvenido, {{ authStore.user?.email?.split('@')[0] || 'usuario' }}
          </h1>
          <p class="text-sm text-muted-foreground">Aquí está el resumen de tus tareas</p>
        </div>

        <!-- KPIs -->
        <div v-if="loading" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <USkeleton v-for="i in 4" :key="i" class="h-24 rounded-xl" />
        </div>
        <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <UCard class="p-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <UIcon name="i-lucide-clipboard-list" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Total tareas</p>
                <p class="text-2xl font-bold">{{ totalTasks }}</p>
              </div>
            </div>
          </UCard>

          <UCard class="p-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                <UIcon name="i-lucide-clock" class="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p class="text-xs text-muted-foreground">En progreso</p>
                <p class="text-2xl font-bold">{{ inProgressTasks }}</p>
              </div>
            </div>
          </UCard>

          <UCard class="p-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <UIcon name="i-lucide-circle-dashed" class="w-5 h-5 text-zinc-500" />
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Por hacer</p>
                <p class="text-2xl font-bold">{{ pendingTasks }}</p>
              </div>
            </div>
          </UCard>

          <UCard class="p-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <UIcon name="i-lucide-trending-up" class="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Completitud</p>
                <p class="text-2xl font-bold">{{ completionRate }}%</p>
                <p class="text-xs text-muted-foreground">{{ completedTasks }} de {{ totalTasks }}</p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Performance + Projects row -->
        <div v-if="performance" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Completion rate -->
          <UCard class="p-5">
            <div class="flex items-center gap-5">
              <CircularProgress
                :value="performance.completion_rate"
                :size="72"
                color="#003C68"
              />
              <div>
                <p class="text-sm font-semibold">Tasa de Completitud</p>
                <p class="text-xs text-muted-foreground mt-1">
                  {{ performance.completed_tasks }} de {{ performance.total_tasks }} tareas completadas
                </p>
                <p v-if="performance.overdue_tasks > 0" class="text-xs text-red-500 mt-1">
                  {{ performance.overdue_tasks }} vencida{{ performance.overdue_tasks !== 1 ? 's' : '' }}
                </p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <ExportPdfButton
                    v-if="employeeId"
                    :url="`/api/employees/${employeeId}/report/pdf`"
                    :filename="`mi_desempeno.pdf`"
                    label="Exportar PDF"
                  />
                  <button
                    v-if="employeeId"
                    @click="sendReportByEmail"
                    :disabled="sendingReport"
                    class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg disabled:opacity-50 transition-colors hover:bg-muted/50"
                  >
                    <UIcon
                      :name="sendingReport ? 'i-lucide-loader-2' : reportSent ? 'i-lucide-check' : 'i-lucide-mail'"
                      class="w-4 h-4"
                      :class="{ 'animate-spin': sendingReport, 'text-green-600': reportSent }"
                    />
                    {{ sendingReport ? 'Enviando...' : reportSent ? '¡Enviado!' : 'Enviar por email' }}
                  </button>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Assigned projects -->
          <UCard class="p-5">
            <p class="text-sm font-semibold mb-3">Mis Proyectos</p>
            <div v-if="performance.assigned_projects.length === 0" class="text-xs text-muted-foreground">
              Sin proyectos asignados actualmente.
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="p in performance.assigned_projects"
                :key="p.project_id"
                class="flex items-center justify-between text-sm py-1 border-b dark:border-gray-800 last:border-0"
              >
                <span class="font-medium truncate flex-1 min-w-0">{{ p.project_name }}</span>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Tareas urgentes / vencidas -->
        <UCard v-if="urgentTasks.length > 0" class="border-orange-200 dark:border-orange-800">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 text-orange-500" />
              <span class="font-semibold text-sm text-orange-600 dark:text-orange-400">
                {{ urgentTasks.length }} tarea{{ urgentTasks.length > 1 ? 's' : '' }} urgente{{ urgentTasks.length > 1 ? 's' : '' }} o vencida{{ urgentTasks.length > 1 ? 's' : '' }}
              </span>
            </div>
          </template>
          <div class="space-y-2">
            <div
              v-for="task in urgentTasks"
              :key="task.id"
              class="flex items-center justify-between py-1"
            >
              <div class="flex items-center gap-2 min-w-0">
                <UBadge :color="priorityColor[task.priority]" size="xs" variant="subtle">
                  {{ priorityLabel[task.priority] }}
                </UBadge>
                <span class="text-sm truncate">{{ task.title }}</span>
              </div>
              <span
                v-if="isOverdue(task)"
                class="text-xs text-red-500 flex-shrink-0 ml-2"
              >
                Vencida {{ formatDate(task.due_date) }}
              </span>
            </div>
          </div>
        </UCard>

        <!-- Lista de tareas -->
        <UCard>
          <template #header>
            <h3 class="font-semibold">Mis Tareas</h3>
          </template>

          <!-- Cargando -->
          <div v-if="loading" class="space-y-3">
            <USkeleton v-for="i in 3" :key="i" class="h-16 rounded-lg" />
          </div>

          <!-- Sin tareas -->
          <div v-else-if="tasks.length === 0" class="text-center py-10">
            <UIcon name="i-lucide-clipboard-list" class="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p class="text-sm text-muted-foreground">No tienes tareas asignadas</p>
          </div>

          <!-- Tareas -->
          <div v-else class="space-y-3">
            <div
              v-for="task in tasks"
              :key="task.id"
              class="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
              :class="{ 'border-red-200 dark:border-red-900': isOverdue(task) }"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-2 mb-1">
                    <span class="font-medium text-sm">{{ task.title }}</span>
                    <UBadge :color="priorityColor[task.priority]" variant="subtle" size="xs">
                      {{ priorityLabel[task.priority] }}
                    </UBadge>
                    <UBadge :color="statusColor[task.status]" size="xs">
                      {{ statusLabel[task.status] }}
                    </UBadge>
                    <UBadge v-if="isOverdue(task)" color="error" size="xs">
                      Vencida
                    </UBadge>
                  </div>

                  <p v-if="task.project_name" class="text-xs text-muted-foreground mb-1">
                    Proyecto: {{ task.project_name }}
                  </p>
                  <p v-if="task.description" class="text-xs text-muted-foreground line-clamp-2">
                    {{ task.description }}
                  </p>

                  <div v-if="task.due_date" class="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                    <UIcon name="i-lucide-calendar" class="w-3 h-3" />
                    <span>Vence: {{ formatDate(task.due_date) }}</span>
                  </div>
                </div>

                <!-- Acción: completar tarea -->
                <div class="flex-shrink-0">
                  <UButton
                    v-if="task.status !== 'completed'"
                    size="xs"
                    color="primary"
                    variant="outline"
                    icon="i-lucide-check"
                    @click="openCompleteModal(task)"
                  >
                    Completar
                  </UButton>
                  <UBadge v-else color="success" variant="subtle" size="sm">
                    <UIcon name="i-lucide-check-circle" class="w-3 h-3 mr-1" />
                    Completada
                  </UBadge>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- OKRs activos (oculto temporalmente, pendiente de activar) -->
        <UCard v-if="false">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-target" class="w-4 h-4 text-primary" />
              <h3 class="font-semibold">OKRs Activos</h3>
            </div>
          </template>

          <div v-if="loadingOkrs" class="space-y-3">
            <USkeleton v-for="i in 3" :key="i" class="h-16 rounded-lg" />
          </div>

          <div v-else-if="okrs.length === 0" class="text-center py-8">
            <UIcon name="i-lucide-target" class="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-30" />
            <p class="text-sm text-muted-foreground">No hay OKRs activos por el momento.</p>
          </div>

          <div v-else class="space-y-4 py-1">
            <div
              v-for="okr in okrs"
              :key="okr.id"
              class="p-4 rounded-lg border border-default bg-elevated/30 space-y-2"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap mb-0.5">
                    <p class="font-semibold text-sm truncate">{{ okr.title }}</p>
                    <UBadge v-if="okr.project_name" color="neutral" variant="outline" size="xs">
                      {{ okr.project_name }}
                    </UBadge>
                  </div>
                  <p v-if="okr.description" class="text-xs text-muted-foreground line-clamp-2">
                    {{ okr.description }}
                  </p>
                  <p v-if="okr.target_date" class="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <UIcon name="i-lucide-calendar" class="w-3 h-3" />
                    Meta: {{ new Date(okr.target_date).toLocaleDateString('es-CO') }}
                  </p>
                </div>
                <span class="text-sm font-bold shrink-0">{{ okr.progress }}%</span>
              </div>
              <ProgressBar :value="okr.progress" :show-percent="false" :height="8" color="#003C68" />
            </div>
          </div>
        </UCard>

      </div>
    </template>
  </UDashboardPanel>

  <!-- Modal completar tarea -->
  <CompleteTaskModal
    v-if="selectedTask"
    :show="showCompleteModal"
    :task-id="selectedTask.id"
    :task-title="selectedTask.title"
    @close="showCompleteModal = false"
    @completed="onTaskCompleted"
  />
</template>
