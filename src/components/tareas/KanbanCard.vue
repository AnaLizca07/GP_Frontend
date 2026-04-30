<script setup lang="ts">
import { computed, ref } from 'vue'

// Define props
interface Props {
  tarea: {
    id: number
    code?: string
    titulo: string
    proyecto: string
    asignado: string
    iniciales: string
    fecha: string
    prioridad: 'Alta' | 'Media' | 'Baja'
    estado: 'Por Hacer' | 'En Progreso' | 'En Revisión' | 'Completada'
    completada: boolean
  }
  isManager?: boolean
}

const props = withDefaults(defineProps<Props>(), { isManager: false })

// Define emits
const emit = defineEmits<{
  toggleCompletion: [id: number]
  editTask: [id: number]
  dragStart: [id: number]
  dragEnd: []
}>()

// Drag state
const isDragging = ref(false)

// Get priority color
const getPriorityColor = computed(() => {
  switch (props.tarea.prioridad) {
    case 'Alta':
      return 'error'
    case 'Media':
      return 'warning'
    case 'Baja':
      return 'success'
    default:
      return 'neutral'
  }
})

// Handle completion toggle
const handleToggleCompletion = () => {
  emit('toggleCompletion', props.tarea.id)
}

// Handle edit task
const handleEditTask = () => {
  emit('editTask', props.tarea.id)
}

// Drag handlers
const handleDragStart = (event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', props.tarea.id.toString())
    event.dataTransfer.setData('application/json', JSON.stringify(props.tarea))
    event.dataTransfer.effectAllowed = 'move'
  }
  isDragging.value = true
  emit('dragStart', props.tarea.id)
}

const handleDragEnd = () => {
  isDragging.value = false
  emit('dragEnd')
}
</script>

<template>
  <UCard
    class="p-4 hover:shadow-md transition-all duration-200 cursor-move select-none"
    :class="{ 'opacity-50 scale-95': isDragging }"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <div class="space-y-3">
      <!-- Task Header -->
      <div class="flex items-start justify-between">
        <UCheckbox
          :model-value="tarea.completada"
          @change="handleToggleCompletion"
          :disabled="tarea.estado === 'Completada'"
        />

        <div class="flex items-center gap-2">
          <UBadge
            :label="tarea.prioridad"
            :color="getPriorityColor"
            variant="outline"
            size="xs"
          />
          <UButton
            v-if="isManager"
            icon="i-lucide-more-horizontal"
            size="xs"
            color="neutral"
            variant="ghost"
            square
            @click="handleEditTask"
          />
        </div>
      </div>

      <!-- Task Title -->
      <div>
        <h4
          class="font-medium text-sm leading-tight"
          :class="{ 'line-through text-muted-foreground': tarea.completada }"
        >
          {{ tarea.titulo }}
        </h4>
        <div class="flex items-center gap-2 mt-1">
          <p class="text-xs text-muted-foreground">{{ tarea.proyecto }}</p>
          <span v-if="tarea.code" class="text-xs font-mono text-primary/70 bg-primary/8 px-1.5 py-0.5 rounded">{{ tarea.code }}</span>
        </div>
      </div>

      <!-- Task Footer -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1">
          <UAvatar
            :text="tarea.iniciales"
            size="2xs"
          />
          <span class="text-xs text-muted-foreground">{{ tarea.asignado }}</span>
        </div>

        <div class="flex items-center gap-1">
          <UIcon name="i-lucide-calendar" class="w-3 h-3 text-muted-foreground" />
          <span class="text-xs text-muted-foreground">{{ tarea.fecha }}</span>
        </div>
      </div>
    </div>
  </UCard>
</template>