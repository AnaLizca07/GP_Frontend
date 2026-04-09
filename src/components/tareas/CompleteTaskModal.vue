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

// ─── Tipos permitidos ─────────────────────────
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx']
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]
const FILE_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx'
const MAX_SIZE_MB = 10
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

// ─── Estado ──────────────────────────────────
const existingDeliverables = ref<TaskDeliverable[]>([])
const selectedFiles = ref<File[]>([])
const confirmed = ref(false)
const uploading = ref(false)
const loadingDeliverables = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const fileErrors = ref<string[]>([])

// ─── Cargar entregables al abrir ──────────────
watch(
  () => props.show,
  async (visible) => {
    if (!visible) return
    confirmed.value = false
    selectedFiles.value = []
    fileErrors.value = []
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

// ─── Validación de archivos ───────────────────
const getExtension = (filename: string) =>
  filename.includes('.') ? filename.split('.').pop()!.toLowerCase() : ''

const validateFile = (file: File): string | null => {
  const ext = getExtension(file.name)
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `"${file.name}": tipo no permitido (.${ext || 'sin extensión'}). Solo PDF, Word o Excel.`
  }
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return `"${file.name}": el contenido no corresponde a un PDF, Word o Excel válido.`
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `"${file.name}": excede el límite de ${MAX_SIZE_MB}MB (pesa ${(file.size / 1024 / 1024).toFixed(1)}MB).`
  }
  return null
}

// ─── Manejo de archivos ───────────────────────
const processFiles = (files: File[]) => {
  fileErrors.value = []
  const errors: string[] = []
  const valid: File[] = []
  for (const file of files) {
    const err = validateFile(file)
    if (err) errors.push(err)
    else valid.push(file)
  }
  fileErrors.value = errors
  selectedFiles.value.push(...valid)
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  processFiles(Array.from(input.files ?? []))
  input.value = ''
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  processFiles(Array.from(event.dataTransfer?.files ?? []))
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

// ─── Helpers ─────────────────────────────────
const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const fileIcon = (name: string) => {
  const ext = getExtension(name)
  if (ext === 'pdf') return 'i-lucide-file-text'
  if (['doc', 'docx'].includes(ext)) return 'i-lucide-file-type'
  if (['xls', 'xlsx'].includes(ext)) return 'i-lucide-table'
  return 'i-lucide-file'
}

// RF12: se requiere al menos un entregable para completar
const hasDeliverables = computed(
  () => existingDeliverables.value.length > 0 || selectedFiles.value.length > 0
)

// ─── Completar tarea ─────────────────────────
const handleComplete = async () => {
  uploading.value = true
  fileErrors.value = []
  try {
    for (const file of selectedFiles.value) {
      await tasksService.uploadDeliverable(props.taskId, file)
    }
    await tasksService.updateTaskStatus(props.taskId, 'completed')
    emit('completed')
    emit('close')
  } catch (e: any) {
    const msg = e?.response?.data?.detail || 'Error al completar la tarea. Intenta de nuevo.'
    fileErrors.value = [msg]
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

            <!-- Zona de carga -->
            <div>
              <label class="block text-sm font-medium mb-2">Subir entregables</label>
              <div
                class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                @click="fileInput?.click()"
                @dragover.prevent
                @drop="handleDrop"
              >
                <UIcon name="i-lucide-upload-cloud" class="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p class="text-sm text-muted-foreground">Haz clic o arrastra archivos aquí</p>
                <p class="text-xs text-muted-foreground mt-1">
                  Solo <strong>PDF</strong>, <strong>Word</strong> (.doc .docx) y
                  <strong>Excel</strong> (.xls .xlsx) · Máx {{ MAX_SIZE_MB }}MB por archivo
                </p>
              </div>
              <input
                ref="fileInput"
                type="file"
                multiple
                :accept="FILE_ACCEPT"
                class="hidden"
                @change="handleFileSelect"
              />
            </div>

            <!-- Errores de validación -->
            <div
              v-if="fileErrors.length"
              class="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3 space-y-1"
            >
              <div class="flex items-center gap-2 mb-1">
                <UIcon name="i-lucide-alert-circle" class="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <p class="text-sm font-medium text-red-700 dark:text-red-300">
                  {{ fileErrors.length === 1 ? 'Archivo rechazado' : `${fileErrors.length} archivos rechazados` }}
                </p>
              </div>
              <ul class="space-y-0.5 pl-6">
                <li
                  v-for="(err, i) in fileErrors"
                  :key="i"
                  class="text-xs text-red-600 dark:text-red-400 list-disc"
                >
                  {{ err }}
                </li>
              </ul>
            </div>

            <!-- Archivos válidos por subir -->
            <div v-if="selectedFiles.length">
              <p class="text-sm font-medium mb-2">Por subir ({{ selectedFiles.length }})</p>
              <div class="space-y-2">
                <div
                  v-for="(file, idx) in selectedFiles"
                  :key="idx"
                  class="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <UIcon :name="fileIcon(file.name)" class="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span class="text-sm truncate">{{ file.name }}</span>
                    <span class="text-xs text-muted-foreground flex-shrink-0">{{ formatSize(file.size) }}</span>
                  </div>
                  <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" square @click="removeFile(idx)" />
                </div>
              </div>
            </div>

            <!-- Entregables ya subidos -->
            <div v-if="loadingDeliverables" class="text-sm text-muted-foreground">Cargando entregables...</div>
            <div v-else-if="existingDeliverables.length">
              <p class="text-sm font-medium mb-2">Entregables subidos ({{ existingDeliverables.length }})</p>
              <div class="space-y-2">
                <div
                  v-for="d in existingDeliverables"
                  :key="d.id"
                  class="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded-lg"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <UIcon :name="fileIcon(d.file_name)" class="w-4 h-4 text-green-500 flex-shrink-0" />
                    <a :href="d.file_url" target="_blank" class="text-sm text-primary hover:underline truncate">
                      {{ d.file_name }}
                    </a>
                    <span class="text-xs text-muted-foreground flex-shrink-0">{{ formatSize(d.file_size) }}</span>
                  </div>
                  <UButton icon="i-lucide-trash-2" size="xs" color="red" variant="ghost" square @click="deleteExisting(d)" />
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
              <input v-model="confirmed" type="checkbox" class="mt-0.5 w-4 h-4 accent-primary" />
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
