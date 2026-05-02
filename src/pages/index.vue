<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSlowLoad } from '@/composables/useSlowLoad'
import { useEmployees } from '@/composables/useEmployees'
import { useDashboard } from '../composables/useDashboard'
import projectsService from '@/services/projects'
import kpisService, { type ProjectKpis, type BudgetSummary, type PerformanceIndex } from '@/services/kpis'
import okrsService, { type Okr, type OkrCreate, type OkrUpdate } from '@/services/okrs'
import ProgressBar from '@/components/charts/ProgressBar.vue'
import CircularProgress from '@/components/charts/CircularProgress.vue'
import DonutChart from '@/components/charts/DonutChart.vue'
import { formatCOP } from '@/utils'

const { isNotificationsSlideoverOpen } = useDashboard()
const authStore = useAuthStore()
const { activeEmployees, fetchEmployees } = useEmployees()
const $router = useRouter()

// ─── Project filter ───────────────────────────────────────────────────────
const projects = ref<{ id: number; name: string; status: string }[]>([])
const selectedProjectId = ref<number | null>(null)
const projectKpis = ref<ProjectKpis | null>(null)
const budgetSummary = ref<BudgetSummary | null>(null)
const loadingKpis = ref(false)
const loadingProjects = ref(true)
const { slowLoad, startTimer, clearTimer } = useSlowLoad()

const selectedProject = computed(() =>
  projects.value.find(p => p.id === selectedProjectId.value) ?? null
)

async function selectProject(id: number | null) {
  selectedProjectId.value = id
  if (id === null) {
    projectKpis.value = null
    budgetSummary.value = null
    return
  }
  loadingKpis.value = true
  try {
    const [kpis, budget] = await Promise.all([
      kpisService.getProjectKpis(id),
      kpisService.getBudgetSummary(id),
    ])
    projectKpis.value = kpis
    budgetSummary.value = budget
  } catch (e) {
    console.error('Error cargando KPIs:', e)
    projectKpis.value = null
    budgetSummary.value = null
  } finally {
    loadingKpis.value = false
  }
}

// ─── KPI cards ────────────────────────────────────────────────────────────
const globalKpis = ref([
  { title: 'Proyectos Activos', icon: 'i-lucide-folder-open', value: '—', subtexto: 'Cargando…' },
  { title: 'Miembros del Equipo', icon: 'i-lucide-users', value: '—', subtexto: 'Cargando…' },
  { title: 'Presupuesto Total', icon: 'i-lucide-circle-dollar-sign', value: '—', subtexto: 'Selecciona un proyecto' },
])

const kpiCards = computed(() => {
  if (!projectKpis.value) return globalKpis.value
  const k = projectKpis.value
  const budget = k.budget
    ? formatCOP(k.budget)
    : 'Sin definir'
  return [
    {
      title: 'Avance del proyecto',
      icon: 'i-lucide-trending-up',
      value: `${k.progress_percentage.toFixed(0)}%`,
      subtexto: `${k.completed_tasks} de ${k.total_tasks} tareas completadas`,
    },
    {
      title: 'Equipo asignado',
      icon: 'i-lucide-users',
      value: k.team_size.toString(),
      subtexto: 'personas en el proyecto',
    },
    {
      title: 'Presupuesto',
      icon: 'i-lucide-circle-dollar-sign',
      value: budget,
      subtexto: `${k.days_remaining} días restantes`,
    },
  ]
})

// ─── Donut chart (project view) ───────────────────────────────────────────
const donutLabels = ['Completadas', 'En Progreso', 'Pendientes', 'Bloqueadas']
const donutColors = ['#34D399', '#60A5FA', '#94A3B8', '#F87171']
const donutValues = computed(() =>
  projectKpis.value
    ? [
        projectKpis.value.completed_tasks,
        projectKpis.value.in_progress_tasks,
        projectKpis.value.pending_tasks,
        projectKpis.value.blocked_tasks,
      ]
    : []
)

// ─── SPI vs CPI (por proyecto) ────────────────────────────────────────────
const performanceIndices = ref<PerformanceIndex[]>([])
const loadingPI = ref(false)

const currentProjectPI = computed(() =>
  performanceIndices.value.find(p => p.id === selectedProjectId.value) ?? null
)

function piIndexColor(val: number) {
  if (val >= 1.1) return 'text-green-600 dark:text-green-400'
  if (val >= 0.9) return 'text-amber-500'
  return 'text-red-500'
}
function piIndexBg(val: number) {
  if (val >= 1.1) return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
  if (val >= 0.9) return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
  return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
}
function cpiLabel(cpi: number) {
  if (cpi >= 1.1) return 'Bajo presupuesto'
  if (cpi >= 0.9) return 'En línea'
  return 'Sobre presupuesto'
}
function spiLabel(spi: number) {
  if (spi >= 1.1) return 'Adelantado'
  if (spi >= 0.9) return 'En cronograma'
  return 'Con retraso'
}

// ─── Budget utilization ───────────────────────────────────────────────────
const budgetUtilization = computed(() => budgetSummary.value?.consumed_percentage ?? 0)

// ─── Estado de Tareas ─────────────────────────────────────────────────────
const taskStatusData = computed(() => {
  if (!projectKpis.value || projectKpis.value.total_tasks === 0) {
    return []
  }
  const total = projectKpis.value.total_tasks
  return [
    { label: 'Completadas', value: Math.round(projectKpis.value.completed_tasks / total * 100), color: '#34D399' },
    { label: 'En Progreso', value: Math.round(projectKpis.value.in_progress_tasks / total * 100), color: '#60A5FA' },
    { label: 'Pendientes', value: Math.round(projectKpis.value.pending_tasks / total * 100), color: '#94A3B8' },
    ...(projectKpis.value.blocked_tasks > 0
      ? [{ label: 'Bloqueadas', value: Math.round(projectKpis.value.blocked_tasks / total * 100), color: '#F87171' }]
      : []),
  ]
})

// ─── Alertas ──────────────────────────────────────────────────────────────
const alertasData = computed(() => {
  if (!projectKpis.value) return []
  const k = projectKpis.value
  const alerts: typeof staticAlertas = []

  if (k.overdue_tasks > 0) {
    alerts.push({
      title: `${k.overdue_tasks} tarea${k.overdue_tasks !== 1 ? 's' : ''} vencida${k.overdue_tasks !== 1 ? 's' : ''}`,
      description: 'Estas tareas superaron su fecha límite sin completarse',
      badge: 'Crítica',
      color: 'error',
    })
  }
  if (k.blocked_tasks > 0) {
    alerts.push({
      title: `${k.blocked_tasks} tarea${k.blocked_tasks !== 1 ? 's' : ''} bloqueada${k.blocked_tasks !== 1 ? 's' : ''}`,
      description: 'Requieren atención para desbloquear el avance',
      badge: 'Atención',
      color: 'warning',
    })
  }
  if (k.days_remaining >= 0 && k.days_remaining < 7 && k.progress_percentage < 80) {
    alerts.push({
      title: 'Plazo próximo a vencer',
      description: `El proyecto finaliza en ${k.days_remaining} día${k.days_remaining !== 1 ? 's' : ''} con ${k.progress_percentage.toFixed(0)}% de avance`,
      badge: 'Atención',
      color: 'warning',
    })
  }

  return alerts.length > 0
    ? alerts
    : [{ title: 'Sin alertas activas', description: 'El proyecto está en buen estado', badge: 'OK', color: 'success' }]
})

// ─── OKRs ─────────────────────────────────────────────────────────────────
const okrs = ref<Okr[]>([])
const loadingOkrs = ref(false)
const okrModalOpen = ref(false)
const okrEditTarget = ref<Okr | null>(null)
const savingOkr = ref(false)
const deletingOkrId = ref<number | null>(null)

const okrStatusOptions = [
  { label: 'Activo', value: 'active' },
  { label: 'Completado', value: 'completed' },
  { label: 'Cancelado', value: 'cancelled' },
]

const okrForm = ref<OkrCreate & { status: string }>({
  title: '',
  description: '',
  progress: 0,
  project_id: null,
  target_date: null,
  status: 'active',
})

const okrProjectItems = computed(() => [
  { label: 'Sin proyecto', value: null },
  ...projects.value.map(p => ({ label: p.name, value: p.id })),
])

async function fetchOkrs() {
  loadingOkrs.value = true
  try {
    okrs.value = await okrsService.getOkrs()
  } catch (e) {
    console.error('Error cargando OKRs:', e)
  } finally {
    loadingOkrs.value = false
  }
}

function openCreateOkr() {
  okrEditTarget.value = null
  okrForm.value = { title: '', description: '', progress: 0, project_id: null, target_date: null, status: 'active' }
  okrModalOpen.value = true
}

function openEditOkr(okr: Okr) {
  okrEditTarget.value = okr
  okrForm.value = {
    title: okr.title,
    description: okr.description ?? '',
    progress: okr.progress,
    project_id: okr.project_id ?? null,
    target_date: okr.target_date ?? null,
    status: okr.status,
  }
  okrModalOpen.value = true
}

async function saveOkr() {
  if (!okrForm.value.title.trim()) return
  savingOkr.value = true
  try {
    if (okrEditTarget.value) {
      const updated = await okrsService.updateOkr(okrEditTarget.value.id, okrForm.value as OkrUpdate)
      const idx = okrs.value.findIndex(o => o.id === okrEditTarget.value!.id)
      if (idx !== -1) okrs.value[idx] = updated
    } else {
      const created = await okrsService.createOkr(okrForm.value as OkrCreate)
      okrs.value.unshift(created)
    }
    okrModalOpen.value = false
  } catch (e) {
    console.error('Error guardando OKR:', e)
  } finally {
    savingOkr.value = false
  }
}

async function deleteOkr(id: number) {
  deletingOkrId.value = id
  try {
    await okrsService.deleteOkr(id)
    okrs.value = okrs.value.filter(o => o.id !== id)
  } catch (e) {
    console.error('Error eliminando OKR:', e)
  } finally {
    deletingOkrId.value = null
  }
}

function okrStatusColor(s: string) {
  if (s === 'completed') return 'success'
  if (s === 'cancelled') return 'error'
  return 'primary'
}

function okrStatusLabel(s: string) {
  if (s === 'completed') return 'Completado'
  if (s === 'cancelled') return 'Cancelado'
  return 'Activo'
}

// ─── Mount ────────────────────────────────────────────────────────────────
onMounted(async () => {
  if (authStore.isEmployee) { await $router.push('/empleado'); return }
  if (authStore.isSponsor) { await $router.push('/sponsor'); return }

  startTimer()
  await Promise.all([
    fetchEmployees().then(() => {
      globalKpis.value[1].value = activeEmployees.value.length.toString()
      globalKpis.value[1].subtexto = `${activeEmployees.value.length} activos`
    }).catch(() => {}),
    projectsService.getProjects({ limit: 100 }).then(res => {
      projects.value = (res.projects ?? []).map((p: any) => ({ id: p.id, name: p.name, status: p.status }))
      globalKpis.value[0].value = projects.value.filter(p => p.status === 'active').length.toString()
      globalKpis.value[0].subtexto = `${projects.value.length} en total`
      if (projects.value.length > 0) selectProject(projects.value[0].id)
    }).catch(() => {}),
    fetchOkrs().catch(() => {}),
    (async () => {
      loadingPI.value = true
      try { performanceIndices.value = await kpisService.getPerformanceIndices() }
      catch (e) { console.error('Error cargando índices SPI/CPI:', e) }
      finally { loadingPI.value = false }
    })(),
  ])

  clearTimer()
  loadingProjects.value = false
})
</script>

<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <UDashboardNavbar title="Dashboard" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <div class="hidden sm:flex flex-col">
            <span class="text-lg font-bold">ProjeGest</span>
            <span class="text-xs text-muted-foreground">Panel de Gerente</span>
          </div>
        </template>

        <template #right>
          <UTooltip text="Notificaciones" :shortcuts="['N']">
            <UButton color="neutral" variant="ghost" square @click="isNotificationsSlideoverOpen = true">
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>

          <UChip size="lg" class="hidden sm:flex items-center px-3 py-1">
            <UAvatar size="xs" :alt="authStore.user?.email" class="mr-2" />
            <span class="text-sm">{{ authStore.user?.email }}</span>
            <UBadge variant="outline" size="xs" class="ml-2">{{ authStore.user?.role }}</UBadge>
          </UChip>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- ── Project selector: siempre visible ─────────────────── -->
      <div class="mb-6">
        <div class="flex items-center gap-2 mb-3">
          <UIcon name="i-lucide-folder" class="w-4 h-4 text-muted-foreground" />
          <span class="text-sm font-medium text-muted-foreground">Proyecto</span>
        </div>

        <div v-if="loadingProjects" class="space-y-2">
          <div class="flex gap-2">
            <USkeleton v-for="i in 4" :key="i" class="h-8 w-28 rounded-lg" />
          </div>
          <p v-if="slowLoad" class="text-xs text-muted-foreground">
            El servidor está iniciando. En el plan gratuito de hosting puede tardar hasta 40 segundos la primera vez del día.
          </p>
        </div>

        <div v-else class="flex flex-wrap gap-2">
          <UButton
            v-for="p in projects"
            :key="p.id"
            size="sm"
            :variant="selectedProjectId === p.id ? 'solid' : 'outline'"
            :color="selectedProjectId === p.id ? 'primary' : 'neutral'"
            @click="selectProject(p.id)"
          >
            {{ p.name }}
          </UButton>
        </div>
      </div>

      <!-- ── Empty state: sin proyectos ────────────────────── -->
      <div v-if="!loadingProjects && projects.length === 0" class="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div class="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
          <UIcon name="i-lucide-folder-plus" class="w-10 h-10 text-muted-foreground opacity-50" />
        </div>
        <div>
          <p class="text-lg font-semibold">No tienes proyectos aún</p>
          <p class="text-sm text-muted-foreground mt-1">Crea tu primer proyecto para ver las métricas aquí.</p>
        </div>
        <UButton icon="i-lucide-plus" label="Crear proyecto" color="primary" to="/proyectos" />
      </div>

      <!-- ── Dashboard content ─────────────────────────────────── -->
      <div v-else class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div v-if="loadingKpis" v-for="i in 3" :key="i">
          <USkeleton class="h-24 rounded-xl" />
        </div>
        <UCard v-else v-for="kpi in kpiCards" :key="kpi.title">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-3">
                <h3 class="text-sm font-medium text-muted-foreground">{{ kpi.title }}</h3>
                <UIcon :name="kpi.icon" class="w-4 h-4 text-muted-foreground" />
              </div>
              <p class="text-3xl font-bold text-foreground">{{ kpi.value }}</p>
              <p class="text-sm text-muted-foreground mt-1">{{ kpi.subtexto }}</p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- ── Charts Row ─────────────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Donut chart "Estado de Tareas" / global placeholder -->
        <UCard class="lg:col-span-2">
          <template #header>
            <h3 class="text-lg font-semibold">Distribución de Tareas</h3>
          </template>
          <div v-if="loadingKpis" class="flex items-center justify-center h-48">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
          <DonutChart
            v-else
            :labels="donutLabels"
            :values="donutValues"
            :colors="donutColors"
            :height="220"
          />
        </UCard>

        <!-- Right column: avance + SPI/CPI (project) / placeholder (global) -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ selectedProjectId ? 'Rendimiento EVM' : 'Rendimiento EVM' }}
            </h3>
          </template>

          <!-- Loading -->
          <div v-if="loadingKpis || loadingPI" class="flex items-center justify-center h-48">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-muted-foreground" />
          </div>

          <!-- Project selected: avance + CPI + SPI -->
          <div v-else-if="selectedProjectId && projectKpis" class="space-y-4 py-1">

            <!-- Circular avance -->
            <div class="flex items-center justify-center pt-1">
              <CircularProgress
                :value="projectKpis.progress_percentage"
                :size="110"
                color="#003C68"
                label="Avance"
              />
            </div>

            <!-- CPI -->
            <div
              v-if="currentProjectPI"
              class="rounded-lg border p-3 space-y-1"
              :class="piIndexBg(currentProjectPI.cpi)"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-muted-foreground">CPI — Costo</span>
                <span class="text-lg font-bold" :class="piIndexColor(currentProjectPI.cpi)">
                  {{ currentProjectPI.cpi.toFixed(2) }}
                </span>
              </div>
              <p class="text-xs font-medium" :class="piIndexColor(currentProjectPI.cpi)">
                {{ cpiLabel(currentProjectPI.cpi) }}
              </p>
              <p class="text-[11px] text-muted-foreground">
                Por cada $1 COP gastado se generan
                <strong>${{ currentProjectPI.cpi.toFixed(2) }} COP</strong> de valor
              </p>
            </div>

            <!-- SPI -->
            <div
              v-if="currentProjectPI"
              class="rounded-lg border p-3 space-y-1"
              :class="piIndexBg(currentProjectPI.spi)"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-muted-foreground">SPI — Cronograma</span>
                <span class="text-lg font-bold" :class="piIndexColor(currentProjectPI.spi)">
                  {{ currentProjectPI.spi.toFixed(2) }}
                </span>
              </div>
              <p class="text-xs font-medium" :class="piIndexColor(currentProjectPI.spi)">
                {{ spiLabel(currentProjectPI.spi) }}
              </p>
              <p class="text-[11px] text-muted-foreground">
                Se ha completado
                <strong>{{ currentProjectPI.progress_pct }}%</strong> del trabajo planificado
              </p>
            </div>

            <!-- Diagnóstico global -->
            <p v-if="currentProjectPI" class="text-[11px] text-center text-muted-foreground pb-1">
              {{
                currentProjectPI.cpi >= 0.9 && currentProjectPI.spi >= 0.9
                  ? '✅ Proyecto en buenas condiciones'
                  : currentProjectPI.cpi < 0.9 && currentProjectPI.spi < 0.9
                  ? '⚠️ Requiere atención inmediata'
                  : currentProjectPI.cpi < 0.9
                  ? '💸 Revisar control de costos'
                  : '⏱ Revisar cronograma'
              }}
            </p>
          </div>

          <!-- Global (sin proyecto): invitar a seleccionar -->
          <div v-else class="flex flex-col items-center justify-center h-48 text-center gap-2 text-muted-foreground">
            <UIcon name="i-lucide-mouse-pointer-click" class="w-8 h-8 opacity-30" />
            <p class="text-sm">Selecciona un proyecto para ver SPI y CPI</p>
          </div>
        </UCard>
      </div>

      <!-- ── Estado de Tareas ───────────────────────────────── -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Estado de Tareas</h3>
            <UBadge v-if="selectedProject" color="neutral" variant="outline" size="sm">
              {{ selectedProject.name }}
            </UBadge>
          </div>
        </template>

        <div v-if="loadingKpis" class="space-y-4 py-2">
          <USkeleton v-for="i in 3" :key="i" class="h-6 rounded" />
        </div>
        <div v-else class="space-y-4 py-2">
          <div v-for="task in taskStatusData" :key="task.label">
            <ProgressBar
              :value="task.value"
              :label="task.label"
              :color="task.color"
              :height="8"
            />
          </div>
        </div>

        <p v-if="selectedProjectId && projectKpis && projectKpis.total_tasks === 0"
           class="text-sm text-center text-muted-foreground py-4">
          Este proyecto no tiene tareas registradas aún.
        </p>
      </UCard>

      <!-- ── Presupuesto ──────────────────────────────────────── -->
      <UCard v-if="selectedProjectId">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-circle-dollar-sign" class="w-5 h-5 text-primary" />
              <h3 class="text-lg font-semibold">Presupuesto del Proyecto</h3>
            </div>
            <UBadge v-if="selectedProject" color="neutral" variant="outline" size="sm">
              {{ selectedProject.name }}
            </UBadge>
          </div>
        </template>

        <div v-if="loadingKpis" class="space-y-3 py-2">
          <USkeleton v-for="i in 3" :key="i" class="h-8 rounded" />
        </div>

        <div v-else-if="!budgetSummary || budgetSummary.total_budget === 0" class="text-center py-6">
          <UIcon name="i-lucide-circle-dollar-sign" class="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-30" />
          <p class="text-sm text-muted-foreground">Sin presupuesto definido para este proyecto.</p>
        </div>

        <div v-else class="space-y-5 py-1">
          <!-- Barra de consumo -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-sm font-medium">Presupuesto consumido</span>
              <span
                class="text-sm font-bold"
                :class="budgetSummary.consumed_percentage >= 90 ? 'text-red-500' : budgetSummary.consumed_percentage >= 70 ? 'text-amber-500' : 'text-green-600 dark:text-green-400'"
              >
                {{ budgetSummary.consumed_percentage.toFixed(1) }}%
              </span>
            </div>
            <div class="w-full h-3 bg-muted rounded-full overflow-hidden">
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

          <!-- 3 métricas -->
          <div class="grid grid-cols-3 gap-3">
            <div class="p-3 rounded-lg bg-muted/30 text-center">
              <p class="text-xs text-muted-foreground mb-1">Presupuesto</p>
              <p class="text-sm font-bold truncate">{{ formatCOP(budgetSummary.total_budget) }}</p>
            </div>
            <div class="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-center">
              <p class="text-xs text-muted-foreground mb-1">Ingresos</p>
              <p class="text-sm font-bold text-blue-600 dark:text-blue-400 truncate">{{ formatCOP(budgetSummary.income) }}</p>
            </div>
            <div class="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-center">
              <p class="text-xs text-muted-foreground mb-1">Egresos</p>
              <p class="text-sm font-bold text-red-600 dark:text-red-400 truncate">{{ formatCOP(budgetSummary.spent) }}</p>
            </div>
          </div>

          <!-- Saldo real disponible -->
          <div class="flex items-center justify-between text-sm border-t border-default pt-3">
            <span class="text-muted-foreground flex items-center gap-1.5">
              <UIcon name="i-lucide-wallet" class="w-4 h-4" :class="budgetSummary.available_balance >= 0 ? 'text-green-500' : 'text-red-500'" />
              Saldo disponible (ingresos − egresos)
            </span>
            <span class="font-bold" :class="budgetSummary.available_balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
              {{ formatCOP(budgetSummary.available_balance) }}
            </span>
          </div>
        </div>
      </UCard>

      <!-- ── Alertas ─────────────────────────────────────────── -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-triangle-alert" class="w-5 h-5 text-warning" />
              <h3 class="text-lg font-semibold">Alertas</h3>
            </div>
            <UBadge v-if="selectedProject" color="neutral" variant="outline" size="sm">
              {{ selectedProject.name }}
            </UBadge>
          </div>
        </template>

        <div v-if="loadingKpis" class="space-y-3">
          <USkeleton v-for="i in 2" :key="i" class="h-16 rounded-lg" />
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="alerta in alertasData"
            :key="alerta.title"
            class="flex items-center justify-between p-4 rounded-lg border border-default bg-elevated/30"
          >
            <div>
              <p class="font-semibold text-sm">{{ alerta.title }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">{{ alerta.description }}</p>
            </div>
            <UBadge :color="alerta.color" variant="soft" class="flex-shrink-0 ml-4">
              {{ alerta.badge }}
            </UBadge>
          </div>
        </div>
      </UCard>

      <!-- ── OKRs (oculto temporalmente, pendiente de activar) ── -->
      <UCard v-if="false">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-target" class="w-5 h-5 text-primary" />
              <h3 class="text-lg font-semibold">OKRs</h3>
            </div>
            <UButton
              size="sm"
              icon="i-lucide-plus"
              label="Nuevo OKR"
              @click="openCreateOkr"
            />
          </div>
        </template>

        <!-- Loading -->
        <div v-if="loadingOkrs" class="space-y-4 py-2">
          <USkeleton v-for="i in 3" :key="i" class="h-20 rounded-lg" />
        </div>

        <!-- Empty state -->
        <div v-else-if="okrs.length === 0" class="py-10 text-center text-muted-foreground">
          <UIcon name="i-lucide-target" class="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p class="text-sm">No hay OKRs registrados aún.</p>
          <p class="text-xs mt-1">Crea el primero con el botón "Nuevo OKR".</p>
        </div>

        <!-- OKR list -->
        <div v-else class="space-y-4 py-2">
          <div
            v-for="okr in okrs"
            :key="okr.id"
            class="p-4 rounded-lg border border-default bg-elevated/30 space-y-2"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <p class="font-semibold text-sm truncate">{{ okr.title }}</p>
                  <UBadge :color="okrStatusColor(okr.status)" variant="soft" size="xs">
                    {{ okrStatusLabel(okr.status) }}
                  </UBadge>
                  <UBadge v-if="okr.project_name" color="neutral" variant="outline" size="xs">
                    {{ okr.project_name }}
                  </UBadge>
                </div>
                <p v-if="okr.description" class="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {{ okr.description }}
                </p>
                <p v-if="okr.target_date" class="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <UIcon name="i-lucide-calendar" class="w-3 h-3" />
                  Meta: {{ new Date(okr.target_date).toLocaleDateString('es-CO') }}
                </p>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <span class="text-sm font-bold text-foreground w-10 text-right">{{ okr.progress }}%</span>
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-pencil"
                  @click="openEditOkr(okr)"
                />
                <UButton
                  size="xs"
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash-2"
                  :loading="deletingOkrId === okr.id"
                  @click="deleteOkr(okr.id)"
                />
              </div>
            </div>
            <ProgressBar :value="okr.progress" :show-percent="false" :height="8" color="#003C68" />
          </div>
        </div>
      </UCard>

      <!-- ── OKR Modal (oculto temporalmente) ─────────────────── -->
      <UModal v-if="false" v-model:open="okrModalOpen" :title="okrEditTarget ? 'Editar OKR' : 'Nuevo OKR'">
        <template #body>
          <div class="space-y-4">
            <!-- Title -->
            <UFormField label="Título *">
              <UInput v-model="okrForm.title" placeholder="Ej: Aumentar productividad del equipo" class="w-full" />
            </UFormField>

            <!-- Description -->
            <UFormField label="Descripción">
              <UTextarea v-model="okrForm.description" placeholder="Describe el objetivo clave a alcanzar…" :rows="3" class="w-full" />
            </UFormField>

            <!-- Progress + Status row -->
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Progreso (%)">
                <UInput
                  v-model.number="okrForm.progress"
                  type="number"
                  :min="0"
                  :max="100"
                  placeholder="0-100"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Estado">
                <USelect
                  v-model="okrForm.status"
                  :items="okrStatusOptions"
                  value-key="value"
                  class="w-full"
                />
              </UFormField>
            </div>

            <!-- Project association -->
            <UFormField label="Proyecto (opcional)">
              <USelect
                v-model="okrForm.project_id"
                :items="okrProjectItems"
                value-key="value"
                placeholder="Sin proyecto"
                class="w-full"
              />
            </UFormField>

            <!-- Target date -->
            <UFormField label="Fecha meta (opcional)">
              <UInput v-model="okrForm.target_date" type="date" class="w-full" />
            </UFormField>

            <!-- Progress bar preview -->
            <div class="pt-1">
              <p class="text-xs text-muted-foreground mb-1">Vista previa del progreso</p>
              <ProgressBar :value="okrForm.progress" :show-percent="false" :height="10" color="#003C68" />
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="outline" label="Cancelar" @click="okrModalOpen = false" />
            <UButton
              color="primary"
              :label="okrEditTarget ? 'Guardar cambios' : 'Crear OKR'"
              :loading="savingOkr"
              :disabled="!okrForm.title.trim()"
              @click="saveOkr"
            />
          </div>
        </template>
      </UModal>

      </div><!-- end dashboard content -->
    </template>
  </UDashboardPanel>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
