import React from 'react'

// Единая палитра графиков: приглушённые «типографские» цвета,
// одинаково читаемые в светлой и тёмной теме.
export const CHART_COLORS = [
  '#a2532c', // глина
  '#586a3c', // мох
  '#3d5563', // сталь
  '#b0853f', // охра
  '#7c5b6e', // слива
  '#4f6f68', // глубокая бирюза
  '#8f4a3c', // кирпич
  '#6b6559', // тёплый серый
  '#8a8f5c', // олива
  '#5c6b7a', // графит
]

export const ACCENT = '#b46a3f'

export function colorAt(index) {
  return CHART_COLORS[index % CHART_COLORS.length]
}

// Пончиковая диаграмма с легендой-списком.
export function DonutChart({ items = [], size = 148, thickness = 16, centerValue, centerLabel }) {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  if (!total) {
    return <p className="py-4 text-center text-xs text-ink-faint dark:text-stone-500">Нет данных</p>
  }
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-4 sm:flex-row">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Диаграмма долей">
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={thickness}
              className="stroke-stone-100 dark:stroke-stone-800"
            />
            {items.map((item, index) => {
              const fraction = item.value / total
              const length = Math.max(fraction * circumference - 3, 0)
              const dash = `${length} ${circumference - length}`
              const element = (
                <circle
                  key={item.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={item.color || colorAt(index)}
                  strokeWidth={thickness}
                  strokeDasharray={dash}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                >
                  <title>{`${item.label}: ${item.value}`}</title>
                </circle>
              )
              offset += fraction * circumference
              return element
            })}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold tabular-nums text-ink dark:text-stone-50">{centerValue ?? total}</span>
          {centerLabel && (
            <span className="mt-0.5 max-w-[80%] text-center text-[10px] leading-tight text-ink-faint dark:text-stone-500">
              {centerLabel}
            </span>
          )}
        </div>
      </div>

      <ul className="w-full min-w-0 space-y-1.5">
        {items.map((item, index) => {
          const percent = Math.round((item.value / total) * 100)
          return (
            <li key={item.key} className="flex items-center gap-2 text-xs" title={`${item.label}: ${item.value}`}>
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color || colorAt(index) }}
              />
              <span className="min-w-0 flex-1 truncate text-ink-muted dark:text-stone-300">{item.label}</span>
              <span className="shrink-0 tabular-nums text-ink dark:text-stone-200">{item.value}</span>
              <span className="w-8 shrink-0 text-right tabular-nums text-ink-faint dark:text-stone-500">{percent}%</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// Кольцо прогресса с подписью в центре.
export function RingProgress({ value = 0, size = 96, stroke = 8, label, caption }) {
  const clamped = Math.min(100, Math.max(0, value))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dash = (clamped / 100) * circumference

  return (
    <div className="flex w-full min-w-0 flex-wrap items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Прогресс ${clamped}%`}>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={stroke}
              className="stroke-stone-200 dark:stroke-stone-800"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              stroke={ACCENT}
              strokeDasharray={`${dash} ${circumference - dash}`}
            />
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold tabular-nums text-ink dark:text-stone-50">
            {String(clamped).replace('.', ',')}%
          </span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        {label && <div className="text-sm font-medium leading-snug text-ink dark:text-stone-100">{label}</div>}
        {caption && <div className="mt-0.5 text-xs leading-snug text-ink-muted dark:text-stone-400">{caption}</div>}
      </div>
    </div>
  )
}

// Area-график с накоплением (SVG, без зависимостей).
export function AreaChart({ points = [], height = 132, labels = [] }) {
  const values = points.map((point) => point.value)
  const max = Math.max(1, ...values)
  const width = 100
  const step = values.length > 1 ? width / (values.length - 1) : 0
  const coords = values.map((value, index) => ({
    x: index * step,
    y: 100 - (value / max) * 92,
  }))

  const line = coords.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ')
  const area = coords.length
    ? `${line} L${coords[coords.length - 1].x},100 L${coords[0].x},100 Z`
    : ''

  return (
    <div>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ width: '100%', height }}
        role="img"
        aria-label="График накопительной нагрузки"
      >
        {[25, 50, 75].map((lineY) => (
          <line
            key={lineY}
            x1="0"
            y1={lineY}
            x2="100"
            y2={lineY}
            className="stroke-stone-200/80 dark:stroke-stone-800"
            strokeWidth="0.4"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {area && <path d={area} fill={ACCENT} fillOpacity="0.12" />}
        {line && (
          <path
            d={line}
            fill="none"
            stroke={ACCENT}
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {labels.length > 0 && (
        <div className="mt-1 flex justify-between gap-2 text-[10px] text-ink-faint dark:text-stone-500">
          {labels.map((label, index) => (
            <span key={`${label}-${index}`}>{label}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// Столбики по месяцам.
export function MonthBars({ items = [], labels = [] }) {
  const max = Math.max(1, ...items.map((item) => item.total))
  return (
    <div>
      <div className="flex h-28 items-end justify-center gap-1.5">
        {items.map((item, index) => {
          const height = item.total ? Math.max(6, Math.round((item.total / max) * 100)) : 2
          return (
            <div key={item.month ?? index} className="group flex h-full max-w-[56px] flex-1 flex-col items-center justify-end">
              <span className="mb-1 text-[10px] tabular-nums text-ink-faint opacity-0 transition-opacity group-hover:opacity-100 dark:text-stone-500">
                {item.total}
              </span>
              <div
                className={`w-full rounded-sm transition-colors ${
                  item.total ? 'bg-clay-500/80 group-hover:bg-clay-600' : 'bg-stone-100 dark:bg-stone-800'
                }`}
                style={{ height: `${height}%` }}
                title={`${labels[index] || ''}: ${item.total}`}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-1.5 flex justify-center gap-1.5 text-center text-[10px] text-ink-faint dark:text-stone-500">
        {items.map((item, index) => (
          <span key={item.month ?? index} className="min-w-0 max-w-[56px] flex-1 truncate">
            {labels[index]}
          </span>
        ))}
      </div>
    </div>
  )
}

// Теплокарта «день недели × время».
export function Heatmap({ heatmap, dayLabels = [], labels }) {
  const { times, cells, max } = heatmap
  if (!times.length) {
    return <p className="py-4 text-center text-xs text-ink-faint dark:text-stone-500">Нет данных</p>
  }
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <div className="mx-auto w-fit min-w-[260px]">
        <div className="mb-1 flex gap-1">
          <span className="w-11 shrink-0" />
          {dayLabels.map((day) => (
            <span key={day} className="w-7 shrink-0 text-center text-[10px] font-medium text-ink-faint dark:text-stone-500 sm:w-8">
              {day}
            </span>
          ))}
        </div>
        <div className="space-y-1">
          {times.map((time) => (
            <div key={time} className="flex items-center gap-1">
              <span className="w-11 shrink-0 text-right text-[10px] tabular-nums text-ink-faint dark:text-stone-500">
                {time}
              </span>
              {dayLabels.map((day, index) => {
                const value = cells.get(`${index + 1}|${time}`) || 0
                const alpha = value ? Math.min(0.12 + (value / Math.max(1, max)) * 0.78, 0.9) : 0
                return (
                  <span
                    key={`${time}-${day}`}
                    className={`h-7 w-7 shrink-0 rounded-[4px] sm:h-8 sm:w-8 ${value ? '' : 'bg-stone-100 dark:bg-stone-800/70'}`}
                    style={value ? { backgroundColor: `rgba(162, 83, 44, ${alpha})` } : undefined}
                    title={`${day}, ${time}: ${value}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-ink-faint dark:text-stone-500">
          <span>{labels?.less || 'меньше'}</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className={`h-2.5 w-2.5 rounded-sm ${level === 0 ? 'bg-stone-100 dark:bg-stone-800' : ''}`}
              style={level ? { backgroundColor: `rgba(162, 83, 44, ${0.12 + level * 0.18})` } : undefined}
            />
          ))}
          <span>{labels?.more || 'больше'}</span>
        </div>
      </div>
    </div>
  )
}

// Горизонтальные сравнительные полосы (для групп/аудиторий).
export function CompareBars({ items = [], valueLabel }) {
  const peak = Math.max(1, ...items.map((item) => item.value))
  return (
    <ul className="space-y-2">
      {items.map((item, index) => {
        const width = item.value ? Math.max(4, (item.value / peak) * 100) : 0
        return (
          <li key={item.key ?? item.label ?? index} className="text-xs">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate text-ink-muted dark:text-stone-300">{item.label}</span>
              <span className="shrink-0 tabular-nums text-ink-faint dark:text-stone-500">
                {item.value}
                {valueLabel ? ` ${valueLabel}` : ''}
              </span>
            </div>
            <span className="block h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${width}%`,
                  backgroundColor: item.color || ACCENT,
                }}
              />
            </span>
          </li>
        )
      })}
    </ul>
  )
}

// Мини-график динамики (спарклайн).
export function Sparkline({ values = [], width = 96, height = 28 }) {
  if (!values.length) return null
  const max = Math.max(1, ...values)
  const step = values.length > 1 ? 100 / (values.length - 1) : 0
  const line = values
    .map((value, index) => `${index === 0 ? 'M' : 'L'}${index * step},${100 - (value / max) * 92}`)
    .join(' ')
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width, height }} aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={ACCENT}
        strokeWidth="2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
