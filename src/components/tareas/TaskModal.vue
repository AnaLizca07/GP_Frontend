<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import tasksService, { type Task, type TaskCreate, type TaskStatus, type TaskPriority } from '@/services/tasks'
import projectsService, { type Project } from '@/services/projects'
import { employeeService as employeesService } from '@/services/employees'

// ─── Props / Emits ────────────────────────────
interface Props {
  show: boolean
  task?: Task | null           // null = crear, Task = editar
  initialStatus?: TaskStatus   // para pre-seleccionar columna
}

const props = withDefaults(defineProps<Props>(), {
  task: null,
  initialStatus: 'pending',
})

const emit = defineEmits<{
  close: []
  saved: [task: Task]
}>()

// ─── Estado ──────────────────────────────────
const saving = ref(false)
const projects = ref<Project[]>([])
const employees = ref<any[]>([])
const loadingOptions = ref(false)

const form = ref<TaskCreate>({
  project_id: 0,
  employee_id: 0,
  title: '',
  description: '',
  status: props.initialStatus,
  priority: 'medium',
  due_date: '',
})

// ─── Watcher: sincronizar form cuando cambia el task prop ────
watch(
  () => props.show,
  async (visible) => {
    if (!visible) return
    if (props.task) {
      // Modo edición
      form.value = {
        project_id: props.task.project_id,
        employee_id: props.task.employee_id,
        title: props.task.title,
        description: props.task.description ?? '',
        status: props.task.status,
        priority: props.task.priority,
        due_date: props.task.due_date ?? '',
      }
    } else {
      // Modo creación
      form.value = {
        project_id: 0,
        employee_id: 0,
        title: '',
        description: '',
        status: props.initialStatus,
        priority: 'medium',
        due_date: '',
      }
    }
    await loadOptions()
  },
  { immediate: false }
)

// ─── Cargar proyectos y empleados ─────────────
const loadOptions = async () => {
  if (projects.value.length && employees.value.length) return
  loadingOptions.value = true
  try {
    const [projRes, empRes] = await Promise.all([
      projectsService.getProjects({ limit: 100 }),
      employeesService.getEmployees({ limit: 100 }),
    ])
    projects.value = projRes.projects
    employees.value = empRes.employees ?? empRes
  } catch (e) {
    console.error('Error cargando opciones:', e)
  } finally {
    loadingOptions.value = false
  }
}

// ─── Submit ───────────────────────────────────
const handleSubmit = async () => {
  if (!form.value.title || !form.value.project_id || !form.value.employee_id) return
  saving.value = true
  try {
    const payload: TaskCreate = {
      project_id: Number(form.value.project_id),
      employee_id: Number(form.value.employee_id),
      title: form.value.title,
      description: form.value.description || undefined,
      status: form.value.status as TaskStatus,
      priority: form.value.priority as TaskPriority,
      due_date: form.value.due_date || undefined,
    }

    let saved: Task
    if (props.task) {
      saved = await tasksService.updateTask(props.task.id, payload)
    } else {
      saved = await tasksService.createTask(payload)
    }
    emit('saved', saved)
    emit('close')
  } catch (e) {
    console.error('Error guardando tarea:', e)
  } finally {
    saving.value = false
  }
}

const priorityLabel: Record<string, string> = {
  low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente',
}
const statusLabel: Record<string, string> = {
  pending: 'Por Hacer', in_progress: 'En Progreso',
  completed: 'Completada', blocked: 'Bloqueada',
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="fixed inset-0 bg-black/40" @click="emit('close')" />
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg">
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b dark:border-gray-700">
            <div>
              <h2 class="text-lg font-semibold">
                {{ task ? 'Editar Tarea' : 'Nueva Tarea' }}
              </h2>
              <span v-if="task?.code" class="text-xs font-mono text-muted-foreground">{{ task.code }}</span>
            </div>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" square @click="emit('close')" />
          </div>

          <!-- Body -->
          <div class="p-6 space-y-4">
            <!-- Título -->
            <div>
              <label class="block text-sm font-medium mb-1">Título *</label>
              <input
                v-model="form.title"
                type="text"
                placeholder="Descripción breve de la tarea"
                class="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <!-- Descripción -->
            <div>
              <label class="block text-sm font-medium mb-1">Descripción</label>
              <textarea
                v-model="form.description"
                rows="3"
                placeholder="Detalla qué hay que hacer..."
                class="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:outline-none resize-none"
              />
            </div>

            <!-- Proyecto -->
            <div>
              <label class="block text-sm font-medium mb-1">Proyecto *</label>
              <div v-if="loadingOptions" class="text-sm text-muted-foreground">Cargando...</div>
              <select
                v-else
                v-model.number="form.project_id"
                class="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option :value="0" disabled>Selecciona un proyecto</option>
                <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>

            <!-- Empleado asignado -->
            <div>
              <label class="block text-sm font-medium mb-1">Asignar a *</label>
              <select
                v-model.number="form.employee_id"
                class="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option :value="0" disabled>Selecciona un empleado</option>
                <option v-for="e in employees" :key="e.id" :value="e.id">
                  {{ e.name }} — {{ e.position }}
                </option>
              </select>
            </div>

            <!-- Prioridad + Estado -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Prioridad</label>
                <select
                  v-model="form.priority"
                  class="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option v-for="(label, val) in priorityLabel" :key="val" :value="val">{{ label }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Estado</label>
                <select
                  v-model="form.status"
                  class="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option v-for="(label, val) in statusLabel" :key="val" :value="val">{{ label }}</option>
                </select>
              </div>
            </div>

            <!-- Fecha límite -->
            <div>
              <label class="block text-sm font-medium mb-1">Fecha límite</label>
              <input
                v-model="form.due_date"
                type="date"
                class="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <!-- Footer -->
          <div class="flex gap-3 p-6 pt-0">
            <button
              @click="emit('close')"
              class="flex-1 p-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
            >
              Cancelar
            </button>
            <button
              @click="handleSubmit"
              :disabled="!form.title || !form.project_id || !form.employee_id || saving"
              class="flex-1 p-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
            >
              {{ saving ? 'Guardando...' : task ? 'Actualizar' : 'Crear Tarea' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
