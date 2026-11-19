import React from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { TYPE_STYLES } from '../constants.js'

export function StatsCard({ title, subtitle, children, className = '' }) {
  return (
    <section className={`min-w-0 rounded-xl border border-stone-200 bg-white p-3.5 dark:border-stone-800 dark:bg-stone-900 sm:p-4 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
          <h3 className="text-sm font-semibold text-ink dark:text-stone-100">{title}</h3>
          {subtitle && <span className="text-xs text-ink-faint dark:text-stone-500">{subtitle}</span>}
        </div>
      )}
      {children}
    </section>
  )
}

export function BarList({ items }) {
  const peak = Math.max(1, ...items.map((i) => i.value))
  return (
    <ul className="space-y-1.5">
      {items.map((item) => {
        const width = item.value ? Math.max(2, (item.value / peak) * 100) : 0
        return (
          <li key={item.key} className="flex items-center gap-2.5 text-xs" title={item.title}>
            <span className="w-11 shrink-0 truncate text-ink-muted dark:text-stone-400">{item.label}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
              <span className="block h-full rounded-full bg-clay-600/80 dark:bg-clay-400/80" style={{ width: `${width}%` }} />
            </span>
            <span className="w-7 shrink-0 text-right tabular-nums text-ink-muted dark:text-stone-400">
              {item.value}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export function WeeklyBars({ weeks }) {
  const peak = Math.max(1, ...weeks.map((w) => w.total))
  return (
    <div>
      <div className="flex h-28 items-end gap-[3px]">
        {weeks.map((week) => {
          const height = week.total ? Math.max(4, Math.round((week.total / peak) * 100)) : 2
          return (
            <div
              key={week.week}
              className="flex h-full flex-1 items-end"
              title={`${format(week.monday, 'd MMM', { locale: ru })} — ${week.total}`}
            >
              <div
                className={`w-full rounded-sm ${
                  week.total === 0
                    ? 'bg-stone-100 dark:bg-stone-800'
                    : week.isCurrent
                      ? 'bg-clay-600 dark:bg-clay-400'
                      : 'bg-clay-600/35 dark:bg-clay-400/35'
                }`}
                style={{ height: `${height}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-ink-faint dark:text-stone-500">
        <span>{weeks.length ? format(weeks[0].monday, 'd MMM', { locale: ru }) : ''}</span>
        <span>{weeks.length ? format(weeks[weeks.length - 1].monday, 'd MMM', { locale: ru }) : ''}</span>
      </div>
    </div>
  )
}

export function TypeSplit({ rows }) {
  const total = rows.reduce((sum, row) => sum + row.total, 0)
  if (!total) return null
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
        {rows.map((row) => (
          <span
            key={row.key}
            className={TYPE_STYLES[row.key]?.dot || 'bg-stone-400'}
            style={{ width: `${(row.total / total) * 100}%` }}
            title={`${TYPE_STYLES[row.key]?.label || row.name}: ${row.total}`}
          />
        ))}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center gap-1.5 text-ink-muted dark:text-stone-400">
            <span className={`h-1.5 w-1.5 rounded-full ${TYPE_STYLES[row.key]?.dot || 'bg-stone-400'}`} />
            <span>{TYPE_STYLES[row.key]?.label || row.name}</span>
            <span className="tabular-nums text-ink-faint dark:text-stone-500">{row.total}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
