<script setup lang="ts">
import { computed, ref } from 'vue'
import KanbanCard from './KanbanCard.vue'

// Define props
interface Props {
  title: string
  status: 'Por Hacer' | 'En Progreso' | 'Completada'
  tasks: any[]
  count: number
  isManager?: boolean
}

const props = defineProps<Props>()

// Define emits
const emit = defineEmits<{
  toggleTaskCompletion: [id: number]
  editTask: [id: number]
  moveTask: [taskId: number, newStatus: string]
  dragStart: [id: number]
  dragEnd: []
  addTask: [status: string]
}>()

// Drop state
const isDragOver = ref(false)
const draggedTaskId = ref<number | null>(null)

// Column styling based on status
const columnConfig = computed(() => {
  switch (props.status) {
    case 'Por Hacer':
      return {
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        titleColor: 'text-blue-700 dark:text-blue-300',
        countBg: 'bg-blue-100 dark:bg-blue-900'
      }
    case 'En Progreso':
      return {
        bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        titleColor: 'text-yellow-700 dark:text-yellow-300',
        countBg: 'bg-yellow-100 dark:bg-yellow-900'
      }
    case 'Completada':
      return {
        bgColor: 'bg-green-50 dark:bg-green-950/20',
        borderColor: 'border-green-200 dark:border-green-800',
        titleColor: 'text-green-700 dark:text-green-300',
        countBg: 'bg-green-100 dark:bg-green-900'
      }
    default:
      return {
        bgColor: 'bg-gray-50 dark:bg-gray-950/20',
        borderColor: 'border-gray-200 dark:border-gray-800',
        titleColor: 'text-gray-700 dark:text-gray-300',
        countBg: 'bg-gray-100 dark:bg-gray-900'
      }
  }
})

// Handle task completion toggle
const handleToggleCompletion = (id: number) => {
  emit('toggleTaskCompletion', id)
}

// Handle edit task
const handleEditTask = (id: number) => {
  emit('editTask', id)
}

// Handle drag start from cards
const handleDragStart = (id: number) => {
  draggedTaskId.value = id
  emit('dragStart', id)
}

// Handle drag end from cards
const handleDragEnd = () => {
  draggedTaskId.value = null
  isDragOver.value = false
  emit('dragEnd')
}

// Drop zone handlers
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
  isDragOver.value = true
}

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (event: DragEvent) => {
  // Solo cambiar el estado si realmente salimos de la zona
  if (!event.currentTarget.contains(event.relatedTarget as Node)) {
    isDragOver.value = false
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false

  const taskId = parseInt(event.dataTransfer!.getData('text/plain'))
  console.log(`Drop en columna "${props.status}": taskId=${taskId}, draggedTaskId=${draggedTaskId.value}`)

  if (taskId) {
    console.log(`Emitiendo moveTask: ${taskId} -> ${props.status}`)
    emit('moveTask', taskId, props.status)
  } else {
    console.log('❌ No se pudo obtener el taskId del drop')
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Column Header -->
    <div
      class="p-4 rounded-t-lg border-l-4"
      :class="[columnConfig.bgColor, columnConfig.borderColor]"
    >
      <div class="flex items-center justify-between">
        <h3
          class="font-semibold text-sm"
          :class="columnConfig.titleColor"
        >
          {{ title }}
        </h3>
        <div
          class="px-2 py-1 rounded-full text-xs font-medium"
          :class="[columnConfig.countBg, columnConfig.titleColor]"
        >
          {{ count }}
        </div>
      </div>
    </div>

    <!-- Column Content -->
    <div
      class="flex-1 p-4 space-y-3 min-h-[400px] rounded-b-lg border-l-4 border-t-0 transition-all duration-200"
      :class="[
        columnConfig.bgColor,
        columnConfig.borderColor,
        {
          'ring-2 ring-primary ring-opacity-50 bg-primary/10': isDragOver,
          'scale-[1.02]': isDragOver
        }
      ]"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <KanbanCard
        v-for="task in tasks"
        :key="task.id"
        :tarea="task"
        @toggle-completion="handleToggleCompletion"
        @edit-task="handleEditTask"
        @drag-start="handleDragStart"
        @drag-end="handleDragEnd"
      />

      <!-- Empty State -->
      <div
        v-if="tasks.length === 0"
        class="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg"
      >
        <p class="text-sm text-muted-foreground">No hay tareas</p>
      </div>

      <!-- Add Task Button (solo managers) -->
      <UButton
        v-if="props.isManager"
        variant="ghost"
        block
        class="mt-4 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary"
        icon="i-lucide-plus"
        @click="emit('addTask', props.status)"
      >
        Agregar tarea
      </UButton>
    </div>
  </div>
</template>