<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import projectsService, { type Project, type ProjectCreate } from '@/services/projects'
import AssignEmployeesModal from '@/components/proyectos/AssignEmployeesModal.vue'
import api from '@/services/api'
import { formatCOP } from '@/utils'

interface Sponsor { id: string; email: string }

const router = useRouter()

const proyectos = ref<Project[]>([])
const sponsors = ref<Sponsor[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showModal = ref(false)
const isEditMode = ref(false)
const editingId = ref<number | null>(null)
const filterStatus = ref('')

const form = ref<ProjectCreate & { status?: string }>({
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  budget: undefined,
  sponsor_id: undefined,
  status: 'planning',
})

const proyectosFiltrados = computed(() => {
  if (!filterStatus.value) return proyectos.value
  const map: Record<string, string> = {
    Activo: 'active', Planificación: 'planning', 'En Espera': 'on_hold',
    Completado: 'completed', Cancelado: 'cancelled',
  }
  return proyectos.value.filter(p => p.status === (map[filterStatus.value] ?? filterStatus.value))
})

const statusLabel = (status: string) =>
  ({ active: 'Activo', planning: 'Planificación', on_hold: 'En Espera', completed: 'Completado', cancelled: 'Cancelado' }[status] ?? status)

const getBadgeColor = (status: string): 'primary' | 'neutral' | 'success' | 'warning' | 'error' =>
  ({ active: 'primary', completed: 'success', on_hold: 'warning', cancelled: 'error', planning: 'neutral' } as any)[status] ?? 'neutral'

const getBadgeVariant = (status: string) => status === 'completed' ? 'solid' : 'outline'

const formatBudget = (budget?: number) => budget ? formatCOP(budget) : '—'

const formatDate = (dateStr?: string) =>
  dateStr ? new Date(dateStr + 'T00:00:00').toLocaleDateString('es-CO') : '—'

const fetchProyectos = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await projectsService.getProjects({ limit: 100 })
    proyectos.value = response.projects
  } catch (e: any) {
    error.value = 'Error al cargar proyectos'
    console.error(e)
  } finally {
    loading.value = false
  }
}

const fetchSponsors = async () => {
  try {
    const { data } = await api.get('/api/auth/sponsors')
    sponsors.value = data
  } catch (e) {
    console.error('Error cargando sponsors:', e)
  }
}

onMounted(() => { fetchProyectos(); fetchSponsors() })

const resetForm = () => {
  form.value = { name: '', description: '', start_date: '', end_date: '', budget: undefined, sponsor_id: undefined, status: 'planning' }
}

const openCreateModal = () => { isEditMode.value = false; editingId.value = null; resetForm(); showModal.value = true }

const openEditModal = (p: Project) => {
  isEditMode.value = true; editingId.value = p.id
  form.value = { name: p.name, description: p.description ?? '', start_date: p.start_date, end_date: p.end_date ?? '', budget: p.budget, sponsor_id: p.sponsor_id, status: p.status }
  showModal.value = true
}

const closeModal = () => { showModal.value = false; isEditMode.value = false; editingId.value = null; resetForm() }

const handleSubmit = async () => {
  if (!form.value.name || !form.value.start_date) return
  loading.value = true
  try {
    const payload = {
      name: form.value.name,
      description: form.value.description || undefined,
      start_date: form.value.start_date,
      end_date: form.value.end_date || undefined,
      budget: form.value.budget || undefined,
      sponsor_id: form.value.sponsor_id || undefined,
    }
    if (isEditMode.value && editingId.value) {
      const updated = await projectsService.updateProject(editingId.value, { ...payload, status: form.value.status })
      const idx = proyectos.value.findIndex(p => p.id === editingId.value)
      if (idx !== -1) proyectos.value[idx] = updated
    } else {
      proyectos.value.unshift(await projectsService.createProject(payload))
    }
    closeModal()
  } catch (e) { console.error('Error guardando proyecto:', e) }
  finally { loading.value = false }
}

const deleteProject = async (id: number) => {
  if (!confirm('¿Eliminar este proyecto?')) return
  try { await projectsService.deleteProject(id); proyectos.value = proyectos.value.filter(p => p.id !== id) }
  catch (e) { console.error(e) }
}

// Assign employees modal
const showAssignModal = ref(false)
const assigningProject = ref<Project | null>(null)

const openAssignModal = (p: Project) => {
  assigningProject.value = p
  showAssignModal.value = true
}

const closeAssignModal = () => {
  showAssignModal.value = false
  assigningProject.value = null
}

const onAssignUpdated = async () => {
  await fetchProyectos()
  closeAssignModal()
}

// Detail modal
const showDetailModal = ref(false)
const detailProject = ref<Project | null>(null)

const openDetailModal = (p: Project) => {
  detailProject.value = p
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  detailProject.value = null
}

// Abre el modal de asignación desde el modal de detalle
// (hay que capturar el proyecto antes de que closeDetailModal lo nullifique)
const openAssignFromDetail = () => {
  const p = detailProject.value
  closeDetailModal()
  if (p) openAssignModal(p)
}

const getMenuItems = (p: Project) => [[
  { label: 'Dashboard', icon: 'i-lucide-bar-chart-2', onSelect: () => router.push(`/proyectos/${p.id}`) },
  { label: 'Ver detalle', icon: 'i-lucide-eye', onSelect: () => openDetailModal(p) },
  { label: 'Editar', icon: 'i-lucide-edit', onSelect: () => openEditModal(p) },
  { label: 'Asignar equipo', icon: 'i-lucide-users-round', onSelect: () => openAssignModal(p) },
  { label: 'Eliminar', icon: 'i-lucide-trash', color: 'red' as const, onSelect: () => deleteProject(p.id) },
]]
</script>

<template>
  <UDashboardPanel id="proyectos">
    <template #header>
      <UDashboardNavbar title="Proyectos" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <div class="hidden sm:flex flex-col">
            <span class="text-lg font-bold">ProjeGest</span>
            <span class="text-xs text-muted-foreground">Panel de Gerente</span>
          </div>
        </template>
        <template #right>
          <select v-model="filterStatus" class="hidden sm:block px-3 py-2 border rounded text-sm dark:bg-gray-800 dark:border-gray-600">
            <option value="">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Planificación">Planificación</option>
            <option value="En Espera">En Espera</option>
            <option value="Completado">Completado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
          <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost" size="md" :loading="loading" @click="fetchProyectos" />
          <UButton icon="i-lucide-plus" color="neutral" size="md" @click="openCreateModal">
            <span class="hidden sm:inline">Nuevo Proyecto</span>
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Mobile filter (visible only on small screens) -->
      <div class="sm:hidden mb-4">
        <select v-model="filterStatus" class="w-full px-3 py-2 border rounded text-sm dark:bg-gray-800 dark:border-gray-600">
          <option value="">Todos los estados</option>
          <option value="Activo">Activo</option>
          <option value="Planificación">Planificación</option>
          <option value="En Espera">En Espera</option>
          <option value="Completado">Completado</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </div>

      <div v-if="loading && proyectos.length === 0" class="flex justify-center items-center h-64">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-muted-foreground" />
      </div>

      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-500 mb-4">{{ error }}</p>
        <UButton label="Reintentar" @click="fetchProyectos" />
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UCard v-for="proyecto in proyectosFiltrados" :key="proyecto.id" class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div class="min-w-0 flex-1">
              <h3 class="font-semibold text-lg leading-6">{{ proyecto.name }}</h3>
              <span v-if="proyecto.code" class="text-xs font-mono text-muted-foreground">{{ proyecto.code }}</span>
            </div>
            <UDropdownMenu :items="getMenuItems(proyecto)">
              <UButton icon="i-lucide-more-vertical" size="sm" color="neutral" variant="ghost" square />
            </UDropdownMenu>
          </div>

          <div class="mb-4">
            <UBadge :label="statusLabel(proyecto.status)" :variant="getBadgeVariant(proyecto.status)" :color="getBadgeColor(proyecto.status)" size="sm" />
          </div>

          <p v-if="proyecto.description" class="text-sm text-muted-foreground mb-4 line-clamp-2">{{ proyecto.description }}</p>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-users" class="w-4 h-4 text-muted-foreground" />
              <div class="flex flex-col">
                <span class="text-xs text-muted-foreground">Equipo</span>
                <span class="text-sm font-medium">{{ proyecto.assigned_employees.length }} miembros</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-calendar" class="w-4 h-4 text-muted-foreground" />
              <div class="flex flex-col">
                <span class="text-xs text-muted-foreground">Finaliza</span>
                <span class="text-sm font-medium">{{ formatDate(proyecto.end_date) }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Presupuesto</span>
            <span class="text-sm font-semibold">{{ formatBudget(proyecto.budget) }}</span>
          </div>
          <div v-if="proyecto.sponsor_email" class="flex items-center justify-between mt-2">
            <span class="text-sm text-muted-foreground">Sponsor</span>
            <span class="text-xs truncate max-w-36">{{ proyecto.sponsor_email }}</span>
          </div>
        </UCard>

        <div v-if="proyectosFiltrados.length === 0 && !loading" class="col-span-full text-center py-16">
          <UIcon name="i-lucide-folder-open" class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p class="text-muted-foreground">No hay proyectos{{ filterStatus ? ' con ese estado' : '' }}</p>
          <UButton label="Crear proyecto" class="mt-4" @click="openCreateModal" />
        </div>
      </div>
    </template>

    <!-- Detail Modal -->
    <div v-if="showDetailModal && detailProject" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="fixed inset-0 bg-gray-500/40 dark:bg-gray-900/60" @click="closeDetailModal" />
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg">
          <!-- Header -->
          <div class="flex items-start justify-between p-6 border-b dark:border-gray-700">
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold truncate">{{ detailProject.name }}</h3>
              <div class="flex items-center gap-2 mt-1 flex-wrap">
                <UBadge :label="statusLabel(detailProject.status)" :variant="getBadgeVariant(detailProject.status)" :color="getBadgeColor(detailProject.status)" size="sm" />
                <span v-if="detailProject.code" class="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{{ detailProject.code }}</span>
              </div>
            </div>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" class="ml-4 shrink-0" @click="closeDetailModal" />
          </div>

          <!-- Body -->
          <div class="p-6 space-y-4">
            <!-- Description -->
            <div v-if="detailProject.description">
              <p class="text-xs font-medium text-muted-foreground uppercase mb-1">Descripción</p>
              <p class="text-sm">{{ detailProject.description }}</p>
            </div>

            <!-- Dates & Budget -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs font-medium text-muted-foreground uppercase mb-1">Fecha inicio</p>
                <p class="text-sm font-medium">{{ formatDate(detailProject.start_date) }}</p>
              </div>
              <div>
                <p class="text-xs font-medium text-muted-foreground uppercase mb-1">Fecha fin</p>
                <p class="text-sm font-medium">{{ formatDate(detailProject.end_date) }}</p>
              </div>
              <div>
                <p class="text-xs font-medium text-muted-foreground uppercase mb-1">Presupuesto</p>
                <p class="text-sm font-medium">{{ formatBudget(detailProject.budget) }}</p>
              </div>
              <div v-if="detailProject.sponsor_email">
                <p class="text-xs font-medium text-muted-foreground uppercase mb-1">Sponsor</p>
                <p class="text-sm font-medium truncate">{{ detailProject.sponsor_email }}</p>
              </div>
            </div>

            <!-- Team -->
            <div>
              <p class="text-xs font-medium text-muted-foreground uppercase mb-2">
                Equipo ({{ detailProject.assigned_employees.length }} miembros)
              </p>
              <div v-if="detailProject.assigned_employees.length === 0" class="text-sm text-muted-foreground">
                Sin empleados asignados
              </div>
              <div v-else class="space-y-2 max-h-48 overflow-y-auto">
                <div
                  v-for="emp in detailProject.assigned_employees"
                  :key="emp.employee_id"
                  class="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800"
                >
                  <div>
                    <p class="text-sm font-medium">{{ emp.employee_name }}</p>
                    <p class="text-xs text-muted-foreground">{{ emp.employee_position }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex gap-3 p-6 pt-0">
            <button @click="closeDetailModal" class="flex-1 p-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">Cerrar</button>
            <button @click="openAssignFromDetail" class="flex-1 p-2 text-white rounded text-sm font-medium" style="background-color: #003C68;">
              Gestionar equipo
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Assign Employees Modal -->
    <AssignEmployeesModal
      v-if="assigningProject"
      :open="showAssignModal"
      :project-id="assigningProject.id"
      :project-name="assigningProject.name"
      @close="closeAssignModal"
      @updated="onAssignUpdated"
    />

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="fixed inset-0 bg-gray-500/40 dark:bg-gray-900/60" @click="closeModal" />
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg p-6">
          <h3 class="text-lg font-semibold mb-4">{{ isEditMode ? 'Editar Proyecto' : 'Nuevo Proyecto' }}</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Nombre *</label>
              <input v-model="form.name" type="text" placeholder="Nombre del proyecto" class="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Descripción</label>
              <textarea v-model="form.description" rows="3" placeholder="Descripción..." class="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Fecha inicio *</label>
                <input v-model="form.start_date" type="date" class="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Fecha fin</label>
                <input v-model="form.end_date" type="date" class="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Presupuesto (COP)</label>
                <input v-model.number="form.budget" type="number" placeholder="0" class="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
              </div>
              <div v-if="isEditMode">
                <label class="block text-sm font-medium mb-1">Estado</label>
                <select v-model="form.status" class="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600">
                  <option value="planning">Planificación</option>
                  <option value="active">Activo</option>
                  <option value="on_hold">En Espera</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Patrocinador</label>
              <select v-model="form.sponsor_id" class="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600">
                <option value="">Sin patrocinador</option>
                <option v-for="s in sponsors" :key="s.id" :value="s.id">{{ s.email }}</option>
              </select>
            </div>
          </div>
          <div class="flex gap-3 mt-6">
            <button @click="closeModal" class="flex-1 p-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700">Cancelar</button>
            <button @click="handleSubmit" :disabled="!form.name || !form.start_date || loading" class="flex-1 p-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50">
              {{ loading ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </UDashboardPanel>
</template>
