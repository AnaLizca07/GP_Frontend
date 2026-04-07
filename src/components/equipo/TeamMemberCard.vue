<script setup lang="ts">
import type { MiembroEquipo } from '@/types/equipo'
import RatingComponent from './RatingComponent.vue'
import { formatCOP } from '@/utils'

interface Props {
  member: MiembroEquipo
  readonly?: boolean
  savingRating?: boolean
}

interface Emits {
  (e: 'show-profile', member: MiembroEquipo): void
  (e: 'edit-member', member: MiembroEquipo): void
  (e: 'deactivate-member', member: MiembroEquipo): void
  (e: 'save-rating', member: MiembroEquipo): void
}

const props = withDefaults(defineProps<Props>(), { readonly: false, savingRating: false })
const emit = defineEmits<Emits>()

const getMenuItems = (miembro: MiembroEquipo) => props.readonly
  ? [[{ label: 'Ver perfil', icon: 'i-lucide-user', onSelect: () => emit('show-profile', miembro) }]]
  : [[
      { label: 'Ver perfil', icon: 'i-lucide-user', onSelect: () => emit('show-profile', miembro) },
      { label: 'Editar', icon: 'i-lucide-edit', onSelect: () => emit('edit-member', miembro) },
      { label: 'Desactivar', icon: 'i-lucide-user-x', color: 'error' as const, onSelect: () => emit('deactivate-member', miembro) },
    ]]


  

const salaryLabel = (member: MiembroEquipo): string => {
  if (member.salary_type === 'monthly' && member.salary_monthly) {
    return `${formatCOP(member.salary_monthly)} / mes`
  }
  if (member.salary_type === 'biweekly' && member.salary_biweekly) {
    return `${formatCOP(member.salary_biweekly)} / quincena`
  }
  if (member.salary_type === 'hourly' && member.salary_hourly) {
    return `${formatCOP(member.salary_hourly)} / hora`
  }
  return 'Sin salario registrado'
}

const handleRatingUpdate = (rating: number) => {
  props.member.calificacion = rating
}

const handleCommentUpdate = (comment: string) => {
  props.member.comentario = comment
}

const handleSaveRating = () => {
  emit('save-rating', props.member)
}
</script>

<template>
  <UCard class="p-6">
    <!-- Header -->
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center gap-3">
        <UAvatar :text="member.iniciales" size="md" />
        <div>
          <h3 class="font-semibold text-lg">{{ member.nombre }}</h3>
          <p class="text-sm text-muted-foreground">{{ member.rol }}</p>
        </div>
      </div>
      <UDropdownMenu :items="getMenuItems(member)">
        <UButton
          icon="i-lucide-more-vertical"
          size="sm"
          color="neutral"
          variant="ghost"
          square
        />
      </UDropdownMenu>
    </div>

    <!-- Status badge -->
    <div class="mb-4">
      <UBadge
        :label="member.disponibilidad"
        :color="member.disponibilidad === 'Activo' ? 'success' : 'neutral'"
        variant="solid"
        size="sm"
      />
    </div>

    <!-- Contact info (manager only) -->
    <div v-if="!readonly" class="space-y-2 mb-4">
      <div v-if="member.identification" class="flex items-center gap-2 text-sm">
        <UIcon name="i-lucide-credit-card" class="w-4 h-4 text-muted-foreground shrink-0" />
        <span class="text-muted-foreground">CC {{ member.identification }}</span>
      </div>
      <div v-if="member.telefono" class="flex items-center gap-2 text-sm">
        <UIcon name="i-lucide-phone" class="w-4 h-4 text-muted-foreground shrink-0" />
        <span class="text-muted-foreground">{{ member.telefono }}</span>
      </div>
      <div class="flex items-center gap-2 text-sm">
        <UIcon name="i-lucide-banknote" class="w-4 h-4 text-muted-foreground shrink-0" />
        <span class="text-muted-foreground">{{ salaryLabel(member) }}</span>
      </div>
      <div class="flex items-center gap-2 text-sm">
        <UIcon
          :name="member.resume_url ? 'i-lucide-file-check' : 'i-lucide-file-x'"
          class="w-4 h-4 shrink-0"
          :class="member.resume_url ? 'text-green-500' : 'text-muted-foreground'"
        />
        <span class="text-muted-foreground">
          {{ member.resume_url ? 'Hoja de vida subida' : 'Sin hoja de vida' }}
        </span>
      </div>
    </div>

    <!-- Rating Section (manager only) -->
    <RatingComponent v-if="!readonly"
      :saving="savingRating"
      :rating="member.calificacion"
      :last-rated="member.fechaCalificacion"
      :comment="member.comentario"
      @update:rating="handleRatingUpdate"
      @update:comment="handleCommentUpdate"
      @save="handleSaveRating"
    />
  </UCard>
</template>
