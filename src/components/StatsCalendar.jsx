import React, { useMemo } from 'react'
import { format, isSameDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import { DAY_LABELS } from '../constants.js'
import { getSemesterInfo, toDDMM } from '../utils/schedule.js'
import { capitalizeFirst, pairsLabel } from '../utils/statsFormat.js'

const HEAT = (alpha) => `rgba(162, 83, 44, ${alpha})`

// Пять ступеней интенсивности: 1 пара, 2, 3–4, 5 и больше
function heatLevel(count) {
  if (!count) return 0
  if (count >= 5) return 4
  if (count >= 3) return 3
  if (count === 2) return 2
  return 1
}

const LEVEL_ALPHA = [0, 0.12, 0.22, 0.32, 0.44]

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

export default function StatsCalendar({ stats, group, teacher, period, onOpenDate }) {
  const year = stats.seasonYear
  const semesterInfo = getSemesterInfo(stats.semester)
  const months = semesterInfo.months
  const activeMonth = typeof period === 'string' && period.startsWith('month-') ? Number(period.slice(6)) : null
  const now = new Date()

  const counts = useMemo(() => {
    const map = new Map()
    for (const lesson of stats.lessons) {
      if (group !== 'all' && !lesson.groups.includes(group)) continue
      if (teacher !== 'all' && lesson.teacher !== teacher) continue
      const key = toDDMM(lesson.date)
      map.set(key, (map.get(key) || 0) + 1)
    }
    return map
  }, [stats.lessons, group, teacher])

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-ink-muted dark:text-stone-400">
        Интенсивность — число пар в день. Нажми на день, чтобы открыть его в расписании.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {months.map((month) => {
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
              className={`rounded-xl border border-stone-200 bg-white p-3 transition-opacity dark:border-stone-800 dark:bg-stone-900 ${dimmed ? 'opacity-40' : ''}`}
            >
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                <h3 className="text-sm font-semibold capitalize text-ink dark:text-stone-100">
                  {format(monthDate, 'LLLL', { locale: ru })}
                </h3>
                <span className="text-[11px] text-ink-muted dark:text-stone-400">
                  {pairsLabel(monthPairs)} · {monthDays} дн.
                </span>
              </div>

              <div className="mb-1 grid grid-cols-7 gap-1 text-center">
                {DAY_LABELS.map((day) => (
                  <span key={day} className="py-0.5 text-[10px] font-medium text-ink-faint dark:text-stone-500">
                    {day}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {cells.map((cell, index) => {
                  if (!cell) return <span key={`empty-${index}`} />
                  const count = counts.get(toDDMM(cell)) || 0
                  const level = heatLevel(count)
                  const alpha = LEVEL_ALPHA[level]
                  const isToday = isSameDay(cell, now)
                  return (
                    <button
                      key={cell.toISOString()}
                      type="button"
                      disabled={!count}
                      onClick={() => onOpenDate(cell)}
                      title={`${capitalizeFirst(format(cell, 'd MMMM', { locale: ru }))} · ${pairsLabel(count)}`}
                      style={count ? { backgroundColor: HEAT(alpha) } : undefined}
                      className={`flex aspect-square items-center justify-center rounded-md text-[11px] tabular-nums transition-colors sm:text-xs ${
                        count
                          ? 'border border-transparent text-ink hover:ring-1 hover:ring-clay-500 dark:text-stone-100'
                          : 'cursor-default border border-transparent text-stone-300 dark:text-stone-700'
                      } ${isToday ? 'ring-1 ring-inset ring-clay-600 dark:ring-clay-400' : ''}`}
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

      <div className="flex items-center justify-center gap-2 text-[11px] text-ink-faint dark:text-stone-500">
        <span>меньше</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className={`h-3 w-3 rounded-sm ${level === 0 ? 'bg-stone-100 dark:bg-stone-800' : ''}`}
            style={level ? { backgroundColor: HEAT(LEVEL_ALPHA[level]) } : undefined}
          />
        ))}
        <span>больше</span>
      </div>
    </div>
  )
}
