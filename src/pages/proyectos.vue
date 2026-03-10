<script setup lang="ts">
import { ref } from 'vue'

// Define project interface
interface Proyecto {
  id: number
  nombre: string
  estado: 'Activo' | 'Planificación' | 'En Espera' | 'Completado'
  progreso: number
  equipo: number
  finaliza: string
  presupuesto: string
  manager: string
}

// Demo data for projects
const proyectos = ref<Proyecto[]>([
  {
    id: 1,
    nombre: 'Sistema de Gestión Empresarial',
    estado: 'Activo',
    progreso: 68,
    equipo: 8,
    finaliza: '30/06/2026',
    presupuesto: '$450,000',
    manager: 'Ana García'
  },
  {
    id: 2,
    nombre: 'Migración a Cloud',
    estado: 'Activo',
    progreso: 45,
    equipo: 6,
    finaliza: '15/05/2026',
    presupuesto: '$280,000',
    manager: 'Carlos Ruiz'
  },
  {
    id: 3,
    nombre: 'App Móvil Cliente',
    estado: 'Planificación',
    progreso: 15,
    equipo: 5,
    finaliza: '30/09/2026',
    presupuesto: '$320,000',
    manager: 'María López'
  },
  {
    id: 4,
    nombre: 'Renovación de Infraestructura',
    estado: 'En Espera',
    progreso: 30,
    equipo: 4,
    finaliza: '30/04/2026',
    presupuesto: '$180,000',
    manager: 'Ana García'
  },
  {
    id: 5,
    nombre: 'Portal de Clientes',
    estado: 'Completado',
    progreso: 100,
    equipo: 7,
    finaliza: '31/01/2026',
    presupuesto: '$220,000',
    manager: 'Carlos Ruiz'
  },
  {
    id: 6,
    nombre: 'Sistema de Reportería',
    estado: 'Activo',
    progreso: 82,
    equipo: 5,
    finaliza: '15/03/2026',
    presupuesto: '$150,000',
    manager: 'María López'
  }
])

// Get badge variant based on project status
const getBadgeVariant = (estado: string) => {
  switch (estado) {
    case 'Completado':
      return 'solid'
    default:
      return 'outline'
  }
}

// Get badge color based on project status
const getBadgeColor = (estado: string): 'primary' | 'neutral' | 'success' | 'warning' => {
  switch (estado) {
    case 'Activo':
      return 'primary'
    case 'Completado':
      return 'success'
    case 'En Espera':
      return 'warning'
    default:
      return 'neutral'
  }
}

// Menu options for project cards
const getMenuItems = (proyecto: Proyecto) => [[
  {
    label: 'Ver detalles',
    icon: 'i-lucide-eye',
    click: () => console.log('Ver detalles', proyecto.id)
  },
  {
    label: 'Editar',
    icon: 'i-lucide-edit',
    click: () => console.log('Editar', proyecto.id)
  },
  {
    label: 'Eliminar',
    icon: 'i-lucide-trash',
    color: 'red',
    click: () => console.log('Eliminar', proyecto.id)
  }
]]
</script>

<template>
  <UDashboardPanel id="proyectos">
    <template #header>
      <UDashboardNavbar title="Proyectos" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <div class="flex flex-col">
            <span class="text-xl font-bold">Proyectos</span>
            <span class="text-sm text-muted-foreground">Gestiona y supervisa todos tus proyectos</span>
          </div>
        </template>

        <template #right>
          <UButton
            icon="i-lucide-plus"
            label="Nuevo Proyecto"
            color="neutral"
            size="md"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UCard
          v-for="proyecto in proyectos"
          :key="proyecto.id"
          class="p-6"
        >
          <!-- Header with title and menu -->
          <div class="flex items-start justify-between mb-4">
            <h3 class="font-semibold text-lg leading-6">{{ proyecto.nombre }}</h3>
            <UDropdownMenu :items="getMenuItems(proyecto)">
              <UButton
                icon="i-lucide-more-vertical"
                size="sm"
                color="neutral"
                variant="ghost"
                square
              />
            </UDropdownMenu>
          </div>

          <!-- Status Badge -->
          <div class="mb-4">
            <UBadge
              :label="proyecto.estado"
              :variant="getBadgeVariant(proyecto.estado)"
              :color="getBadgeColor(proyecto.estado)"
              size="sm"
            />
          </div>

          <!-- Progress Section -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-muted-foreground">Progreso</span>
              <span class="text-sm font-medium">{{ proyecto.progreso }}%</span>
            </div>
            <UProgress :value="proyecto.progreso" color="neutral" size="md" />
          </div>

          <!-- Team and End Date -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-users" class="w-4 h-4 text-muted-foreground" />
              <div class="flex flex-col">
                <span class="text-xs text-muted-foreground">Equipo</span>
                <span class="text-sm font-medium">{{ proyecto.equipo }} miembros</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-calendar" class="w-4 h-4 text-muted-foreground" />
              <div class="flex flex-col">
                <span class="text-xs text-muted-foreground">Finaliza</span>
                <span class="text-sm font-medium">{{ proyecto.finaliza }}</span>
              </div>
            </div>
          </div>

          <!-- Budget and Manager -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Presupuesto</span>
              <span class="text-sm font-semibold">{{ proyecto.presupuesto }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Manager:</span>
              <span class="text-sm font-medium">{{ proyecto.manager }}</span>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>