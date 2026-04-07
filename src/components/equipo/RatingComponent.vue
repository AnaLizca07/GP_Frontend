<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  rating: number | null
  maxRating?: number
  readonly?: boolean
  saving?: boolean
  size?: 'sm' | 'md' | 'lg'
  lastRated?: string | null
  comment?: string
}

interface Emits {
  (e: 'update:rating', value: number): void
  (e: 'update:comment', value: string): void
  (e: 'save'): void
}

const props = withDefaults(defineProps<Props>(), {
  saving: false,
  maxRating: 5,
  readonly: false,
  size: 'md'
})

const emit = defineEmits<Emits>()

const localComment = ref(props.comment || '')

watch(() => props.comment, (newComment) => {
  localComment.value = newComment || ''
})

const updateComment = (value: string) => {
  localComment.value = value
  emit('update:comment', value)
}

const setRating = (rating: number) => {
  if (!props.readonly) {
    emit('update:rating', rating)
  }
}

const handleSave = () => {
  emit('save')
}

const iconSize = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-3 h-3'
    case 'lg': return 'w-6 h-6'
    default: return 'w-4 h-4'
  }
})
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium">Calificación</span>
      <div class="flex items-center gap-2">
        <div class="flex gap-1">
          <UIcon
            v-for="i in maxRating"
            :key="i"
            name="i-lucide-star"
            :class="[
              iconSize,
              'transition-colors',
              !readonly ? 'cursor-pointer' : 'cursor-default',
              i <= (rating || 0)
                ? 'text-yellow-500 fill-current'
                : 'text-muted-foreground'
            ]"
            @click="setRating(i)"
          />
        </div>
        <span v-if="rating" class="text-xs text-muted-foreground">
          {{ rating }}/{{ maxRating }}
        </span>
      </div>
    </div>

    <div v-if="lastRated" class="text-xs text-muted-foreground">
      · {{ lastRated }}
    </div>

    <div v-if="!rating" class="text-xs text-muted-foreground">
      Sin calificar
    </div>

    <!-- Comment textarea -->
    <UTextarea
      :model-value="localComment"
      @update:model-value="updateComment"
      placeholder="Comentario"
      size="sm"
      :rows="2"
      class="text-xs"
      :readonly="readonly"
    />

    <!-- Save button -->
    <UButton
      v-if="!readonly"
      label="Guardar calificación"
      :loading="saving"
      size="xs"
      color="neutral"
      variant="outline"
      block
      @click="handleSave"
    />
  </div>
</template>