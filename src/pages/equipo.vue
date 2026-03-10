<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEmployees } from '@/composables/useEmployees'

// Define team member interface (extending Employee data with additional UI fields)
interface MiembroEquipo {
  id: number
  nombre: string
  iniciales: string
  rol: string
  disponibilidad: 'Ocupado' | 'Disponible'
  proyectos: number
  tareasCompletadas: number
  tareasTotal: number
  email: string
  telefono: string
  habilidades: string[]
  calificacion: number | null
  fechaCalificacion: string | null
  comentario: string
  user_id?: string
  salary_monthly?: number
}

const { employees, loading, fetchEmployees, createEmployee } = useEmployees()

// Demo data for team members (will be replaced with real data)
const miembrosDemo = ref<MiembroEquipo[]>([
  {
    id: 1,
    nombre: 'Ana García',
    iniciales: 'AG',
    rol: 'Project Manager',
    disponibilidad: 'Ocupado',
    proyectos: 3,
    tareasCompletadas: 45,
    tareasTotal: 52,
    email: 'ana.garcia@company.com',
    telefono: '+34 600 123 456',
    habilidades: ['Gestión', 'Agile', 'Scrum'],
    calificacion: 4,
    fechaCalificacion: '15/02/2026',
    comentario: 'Buen rendimiento, entregas a tiempo.'
  },
  {
    id: 2,
    nombre: 'Carlos Ruiz',
    iniciales: 'CR',
    rol: 'DevOps Engineer',
    disponibilidad: 'Disponible',
    proyectos: 2,
    tareasCompletadas: 38,
    tareasTotal: 40,
    email: 'carlos.ruiz@company.com',
    telefono: '+34 600 234 567',
    habilidades: ['AWS', 'Docker', 'Kubernetes'],
    calificacion: 5,
    fechaCalificacion: '15/02/2026',
    comentario: 'Excelente desempeño en infraestructura.'
  },
  {
    id: 3,
    nombre: 'María López',
    iniciales: 'ML',
    rol: 'UX/UI Designer',
    disponibilidad: 'Disponible',
    proyectos: 2,
    tareasCompletadas: 28,
    tareasTotal: 35,
    email: 'maria.lopez@company.com',
    telefono: '+34 600 345 678',
    habilidades: ['Figma', 'Sketch', 'Design Systems'],
    calificacion: null,
    fechaCalificacion: null,
    comentario: ''
  }
])

const miembros = ref<MiembroEquipo[]>(miembrosDemo.value)
const showAddMemberModal = ref(false)
const newMemberForm = ref({
  email: '',
  name: '',
  identification: '',
  position: '',
  phone: '',
  address: '',
  salary_type: 'monthly' as const,
  salary_monthly: 0,
  status: 'active' as const
})

// Convert Employee to MiembroEquipo format
const convertToMiembro = (employee: any): MiembroEquipo => {
  const initials = employee.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
  return {
    id: employee.id,
    nombre: employee.name,
    iniciales: initials,
    rol: employee.position,
    disponibilidad: employee.status === 'active' ? 'Disponible' : 'Ocupado',
    proyectos: Math.floor(Math.random() * 5) + 1, // Random demo data
    tareasCompletadas: Math.floor(Math.random() * 50) + 20,
    tareasTotal: Math.floor(Math.random() * 20) + 40,
    email: `${employee.name.toLowerCase().replace(' ', '.')}@company.com`,
    telefono: employee.phone || '+34 600 000 000',
    habilidades: ['Skill 1', 'Skill 2'], // Demo data
    calificacion: null,
    fechaCalificacion: null,
    comentario: '',
    user_id: employee.user_id,
    salary_monthly: employee.salary_monthly
  }
}

// Load real employees data
onMounted(async () => {
  try {
    await fetchEmployees({ status_filter: 'active' })
    if (employees.value.length > 0) {
      // Convert employees to team members format
      const realMembers = employees.value.map(convertToMiembro)
      miembros.value = [...miembrosDemo.value, ...realMembers]
    }
  } catch (error) {
    console.error('Error loading team members:', error)
  }
})

// Get availability color
const getAvailabilityColor = (disponibilidad: string): 'success' | 'warning' => {
  return disponibilidad === 'Disponible' ? 'success' : 'warning'
}

// Get menu items for each member
const getMenuItems = (miembro: MiembroEquipo) => [[
  {
    label: 'Ver perfil',
    icon: 'i-lucide-user',
    click: () => console.log('Ver perfil', miembro.id)
  },
  {
    label: 'Editar',
    icon: 'i-lucide-edit',
    click: () => console.log('Editar', miembro.id)
  },
  {
    label: 'Desactivar',
    icon: 'i-lucide-user-x',
    color: 'error',
    click: () => console.log('Desactivar', miembro.id)
  }
]]

// Save rating for a member
const saveRating = (miembro: MiembroEquipo) => {
  miembro.fechaCalificacion = new Date().toLocaleDateString('es-ES')
  console.log('Rating saved for', miembro.nombre, miembro.calificacion, miembro.comentario)
}

// Add new member
const addMember = async () => {
  try {
    const newEmployee = await createEmployee(newMemberForm.value)
    const newMember = convertToMiembro(newEmployee)
    miembros.value.push(newMember)
    showAddMemberModal.value = false

    // Reset form
    newMemberForm.value = {
      email: '',
      name: '',
      identification: '',
      position: '',
      phone: '',
      address: '',
      salary_type: 'monthly',
      salary_monthly: 0,
      status: 'active'
    }
  } catch (error) {
    console.error('Error adding member:', error)
  }
}
</script>

<template>
  <UDashboardPanel id="equipo">
    <template #header>
      <UDashboardNavbar title="Equipo" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <div class="flex flex-col">
            <span class="text-xl font-bold">Equipo</span>
            <span class="text-sm text-muted-foreground">Gestiona los miembros del equipo y sus asignaciones</span>
          </div>
        </template>

        <template #right>
          <UButton
            icon="i-lucide-plus"
            label="Agregar Miembro"
            color="neutral"
            size="md"
            @click="showAddMemberModal = true"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Team Members Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UCard
          v-for="miembro in miembros"
          :key="miembro.id"
          class="p-6"
        >
          <!-- Header with avatar, name and menu -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <UAvatar
                :text="miembro.iniciales"
                size="md"
              />
              <div>
                <h3 class="font-semibold text-lg">{{ miembro.nombre }}</h3>
                <p class="text-sm text-muted-foreground">{{ miembro.rol }}</p>
              </div>
            </div>
            <UDropdownMenu :items="getMenuItems(miembro)">
              <UButton
                icon="i-lucide-more-vertical"
                size="sm"
                color="neutral"
                variant="ghost"
                square
              />
            </UDropdownMenu>
          </div>

          <!-- Availability and projects -->
          <div class="flex items-center justify-between mb-4">
            <UBadge
              :label="miembro.disponibilidad"
              :color="getAvailabilityColor(miembro.disponibilidad)"
              variant="solid"
              size="sm"
            />
            <span class="text-sm text-muted-foreground">{{ miembro.proyectos }} proyectos</span>
          </div>

          <!-- Tasks completed -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-muted-foreground">Tareas Completadas</span>
              <span class="text-sm font-medium">{{ miembro.tareasCompletadas }}/{{ miembro.tareasTotal }}</span>
            </div>
            <UProgress
              :value="(miembro.tareasCompletadas / miembro.tareasTotal) * 100"
              color="neutral"
              size="md"
            />
          </div>

          <!-- Contact info -->
          <div class="space-y-2 mb-4">
            <div class="flex items-center gap-2 text-sm">
              <UIcon name="i-lucide-mail" class="w-4 h-4 text-muted-foreground" />
              <span class="text-muted-foreground truncate">{{ miembro.email }}</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <UIcon name="i-lucide-phone" class="w-4 h-4 text-muted-foreground" />
              <span class="text-muted-foreground">{{ miembro.telefono }}</span>
            </div>
          </div>

          <!-- Skills -->
          <div class="mb-4">
            <p class="text-sm font-medium mb-2">Habilidades</p>
            <div class="flex flex-wrap gap-1">
              <UBadge
                v-for="habilidad in miembro.habilidades"
                :key="habilidad"
                :label="habilidad"
                variant="outline"
                size="xs"
              />
            </div>
          </div>

          <!-- Rating Section -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Calificación</span>
              <div class="flex items-center gap-2">
                <div class="flex gap-1">
                  <UIcon
                    v-for="i in 5"
                    :key="i"
                    name="i-lucide-star"
                    :class="[
                      'w-4 h-4 cursor-pointer transition-colors',
                      i <= (miembro.calificacion || 0)
                        ? 'text-yellow-500 fill-current'
                        : 'text-muted-foreground'
                    ]"
                    @click="miembro.calificacion = i"
                  />
                </div>
                <span v-if="miembro.calificacion" class="text-xs text-muted-foreground">
                  {{ miembro.calificacion }}/5
                </span>
              </div>
            </div>

            <div v-if="miembro.fechaCalificacion" class="text-xs text-muted-foreground">
              · {{ miembro.fechaCalificacion }}
            </div>

            <div v-if="!miembro.calificacion" class="text-xs text-muted-foreground">
              Sin calificar
            </div>

            <!-- Comment textarea -->
            <UTextarea
              v-model="miembro.comentario"
              placeholder="Comentario"
              size="sm"
              :rows="2"
              class="text-xs"
            />

            <!-- Save button -->
            <UButton
              label="Guardar calificación"
              size="xs"
              color="neutral"
              variant="outline"
              block
              @click="saveRating(miembro)"
            />
          </div>
        </UCard>
      </div>

    </template>
  </UDashboardPanel>

  <!-- Add Member Modal -->
  <div v-if="showAddMemberModal" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/75 transition-opacity" @click="showAddMemberModal = false"></div>

    <!-- Modal Container -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-900 shadow-xl transition-all w-full max-w-2xl">
        <!-- Modal Content -->
        <div class="p-6">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                Agregar Nuevo Miembro
              </h3>
              <p class="text-sm text-muted-foreground mt-1">
                Complete la información del nuevo miembro del equipo
              </p>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              size="sm"
              square
              @click="showAddMemberModal = false"
            />
          </div>

          <!-- Form -->
          <form @submit.prevent="addMember" class="space-y-6">
            <!-- Grid Layout for Fields -->
            <div class="space-y-6">
              <!-- Email -->
              <div>
                <div class="mb-3">
                  <span class="text-sm font-medium text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-md">
                    📧 Correo institucional
                  </span>
                </div>
                <UFormGroup label="Correo Electrónico" required>
                  <UInput
                    v-model="newMemberForm.email"
                    type="email"
                    placeholder="juan.perez@empresa.com"
                    required
                    icon="i-lucide-mail"
                  />
                  <template #description>
                    <span class="text-xs text-muted-foreground">
                      El empleado usará este email para acceder al sistema
                    </span>
                  </template>
                </UFormGroup>
              </div>

              <!-- Name and ID Row -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div class="mb-3">
                    <span class="text-sm font-medium text-gray-900 dark:text-white bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-md">
                      👤 Información personal
                    </span>
                  </div>
                  <UFormGroup label="Nombre Completo" required>
                    <UInput
                      v-model="newMemberForm.name"
                      placeholder="Juan Carlos Pérez González"
                      required
                      icon="i-lucide-user"
                    />
                    <template #description>
                      <span class="text-xs text-muted-foreground">
                        Nombres y apellidos como aparecen en la cédula
                      </span>
                    </template>
                  </UFormGroup>
                </div>

                <div>
                  <div class="mb-3">
                    <span class="text-sm font-medium text-gray-900 dark:text-white bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-md">
                      🆔 Documento de identidad
                    </span>
                  </div>
                  <UFormGroup label="Número de Cédula" required>
                    <UInput
                      v-model="newMemberForm.identification"
                      placeholder="1234567890"
                      required
                      icon="i-lucide-credit-card"
                    />
                    <template #description>
                      <span class="text-xs text-muted-foreground">
                        Solo números, sin puntos ni espacios
                      </span>
                    </template>
                  </UFormGroup>
                </div>
              </div>

              <!-- Position and Phone Row -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div class="mb-3">
                    <span class="text-sm font-medium text-gray-900 dark:text-white bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-md">
                      💼 Puesto de trabajo
                    </span>
                  </div>
                  <UFormGroup label="Cargo en la Empresa" required>
                    <UInput
                      v-model="newMemberForm.position"
                      placeholder="Desarrollador Frontend"
                      required
                      icon="i-lucide-briefcase"
                    />
                    <template #description>
                      <span class="text-xs text-muted-foreground">
                        Título del puesto que desempeñará
                      </span>
                    </template>
                  </UFormGroup>
                </div>

                <div>
                  <div class="mb-3">
                    <span class="text-sm font-medium text-gray-900 dark:text-white bg-cyan-50 dark:bg-cyan-900/20 px-3 py-1.5 rounded-md">
                      📞 Número de contacto
                    </span>
                  </div>
                  <UFormGroup label="Teléfono Móvil">
                    <UInput
                      v-model="newMemberForm.phone"
                      placeholder="+57 300 123 4567"
                      icon="i-lucide-phone"
                    />
                    <template #description>
                      <span class="text-xs text-muted-foreground">
                        Con código de país (+57) - Opcional
                      </span>
                    </template>
                  </UFormGroup>
                </div>
              </div>

              <!-- Salary -->
              <div>
                <div class="mb-3">
                  <span class="text-sm font-medium text-gray-900 dark:text-white bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1.5 rounded-md">
                    💰 Remuneración mensual
                  </span>
                </div>
                <UFormGroup label="Salario Base">
                  <UInput
                    v-model="newMemberForm.salary_monthly"
                    type="number"
                    placeholder="3500000"
                    icon="i-lucide-dollar-sign"
                  >
                    <template #trailing>
                      <span class="text-xs text-muted-foreground">COP</span>
                    </template>
                  </UInput>
                  <template #description>
                    <span class="text-xs text-muted-foreground">
                      Valor en pesos sin puntos (ej: 3500000) - Opcional
                    </span>
                  </template>
                </UFormGroup>
              </div>

              <!-- Address -->
              <div>
                <div class="mb-3">
                  <span class="text-sm font-medium text-gray-900 dark:text-white bg-pink-50 dark:bg-pink-900/20 px-3 py-1.5 rounded-md">
                    🏠 Lugar de residencia
                  </span>
                </div>
                <UFormGroup label="Dirección Completa">
                  <UInput
                    v-model="newMemberForm.address"
                    placeholder="Calle 123 #45-67, Apartamento 301, Bogotá"
                    icon="i-lucide-map-pin"
                  />
                  <template #description>
                    <span class="text-xs text-muted-foreground">
                      Dirección donde vive actualmente - Opcional
                    </span>
                  </template>
                </UFormGroup>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <UButton
                label="Cancelar"
                color="neutral"
                variant="outline"
                @click="showAddMemberModal = false"
                class="flex-1"
              />
              <UButton
                label="Agregar Miembro"
                type="submit"
                :loading="loading"
                :disabled="!newMemberForm.email || !newMemberForm.name || !newMemberForm.identification || !newMemberForm.position"
                class="flex-1"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>

</template>