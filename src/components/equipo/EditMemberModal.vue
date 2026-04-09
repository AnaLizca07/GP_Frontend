<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { MiembroEquipo } from '@/types/equipo'
import type { UpdateEmployeeData } from '@/services/employees'

interface Props {
  show: boolean
  member: MiembroEquipo | null
  loading?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'submit', id: number, data: UpdateEmployeeData): void
}

const props = withDefaults(defineProps<Props>(), { loading: false })
const emit = defineEmits<Emits>()

const salaryTypeOptions = [
  { label: 'Mensual', value: 'monthly' },
  { label: 'Quincenal', value: 'biweekly' },
  { label: 'Por hora', value: 'hourly' },
]

const form = ref<UpdateEmployeeData & { salary_type?: 'monthly' | 'hourly' | 'biweekly' }>({
  name: '',
  identification: '',
  position: '',
  phone: '',
  address: '',
  salary_type: 'monthly',
  salary_monthly: null,
  salary_hourly: null,
  salary_biweekly: null,
})

// ─── Touched state ────────────────────────────────────────────────────────────
const touched = reactive({ name: false, identification: false, position: false })

// ─── Validaciones en tiempo real ──────────────────────────────────────────────
const nameError = computed(() => {
  if (!form.value.name?.trim()) return 'El nombre es obligatorio'
  if (form.value.name.trim().length < 3) return 'Ingresa el nombre completo'
  return null
})

const identificationError = computed(() => {
  if (!form.value.identification) return 'La cédula es obligatoria'
  if (!/^\d+$/.test(form.value.identification)) return 'Solo números, sin puntos ni espacios'
  if (form.value.identification.length < 6) return 'La cédula debe tener al menos 6 dígitos'
  return null
})

const positionError = computed(() => {
  if (!form.value.position?.trim()) return 'El cargo es obligatorio'
  return null
})

const isFormValid = computed(() =>
  !nameError.value && !identificationError.value && !positionError.value
)

watch(() => props.member, (member) => {
  if (member) {
    form.value = {
      name: member.nombre,
      identification: member.identification,
      position: member.rol,
      phone: member.telefono,
      address: '',
      salary_type: member.salary_type || 'monthly',
      salary_monthly: member.salary_monthly ?? null,
      salary_hourly: member.salary_hourly ?? null,
      salary_biweekly: member.salary_biweekly ?? null,
    }
    // Resetear touched al abrir con nuevo miembro
    touched.name           = false
    touched.identification = false
    touched.position       = false
  }
}, { immediate: true })

const handleSubmit = () => {
  touched.name           = true
  touched.identification = true
  touched.position       = true
  if (!isFormValid.value || !props.member) return
  emit('submit', props.member.id, { ...form.value })
}
</script>

<template>
  <div v-if="show && member" class="fixed inset-0 z-[9999] overflow-y-auto">
    <div class="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/75 transition-opacity" @click="$emit('close')" />

    <div class="flex min-h-full items-center justify-center p-4">
      <div class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-900 shadow-xl w-full max-w-2xl">
        <div class="p-6">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <UAvatar :text="member.iniciales" size="md" />
              <div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Editar empleado</h3>
                <p class="text-sm text-muted-foreground">{{ member.nombre }}</p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="$emit('close')" />
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Name & Identification -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium mb-1">Nombre completo *</label>
                <UInput
                  v-model="form.name"
                  placeholder="Juan Carlos Pérez"
                  icon="i-lucide-user"
                  :color="touched.name && nameError ? 'error' : undefined"
                  @blur="touched.name = true"
                />
                <p v-if="touched.name && nameError" class="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <UIcon name="i-lucide-circle-alert" class="w-3 h-3 shrink-0" />
                  {{ nameError }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Cédula *</label>
                <UInput
                  v-model="form.identification"
                  placeholder="1234567890"
                  icon="i-lucide-credit-card"
                  :color="touched.identification && identificationError ? 'error' : undefined"
                  @blur="touched.identification = true"
                />
                <p v-if="touched.identification && identificationError" class="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <UIcon name="i-lucide-circle-alert" class="w-3 h-3 shrink-0" />
                  {{ identificationError }}
                </p>
                <p v-else class="text-xs text-muted-foreground mt-1">Solo números, sin puntos</p>
              </div>
            </div>

            <!-- Position & Phone -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium mb-1">Cargo *</label>
                <UInput
                  v-model="form.position"
                  placeholder="Desarrollador Frontend"
                  icon="i-lucide-briefcase"
                  :color="touched.position && positionError ? 'error' : undefined"
                  @blur="touched.position = true"
                />
                <p v-if="touched.position && positionError" class="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <UIcon name="i-lucide-circle-alert" class="w-3 h-3 shrink-0" />
                  {{ positionError }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Teléfono</label>
                <UInput v-model="form.phone" placeholder="+57 300 123 4567" icon="i-lucide-phone" />
                <p class="text-xs text-muted-foreground mt-1">Opcional — ej: +57 300 123 4567</p>
              </div>
            </div>

            <!-- Address -->
            <div>
              <label class="block text-sm font-medium mb-1">Dirección</label>
              <UInput v-model="form.address" placeholder="Calle 123 #45-67, Bogotá" icon="i-lucide-map-pin" />
            </div>

            <!-- Salary Type -->
            <div>
              <label class="block text-sm font-medium mb-2">Tipo de salario</label>
              <div class="flex gap-4">
                <label v-for="option in salaryTypeOptions" :key="option.value" class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" :value="option.value" v-model="form.salary_type" class="accent-primary" />
                  <span class="text-sm">{{ option.label }}</span>
                </label>
              </div>
            </div>

            <!-- Salary Amount -->
            <div>
              <label class="block text-sm font-medium mb-1">
                Salario base
                <span class="text-muted-foreground font-normal">
                  ({{ form.salary_type === 'monthly' ? 'mensual' : form.salary_type === 'biweekly' ? 'quincenal' : 'por hora' }})
                </span>
              </label>
              <UInput v-if="form.salary_type === 'monthly'" v-model="form.salary_monthly" type="number" placeholder="3500000" icon="i-lucide-dollar-sign">
                <template #trailing><span class="text-xs text-muted-foreground">COP/mes</span></template>
              </UInput>
              <UInput v-else-if="form.salary_type === 'biweekly'" v-model="form.salary_biweekly" type="number" placeholder="1750000" icon="i-lucide-dollar-sign">
                <template #trailing><span class="text-xs text-muted-foreground">COP/quincena</span></template>
              </UInput>
              <UInput v-else v-model="form.salary_hourly" type="number" placeholder="21875" icon="i-lucide-dollar-sign">
                <template #trailing><span class="text-xs text-muted-foreground">COP/hora</span></template>
              </UInput>
              <p class="text-xs text-muted-foreground mt-1">Valor en pesos sin puntos — Opcional</p>
            </div>

            <!-- Buttons -->
            <div class="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <UButton label="Cancelar" color="neutral" variant="outline" @click="$emit('close')" class="flex-1" />
              <UButton label="Guardar cambios" type="submit" :loading="loading" :disabled="loading" class="flex-1" />
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
