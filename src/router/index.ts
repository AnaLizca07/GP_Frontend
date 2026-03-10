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

  // Rutas protegidas - Dashboard principal
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/pages/index.vue'),
    beforeEnter: authGuard,
    meta: { requiresAuth: true, allowedRoles: ['manager', 'employee', 'sponsor'] }
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
    path: '/tareas',
    name: 'tareas',
    component: () => import('@/pages/tareas.vue'),
    beforeEnter: authGuard,
    meta: { requiresAuth: true, allowedRoles: ['manager', 'employee'] }
  },
  {
    path: '/equipo',
    name: 'equipo',
    component: () => import('@/pages/equipo.vue'),
    beforeEnter: [authGuard, roleGuard(['manager'])],
    meta: { requiresAuth: true, allowedRoles: ['manager'] }
  },
  {
    path: '/finanzas',
    name: 'finanzas',
    component: () => import('@/pages/finanzas.vue'),
    beforeEnter: [authGuard, roleGuard(['manager'])],
    meta: { requiresAuth: true, allowedRoles: ['manager'] }
  },

  // Rutas protegidas - Inbox (todos los roles)
  {
    path: '/inbox',
    name: 'inbox',
    component: () => import('@/pages/inbox.vue'),
    beforeEnter: authGuard,
    meta: { requiresAuth: true, allowedRoles: ['manager', 'employee', 'sponsor'] }
  },

  // Rutas protegidas - Customers (manager y employee)
  {
    path: '/customers',
    name: 'customers',
    component: () => import('@/pages/customers.vue'),
    beforeEnter: [authGuard, roleGuard(['manager', 'employee'])],
    meta: { requiresAuth: true, allowedRoles: ['manager', 'employee'] }
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
        path: 'members',
        name: 'settings-members',
        component: () => import('@/pages/settings/members.vue'),
        beforeEnter: roleGuard(['manager']),
        meta: { allowedRoles: ['manager'] }
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