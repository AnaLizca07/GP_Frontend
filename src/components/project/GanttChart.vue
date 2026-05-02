<script setup lang="ts">
import { computed, ref } from 'vue'

export interface GanttTask {
  id: number
  title: string
  start: string   // ISO date YYYY-MM-DD
  end: string
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'review' | string
  assignee?: string
}

const props = withDefaults(defineProps<{
  tasks: GanttTask[]
  projectStart?: string
  projectEnd?: string
}>(), {})

// ── Constantes de layout ────────────────────────────────────
const ROW_H    = 38
const LABEL_W  = 190
const BAR_H    = 22
const PADDING  = 6
const MONTH_H  = 24   // altura cabecera mes
const DAY_H    = 20   // altura fila de días
const HEADER_H = MONTH_H + DAY_H  // 44px total de cabeceras

// ── Colores y etiquetas de estado ──────────────────────────
const STATUS_COLOR: Record<string, string> = {
  completed:   '#34D399',
  in_progress: '#60A5FA',
  review:      '#FCD34D',
  pending:     '#94A3B8',
  blocked:     '#F87171',
}

const STATUS_LABEL: Record<string, string> = {
  completed:   'Completada',
  in_progress: 'En Progreso',
  review:      'En Revisión',
  pending:     'Pendiente',
  blocked:     'Bloqueada',
}

// ── Utilidades de fecha ─────────────────────────────────────
function parseDate(s: string): Date {
  return new Date(s + 'T00:00:00')
}

function formatDateLabel(s: string): string {
  return parseDate(s).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ── Rango temporal ──────────────────────────────────────────
const { rangeStart, rangeEnd, totalDays } = computed(() => {
  const allDates: Date[] = []
  if (props.projectStart) allDates.push(parseDate(props.projectStart))
  if (props.projectEnd)   allDates.push(parseDate(props.projectEnd))
  for (const t of props.tasks) {
    if (t.start) allDates.push(parseDate(t.start))
    if (t.end)   allDates.push(parseDate(t.end))
  }
  if (!allDates.length) {
    const now = new Date()
    return { rangeStart: now, rangeEnd: now, totalDays: 1 }
  }
  const min = new Date(Math.min(...allDates.map(d => d.getTime())))
  const max = new Date(Math.max(...allDates.map(d => d.getTime())))
  min.setDate(min.getDate() - 1)
  max.setDate(max.getDate() + 2)
  const totalDays = Math.max(1, Math.ceil((max.getTime() - min.getTime()) / 86400000))
  return { rangeStart: min, rangeEnd: max, totalDays }
}).value

// ── Escala horizontal ───────────────────────────────────────
const CHART_W = computed(() => Math.max(600, totalDays * 26))

const svgWidth  = computed(() => LABEL_W + CHART_W.value)
const svgHeight = computed(() => HEADER_H + PADDING * 2 + props.tasks.length * ROW_H + 30)

function dayX(d: Date): number {
  const diff = (d.getTime() - rangeStart.getTime()) / 86400000
  return LABEL_W + (diff / totalDays) * CHART_W.value
}

// ── Cabecera de meses ───────────────────────────────────────
const monthLabels = computed(() => {
  const labels: Array<{ x: number; label: string; width: number }> = []
  const cur = new Date(rangeStart)
  cur.setDate(1)
  while (cur <= rangeEnd) {
    const monthStart = new Date(Math.max(cur.getTime(), rangeStart.getTime()))
    const monthEnd   = new Date(cur.getFullYear(), cur.getMonth() + 1, 0)
    const x    = dayX(monthStart)
    const endX = dayX(new Date(Math.min(monthEnd.getTime(), rangeEnd.getTime())))
    labels.push({
      x,
      width: endX - x,
      label: cur.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
    })
    cur.setMonth(cur.getMonth() + 1)
    cur.setDate(1)
  }
  return labels
})

// ── Cabecera de días ────────────────────────────────────────
const dayLabels = computed(() => {
  const labels: Array<{ x: number; label: string; isMonday: boolean }> = []
  const pxPerDay = CHART_W.value / totalDays
  // Mostrar cada 1, 3 o 7 días según el zoom
  const step = pxPerDay >= 18 ? 1 : pxPerDay >= 10 ? 3 : 7

  const cur = new Date(rangeStart)
  let i = 0
  while (cur <= rangeEnd) {
    const isMonday = cur.getDay() === 1
    if (i % step === 0 || isMonday) {
      labels.push({
        x: dayX(cur) + pxPerDay / 2,
        label: cur.getDate().toString(),
        isMonday,
      })
    }
    cur.setDate(cur.getDate() + 1)
    i++
  }
  return labels
})

// ── Líneas de semana ────────────────────────────────────────
const weekLines = computed(() => {
  const lines: number[] = []
  const cur = new Date(rangeStart)
  const dow = cur.getDay()
  if (dow !== 1) cur.setDate(cur.getDate() + ((8 - dow) % 7))
  while (cur <= rangeEnd) {
    lines.push(dayX(cur))
    cur.setDate(cur.getDate() + 7)
  }
  return lines
})

// ── Props de barra ──────────────────────────────────────────
function barProps(task: GanttTask) {
  if (!task.start || !task.end) return null
  const s    = parseDate(task.start)
  const e    = parseDate(task.end)
  const x    = dayX(s)
  const endX = dayX(e) + (CHART_W.value / totalDays)  // incluye el último día
  const w    = Math.max(6, endX - x)
  return { x, width: w }
}

// ── Línea "Hoy" ─────────────────────────────────────────────
const today = new Date()
today.setHours(0, 0, 0, 0)
const todayX = computed(() => {
  if (today < rangeStart || today > rangeEnd) return -1
  return dayX(today)
})

// ── Tooltip flotante ────────────────────────────────────────
interface TooltipState {
  clientX: number
  clientY: number
  task: GanttTask
}
const tooltip = ref<TooltipState | null>(null)

function onBarMouseMove(event: MouseEvent, task: GanttTask) {
  tooltip.value = { clientX: event.clientX, clientY: event.clientY, task }
}
function onBarMouseLeave() {
  tooltip.value = null
}
</script>

<template>
  <div v-if="tasks.length === 0" class="text-center py-8 text-muted-foreground text-sm">
    No hay tareas para mostrar en el Gantt.
  </div>

  <div v-else class="overflow-x-auto rounded border dark:border-gray-700">
    <svg
      :width="svgWidth"
      :height="svgHeight"
      class="font-sans text-xs select-none"
      @mouseleave="onBarMouseLeave"
    >
      <!-- ── Fondo general ── -->
      <rect x="0" y="0" :width="svgWidth" :height="svgHeight" fill="white" />

      <!-- ── Cabecera meses ── -->
      <rect x="0" y="0" :width="svgWidth" :height="MONTH_H" fill="#003C68" />
      <!-- esquina izquierda cabecera meses -->
      <rect x="0" y="0" :width="LABEL_W" :height="MONTH_H" fill="#002b4d" />

      <g v-for="m in monthLabels" :key="m.x">
        <!-- separador vertical entre meses -->
        <line :x1="m.x" y1="0" :x2="m.x" :y2="MONTH_H" stroke="#ffffff30" stroke-width="1" />
        <text
          :x="m.x + m.width / 2"
          :y="MONTH_H - 7"
          text-anchor="middle"
          fill="white"
          font-size="10"
          font-weight="600"
        >{{ m.label }}</text>
      </g>

      <!-- ── Cabecera días ── -->
      <rect x="0" :y="MONTH_H" :width="svgWidth" :height="DAY_H" fill="#F1F5F9" />
      <rect x="0" :y="MONTH_H" :width="LABEL_W" :height="DAY_H" fill="#E2E8F0" />
      <!-- texto "Tarea" en la columna de etiquetas -->
      <text
        :x="LABEL_W / 2"
        :y="MONTH_H + DAY_H - 5"
        text-anchor="middle"
        fill="#64748B"
        font-size="9"
        font-weight="600"
        letter-spacing="0.5"
      >TAREA</text>

      <g v-for="dl in dayLabels" :key="dl.x">
        <text
          :x="dl.x"
          :y="MONTH_H + DAY_H - 5"
          text-anchor="middle"
          :fill="dl.isMonday ? '#60A5FA' : '#94A3B8'"
          :font-weight="dl.isMonday ? '700' : '400'"
          font-size="9"
        >{{ dl.label }}</text>
      </g>

      <!-- línea separadora cabecera / filas -->
      <line x1="0" :y1="HEADER_H" :x2="svgWidth" :y2="HEADER_H" stroke="#CBD5E1" stroke-width="1" />

      <!-- ── Líneas de semana ── -->
      <g v-for="wx in weekLines" :key="wx">
        <line
          :x1="wx" :y1="HEADER_H"
          :x2="wx" :y2="svgHeight"
          stroke="#E5E7EB"
          stroke-width="0.8"
        />
      </g>

      <!-- ── Línea "Hoy" ── -->
      <g v-if="todayX > 0">
        <line
          :x1="todayX" :y1="MONTH_H"
          :x2="todayX" :y2="svgHeight"
          stroke="#EF4444"
          stroke-width="1.5"
          stroke-dasharray="4 3"
        />
        <!-- píldora "Hoy" en cabecera días -->
        <rect
          :x="todayX - 12"
          :y="MONTH_H + 3"
          width="24"
          height="13"
          rx="6"
          fill="#EF4444"
        />
        <text
          :x="todayX"
          :y="MONTH_H + 13"
          text-anchor="middle"
          fill="white"
          font-size="8"
          font-weight="700"
        >HOY</text>
      </g>

      <!-- ── Filas de tareas ── -->
      <g v-for="(task, i) in tasks" :key="task.id">
        <!-- Fondo alternado -->
        <rect
          x="0"
          :y="HEADER_H + PADDING + i * ROW_H"
          :width="svgWidth"
          :height="ROW_H"
          :fill="i % 2 === 0 ? '#F9FAFB' : '#FFFFFF'"
        />

        <!-- Separador columna etiquetas -->
        <line
          :x1="LABEL_W" :y1="HEADER_H + PADDING + i * ROW_H"
          :x2="LABEL_W" :y2="HEADER_H + PADDING + (i + 1) * ROW_H"
          stroke="#E5E7EB"
          stroke-width="1"
        />

        <!-- Separador fila inferior -->
        <line
          x1="0" :y1="HEADER_H + PADDING + (i + 1) * ROW_H"
          :x2="svgWidth" :y2="HEADER_H + PADDING + (i + 1) * ROW_H"
          stroke="#F1F5F9"
          stroke-width="1"
        />

        <!-- Etiqueta de tarea -->
        <text
          :x="10"
          :y="HEADER_H + PADDING + i * ROW_H + ROW_H / 2 + 4"
          fill="#374151"
          font-size="11"
        >
          {{ task.title.length > 24 ? task.title.slice(0, 23) + '…' : task.title }}
        </text>

        <!-- Barra + tooltip trigger -->
        <g
          v-if="barProps(task)"
          style="cursor: pointer"
          @mousemove="onBarMouseMove($event, task)"
          @mouseleave="onBarMouseLeave"
        >
          <!-- Sombra sutil -->
          <rect
            :x="barProps(task)!.x + 1"
            :y="HEADER_H + PADDING + i * ROW_H + (ROW_H - BAR_H) / 2 + 2"
            :width="barProps(task)!.width"
            :height="BAR_H"
            :fill="STATUS_COLOR[task.status] || '#94A3B8'"
            rx="4" ry="4"
            opacity="0.15"
          />
          <!-- Barra principal -->
          <rect
            :x="barProps(task)!.x"
            :y="HEADER_H + PADDING + i * ROW_H + (ROW_H - BAR_H) / 2"
            :width="barProps(task)!.width"
            :height="BAR_H"
            :fill="STATUS_COLOR[task.status] || '#94A3B8'"
            rx="4" ry="4"
            opacity="0.92"
          />
          <!-- Brillo superior -->
          <rect
            :x="barProps(task)!.x + 2"
            :y="HEADER_H + PADDING + i * ROW_H + (ROW_H - BAR_H) / 2 + 2"
            :width="Math.max(0, barProps(task)!.width - 4)"
            height="4"
            rx="2"
            fill="white"
            opacity="0.2"
          />
          <!-- Nombre del asignado dentro de la barra -->
          <text
            v-if="task.assignee && barProps(task)!.width > 55"
            :x="barProps(task)!.x + 9"
            :y="HEADER_H + PADDING + i * ROW_H + ROW_H / 2 + 4"
            fill="white"
            font-size="9"
            font-weight="500"
          >
            {{ task.assignee.split(' ')[0] }}
          </text>
        </g>
      </g>

      <!-- ── Leyenda ── -->
      <g :transform="`translate(${LABEL_W + 4}, ${HEADER_H + PADDING + tasks.length * ROW_H + 9})`">
        <g
          v-for="(entry, idx) in [
            { key: 'completed',   label: 'Completada' },
            { key: 'in_progress', label: 'En Progreso' },
            { key: 'review',      label: 'En Revisión' },
            { key: 'pending',     label: 'Pendiente' },
            { key: 'blocked',     label: 'Bloqueada' },
          ]"
          :key="entry.key"
          :transform="`translate(${idx * 112}, 0)`"
        >
          <rect x="0" y="0" width="10" height="10" :fill="STATUS_COLOR[entry.key]" rx="2" />
          <text x="14" y="9" font-size="9" fill="#6B7280">{{ entry.label }}</text>
        </g>
      </g>
    </svg>
  </div>

  <!-- ── Tooltip flotante (fuera del SVG, posición fixed) ── -->
  <Teleport to="body">
    <div
      v-if="tooltip"
      class="fixed z-[9999] pointer-events-none"
      :style="{ left: `${tooltip.clientX + 14}px`, top: `${tooltip.clientY - 8}px` }"
    >
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl px-3.5 py-2.5 text-xs min-w-[180px]">
        <!-- Título -->
        <p class="font-semibold text-gray-900 dark:text-gray-100 mb-2 leading-tight">
          {{ tooltip.task.title }}
        </p>

        <!-- Estado -->
        <div class="flex items-center gap-1.5 mb-1.5">
          <span
            class="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
            :style="{ background: STATUS_COLOR[tooltip.task.status] || '#94A3B8' }"
          />
          <span class="text-gray-600 dark:text-gray-400">
            {{ STATUS_LABEL[tooltip.task.status] || tooltip.task.status }}
          </span>
        </div>

        <!-- Fechas -->
        <div class="flex items-start gap-1.5 text-gray-500 dark:text-gray-400 mb-1">
          <span class="mt-px">📅</span>
          <span>
            {{ formatDateLabel(tooltip.task.start) }}<br/>
            <span class="text-gray-400">→ {{ formatDateLabel(tooltip.task.end) }}</span>
          </span>
        </div>

        <!-- Asignado -->
        <div v-if="tooltip.task.assignee" class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
          <span>👤</span>
          <span>{{ tooltip.task.assignee }}</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>
