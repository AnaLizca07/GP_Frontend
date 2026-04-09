/**
 * Mantiene el backend de Render despierto enviando un ping cada 10 minutos.
 * Render (plan gratuito) duerme el servicio tras 15 min de inactividad,
 * causando un cold start de ~40s en la primera petición.
 */
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const PING_INTERVAL_MS = 10 * 60 * 1000 // 10 minutos

export function startKeepAlive(): void {
  // Solo en producción — en local no hace falta
  if (import.meta.env.DEV) return

  const ping = () =>
    fetch(`${BACKEND_URL}/`)
      .catch(() => { /* ignorar errores silenciosamente */ })

  ping() // ping inmediato al cargar la app
  setInterval(ping, PING_INTERVAL_MS)
}
