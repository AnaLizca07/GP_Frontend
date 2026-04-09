<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import KanbanColumn from '@/components/tareas/KanbanColumn.vue'
import TaskModal from '@/components/tareas/TaskModal.vue'
import CompleteTaskModal from '@/components/tareas/CompleteTaskModal.vue'
import tasksService, { type Task, type TaskStatus, type AllDeliverable } from '@/services/tasks'
import projectsService from '@/services/projects'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isManager = computed(() => authStore.isManager)

// ─── Proyectos ───────────────────────────────
interface ProjectItem { id: number; name: string }
const projects = ref<ProjectItem[]>([])
const selectedProjectId = ref<number | null>(null)

const selectedProject = computed(() =>
  projects.value.find(p => p.id === selectedProjectId.value) ?? null
)

// ─── Tipos para el Kanban ────────────────────
type KanbanStatus = 'Por Hacer' | 'En Progreso' | 'Completada'
type KanbanPriority = 'Alta' | 'Media' | 'Baja'

interface TareaKanban {
  id: number
  code?: string
  titulo: string
  proyecto: string
  asignado: string
  iniciales: string
  fecha: string
  prioridad: KanbanPriority
  estado: KanbanStatus
  completada: boolean
}

// ─── Mapeo backend <-> Kanban ────────────────
const STATUS_TO_KANBAN: Record<TaskStatus, KanbanStatus> = {
  pending: 'Por Hacer',
  in_progress: 'En Progreso',
  completed: 'Completada',
  blocked: 'Por Hacer',
}

const KANBAN_TO_STATUS: Record<string, TaskStatus> = {
  'Por Hacer': 'pending',
  'En Progreso': 'in_progress',
  Completado: 'completed',
  Completada: 'completed',
}

const PRIORITY_TO_KANBAN: Record<string, KanbanPriority> = {
  low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Alta',
}

const taskToKanban = (task: Task): TareaKanban => {
  const name = task.employee_name ?? 'Sin asignar'
  const words = name.split(' ')
  const iniciales = words.map(w => w[0]).join('').toUpperCase().slice(0, 2)
  return {
    id: task.id,
    code: task.code,
    titulo: task.title,
    proyecto: task.project_name,
    asignado: name,
    iniciales,
    fecha: task.due_date ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('es-CO') : '—',
    prioridad: PRIORITY_TO_KANBAN[task.priority] ?? 'Media',
    estado: STATUS_TO_KANBAN[task.status] ?? 'Por Hacer',
    completada: task.status === 'completed',
  }
}

// ─── Tab activo ───────────────────────────────
const activeTab = ref<'kanban' | 'entregables'>('kanban')

// ─── Estado principal ─────────────────────────
const loadingProjects = ref(true)
const tareas = ref<TareaKanban[]>([])
const rawTasks = ref<Task[]>([])        // copia original para el modal de edición
const loading = ref(false)
const error = ref<string | null>(null)

// ─── Entregables ──────────────────────────────
const allDeliverables = ref<AllDeliverable[]>([])
const loadingDeliverables = ref(false)
const deliverableSearch = ref('')

const filteredDeliverables = computed(() => {
  let list = allDeliverables.value
  if (selectedProject.value) {
    list = list.filter(d => d.project_name === selectedProject.value!.name)
  }
  if (!deliverableSearch.value) return list
  const q = deliverableSearch.value.toLowerCase()
  return list.filter(d =>
    d.task_title.toLowerCase().includes(q) ||
    d.project_name.toLowerCase().includes(q) ||
    d.employee_name.toLowerCase().includes(q) ||
    d.file_name.toLowerCase().includes(q)
  )
})

const fetchDeliverables = async () => {
  loadingDeliverables.value = true
  try {
    allDeliverables.value = await tasksService.getAllDeliverables()
  } catch (e) {
    console.error('Error cargando entregables:', e)
  } finally {
    loadingDeliverables.value = false
  }
}

const handleTabChange = (tab: 'kanban' | 'entregables') => {
  activeTab.value = tab
  if (tab === 'entregables' && allDeliverables.value.length === 0) {
    fetchDeliverables()
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })

const statusLabel = (s: string) =>
  ({ pending: 'Por Hacer', in_progress: 'En Progreso', completed: 'Completada', blocked: 'Bloqueada' }[s] ?? s)

const statusColor = (s: string) =>
  ({ pending: 'neutral', in_progress: 'warning', completed: 'success', blocked: 'error' }[s] ?? 'neutral') as any

const handleDeleteDeliverable = async (d: AllDeliverable) => {
  if (!confirm(`¿Eliminar el entregable "${d.file_name}"?`)) return
  try {
    await tasksService.deleteDeliverable(d.task_id, d.id)
    allDeliverables.value = allDeliverables.value.filter(x => x.id !== d.id)
  } catch (e) {
    console.error('Error eliminando entregable:', e)
  }
}

// ─── Estado modales ───────────────────────────
const showTaskModal = ref(false)
const editingTask = ref<Task | null>(null)
const initialStatus = ref<TaskStatus>('pending')

const showCompleteModal = ref(false)
const completingTaskId = ref<number>(0)
const completingTaskTitle = ref<string>('')

// ─── Columnas Kanban ─────────────────────────
const tareasPorHacer = computed(() => tareas.value.filter(t => t.estado === 'Por Hacer'))
const tareasEnProgreso = computed(() => tareas.value.filter(t => t.estado === 'En Progreso'))
const tareasCompletadas = computed(() => tareas.value.filter(t => t.estado === 'Completada'))

const kanbanColumns = computed(() => [
  { title: 'Por Hacer', status: 'Por Hacer' as const, tasks: tareasPorHacer.value, count: tareasPorHacer.value.length },
  { title: 'En Progreso', status: 'En Progreso' as const, tasks: tareasEnProgreso.value, count: tareasEnProgreso.value.length },
  { title: 'Completada', status: 'Completada' as const, tasks: tareasCompletadas.value, count: tareasCompletadas.value.length },
])

// ─── Carga ────────────────────────────────────
const fetchTareas = async () => {
  loading.value = true
  error.value = null
  try {
    const params = selectedProjectId.value ? { project_id: selectedProjectId.value } : undefined
    const response = await tasksService.getTasks(params)

    // RF-bug: cuando se muestran "Todos los proyectos", filtrar solo las tareas
    // que pertenecen a proyectos del gerente actual (projects.value ya está
    // filtrado por el backend según el usuario autenticado).
    let tasks = response.tasks
    if (!selectedProjectId.value && projects.value.length > 0) {
      const myProjectIds = new Set(projects.value.map(p => p.id))
      tasks = tasks.filter(t => myProjectIds.has(t.project_id))
    }

    rawTasks.value = tasks
    tareas.value = tasks.map(taskToKanban)
  } catch (e: any) {
    error.value = 'Error al cargar tareas'
    console.error(e)
  } finally {
    loading.value = false
  }
}

watch(selectedProjectId, () => {
  fetchTareas()
  if (activeTab.value === 'entregables') fetchDeliverables()
})

onMounted(async () => {
  try {
    const res = await projectsService.getProjects()
    projects.value = res.projects.map((p: any) => ({ id: p.id, name: p.name }))
  } catch (e) {
    console.error('Error cargando proyectos:', e)
  } finally {
    loadingProjects.value = false
  }
  if (projects.value.length > 0) {
    fetchTareas()
  }
})

// ─── Modal: crear / editar ─────────────────────
const handleNewTask = (status: TaskStatus = 'pending') => {
  editingTask.value = null
  initialStatus.value = status
  showTaskModal.value = true
}

const handleAddTaskFromColumn = (kanbanStatus: string) => {
  const status = KANBAN_TO_STATUS[kanbanStatus] ?? 'pending'
  handleNewTask(status)
}

const handleEditTask = async (taskId: number) => {
  // Buscar en cache primero, luego fetch si no está
  let task = rawTasks.value.find(t => t.id === taskId)
  if (!task) {
    try {
      task = await tasksService.getTask(taskId)
    } catch (e) {
      console.error('Error cargando tarea:', e)
      return
    }
  }
  editingTask.value = task
  showTaskModal.value = true
}

const handleTaskSaved = (savedTask: Task) => {
  const kanban = taskToKanban(savedTask)
  const idx = tareas.value.findIndex(t => t.id === savedTask.id)
  if (idx !== -1) {
    tareas.value[idx] = kanban
    rawTasks.value[rawTasks.value.findIndex(t => t.id === savedTask.id)] = savedTask
  } else {
    tareas.value.push(kanban)
    rawTasks.value.push(savedTask)
  }
}

// ─── Modal: completar con entregables ─────────
const openCompleteModal = (taskId: number) => {
  const tarea = tareas.value.find(t => t.id === taskId)
  if (!tarea) return
  completingTaskId.value = taskId
  completingTaskTitle.value = tarea.titulo
  showCompleteModal.value = true
}

const handleTaskCompleted = () => {
  // Actualizar estado en local
  const tarea = tareas.value.find(t => t.id === completingTaskId.value)
  if (tarea) {
    tarea.estado = 'Completada'
    tarea.completada = true
  }
}

// ─── Kanban acciones ──────────────────────────
const handleMoveTask = async (taskId: number, newKanbanStatus: string) => {
  const tarea = tareas.value.find(t => t.id === taskId)
  if (!tarea) return

  const newStatus = KANBAN_TO_STATUS[newKanbanStatus]
  if (!newStatus || STATUS_TO_KANBAN[newStatus] === tarea.estado) return

  // Si se mueve a Completada, abrir modal de entregables
  if (newStatus === 'completed') {
    openCompleteModal(taskId)
    return
  }

  // Optimistic update
  tarea.estado = STATUS_TO_KANBAN[newStatus]
  tarea.completada = false

  try {
    await tasksService.updateTaskStatus(taskId, newStatus)
  } catch (e) {
    console.error('Error actualizando estado:', e)
    fetchTareas()
  }
}

const handleToggleTaskCompletion = async (taskId: number) => {
  const tarea = tareas.value.find(t => t.id === taskId)
  if (!tarea) return

  if (!tarea.completada) {
    // Completar → abrir modal de entregables
    openCompleteModal(taskId)
    return
  }

  // Reabrir tarea (desmarcar completada)
  tarea.completada = false
  tarea.estado = 'Por Hacer'

  try {
    await tasksService.updateTaskStatus(taskId, 'pending')
  } catch (e) {
    console.error('Error actualizando tarea:', e)
    fetchTareas()
  }
}

const handleDragStart = (_taskId: number) => {}
const handleDragEnd = () => {}
</script>

<template>
  <UDashboardPanel id="tareas">
    <template #header>
      <UDashboardNavbar title="Tareas" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <div class="hidden sm:flex flex-col">
            <span class="text-lg font-bold">ProjeGest</span>
            <span class="text-xs text-muted-foreground">Panel de Gerente</span>
          </div>
        </template>
        <template #right>
          <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost" size="md" :loading="loading" @click="fetchTareas" />
          <UButton v-if="isManager" icon="i-lucide-plus" color="primary" size="md" @click="handleNewTask()">
            <span class="hidden sm:inline">Nueva Tarea</span>
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- ── Selector de proyecto ── -->
      <div v-if="projects.length > 0" class="mb-5">
        <div class="flex flex-wrap gap-2">
          <button
            class="px-3 py-1.5 rounded-full text-sm font-medium border transition-colors"
            :class="selectedProjectId === null
              ? 'bg-primary text-white border-primary'
              : 'border-default text-muted-foreground hover:text-foreground hover:border-foreground/30'"
            @click="selectedProjectId = null"
          >
            Todos los proyectos
          </button>
          <button
            v-for="p in projects"
            :key="p.id"
            class="px-3 py-1.5 rounded-full text-sm font-medium border transition-colors"
            :class="selectedProjectId === p.id
              ? 'bg-primary text-white border-primary'
              : 'border-default text-muted-foreground hover:text-foreground hover:border-foreground/30'"
            @click="selectedProjectId = p.id"
          >
            {{ p.name }}
          </button>
        </div>
      </div>

      <!-- ── Empty state: sin proyectos ── -->
      <div v-if="!loadingProjects && projects.length === 0" class="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div class="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
          <UIcon name="i-lucide-folder-x" class="w-10 h-10 text-muted-foreground opacity-50" />
        </div>
        <div>
          <p class="text-lg font-semibold">Sin proyectos asignados</p>
          <p class="text-sm text-muted-foreground mt-1">No tienes proyectos aún. Las tareas aparecerán aquí una vez que te asignen a un proyecto.</p>
        </div>
      </div>

      <!-- Tabs (solo para managers, solo si hay proyectos) -->
      <div v-if="isManager && projects.length > 0" class="flex gap-1 mb-6 border-b border-default">
        <button
          class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
          :class="activeTab === 'kanban'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'"
          @click="handleTabChange('kanban')"
        >
          <span class="flex items-center gap-2">
            <UIcon name="i-lucide-layout-dashboard" class="w-4 h-4" />
            Tablero
          </span>
        </button>
        <button
          class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
          :class="activeTab === 'entregables'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'"
          @click="handleTabChange('entregables')"
        >
          <span class="flex items-center gap-2">
            <UIcon name="i-lucide-file-check" class="w-4 h-4" />
            Entregables
            <span v-if="allDeliverables.length > 0" class="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-semibold">
              {{ allDeliverables.length }}
            </span>
          </span>
        </button>
      </div>

      <!-- ── TAB: KANBAN ── -->
      <template v-if="activeTab === 'kanban' && projects.length > 0">
        <!-- Error -->
        <div v-if="error" class="text-center py-8">
          <p class="text-red-500 mb-4">{{ error }}</p>
          <UButton label="Reintentar" @click="fetchTareas" />
        </div>

        <!-- Loading -->
        <div v-else-if="loading && tareas.length === 0" class="flex justify-center items-center h-64">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-muted-foreground" />
        </div>

        <div v-else>
          <!-- Resumen -->
          <div class="mb-6 flex items-center justify-between">
            <span v-if="selectedProject" class="text-sm font-medium text-foreground">
              {{ selectedProject.name }}
            </span>
            <span v-else class="text-sm text-muted-foreground">Todos los proyectos</span>
            <span class="text-sm text-muted-foreground">
              {{ tareas.length }} tareas ·
              {{ tareasCompletadas.length }} completadas ·
              <span class="text-red-500 font-medium">{{ tareas.length - tareasCompletadas.length }} pendientes</span>
            </span>
          </div>

          <!-- Kanban Board -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-310px)]">
            <KanbanColumn
              v-for="column in kanbanColumns"
              :key="column.status"
              :title="column.title"
              :status="column.status"
              :tasks="column.tasks"
              :count="column.count"
              :is-manager="isManager"
              @toggle-task-completion="handleToggleTaskCompletion"
              @edit-task="handleEditTask"
              @move-task="handleMoveTask"
              @drag-start="handleDragStart"
              @drag-end="handleDragEnd"
              @add-task="handleAddTaskFromColumn"
            />
          </div>
        </div>
      </template>

      <!-- ── TAB: ENTREGABLES ── -->
      <template v-else-if="activeTab === 'entregables' && projects.length > 0">
        <!-- Buscador + acción -->
        <div class="flex items-center gap-3 mb-5">
          <div class="relative flex-1 max-w-sm">
            <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              v-model="deliverableSearch"
              type="text"
              placeholder="Buscar por tarea, proyecto o empleado…"
              class="w-full pl-9 pr-3 py-2 text-sm border border-default rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            size="sm"
            :loading="loadingDeliverables"
            @click="fetchDeliverables"
          />
          <span class="text-sm text-muted-foreground">
            {{ filteredDeliverables.length }} entregable{{ filteredDeliverables.length !== 1 ? 's' : '' }}
          </span>
        </div>

        <!-- Loading -->
        <div v-if="loadingDeliverables" class="flex justify-center items-center h-48">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-muted-foreground" />
        </div>

        <!-- Vacío -->
        <div v-else-if="filteredDeliverables.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
          <div class="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <UIcon name="i-lucide-file-x" class="w-8 h-8 text-muted-foreground" />
          </div>
          <p class="text-muted-foreground font-medium">No hay entregables</p>
          <p class="text-sm text-muted-foreground mt-1">
            {{ deliverableSearch ? 'Ningún resultado coincide con tu búsqueda' : 'Los entregables aparecerán aquí cuando los empleados completen tareas' }}
          </p>
        </div>

        <!-- Lista de entregables -->
        <div v-else class="space-y-3">
          <div
            v-for="d in filteredDeliverables"
            :key="d.id"
            class="flex items-center gap-4 p-4 rounded-xl border border-default bg-background hover:bg-muted/40 transition-colors"
          >
            <!-- Ícono PDF / archivo -->
            <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <UIcon name="i-lucide-file-text" class="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>

            <!-- Info archivo -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{{ d.file_name }}</p>
              <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                <span class="text-xs text-muted-foreground flex items-center gap-1">
                  <UIcon name="i-lucide-list-checks" class="w-3 h-3" />
                  {{ d.task_title }}
                </span>
                <span class="text-xs text-muted-foreground flex items-center gap-1">
                  <UIcon name="i-lucide-folder" class="w-3 h-3" />
                  {{ d.project_name }}
                </span>
                <span class="text-xs text-muted-foreground flex items-center gap-1">
                  <UIcon name="i-lucide-user" class="w-3 h-3" />
                  {{ d.employee_name }}
                </span>
              </div>
            </div>

            <!-- Metadata + acciones -->
            <div class="flex items-center gap-3 flex-shrink-0">
              <UBadge :color="statusColor(d.task_status)" variant="subtle" size="xs">
                {{ statusLabel(d.task_status) }}
              </UBadge>
              <div class="text-right hidden sm:block">
                <p class="text-xs text-muted-foreground">{{ formatFileSize(d.file_size) }}</p>
                <p class="text-xs text-muted-foreground">{{ formatDate(d.uploaded_at) }}</p>
              </div>
              <a
                :href="d.file_url"
                target="_blank"
                rel="noopener"
              >
                <UButton icon="i-lucide-eye" size="xs" color="neutral" variant="ghost" title="Ver documento" />
              </a>
              <a
                :href="d.file_url"
                :download="d.file_name"
              >
                <UButton icon="i-lucide-download" size="xs" color="neutral" variant="ghost" title="Descargar" />
              </a>
              <UButton
                icon="i-lucide-trash-2"
                size="xs"
                color="error"
                variant="ghost"
                title="Eliminar"
                @click="handleDeleteDeliverable(d)"
              />
            </div>
          </div>
        </div>
      </template>
    </template>
  </UDashboardPanel>

  <!-- Modal crear/editar tarea -->
  <TaskModal
    :show="showTaskModal"
    :task="editingTask"
    :initial-status="initialStatus"
    @close="showTaskModal = false"
    @saved="handleTaskSaved"
  />

  <!-- Modal completar tarea + entregables -->
  <CompleteTaskModal
    :show="showCompleteModal"
    :task-id="completingTaskId"
    :task-title="completingTaskTitle"
    @close="showCompleteModal = false"
    @completed="handleTaskCompleted"
  />
</template>
