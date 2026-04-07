<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { employeeService } from '@/services/employees'
import type { Employee, UpdateEmployeeData } from '@/services/employees'

const authStore = useAuthStore()
const toast = useToast()

// ─── State ────────────────────────────────────────────────────────────────
const profile = ref<Employee | null>(null)
const loading = ref(false)
const saving = ref(false)
const uploadingResume = ref(false)
const deletingResume = ref(false)

const phone = ref('')
const address = ref('')
const pdfFileRef = ref<HTMLInputElement>()

// ─── Load ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  if (!authStore.isEmployee) return
  loading.value = true
  try {
    profile.value = await employeeService.getMyProfile()
    phone.value = profile.value.phone ?? ''
    address.value = profile.value.address ?? ''
  } catch (e) {
    console.error('Error cargando perfil:', e)
  } finally {
    loading.value = false
  }
})

// ─── Derived ──────────────────────────────────────────────────────────────
const initials = computed(() => {
  const src = profile.value?.name ?? authStore.user?.email ?? ''
  return src.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
})

const displayName = computed(() =>
  profile.value?.name ?? authStore.user?.email?.split('@')[0] ?? 'Usuario'
)

const roleLabel: Record<string, string> = {
  manager: 'Gerente',
  employee: 'Empleado',
  sponsor: 'Patrocinador',
}

const roleColor: Record<string, 'primary' | 'success' | 'warning' | 'neutral'> = {
  manager: 'primary',
  employee: 'success',
  sponsor: 'warning',
}

const isDirty = computed(() =>
  phone.value !== (profile.value?.phone ?? '') ||
  address.value !== (profile.value?.address ?? '')
)

// ─── Save contact info ────────────────────────────────────────────────────
async function saveProfile() {
  if (!profile.value) return
  saving.value = true
  try {
    const updates: UpdateEmployeeData = { phone: phone.value, address: address.value }
    profile.value = await employeeService.updateEmployee(profile.value.id, updates)
    toast.add({ title: 'Perfil actualizado', color: 'success', icon: 'i-lucide-check' })
  } catch {
    toast.add({ title: 'Error al guardar', color: 'error', icon: 'i-lucide-x' })
  } finally {
    saving.value = false
  }
}

// ─── Resume ───────────────────────────────────────────────────────────────
function triggerPdfUpload() {
  pdfFileRef.value?.click()
}

async function onPdfChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !profile.value) return

  if (file.type !== 'application/pdf') {
    toast.add({ title: 'Solo se permiten archivos PDF', color: 'error', icon: 'i-lucide-x' })
    input.value = ''
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    toast.add({ title: 'El archivo debe ser menor a 10MB', color: 'error', icon: 'i-lucide-x' })
    input.value = ''
    return
  }

  uploadingResume.value = true
  try {
    const res = await employeeService.uploadResume(profile.value.id, file)
    profile.value = res.employee
    toast.add({ title: 'Hoja de vida subida exitosamente', color: 'success', icon: 'i-lucide-check' })
  } catch {
    toast.add({ title: 'Error al subir la hoja de vida', color: 'error', icon: 'i-lucide-x' })
  } finally {
    uploadingResume.value = false
    input.value = ''
  }
}

async function deleteResume() {
  if (!profile.value) return
  deletingResume.value = true
  try {
    const res = await employeeService.deleteResume(profile.value.id)
    profile.value = res.employee
    toast.add({ title: 'Hoja de vida eliminada', color: 'neutral', icon: 'i-lucide-trash-2' })
  } catch {
    toast.add({ title: 'Error al eliminar la hoja de vida', color: 'error', icon: 'i-lucide-x' })
  } finally {
    deletingResume.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-5">

    <!-- Page title -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold">Mi Perfil</h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          {{ authStore.isEmployee ? 'Gestiona tu información y hoja de vida' : 'Tu información de cuenta' }}
        </p>
      </div>
    </div>

    <!-- Loading skeleton -->
    <template v-if="loading">
      <USkeleton class="h-28 rounded-xl" />
      <USkeleton class="h-40 rounded-xl" />
      <USkeleton class="h-36 rounded-xl" />
    </template>

    <template v-else>

      <!-- ── Identity card ─────────────────────────────────── -->
      <UCard class="p-5">
        <div class="flex items-center gap-5">
          <UAvatar :text="initials" size="3xl" />
          <div class="flex-1 min-w-0">
            <h2 class="text-lg font-bold truncate">{{ displayName }}</h2>
            <p class="text-sm text-muted-foreground">{{ authStore.user?.email }}</p>

            <div class="flex flex-wrap items-center gap-2 mt-2">
              <UBadge
                :label="roleLabel[authStore.userRole ?? ''] ?? authStore.userRole ?? ''"
                :color="roleColor[authStore.userRole ?? ''] ?? 'neutral'"
                variant="subtle"
              />
              <UBadge
                v-if="profile"
                :label="profile.status === 'active' ? 'Activo' : 'Inactivo'"
                :color="profile.status === 'active' ? 'success' : 'neutral'"
                variant="subtle"
                size="sm"
              />
            </div>

            <div v-if="profile" class="flex flex-wrap gap-x-5 gap-y-1 mt-3">
              <span v-if="profile.identification" class="flex items-center gap-1.5 text-xs text-muted-foreground">
                <UIcon name="i-lucide-credit-card" class="w-3.5 h-3.5" />
                CC {{ profile.identification }}
              </span>
              <span v-if="profile.position" class="flex items-center gap-1.5 text-xs text-muted-foreground">
                <UIcon name="i-lucide-briefcase" class="w-3.5 h-3.5" />
                {{ profile.position }}
              </span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- ── Contact info (employees only) ────────────────── -->
      <UCard v-if="authStore.isEmployee" class="p-5">
        <h3 class="text-sm font-semibold mb-4 flex items-center gap-2">
          <UIcon name="i-lucide-contact" class="w-4 h-4 text-muted-foreground" />
          Información de contacto
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Teléfono">
            <UInput
              v-model="phone"
              placeholder="Ej: 3001234567"
              icon="i-lucide-phone"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Dirección de residencia">
            <UInput
              v-model="address"
              placeholder="Ej: Calle 12 # 3-45, Armenia"
              icon="i-lucide-map-pin"
              class="w-full"
            />
          </UFormField>
        </div>
        <div class="flex justify-end mt-4">
          <UButton
            label="Guardar cambios"
            color="neutral"
            :loading="saving"
            :disabled="!isDirty"
            icon="i-lucide-save"
            @click="saveProfile"
          />
        </div>
      </UCard>

      <!-- ── CV / Hoja de vida (employees only) ──────────── -->
      <UCard v-if="authStore.isEmployee" class="p-5">
        <h3 class="text-sm font-semibold mb-4 flex items-center gap-2">
          <UIcon name="i-lucide-file-text" class="w-4 h-4 text-muted-foreground" />
          Hoja de vida
        </h3>

        <!-- Has resume -->
        <div
          v-if="profile?.resume_url"
          class="flex items-center justify-between gap-4 p-4 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-file-check" class="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p class="text-sm font-medium">Hoja de vida subida</p>
              <p class="text-xs text-muted-foreground">Archivo PDF · Visible para tu gerente</p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <UButton
              label="Ver"
              icon="i-lucide-external-link"
              size="sm"
              variant="outline"
              color="neutral"
              :to="profile.resume_url"
              target="_blank"
            />
            <UButton
              icon="i-lucide-trash-2"
              size="sm"
              variant="ghost"
              color="error"
              :loading="deletingResume"
              @click="deleteResume"
            />
          </div>
        </div>

        <!-- No resume — upload zone -->
        <button
          v-else
          type="button"
          class="w-full border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary hover:bg-muted/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
          :disabled="uploadingResume"
          @click="triggerPdfUpload"
        >
          <UIcon
            :name="uploadingResume ? 'i-lucide-loader-2' : 'i-lucide-upload-cloud'"
            class="w-10 h-10 mx-auto mb-3 text-muted-foreground"
            :class="{ 'animate-spin': uploadingResume }"
          />
          <p class="text-sm font-medium">
            {{ uploadingResume ? 'Subiendo…' : 'Sube tu hoja de vida' }}
          </p>
          <p class="text-xs text-muted-foreground mt-1">Haz clic para seleccionar · Solo PDF · Máx 10 MB</p>
        </button>

        <input ref="pdfFileRef" type="file" class="hidden" accept=".pdf" @change="onPdfChange" />
      </UCard>

      <!-- ── Manager / Sponsor: read-only note ─────────────── -->
      <UCard v-if="!authStore.isEmployee" class="p-5">
        <div class="flex items-start gap-3 text-sm text-muted-foreground">
          <UIcon name="i-lucide-info" class="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            Tu cuenta no tiene un perfil de empleado asociado.
            La información de cuenta como el correo y el rol es gestionada por el administrador del sistema.
          </p>
        </div>
      </UCard>

    </template>
  </div>
</template>
