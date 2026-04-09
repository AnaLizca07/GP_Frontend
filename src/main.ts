import './assets/css/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ui from '@nuxt/ui/vue-plugin'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { startKeepAlive } from './services/keepAlive'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ui)

// Inicializar autenticación
const authStore = useAuthStore()
authStore.initializeAuth()

// Mantener el backend de Render despierto (evita cold starts)
startKeepAlive()

app.mount('#app')
