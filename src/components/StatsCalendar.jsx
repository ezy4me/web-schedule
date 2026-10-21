import React, { useMemo } from 'react'
import { format, isSameDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import { DAY_LABELS } from '../constants.js'
import { toDDMM } from '../utils/schedule.js'
import { capitalizeFirst, pairsLabel } from '../utils/statsFormat.js'

const MONTHS = [8, 9, 10, 11]

function buildCells(year, month) {
  const cells = []
  const first = new Date(year, month, 1)
  const lead = (first.getDay() + 6) % 7
  for (let i = 0; i < lead; i++) cells.push(null)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function StatsCalendar({ stats, group, period, onOpenDate }) {
  const year = stats.seasonYear
  const activeMonth = typeof period === 'string' && period.startsWith('month-') ? Number(period.slice(6)) : null
  const now = new Date()

  const counts = useMemo(() => {
    const map = new Map()
    for (const lesson of stats.lessons) {
      if (group !== 'all' && !lesson.groups.includes(group)) continue
      const key = toDDMM(lesson.date)
      map.set(key, (map.get(key) || 0) + 1)
    }
    return map
  }, [stats.lessons, group])

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Интенсивность — число пар в день. Нажми на день, чтобы открыть его в расписании.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {MONTHS.map((month) => {
          const cells = buildCells(year, month)
          const monthDate = new Date(year, month, 1)
          let monthPairs = 0
          let monthDays = 0
          for (const cell of cells) {
            if (!cell) continue
            const count = counts.get(toDDMM(cell)) || 0
            if (count) {
              monthPairs += count
              monthDays++
            }
          }
          const dimmed = activeMonth !== null && activeMonth !== month
          return (
            <section
              key={month}
              className={`rounded-xl border border-zinc-200 bg-white p-3 transition-opacity dark:border-zinc-800 dark:bg-zinc-900 ${dimmed ? 'opacity-40' : ''}`}
            >
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold capitalize text-zinc-900 dark:text-zinc-100">
                  {format(monthDate, 'LLLL', { locale: ru })}
                </h3>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {pairsLabel(monthPairs)} · {monthDays} дн.
                </span>
              </div>

              <div className="mb-1 grid grid-cols-7 gap-1 text-center">
                {DAY_LABELS.map((day) => (
                  <span key={day} className="py-0.5 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                    {day}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {cells.map((cell, index) => {
                  if (!cell) return <span key={`empty-${index}`} />
                  const count = counts.get(toDDMM(cell)) || 0
                  const strong = count > 0 && 0.12 + count * 0.16 > 0.55
                  const isToday = isSameDay(cell, now)
                  return (
                    <button
                      key={cell.toISOString()}
                      type="button"
                      disabled={!count}
                      onClick={() => onOpenDate(cell)}
                      title={`${capitalizeFirst(format(cell, 'd MMMM', { locale: ru }))} · ${pairsLabel(count)}`}
                      style={count ? { backgroundColor: `rgba(99, 102, 241, ${Math.min(0.12 + count * 0.16, 0.85)})` } : undefined}
                      className={`flex aspect-square items-center justify-center rounded-md text-[11px] tabular-nums transition-colors ${
                        count
                          ? `border border-transparent hover:ring-1 hover:ring-indigo-500 ${strong ? 'font-medium text-white' : 'text-zinc-800 dark:text-zinc-100'}`
                          : 'cursor-default border border-transparent text-zinc-300 dark:text-zinc-700'
                      } ${isToday ? 'ring-1 ring-inset ring-indigo-500' : ''}`}
                    >
                      {cell.getDate()}
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
        <span>меньше</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className={`h-3 w-3 rounded-sm ${level === 0 ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}
            style={level ? { backgroundColor: `rgba(99, 102, 241, ${Math.min(0.12 + level * 0.16, 0.85)})` } : undefined}
          />
        ))}
        <span>больше</span>
      </div>
    </div>
  )
}
