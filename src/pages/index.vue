<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useEmployees } from '@/composables/useEmployees'
import { useDashboard } from '../composables/useDashboard'

const { isNotificationsSlideoverOpen } = useDashboard()
const authStore = useAuthStore()
const { activeEmployees, fetchEmployees } = useEmployees()

// KPI data
const kpis = ref([
  {
    title: 'Proyectos Activos',
    icon: 'i-lucide-folder-open',
    value: '24',
    subtexto: '+12% desde el mes pasado',
    color: 'primary'
  },
  {
    title: 'Miembros del Equipo',
    icon: 'i-lucide-users',
    value: '48',
    subtexto: '42 activos, 6 en licencia',
    color: 'primary'
  },
  {
    title: 'Presupuesto Total',
    icon: 'i-lucide-circle-dollar-sign',
    value: '$2.4M',
    subtexto: '65% utilizado',
    color: 'primary'
  }
])

// Budget utilization for donut chart
const budgetUtilization = ref(65)

onMounted(async () => {
  if (authStore.isManager) {
    try {
      await fetchEmployees({ status_filter: 'active' })
      // Update KPI with real employee count
      kpis.value[1].value = activeEmployees.value.length.toString()
      kpis.value[1].subtexto = `${activeEmployees.value.length} activos`
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }
})
</script>

<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <UDashboardNavbar title="Dashboard" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <div class="flex flex-col">
            <span class="text-lg font-bold">PMIS</span>
            <span class="text-xs text-muted-foreground">Panel de Gerente</span>
          </div>
        </template>

        <template #right>
          <UTooltip text="Notificaciones" :shortcuts="['N']">
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>

          <UChip size="lg" class="px-3 py-1">
            <UAvatar size="xs" :alt="authStore.user?.email" class="mr-2" />
            <span class="text-sm">{{ authStore.user?.email }}</span>
            <UBadge variant="outline" size="xs" class="ml-2">{{ authStore.user?.role }}</UBadge>
          </UChip>

          <UButton
            color="error"
            variant="ghost"
            icon="i-lucide-log-out"
            label="Cerrar Sesión"
            @click="$router.push('/login')"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- KPI Cards Row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <UCard v-for="kpi in kpis" :key="kpi.title" class="p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <h3 class="text-sm font-medium text-muted-foreground">{{ kpi.title }}</h3>
                <UIcon :name="kpi.icon" class="w-4 h-4 text-muted-foreground" />
              </div>
              <p class="text-3xl font-bold text-foreground">{{ kpi.value }}</p>
              <p class="text-sm text-success mt-1">{{ kpi.subtexto }}</p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- Projects by Month Chart -->
        <UCard class="lg:col-span-2">
          <template #header>
            <h3 class="text-lg font-semibold">Proyectos por Mes</h3>
          </template>

          <div class="h-64 flex items-center justify-center">
            <div class="text-center">
              <UIcon name="i-lucide-bar-chart-3" class="w-12 h-12 text-muted-foreground mb-2" />
              <p class="text-sm text-muted-foreground">Gráfico de barras agrupado</p>
              <p class="text-xs text-muted-foreground mt-1">Verde: Completados, Azul: En Progreso</p>
            </div>
          </div>

          <template #footer>
            <div class="flex items-center gap-4 text-xs">
              <div class="flex items-center gap-1">
                <div class="w-3 h-3 bg-green-500 rounded-sm"></div>
                <span>Completados</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-3 h-3 bg-blue-500 rounded-sm"></div>
                <span>En Progreso</span>
              </div>
            </div>
          </template>
        </UCard>

        <!-- Budget Utilization Chart -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Utilización del Presupuesto</h3>
          </template>

          <div class="h-64 flex items-center justify-center">
            <div class="relative w-32 h-32">
              <svg class="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  stroke-width="8"
                  fill="transparent"
                  class="text-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  stroke-width="8"
                  fill="transparent"
                  stroke-dasharray="351.86"
                  :stroke-dashoffset="351.86 - (351.86 * budgetUtilization) / 100"
                  class="text-primary"
                />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-2xl font-bold">{{ budgetUtilization }}%</span>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Estado de Tareas Section -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Estado de Tareas</h3>
        </template>

        <div class="p-6 text-center text-muted-foreground">
          <UIcon name="i-lucide-list-checks" class="w-8 h-8 mx-auto mb-2" />
          <p class="text-sm">Sección de estado de tareas</p>
          <p class="text-xs mt-1">Visible al hacer scroll</p>
        </div>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
