<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useEmployees } from '@/composables/useEmployees'
import { useSlowLoad } from '@/composables/useSlowLoad'
import { employeeService } from '@/services/employees'
import projectsService from '@/services/projects'
import type { UpdateEmployeeData } from '@/services/employees'
import type { MiembroEquipo, NewMemberForm } from '@/types/equipo'
import ratingsService from '@/services/ratings'
import TeamMemberCard from '@/components/equipo/TeamMemberCard.vue'
import AddMemberModal from '@/components/equipo/AddMemberModal.vue'
import EditMemberModal from '@/components/equipo/EditMemberModal.vue'
import ProfileModal from '@/components/equipo/ProfileModal.vue'

const authStore = useAuthStore()
const isManager = computed(() => authStore.isManager)

const { employees, loading, fetchEmployees, createEmployee } = useEmployees()
const { slowLoad, startTimer, clearTimer } = useSlowLoad()

const miembros = ref<MiembroEquipo[]>([])
const showAddMemberModal = ref(false)
const showProfileModal = ref(false)
const showEditModal = ref(false)
const selectedMember = ref<MiembroEquipo | null>(null)
const editingMember = ref<MiembroEquipo | null>(null)
const savingEdit = ref(false)
const savingRatingId = ref<number | null>(null)
const searchQuery = ref('')

const filteredMiembros = computed(() => {
  if (!searchQuery.value.trim()) return miembros.value
  const query = searchQuery.value.toLowerCase().trim()
  return miembros.value.filter(m =>
    m.nombre.toLowerCase().includes(query) ||
    m.rol.toLowerCase().includes(query) ||
    m.identification.includes(query) ||
    m.telefono.includes(query)
  )
})

const mkInitials = (name: string) =>
  name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

const convertToMiembro = (employee: any): MiembroEquipo => ({
  id: employee.id,
  nombre: employee.name,
  iniciales: mkInitials(employee.name),
  rol: employee.position,
  disponibilidad: employee.status === 'active' ? 'Activo' : 'Inactivo',
  identification: employee.identification || '',
  telefono: employee.phone || '',
  calificacion: null,
  fechaCalificacion: null,
  comentario: '',
  user_id: employee.user_id,
  salary_type: employee.salary_type,
  salary_monthly: employee.salary_monthly,
  salary_hourly: employee.salary_hourly,
  salary_biweekly: employee.salary_biweekly,
  resume_url: employee.resume_url,
  status: employee.status,
})

/** Employee view: unique colleagues from all shared projects — parallel fetch */
const loadColleagues = async (): Promise<MiembroEquipo[]> => {
  const projectsRes = await projectsService.getProjects({ limit: 100 })
  if (!projectsRes.projects.length) return []

  // Fetch all project members in parallel instead of sequentially
  const allMemberLists = await Promise.all(
    projectsRes.projects.map(p => projectsService.getProjectEmployees(p.id))
  )

  const seen = new Set<number>()
  const list: MiembroEquipo[] = []
  for (const members of allMemberLists) {
    for (const m of members) {
      if (!seen.has(m.employee_id)) {
        seen.add(m.employee_id)
        list.push({
          id: m.employee_id,
          nombre: m.employee_name,
          iniciales: mkInitials(m.employee_name),
          rol: m.employee_position ?? '',
          disponibilidad: 'Activo',
          identification: m.employee_identification ?? '',
          telefono: m.employee_phone ?? '',
          calificacion: null,
          fechaCalificacion: null,
          comentario: '',
          user_id: '',
          salary_type: 'monthly',
          salary_monthly: null,
          salary_hourly: null,
          salary_biweekly: null,
          resume_url: null,
          status: 'active',
        })
      }
    }
  }
  return list
}

onMounted(async () => {
  startTimer()
  try {
    if (isManager.value) {
      await fetchEmployees({ status_filter: 'active' })
      miembros.value = employees.value.map(convertToMiembro)
    } else {
      miembros.value = await loadColleagues()
    }
  } catch (error) {
    console.error('Error loading team members:', error)
  } finally {
    clearTimer()
  }
})

const showProfile = (miembro: MiembroEquipo) => {
  selectedMember.value = miembro
  showProfileModal.value = true
}

const handleEditMember = (miembro: MiembroEquipo) => {
  editingMember.value = miembro
  showEditModal.value = true
}

const handleUpdateMember = async (id: number, data: UpdateEmployeeData) => {
  savingEdit.value = true
  try {
    const updated = await employeeService.updateEmployee(id, data)
    const idx = miembros.value.findIndex(m => m.id === id)
    if (idx !== -1) {
      miembros.value[idx] = convertToMiembro(updated)
      // Sync selectedMember if profile modal is open for the same member
      if (selectedMember.value?.id === id) {
        selectedMember.value = miembros.value[idx]
      }
    }
    showEditModal.value = false
    editingMember.value = null
  } catch (error) {
    console.error('Error actualizando empleado:', error)
    alert('No se pudo guardar los cambios. Intenta de nuevo.')
  } finally {
    savingEdit.value = false
  }
}

const handleDeactivateMember = async (miembro: MiembroEquipo) => {
  if (!confirm(`¿Desactivar a ${miembro.nombre}? Dejará de aparecer en el equipo activo.`)) return
  try {
    await employeeService.deactivateEmployee(miembro.id)
    miembros.value = miembros.value.filter(m => m.id !== miembro.id)
    if (selectedMember.value?.id === miembro.id) showProfileModal.value = false
  } catch (error) {
    console.error('Error desactivando miembro:', error)
    alert('No se pudo desactivar el miembro. Intenta de nuevo.')
  }
}

const handleSaveRating = async (miembro: MiembroEquipo) => {
  if (!miembro.calificacion) return
  savingRatingId.value = miembro.id
  try {
    await ratingsService.createRating(miembro.id, miembro.calificacion, miembro.comentario)
    miembro.fechaCalificacion = new Date().toLocaleDateString('es-CO')
    // Reset for next rating
    miembro.calificacion = null
    miembro.comentario = ''
  } catch (error) {
    console.error('Error guardando calificación:', error)
    alert('No se pudo guardar la calificación. Intenta de nuevo.')
  } finally {
    savingRatingId.value = null
  }
}

const toast = useToast()

const handleAddMember = async (form: NewMemberForm) => {
  try {
    const newEmployee = await createEmployee(form)
    miembros.value.push(convertToMiembro(newEmployee))
    showAddMemberModal.value = false
    toast.add({ title: 'Miembro agregado correctamente', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (error: any) {
    const detail = error?.response?.data?.detail
    const msg = Array.isArray(detail)
      ? detail.map((d: any) => d.msg).join(', ')
      : (typeof detail === 'string' ? detail : 'Error al crear el empleado')
    toast.add({ title: 'Error al agregar miembro', description: msg, color: 'error', icon: 'i-lucide-alert-circle' })
  }
}
</script>

<template>
  <UDashboardPanel id="equipo">
    <template #header>
      <UDashboardNavbar title="Equipo" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <div class="hidden sm:flex flex-col">
            <span class="text-lg font-bold">ProjeGest</span>
            <span class="text-xs text-muted-foreground">{{ isManager ? 'Panel de Gerente' : 'Mi Equipo' }}</span>
          </div>
        </template>
        <template #right>
          <UInput v-model="searchQuery" placeholder="Buscar miembros..." icon="i-lucide-search" size="md" class="hidden sm:block w-48 sm:w-64" />
          <UButton v-if="isManager" icon="i-lucide-plus" color="neutral" size="md" @click="showAddMemberModal = true">
            <span class="hidden sm:inline">Agregar Miembro</span>
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Mobile search bar (visible only on small screens) -->
      <div class="sm:hidden mb-4">
        <UInput v-model="searchQuery" placeholder="Buscar miembros..." icon="i-lucide-search" size="md" class="w-full" />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-16 gap-3">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-muted-foreground" />
        <p v-if="slowLoad" class="text-sm text-muted-foreground text-center max-w-sm">
          El servidor está iniciando. En el plan gratuito de hosting puede tardar hasta 40 segundos la primera vez del día.
        </p>
      </div>

      <template v-else>
        <!-- Search info -->
        <div v-if="searchQuery.trim()" class="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <UIcon name="i-lucide-search" class="w-4 h-4" />
          <span>{{ filteredMiembros.length }} resultado{{ filteredMiembros.length !== 1 ? 's' : '' }} para "{{ searchQuery }}"</span>
          <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" @click="searchQuery = ''" class="ml-2" />
        </div>

        <!-- No results -->
        <div v-if="searchQuery.trim() && filteredMiembros.length === 0" class="text-center py-12">
          <UIcon name="i-lucide-search-x" class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 class="text-lg font-medium mb-2">No se encontraron miembros</h3>
          <UButton label="Limpiar búsqueda" color="neutral" variant="outline" @click="searchQuery = ''" />
        </div>

        <!-- Empty state -->
        <div v-else-if="miembros.length === 0" class="text-center py-16">
          <UIcon name="i-lucide-users" class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 class="text-lg font-medium mb-2">
            {{ isManager ? 'Sin miembros activos' : 'No estás asignado a ningún proyecto aún' }}
          </h3>
          <UButton v-if="isManager" label="Agregar Miembro" icon="i-lucide-plus" @click="showAddMemberModal = true" />
        </div>

        <!-- Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TeamMemberCard
            v-for="miembro in filteredMiembros"
            :key="miembro.id"
            :member="miembro"
            :readonly="!isManager"
            :saving-rating="savingRatingId === miembro.id"
            @show-profile="showProfile"
            @edit-member="handleEditMember"
            @deactivate-member="handleDeactivateMember"
            @save-rating="handleSaveRating"
          />
        </div>
      </template>
    </template>
  </UDashboardPanel>

  <template v-if="isManager">
    <AddMemberModal
      :show="showAddMemberModal"
      :loading="loading"
      @close="showAddMemberModal = false"
      @submit="handleAddMember"
    />

    <EditMemberModal
      :show="showEditModal"
      :member="editingMember"
      :loading="savingEdit"
      @close="showEditModal = false; editingMember = null"
      @submit="handleUpdateMember"
    />
  </template>

  <ProfileModal
    :show="showProfileModal"
    :member="selectedMember"
    :readonly="!isManager"
    @close="showProfileModal = false"
    @edit="handleEditMember"
    @deactivate="handleDeactivateMember"
  />
</template>
