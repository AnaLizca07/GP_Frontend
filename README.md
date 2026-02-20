# PMIS Dashboard

Un dashboard moderno construido con Vue 3, TypeScript y Tailwind CSS para la gestión de proyectos y métricas.

## 🚀 Instalación

### Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior) - [Descargar aquí](https://nodejs.org/)
- **pnpm** (gestor de paquetes recomendado)

```bash
# Instalar pnpm globalmente
npm install -g pnpm
```

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd dashboard-vue
   ```

2. **Instalar dependencias**
   ```bash
   pnpm install
   ```

3. **Configurar variables de entorno**
   ```bash
   # Copiar el archivo de configuración de ejemplo
   cp .env.example .env
   ```

   Edita el archivo `.env` con tus configuraciones:
   ```env
   # API Configuration
   VITE_API_BASE_URL=http://localhost:8000

   # Application Configuration
   VITE_APP_NAME=PMIS Dashboard
   VITE_APP_VERSION=1.0.0

   # Development Configuration
   VITE_DEV_TOOLS=true
   ```

4. **Verificar la configuración (opcional)**
   ```bash
   # Verificar tipos TypeScript
   pnpm typecheck

   # Ejecutar linter
   pnpm lint
   ```

5. **Ejecutar en modo desarrollo**
   ```bash
   pnpm dev
   ```

   El proyecto estará disponible en: `http://localhost:5173`

## Scripts Disponibles

- `pnpm dev` - Inicia el servidor de desarrollo
- `pnpm build` - Construye la aplicación para producción
- `pnpm preview` - Previsualiza la build de producción
- `pnpm lint` - Ejecuta el linter para verificar el código
- `pnpm typecheck` - Verifica los tipos TypeScript

## Tecnologías Utilizadas

- **Vue 3** - Framework progresivo de JavaScript
- **TypeScript** - Superconjunto tipado de JavaScript
- **Vite** - Herramienta de build rápida
- **Tailwind CSS** - Framework de CSS utilitario
- **Pinia** - Store para manejo de estado
- **Vue Router** - Enrutador oficial de Vue
- **Nuxt UI** - Componentes de interfaz
- **Axios** - Cliente HTTP
- **Zod** - Validación de esquemas


Los archivos de producción se generarán en la carpeta `dist/`.

## Backend API

Este proyecto requiere un backend API ejecutándose. Asegúrate de:

1. Tener tu API backend ejecutándose
2. Configurar la URL correcta en `VITE_API_BASE_URL` en tu archivo `.env`
3. Verificar que la API esté accesible desde tu aplicación frontend

## Solución de Problemas

### Error: "pnpm not found"
```bash
npm install -g pnpm
```

### Error de permisos en Node.js
- En macOS/Linux: Usar `sudo` si es necesario
- En Windows: Ejecutar como administrador

### Puerto 5173 ocupado
Vite automáticamente usará el siguiente puerto disponible (5174, 5175, etc.)

