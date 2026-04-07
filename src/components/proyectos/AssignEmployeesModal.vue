<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { employeeService, type Employee } from '@/services/employees'
import projectsService, { type ProjectEmployee } from '@/services/projects'

const props = defineProps<{
  open: boolean
  projectId: number
  projectName: string
}>()

const emit = defineEmits<{
  close: []
  updated: []
}>()

const allEmployees = ref<Employee[]>([])
const assigned = ref<ProjectEmployee[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

// Local state: employeeId → checked
const selections = ref<Record<number, { checked: boolean }>>({})

const activeEmployees = computed(() =>
  allEmployees.value.filter(e => e.status === 'active')
)

async function loadData() {
  loading.value = true
  error.value = null
  try {
    const [empRes, assignedRes] = await Promise.all([
      employeeService.getEmployees({ limit: 100 }),
      projectsService.getProjectEmployees(props.projectId),
    ])
    allEmployees.value = empRes.employees
    assigned.value = assignedRes

    // Build initial selections
    const map: Record<number, { checked: boolean }> = {}
    for (const emp of empRes.employees) {
      const existing = assignedRes.find(a => a.employee_id === emp.id)
      map[emp.id] = { checked: !!existing }
    }
    selections.value = map
  } catch (e: any) {
    error.value = 'Error al cargar datos'
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (props.open) loadData()
})

watch(() => props.open, (val) => {
  if (val) loadData()
})

async function save() {
  saving.value = true
  error.value = null
  try {
    const previousIds = new Set(assigned.value.map(a => a.employee_id))

    for (const emp of activeEmployees.value) {
      const sel = selections.value[emp.id]
      if (!sel) continue

      const wasAssigned = previousIds.has(emp.id)

      if (sel.checked && !wasAssigned) {
        // New assignment (dedication fixed at 100)
        await projectsService.assignEmployee(props.projectId, emp.id, 100)
      } else if (!sel.checked && wasAssigned) {
        // Remove
        await projectsService.removeEmployee(props.projectId, emp.id)
      }
    }

    emit('updated')
  } catch (e: any) {
    error.value = e?.response?.data?.detail ?? 'Error al guardar cambios'
    console.error(e)
  } finally {
    saving.value = false
  }
}

const selectedCount = computed(() =>
  Object.values(selections.value).filter(s => s.checked).length
)
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="fixed inset-0 bg-gray-500/40 dark:bg-gray-900/60" @click="emit('close')" />
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div>
            <h3 class="text-lg font-semibold">Asignar Equipo</h3>
            <p class="text-sm text-muted-foreground mt-0.5">{{ projectName }}</p>
          </div>
          <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="emit('close')" />
        </div>

        <!-- Body -->
        <div class="p-6">
          <!-- Loading state -->
          <div v-if="loading" class="flex justify-center items-center py-12">
            <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-muted-foreground" />
          </div>

          <!-- Error -->
          <div v-else-if="error" class="text-red-500 text-sm py-4 text-center">{{ error }}</div>

          <!-- No employees -->
          <div v-else-if="activeEmployees.length === 0" class="text-center py-8">
            <UIcon name="i-lucide-users" class="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p class="text-sm text-muted-foreground">No hay empleados activos registrados.</p>
          </div>

          <!-- Employee list -->
          <div v-else class="space-y-3 max-h-80 overflow-y-auto">
            <div
              v-for="emp in activeEmployees"
              :key="emp.id"
              class="flex items-center gap-3 p-3 rounded-lg border dark:border-gray-700 transition-colors"
              :class="selections[emp.id]?.checked ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700' : 'hover:bg-gray-50 dark:hover:bg-gray-800'"
            >
              <!-- Checkbox -->
              <input
                type="checkbox"
                :id="`emp-${emp.id}`"
                v-model="selections[emp.id].checked"
                class="w-4 h-4 rounded accent-[#003C68] cursor-pointer"
              />

              <!-- Employee info -->
              <label :for="`emp-${emp.id}`" class="flex-1 cursor-pointer min-w-0">
                <p class="text-sm font-medium truncate">{{ emp.name }}</p>
                <p class="text-xs text-muted-foreground truncate">{{ emp.position }}</p>
              </label>

            </div>
          </div>

          <!-- Summary -->
          <div v-if="!loading && activeEmployees.length > 0" class="mt-4 pt-4 border-t dark:border-gray-700 flex items-center justify-between text-sm text-muted-foreground">
            <span>{{ selectedCount }} empleado{{ selectedCount !== 1 ? 's' : '' }} seleccionado{{ selectedCount !== 1 ? 's' : '' }}</span>
            <span v-if="error" class="text-red-500 text-xs">{{ error }}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex gap-3 p-6 pt-0">
          <button
            @click="emit('close')"
            class="flex-1 p-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
          >
            Cancelar
          </button>
          <button
            @click="save"
            :disabled="saving || loading"
            class="flex-1 p-2 text-white rounded text-sm font-medium disabled:opacity-50 transition-colors"
            style="background-color: #003C68;"
            :style="{ 'background-color': saving || loading ? undefined : '#003C68' }"
          >
            {{ saving ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
