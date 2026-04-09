import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { authGuard, guestGuard, roleGuard } from './guards'

const routes: RouteRecordRaw[] = [
  // Rutas públicas
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/auth/index.vue'),
    beforeEnter: guestGuard,
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/pages/auth/index.vue'),
    beforeEnter: guestGuard,
    meta: { requiresAuth: false }
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/pages/auth/forgot-password.vue'),
    beforeEnter: guestGuard,
    meta: { requiresAuth: false }
  },
  {
    path: '/change-password',
    name: 'change-password',
    component: () => import('@/pages/auth/change-password.vue'),
    beforeEnter: authGuard,
    meta: { requiresAuth: true }
  },

  // Rutas protegidas - Dashboard principal (solo manager; otros roles se redirigen en index.vue)
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/pages/index.vue'),
    beforeEnter: authGuard,
    meta: { requiresAuth: true, allowedRoles: ['manager', 'employee', 'sponsor'] }
  },

  // Dashboard específico para empleados
  {
    path: '/empleado',
    name: 'empleado',
    component: () => import('@/pages/empleado.vue'),
    beforeEnter: [authGuard, roleGuard(['employee'])],
    meta: { requiresAuth: true, allowedRoles: ['employee'] }
  },

  // Dashboard de patrocinador/cliente
  {
    path: '/sponsor',
    name: 'sponsor',
    component: () => import('@/pages/sponsor.vue'),
    beforeEnter: [authGuard, roleGuard(['sponsor'])],
    meta: { requiresAuth: true, allowedRoles: ['sponsor'] }
  },

  // PMIS - Rutas específicas del sistema de gestión de proyectos
  {
    path: '/proyectos',
    name: 'proyectos',
    component: () => import('@/pages/proyectos.vue'),
    beforeEnter: [authGuard, roleGuard(['manager'])],
    meta: { requiresAuth: true, allowedRoles: ['manager'] }
  },
  {
    path: '/proyectos/:id',
    name: 'proyecto-dashboard',
    component: () => import('@/pages/proyecto-dashboard.vue'),
    beforeEnter: [authGuard, roleGuard(['manager'])],
    meta: { requiresAuth: true, allowedRoles: ['manager'] }
  },
  {
    path: '/tareas',
    name: 'tareas',
    component: () => import('@/pages/tareas.vue'),
    beforeEnter: [authGuard, roleGuard(['manager', 'employee'])],
    meta: { requiresAuth: true, allowedRoles: ['manager', 'employee'] }
  },
  {
    path: '/equipo',
    name: 'equipo',
    component: () => import('@/pages/equipo.vue'),
    beforeEnter: [authGuard, roleGuard(['manager', 'employee'])],
    meta: { requiresAuth: true, allowedRoles: ['manager', 'employee'] }
  },
  {
    path: '/finanzas',
    name: 'finanzas',
    component: () => import('@/pages/finanzas.vue'),
    beforeEnter: [authGuard, roleGuard(['manager'])],
    meta: { requiresAuth: true, allowedRoles: ['manager'] }
  },

  // Rutas protegidas - Settings
  {
    path: '/settings',
    component: () => import('@/pages/settings.vue'),
    beforeEnter: authGuard,
    meta: { requiresAuth: true, allowedRoles: ['manager', 'employee', 'sponsor'] },
    children: [
      {
        path: '',
        name: 'settings',
        component: () => import('@/pages/settings/index.vue'),
        meta: { allowedRoles: ['manager', 'employee', 'sponsor'] }
      },
      {
        path: 'notifications',
        name: 'settings-notifications',
        component: () => import('@/pages/settings/notifications.vue'),
        meta: { allowedRoles: ['manager', 'employee', 'sponsor'] }
      },
      {
        path: 'security',
        name: 'settings-security',
        component: () => import('@/pages/settings/security.vue'),
        meta: { allowedRoles: ['manager', 'employee', 'sponsor'] }
      }
    ]
  },

  // Rutas de error
  {
    path: '/unauthorized',
    name: 'unauthorized',
    component: () => import('@/pages/errors/unauthorized.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/404',
    name: 'not-found',
    component: () => import('@/pages/errors/404.vue'),
    meta: { requiresAuth: false }
  },

  // Catch all - 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router