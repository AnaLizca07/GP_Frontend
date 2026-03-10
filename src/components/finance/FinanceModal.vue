<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click.self="$emit('close')"
  >
    <div class="bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl">
      <!-- Modal Header -->
      <div :class="[
        'px-6 py-4 border-b border-slate-700',
        type === 'income' ? 'bg-gradient-to-r from-emerald-900/20 to-green-900/20' :
        type === 'expense' ? 'bg-gradient-to-r from-red-900/20 to-orange-900/20' :
        'bg-gradient-to-r from-blue-900/20 to-indigo-900/20'
      ]">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div :class="[
              'p-2 rounded-lg',
              type === 'income' ? 'bg-emerald-600' :
              type === 'expense' ? 'bg-red-600' :
              'bg-blue-600'
            ]">
              <UIcon :name="icon" class="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 class="text-xl font-semibold text-white">{{ title }}</h2>
              <p class="text-sm text-slate-300">{{ subtitle }}</p>
            </div>
          </div>
          <button
            @click="$emit('close')"
            :disabled="submitting"
            class="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <UIcon name="i-lucide-x" class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Modal Body -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
        <form @submit.prevent="$emit('submit')" class="space-y-6">
          <slot name="form-fields"></slot>
        </form>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-4 border-t border-slate-700 bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div class="text-sm text-slate-400">
            <slot name="footer-info">
              Complete los campos obligatorios
            </slot>
          </div>
          <div class="flex gap-3">
            <button
              type="button"
              @click="$emit('close')"
              :disabled="submitting"
              class="px-4 py-2 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              @click="$emit('submit')"
              :disabled="submitting || !isFormValid"
              :class="[
                'px-6 py-2 disabled:bg-slate-700 disabled:text-slate-400 text-white font-medium rounded-lg transition-colors focus:outline-none flex items-center gap-2',
                type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500' :
                type === 'expense' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' :
                'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
                'focus:ring-2'
              ]"
            >
              <UIcon v-if="submitting" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
              <UIcon v-else name="i-lucide-save" class="w-4 h-4" />
              {{ submitting ? submitLoadingText : submitText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean
  type: 'income' | 'expense' | 'payroll'
  title: string
  subtitle: string
  icon: string
  submitting?: boolean
  isFormValid?: boolean
  submitText?: string
  submitLoadingText?: string
}

withDefaults(defineProps<Props>(), {
  submitting: false,
  isFormValid: true,
  submitText: 'Guardar',
  submitLoadingText: 'Guardando...'
})

defineEmits<{
  close: []
  submit: []
}>()
</script>