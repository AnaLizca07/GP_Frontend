<script setup lang="ts">
import { ref, computed } from 'vue'

// Define task interface
interface Tarea {
  id: number
  titulo: string
  proyecto: string
  asignado: string
  iniciales: string
  fecha: string
  prioridad: 'Alta' | 'Media' | 'Baja'
  estado: 'Por Hacer' | 'En Progreso' | 'En Revisión' | 'Completada'
  completada: boolean
}

// Demo data for tasks
const tareas = ref<Tarea[]>([
  {
    id: 1,
    titulo: 'Diseño de arquitectura del sistema',
    proyecto: 'Sistema de Gestión Empresarial',
    asignado: 'Ana García',
    iniciales: 'AG',
    fecha: '15/02/2026',
    prioridad: 'Alta',
    estado: 'En Progreso',
    completada: false
  },
  {
    id: 2,
    titulo: 'Configuración de servidores AWS',
    proyecto: 'Migración a Cloud',
    asignado: 'Carlos Ruiz',
    iniciales: 'CR',
    fecha: '18/02/2026',
    prioridad: 'Alta',
    estado: 'En Progreso',
    completada: false
  },
  {
    id: 3,
    titulo: 'Wireframes de la aplicación móvil',
    proyecto: 'App Móvil Cliente',
    asignado: 'María López',
    iniciales: 'ML',
    fecha: '20/02/2026',
    prioridad: 'Media',
    estado: 'Por Hacer',
    completada: false
  },
  {
    id: 4,
    titulo: 'Documentación de API REST',
    proyecto: 'Sistema de Gestión Empresarial',
    asignado: 'Ana García',
    iniciales: 'AG',
    fecha: '22/02/2026',
    prioridad: 'Media',
    estado: 'En Revisión',
    completada: false
  },
  {
    id: 5,
    titulo: 'Configuración de base de datos',
    proyecto: 'Portal de Clientes',
    asignado: 'Carlos Ruiz',
    iniciales: 'CR',
    fecha: '10/02/2026',
    prioridad: 'Baja',
    estado: 'Completada',
    completada: true
  },
  {
    id: 6,
    titulo: 'Testing de integración',
    proyecto: 'Sistema de Reportería',
    asignado: 'María López',
    iniciales: 'ML',
    fecha: '25/02/2026',
    prioridad: 'Alta',
    estado: 'Por Hacer',
    completada: false
  },
  {
    id: 7,
    titulo: 'Desarrollo de componentes UI',
    proyecto: 'App Móvil Cliente',
    asignado: 'Ana García',
    iniciales: 'AG',
    fecha: '28/02/2026',
    prioridad: 'Media',
    estado: 'En Revisión',
    completada: false
  },
  {
    id: 8,
    titulo: 'Optimización de consultas',
    proyecto: 'Sistema de Gestión Empresarial',
    asignado: 'Carlos Ruiz',
    iniciales: 'CR',
    fecha: '01/03/2026',
    prioridad: 'Baja',
    estado: 'En Progreso',
    completada: false
  }
])

// Active tab for filtering
const activeTab = ref('Todas')

// Filter tabs with counts
const tabs = computed(() => [
  { key: 'Todas', label: `Todas (${tareas.value.length})` },
  { key: 'Por Hacer', label: `Por Hacer (${tareas.value.filter(t => t.estado === 'Por Hacer').length})` },
  { key: 'En Progreso', label: `En Progreso (${tareas.value.filter(t => t.estado === 'En Progreso').length})` },
  { key: 'En Revisión', label: `En Revisión (${tareas.value.filter(t => t.estado === 'En Revisión').length})` },
  { key: 'Completadas', label: `Completadas (${tareas.value.filter(t => t.estado === 'Completada').length})` }
])

// Filtered tasks based on active tab
const tareasFiltradas = computed(() => {
  if (activeTab.value === 'Todas') {
    return tareas.value
  }
  return tareas.value.filter(tarea => tarea.estado === activeTab.value)
})

// Get priority badge color
const getPriorityColor = (prioridad: string): 'error' | 'warning' | 'success' | 'neutral' => {
  switch (prioridad) {
    case 'Alta':
      return 'error'
    case 'Media':
      return 'warning'
    case 'Baja':
      return 'success'
    default:
      return 'neutral'
  }
}

// Toggle task completion
const toggleTaskCompletion = (tarea: Tarea) => {
  tarea.completada = !tarea.completada
  tarea.estado = tarea.completada ? 'Completada' : 'Por Hacer'
}
</script>

<template>
  <UDashboardPanel id="tareas">
    <template #header>
      <UDashboardNavbar title="Tareas" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <div class="flex flex-col">
            <span class="text-xl font-bold">Tareas</span>
            <span class="text-sm text-muted-foreground">Gestiona las tareas de todos los proyectos</span>
          </div>
        </template>

        <template #right>
          <UButton
            icon="i-lucide-filter"
            label="Filtrar"
            color="neutral"
            variant="outline"
            size="md"
          />
          <UButton
            icon="i-lucide-plus"
            label="Nueva Tarea"
            color="neutral"
            size="md"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Filter Tabs -->
      <div class="mb-6">
        <UTabs
          :items="tabs"
          v-model="activeTab"
          class="w-full"
          :ui="{ list: 'border-b border-border', trigger: 'text-sm' }"
        />
      </div>

      <!-- Tasks List -->
      <div class="space-y-4">
        <UCard
          v-for="tarea in tareasFiltradas"
          :key="tarea.id"
          class="p-4 transition-all hover:shadow-md"
        >
          <div class="flex items-center gap-4">
            <!-- Checkbox -->
            <UCheckbox
              v-model="tarea.completada"
              @change="toggleTaskCompletion(tarea)"
              :disabled="tarea.estado === 'Completada'"
            />

            <!-- Task Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <!-- Task Title -->
                  <h3
                    class="font-medium text-base"
                    :class="{ 'line-through text-muted-foreground': tarea.completada }"
                  >
                    {{ tarea.titulo }}
                  </h3>

                  <!-- Project Name -->
                  <p class="text-sm text-muted-foreground mt-1">{{ tarea.proyecto }}</p>

                  <!-- Assignee and Date -->
                  <div class="flex items-center gap-4 mt-2">
                    <div class="flex items-center gap-2">
                      <UAvatar
                        :text="tarea.iniciales"
                        size="xs"
                      />
                      <span class="text-sm">{{ tarea.asignado }}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <UIcon name="i-lucide-calendar" class="w-4 h-4 text-muted-foreground" />
                      <span class="text-sm text-muted-foreground">{{ tarea.fecha }}</span>
                    </div>
                  </div>
                </div>

                <!-- Priority Badge -->
                <UBadge
                  :label="tarea.prioridad"
                  :color="getPriorityColor(tarea.prioridad)"
                  variant="solid"
                  size="sm"
                />
              </div>
            </div>
          </div>
        </UCard>

        <!-- Empty State -->
        <div
          v-if="tareasFiltradas.length === 0"
          class="text-center py-12 text-muted-foreground"
        >
          <UIcon name="i-lucide-inbox" class="w-12 h-12 mx-auto mb-4" />
          <p class="text-lg font-medium mb-2">No hay tareas</p>
          <p class="text-sm">No se encontraron tareas para el filtro seleccionado.</p>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>