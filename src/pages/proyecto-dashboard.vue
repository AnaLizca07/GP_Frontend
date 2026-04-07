<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import kpisService, { type ProjectKpis, type ProjectEmployeePerformance } from '@/services/kpis'
import projectsService, { type Project } from '@/services/projects'
import tasksService from '@/services/tasks'
import DonutChart from '@/components/charts/DonutChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import ProgressBar from '@/components/charts/ProgressBar.vue'
import CircularProgress from '@/components/charts/CircularProgress.vue'
import GanttChart from '@/components/project/GanttChart.vue'
import ExportPdfButton from '@/components/ui/ExportPdfButton.vue'
import { formatCOP } from '@/utils'

const route = useRoute()
const router = useRouter()

const projectId = Number(route.params.id)

const loading = ref(true)
const error = ref<string | null>(null)
const kpis = ref<ProjectKpis | null>(null)
const project = ref<Project | null>(null)
const empPerf = ref<ProjectEmployeePerformance | null>(null)
const allTasks = ref<any[]>([])

async function loadData() {
  loading.value = true
  error.value = null
  try {
    const [kpisData, projData, perfData, tasksData] = await Promise.all([
      kpisService.getProjectKpis(projectId),
      projectsService.getProject(projectId),
      kpisService.getProjectEmployeePerformance(projectId),
      tasksService.getTasks({ project_id: projectId }),
    ])
    kpis.value = kpisData
    project.value = projData
    empPerf.value = perfData
    allTasks.value = tasksData.tasks
  } catch (e: any) {
    error.value = 'Error al cargar los datos del proyecto'
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadData())

// ---- Derived data ----

const statusLabel: Record<string, string> = {
  active: 'Activo',
  planning: 'Planificación',
  on_hold: 'En Pausa',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

const statusColor: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  planning: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  on_hold: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

// Donut chart data: task status breakdown
const taskDonutLabels = ['Completadas', 'En Progreso', 'Pendientes', 'Bloqueadas']
const taskDonutColors = ['#22C55E', '#0070C0', '#94A3B8', '#EF4444']
const taskDonutValues = computed(() =>
  kpis.value
    ? [
        kpis.value.completed_tasks,
        kpis.value.in_progress_tasks,
        kpis.value.pending_tasks,
        kpis.value.blocked_tasks,
      ]
    : []
)

// Bar chart: team completion rate
const teamBarLabels = computed(() => empPerf.value?.members.map(m => m.employee_name.split(' ')[0]) ?? [])
const teamBarDatasets = computed(() => [
  {
    label: 'Tareas completadas',
    data: empPerf.value?.members.map(m => m.completed_tasks) ?? [],
    color: '#22C55E',
  },
  {
    label: 'En progreso',
    data: empPerf.value?.members.map(m => m.in_progress_tasks) ?? [],
    color: '#0070C0',
  },
  {
    label: 'Pendientes',
    data: empPerf.value?.members.map(m => m.pending_tasks) ?? [],
    color: '#94A3B8',
  },
])

// Gantt tasks — use created_at as start, due_date as end (RF23)
const ganttTasks = computed(() =>
  allTasks.value
    .filter(t => t.due_date)
    .map(t => ({
      id: t.id,
      title: t.title,
      start: t.created_at ? t.created_at.slice(0, 10) : t.due_date,
      end: t.due_date,
      status: t.status,
      assignee: t.employee_name,
    }))
)

// Budget
const budgetFormatted = computed(() =>
  kpis.value?.budget ? formatCOP(kpis.value.budget) : 'No especificado'
)

// RF23: Gantt export as PNG image
const ganttRef = ref<HTMLElement | null>(null)
const exportingGantt = ref(false)

async function exportGanttImage() {
  const container = ganttRef.value
  if (!container) return
  const svgEl = container.querySelector('svg')
  if (!svgEl) return

  exportingGantt.value = true
  try {
    // Serialize SVG to string with inline styles
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = 2 // retina
      canvas.width = svgEl.clientWidth * scale
      canvas.height = svgEl.clientHeight * scale
      const ctx = canvas.getContext('2d')!
      ctx.scale(scale, scale)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)

      canvas.toBlob(blob => {
        if (!blob) return
        const dlUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = dlUrl
        a.download = `gantt_proyecto_${projectId}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(dlUrl)
        exportingGantt.value = false
      }, 'image/png')
    }
    img.onerror = () => {
      exportingGantt.value = false
    }
    img.src = url
  } catch (e) {
    console.error('Error exportando Gantt:', e)
    exportingGantt.value = false
  }
}

// Date helpers
function fmtDate(s: string | null | undefined): string {
  if (!s) return '—'
  return new Date(s + 'T00:00:00').toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}
</script>

<template>
  <UDashboardPanel id="proyecto-dashboard">
  <template #body>
  <div class="p-6 max-w-7xl mx-auto space-y-6">

    <!-- Back + header -->
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-3">
        <UButton
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="router.push('/proyectos')"
        />
        <div>
          <div v-if="loading" class="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <h1 v-else class="text-2xl font-bold">{{ kpis?.project_name ?? 'Proyecto' }}</h1>
          <span
            v-if="kpis && !loading"
            class="inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium"
            :class="statusColor[kpis.status] ?? 'bg-gray-100 text-gray-600'"
          >
            {{ statusLabel[kpis.status] ?? kpis.status }}
          </span>
        </div>
      </div>

      <ExportPdfButton
        :url="`/api/projects/${projectId}/report/pdf`"
        :filename="`proyecto_${projectId}_reporte.pdf`"
        label="Exportar PDF"
      />
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="n in 4" :key="n" class="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-16 text-red-500">{{ error }}</div>

    <template v-else-if="kpis">

      <!-- KPI Cards row -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <!-- Progress -->
        <div class="col-span-1 bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-4 flex flex-col items-center justify-center gap-2">
          <CircularProgress
            :value="kpis.progress_percentage"
            :size="80"
            color="#003C68"
            label="Avance"
          />
        </div>

        <!-- Tasks -->
        <div class="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-4">
          <p class="text-xs text-muted-foreground mb-2">Tareas</p>
          <p class="text-2xl font-bold">{{ kpis.total_tasks }}</p>
          <div class="mt-2 space-y-1">
            <div class="flex justify-between text-xs">
              <span class="text-green-600">✓ {{ kpis.completed_tasks }} completadas</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-blue-600">▶ {{ kpis.in_progress_tasks }} en progreso</span>
            </div>
            <div class="flex justify-between text-xs" v-if="kpis.overdue_tasks > 0">
              <span class="text-red-500">⚠ {{ kpis.overdue_tasks }} vencidas</span>
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-4">
          <p class="text-xs text-muted-foreground mb-2">Cronograma</p>
          <p class="text-sm font-medium">{{ fmtDate(kpis.start_date) }}</p>
          <p class="text-xs text-muted-foreground mt-0.5">→ {{ fmtDate(kpis.end_date) }}</p>
          <div class="mt-3">
            <ProgressBar
              :value="kpis.total_days > 0 ? (kpis.days_elapsed / kpis.total_days) * 100 : 0"
              color="#F59E0B"
              :height="6"
              :show-percent="false"
            />
            <p class="text-xs text-muted-foreground mt-1">{{ kpis.days_remaining }} días restantes</p>
          </div>
        </div>

        <!-- Team -->
        <div class="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-4">
          <p class="text-xs text-muted-foreground mb-2">Equipo</p>
          <p class="text-2xl font-bold">{{ kpis.team_size }}</p>
          <p class="text-xs text-muted-foreground mt-1">personas asignadas</p>
          <p v-if="kpis.blocked_tasks > 0" class="text-xs text-red-500 mt-2">
            {{ kpis.blocked_tasks }} tarea{{ kpis.blocked_tasks !== 1 ? 's' : '' }} bloqueada{{ kpis.blocked_tasks !== 1 ? 's' : '' }}
          </p>
        </div>

        <!-- Budget -->
        <div class="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-4">
          <p class="text-xs text-muted-foreground mb-2">Presupuesto</p>
          <p class="text-lg font-bold leading-tight">{{ budgetFormatted }}</p>
          <p class="text-xs text-muted-foreground mt-1">presupuesto total</p>
        </div>
      </div>

      <!-- Charts row -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Donut: task status -->
        <div class="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-5">
          <h3 class="text-sm font-semibold mb-4">Estado de Tareas</h3>
          <DonutChart
            :labels="taskDonutLabels"
            :values="taskDonutValues"
            :colors="taskDonutColors"
            :height="220"
          />
        </div>

        <!-- Bar: team performance -->
        <div class="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-5">
          <h3 class="text-sm font-semibold mb-4">Tareas por Miembro del Equipo</h3>
          <BarChart
            v-if="teamBarLabels.length > 0"
            :labels="teamBarLabels"
            :datasets="teamBarDatasets"
            :height="220"
            :stacked="true"
          />
          <p v-else class="text-sm text-muted-foreground text-center py-8">Sin miembros asignados</p>
        </div>
      </div>

      <!-- Team performance table -->
      <div v-if="empPerf && empPerf.members.length > 0" class="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-5">
        <h3 class="text-sm font-semibold mb-4">Desempeño del Equipo</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b dark:border-gray-700 text-muted-foreground text-xs">
                <th class="text-left pb-3 pr-4 font-medium">Empleado</th>
                <th class="text-left pb-3 pr-4 font-medium">Cargo</th>
                <th class="text-center pb-3 pr-4 font-medium">Tareas</th>
                <th class="text-center pb-3 pr-4 font-medium">Completadas</th>
                <th class="text-left pb-3 font-medium w-32">Avance</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="m in empPerf.members"
                :key="m.employee_id"
                class="border-b dark:border-gray-800 last:border-0"
              >
                <td class="py-3 pr-4 font-medium">{{ m.employee_name }}</td>
                <td class="py-3 pr-4 text-muted-foreground text-xs">{{ m.position }}</td>
                <td class="py-3 pr-4 text-center">{{ m.total_tasks }}</td>
                <td class="py-3 pr-4 text-center text-green-600">{{ m.completed_tasks }}</td>
                <td class="py-3 w-36">
                  <div class="flex items-center gap-2">
                    <ProgressBar
                      :value="m.completion_rate"
                      :show-percent="false"
                      :height="6"
                      color="#003C68"
                      class="flex-1"
                    />
                    <span class="text-xs text-muted-foreground w-8 text-right">{{ m.completion_rate.toFixed(0) }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Gantt (RF23) -->
      <div class="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold">Cronograma de Tareas (Gantt)</h3>
          <button
            @click="exportGanttImage"
            :disabled="exportingGantt || ganttTasks.length === 0"
            class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded-lg disabled:opacity-40 transition-colors hover:bg-muted/50"
          >
            <UIcon
              :name="exportingGantt ? 'i-lucide-loader-2' : 'i-lucide-image-down'"
              class="w-3.5 h-3.5"
              :class="{ 'animate-spin': exportingGantt }"
            />
            {{ exportingGantt ? 'Exportando...' : 'Exportar imagen' }}
          </button>
        </div>
        <div ref="ganttRef">
          <GanttChart
            :tasks="ganttTasks"
            :project-start="kpis.start_date ?? undefined"
            :project-end="kpis.end_date ?? undefined"
          />
        </div>
      </div>

    </template>
  </div>
  </template>
  </UDashboardPanel>
</template>
