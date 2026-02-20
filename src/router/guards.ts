import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export const authGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore()

  // Si ya está autenticado, continuar
  if (authStore.isAuthenticated) {
    return next()
  }

  // Verificar si hay token en localStorage
  const token = localStorage.getItem('auth_token')
  if (token) {
    try {
      // Intentar obtener datos del usuario
      await authStore.getCurrentUser()
      return next()
    } catch (error) {
      // Token inválido, limpiar y redirigir
      authStore.clearAuth()
    }
  }

  // No autenticado, redirigir al login
  return next('/login')
}

export const guestGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore()

  // Si ya está autenticado, redirigir al dashboard
  if (authStore.isAuthenticated) {
    return next('/')
  }

  return next()
}

export const roleGuard = (allowedRoles: Array<'manager' | 'employee' | 'sponsor'>) => {
  return async (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    const authStore = useAuthStore()

    // Verificar autenticación primero
    if (!authStore.isAuthenticated) {
      return next('/login')
    }

    // Verificar rol
    if (!authStore.userRole || !allowedRoles.includes(authStore.userRole)) {
      try {
        // Intentar validar el rol en el backend
        await authStore.validateRole(authStore.userRole!)

        if (!allowedRoles.includes(authStore.userRole!)) {
          return next('/unauthorized')
        }
      } catch (error) {
        return next('/unauthorized')
      }
    }

    return next()
  }
}