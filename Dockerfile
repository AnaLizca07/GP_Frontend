# ============================================================
# Etapa 1 – builder
# Instala dependencias y compila la SPA con Vite.
# Las variables VITE_* se reciben como build args y quedan
# embebidas en el bundle (comportamiento estándar de Vite).
# ============================================================
FROM node:20-alpine AS builder

# Build args que se convierten en variables de entorno de Vite
ARG VITE_API_BASE_URL=http://localhost:8000
ARG VITE_APP_NAME=PMIS Dashboard
ARG VITE_APP_VERSION=1.0.0
ARG VITE_DEV_TOOLS=false

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_APP_VERSION=$VITE_APP_VERSION \
    VITE_DEV_TOOLS=$VITE_DEV_TOOLS

WORKDIR /app

# Instalar pnpm de forma global
RUN npm install -g pnpm@10.28.2

# Copiar manifiestos primero para aprovechar la caché de capas
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias (frozen lockfile para reproducibilidad)
RUN pnpm install --frozen-lockfile

# Copiar el resto del código fuente
COPY . .

# Compilar la SPA
RUN pnpm build


# ============================================================
# Etapa 2 – runtime
# Imagen nginx mínima que sirve la SPA estática.
# No contiene Node.js ni código fuente.
# ============================================================
FROM nginx:1.27-alpine AS runtime

# Copiar la SPA compilada desde la etapa builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de nginx (SPA fallback + caché)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Puerto HTTP estándar
EXPOSE 80

# nginx se ejecuta en foreground por defecto en la imagen oficial
CMD ["nginx", "-g", "daemon off;"]
