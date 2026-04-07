<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import tasksService, { type TaskDeliverable } from '@/services/tasks'

// ─── Props / Emits ────────────────────────────
interface Props {
  show: boolean
  taskId: number
  taskTitle: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  completed: []
}>()

// ─── Estado ──────────────────────────────────
const existingDeliverables = ref<TaskDeliverable[]>([])
const selectedFiles = ref<File[]>([])
const confirmed = ref(false)
const uploading = ref(false)
const loadingDeliverables = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// ─── Cargar entregables al abrir ──────────────
watch(
  () => props.show,
  async (visible) => {
    if (!visible) return
    confirmed.value = false
    selectedFiles.value = []
    await loadDeliverables()
  }
)

const loadDeliverables = async () => {
  if (!props.taskId) return
  loadingDeliverables.value = true
  try {
    existingDeliverables.value = await tasksService.getDeliverables(props.taskId)
  } catch (e) {
    console.error('Error cargando entregables:', e)
  } finally {
    loadingDeliverables.value = false
  }
}

// ─── Manejo de archivos ───────────────────────
const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])

  const oversized = files.filter(f => f.size > 10 * 1024 * 1024)
  if (oversized.length) {
    alert(`Algunos archivos exceden 10MB: ${oversized.map(f => f.name).join(', ')}`)
    return
  }
  selectedFiles.value.push(...files)
  input.value = ''
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}

const deleteExisting = async (deliverable: TaskDeliverable) => {
  if (!confirm(`¿Eliminar "${deliverable.file_name}"?`)) return
  try {
    await tasksService.deleteDeliverable(props.taskId, deliverable.id)
    existingDeliverables.value = existingDeliverables.value.filter(d => d.id !== deliverable.id)
  } catch (e) {
    console.error('Error eliminando entregable:', e)
  }
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// RF12: se requiere al menos un entregable para completar
const hasDeliverables = computed(
  () => existingDeliverables.value.length > 0 || selectedFiles.value.length > 0
)

// ─── Completar tarea ─────────────────────────
const handleComplete = async () => {
  uploading.value = true
  try {
    // 1. Subir archivos nuevos
    for (const file of selectedFiles.value) {
      await tasksService.uploadDeliverable(props.taskId, file)
    }

    // 2. Cambiar estado a completada
    await tasksService.updateTaskStatus(props.taskId, 'completed')

    emit('completed')
    emit('close')
  } catch (e) {
    console.error('Error completando tarea:', e)
    alert('Error al completar la tarea. Intenta de nuevo.')
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="fixed inset-0 bg-black/40" @click="emit('close')" />
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg">

          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b dark:border-gray-700">
            <div>
              <h2 class="text-lg font-semibold">Completar Tarea</h2>
              <p class="text-sm text-muted-foreground truncate max-w-xs">{{ taskTitle }}</p>
            </div>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" square @click="emit('close')" />
          </div>

          <!-- Body -->
          <div class="p-6 space-y-5">

            <!-- Upload nuevos archivos -->
            <div>
              <label class="block text-sm font-medium mb-2">Subir entregables</label>
              <div
                class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                @click="fileInput?.click()"
              >
                <UIcon name="i-lucide-upload-cloud" class="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p class="text-sm text-muted-foreground">
                  Haz clic o arrastra archivos aquí
                </p>
                <p class="text-xs text-muted-foreground mt-1">PDF, DOC, XLS, ZIP, JPG, PNG · Máx 10MB</p>
              </div>
              <input
                ref="fileInput"
                type="file"
                multiple
                class="hidden"
                @change="handleFileSelect"
              />
            </div>

            <!-- Archivos seleccionados (nuevos) -->
            <div v-if="selectedFiles.length">
              <p class="text-sm font-medium mb-2">Por subir ({{ selectedFiles.length }})</p>
              <div class="space-y-2">
                <div
                  v-for="(file, idx) in selectedFiles"
                  :key="idx"
                  class="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <UIcon name="i-lucide-file" class="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span class="text-sm truncate">{{ file.name }}</span>
                    <span class="text-xs text-muted-foreground flex-shrink-0">{{ formatSize(file.size) }}</span>
                  </div>
                  <UButton
                    icon="i-lucide-x"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    square
                    @click="removeFile(idx)"
                  />
                </div>
              </div>
            </div>

            <!-- Entregables existentes -->
            <div v-if="loadingDeliverables" class="text-sm text-muted-foreground">
              Cargando entregables...
            </div>
            <div v-else-if="existingDeliverables.length">
              <p class="text-sm font-medium mb-2">Entregables subidos ({{ existingDeliverables.length }})</p>
              <div class="space-y-2">
                <div
                  v-for="d in existingDeliverables"
                  :key="d.id"
                  class="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded-lg"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <UIcon name="i-lucide-file-check" class="w-4 h-4 text-green-500 flex-shrink-0" />
                    <a
                      :href="d.file_url"
                      target="_blank"
                      class="text-sm text-primary hover:underline truncate"
                    >
                      {{ d.file_name }}
                    </a>
                    <span class="text-xs text-muted-foreground flex-shrink-0">{{ formatSize(d.file_size) }}</span>
                  </div>
                  <UButton
                    icon="i-lucide-trash-2"
                    size="xs"
                    color="red"
                    variant="ghost"
                    square
                    @click="deleteExisting(d)"
                  />
                </div>
              </div>
            </div>

            <!-- Aviso: entregable obligatorio -->
            <div
              v-if="!hasDeliverables"
              class="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
            >
              <UIcon name="i-lucide-triangle-alert" class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p class="text-xs text-amber-700 dark:text-amber-300">
                Debes subir al menos un entregable antes de marcar la tarea como completada.
              </p>
            </div>

            <!-- Confirmación -->
            <label class="flex items-start gap-3 cursor-pointer select-none">
              <input
                v-model="confirmed"
                type="checkbox"
                class="mt-0.5 w-4 h-4 accent-primary"
              />
              <span class="text-sm text-muted-foreground">
                Confirmo que la tarea está completa y he subido todos los entregables necesarios.
              </span>
            </label>
          </div>

          <!-- Footer -->
          <div class="flex gap-3 p-6 pt-0">
            <button
              @click="emit('close')"
              class="flex-1 p-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
            >
              Cancelar
            </button>
            <button
              @click="handleComplete"
              :disabled="!confirmed || uploading || !hasDeliverables"
              class="flex-1 p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
            >
              <UIcon v-if="uploading" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
              {{ uploading ? 'Procesando...' : 'Marcar como Completada' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
