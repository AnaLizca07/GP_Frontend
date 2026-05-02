import { ref } from 'vue'

/**
 * Shows a slow-server warning after `delayMs` of continuous loading.
 * Designed for Render free plan cold starts (~40s).
 */
export function useSlowLoad(delayMs = 8000) {
  const slowLoad = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  const startTimer = () => {
    slowLoad.value = false
    timer = setTimeout(() => { slowLoad.value = true }, delayMs)
  }

  const clearTimer = () => {
    if (timer) { clearTimeout(timer); timer = null }
    slowLoad.value = false
  }

  return { slowLoad, startTimer, clearTimer }
}
