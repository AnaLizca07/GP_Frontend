<script setup lang="ts">
import { ref, watch } from 'vue'
import type { MiembroEquipo } from '@/types/equipo'
import ratingsService, { type EmployeeRating } from '@/services/ratings'
import { formatCOP } from '@/utils'

interface Props {
  show: boolean
  member: MiembroEquipo | null
  readonly?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'edit', member: MiembroEquipo): void
  (e: 'deactivate', member: MiembroEquipo): void
}

const props = withDefaults(defineProps<Props>(), { readonly: false })
const emit = defineEmits<Emits>()

// ─── Ratings history (manager only) ──────────────────────────────────────
const ratings = ref<EmployeeRating[]>([])
const loadingRatings = ref(false)

watch(
  () => [props.show, props.member?.id],
  async ([show, memberId]) => {
    if (!show || !memberId || props.readonly) return
    loadingRatings.value = true
    ratings.value = []
    try {
      ratings.value = await ratingsService.getRatings(memberId as number)
    } catch (e) {
      console.error('Error cargando calificaciones:', e)
    } finally {
      loadingRatings.value = false
    }
  }
)

// ─── Helpers ─────────────────────────────────────────────────────────────
const formatSalary = (amount: number | null | undefined) => amount ? formatCOP(amount) : '—'

const salaryRows = (member: MiembroEquipo) => {
  const rows: { label: string; value: string; primary: boolean }[] = []
  if (member.salary_monthly) {
    rows.push({ label: 'Mensual', value: formatSalary(member.salary_monthly), primary: member.salary_type === 'monthly' })
  }
  if (member.salary_biweekly) {
    rows.push({ label: 'Quincenal', value: formatSalary(member.salary_biweekly), primary: member.salary_type === 'biweekly' })
  }
  if (member.salary_hourly) {
    rows.push({ label: 'Por hora', value: formatSalary(member.salary_hourly), primary: member.salary_type === 'hourly' })
  }
  return rows
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
</script>

<template>
  <div v-if="show && member" class="fixed inset-0 z-[9999] overflow-y-auto">
    <div class="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/75 transition-opacity" @click="$emit('close')" />

    <div class="flex min-h-full items-center justify-center p-4">
      <div class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-900 shadow-xl w-full max-w-2xl">
        <div class="p-6">
          <!-- Header -->
          <div class="flex items-start justify-between mb-6">
            <div class="flex items-center gap-4">
              <UAvatar :text="member.iniciales" size="xl" />
              <div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ member.nombre }}</h2>
                <p class="text-base text-muted-foreground">{{ member.rol }}</p>
                <UBadge
                  :label="member.disponibilidad"
                  :color="member.disponibilidad === 'Activo' ? 'success' : 'neutral'"
                  variant="solid"
                  size="sm"
                  class="mt-1"
                />
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="lg" square @click="$emit('close')" />
          </div>

          <!-- Contact & Salary grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <UCard class="p-4">
              <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Contacto</h3>
              <div class="space-y-2">
                <div v-if="member.identification" class="flex items-center gap-2 text-sm">
                  <UIcon name="i-lucide-credit-card" class="w-4 h-4 text-muted-foreground shrink-0" />
                  <span class="text-muted-foreground">CC</span>
                  <span class="font-medium">{{ member.identification }}</span>
                </div>
                <div v-if="member.telefono" class="flex items-center gap-2 text-sm">
                  <UIcon name="i-lucide-phone" class="w-4 h-4 text-muted-foreground shrink-0" />
                  <span class="font-medium">{{ member.telefono }}</span>
                </div>
                <p v-if="!member.identification && !member.telefono" class="text-xs text-muted-foreground">Sin datos de contacto</p>
              </div>
            </UCard>

            <UCard class="p-4">
              <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Salario</h3>
              <div v-if="salaryRows(member).length > 0" class="space-y-1.5">
                <div v-for="row in salaryRows(member)" :key="row.label" class="flex items-center justify-between text-sm">
                  <span class="flex items-center gap-1.5 text-muted-foreground">
                    <UIcon v-if="row.primary" name="i-lucide-star" class="w-3 h-3 text-amber-500" />
                    <span v-else class="w-3" />
                    {{ row.label }}
                  </span>
                  <span class="font-semibold">{{ row.value }}</span>
                </div>
              </div>
              <p v-else class="text-xs text-muted-foreground">Sin información salarial</p>
            </UCard>
          </div>

          <!-- Resume -->
          <UCard class="p-4 mb-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hoja de vida</h3>
              <UBadge
                :label="member.resume_url ? 'Subida' : 'Sin CV'"
                :color="member.resume_url ? 'success' : 'neutral'"
                variant="subtle"
                size="sm"
              />
            </div>
            <div v-if="member.resume_url" class="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <UIcon name="i-lucide-file-check" class="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
              <span class="text-sm flex-1 text-green-700 dark:text-green-300">Documento disponible</span>
              <UButton
                label="Ver"
                icon="i-lucide-external-link"
                variant="outline"
                color="neutral"
                size="sm"
                :to="member.resume_url"
                target="_blank"
              />
            </div>
            <div v-else class="flex items-center gap-3 p-3 rounded-lg bg-muted/40 text-sm text-muted-foreground">
              <UIcon name="i-lucide-file-x" class="w-5 h-5 shrink-0" />
              <span>El empleado aún no ha subido su hoja de vida</span>
            </div>
          </UCard>

          <!-- Ratings history (manager only) -->
          <UCard v-if="!readonly" class="p-4 mb-5">
            <div class="flex items-center gap-2 mb-3">
              <UIcon name="i-lucide-star" class="w-4 h-4 text-yellow-500" />
              <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Historial de Calificaciones
              </h3>
              <UBadge v-if="ratings.length > 0" :label="String(ratings.length)" color="neutral" variant="subtle" size="xs" />
            </div>

            <!-- Loading -->
            <div v-if="loadingRatings" class="space-y-2">
              <USkeleton v-for="i in 3" :key="i" class="h-12 rounded-lg" />
            </div>

            <!-- Empty -->
            <div v-else-if="ratings.length === 0" class="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-muted/30">
              <UIcon name="i-lucide-info" class="w-4 h-4 shrink-0" />
              <span>Aún no se ha registrado ninguna calificación para este empleado.</span>
            </div>

            <!-- List -->
            <div v-else class="space-y-2 max-h-56 overflow-y-auto pr-1">
              <div
                v-for="r in ratings"
                :key="r.id"
                class="p-3 rounded-lg border border-default bg-elevated/30"
              >
                <div class="flex items-center justify-between mb-1">
                  <div class="flex gap-0.5">
                    <UIcon
                      v-for="i in 5"
                      :key="i"
                      name="i-lucide-star"
                      class="w-3.5 h-3.5"
                      :class="i <= r.stars ? 'text-yellow-500' : 'text-muted-foreground opacity-30'"
                    />
                  </div>
                  <span class="text-xs text-muted-foreground">{{ formatDateTime(r.created_at) }}</span>
                </div>
                <p v-if="r.comment" class="text-xs text-foreground leading-relaxed">{{ r.comment }}</p>
                <p v-else class="text-xs text-muted-foreground italic">Sin comentario</p>
              </div>
            </div>
          </UCard>

          <!-- Actions (managers only) -->
          <div v-if="!props.readonly" class="flex gap-3">
            <UButton
              label="Editar"
              icon="i-lucide-edit"
              color="neutral"
              variant="outline"
              class="flex-1"
              @click="$emit('edit', member); $emit('close')"
            />
            <UButton
              label="Desactivar"
              icon="i-lucide-user-x"
              color="error"
              variant="outline"
              class="flex-1"
              @click="$emit('deactivate', member); $emit('close')"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
