import React, { useMemo, useState } from 'react'
import { format, startOfMonth, startOfWeek, addDays, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getSeasonDates, getSemesterInfo, getWeekType } from '../utils/schedule.js'

const WEEKDAY = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

// Всплывающий календарь-месяц: на телефоне — по центру экрана, на десктопе — под кнопкой
export default function CalendarPicker({ selected, semester = 'autumn', onSelect, onClose, emptyDays }) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(selected))
  const seasonDates = useMemo(
    () => getSeasonDates(selected.getFullYear(), semester),
    [selected.getFullYear(), semester]
  )
  const seasonSet = useMemo(
    () => new Set(seasonDates.map((d) => d.toISOString())),
    [seasonDates]
  )

  const cells = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 })
    return Array.from({ length: 42 }, (_, i) => addDays(start, i))
  }, [viewMonth])

  const semesterInfo = getSemesterInfo(semester)
  const canPrev = viewMonth > startOfMonth(new Date(selected.getFullYear(), semesterInfo.startMonth, 1))
  const canNext = viewMonth < startOfMonth(new Date(selected.getFullYear(), semesterInfo.endMonth, 1))

  return (
    <div className="fixed left-1/2 top-1/2 z-30 w-[min(21rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-stone-200 bg-white p-4 shadow-pop sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-1.5 sm:w-[300px] sm:translate-x-0 sm:translate-y-0 dark:border-stone-700 dark:bg-stone-900">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          onClick={() => canPrev && setViewMonth(subMonths(viewMonth, 1))}
          disabled={!canPrev}
          className="grid h-8 w-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-stone-100 hover:text-ink disabled:opacity-30 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-sm font-medium capitalize text-ink dark:text-stone-100">
          {format(viewMonth, 'LLLL yyyy', { locale: ru })}
        </div>
        <button
          onClick={() => canNext && setViewMonth(addMonths(viewMonth, 1))}
          disabled={!canNext}
          className="grid h-8 w-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-stone-100 hover:text-ink disabled:opacity-30 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          aria-label="Следующий месяц"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center">
        {WEEKDAY.map((w) => (
          <div key={w} className="py-1 text-[10px] font-medium text-ink-faint dark:text-stone-500">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const inRange = seasonSet.has(cell.toISOString())
          const active = isSameDay(cell, selected)
          const isWeekend = inRange && !active && emptyDays?.has(cell.toISOString())
          const today = isSameDay(cell, new Date())
          const sameMonth = isSameMonth(cell, viewMonth)
          const type = inRange ? getWeekType(cell, undefined, semester) : null
          const dotColor =
            type === 'odd'
              ? 'bg-ink dark:bg-stone-200'
              : type === 'even'
                ? 'bg-stone-400 dark:bg-stone-500'
                : type === 'single'
                  ? 'bg-clay-600 dark:bg-clay-400'
                  : ''
          return (
            <button
              key={cell.toISOString()}
              disabled={!inRange}
              onClick={() => {
                onSelect(cell)
                onClose()
              }}
              aria-label={format(cell, 'd MMMM yyyy', { locale: ru })}
              aria-pressed={active}
              className={`relative flex h-10 items-center justify-center rounded-md text-sm tabular-nums transition-colors sm:h-9
                ${!inRange
                  ? 'cursor-not-allowed text-stone-300 dark:text-stone-700'
                  : active
                    ? 'bg-ink font-medium text-paper dark:bg-stone-100 dark:text-ink'
                    : isWeekend
                      ? 'text-ink-faint hover:bg-stone-100 dark:text-stone-500 dark:hover:bg-stone-800'
                      : sameMonth
                        ? 'text-ink-soft hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800'
                        : 'text-ink-faint hover:bg-stone-100 dark:text-stone-500 dark:hover:bg-stone-800'}
                ${today && !active ? 'ring-1 ring-inset ring-clay-400 dark:ring-clay-500' : ''}`}
            >
              {format(cell, 'd')}
              {inRange && dotColor && (
                <span
                  className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                    active ? 'bg-paper dark:bg-ink' : dotColor
                  }`}
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted dark:text-stone-400">
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-ink dark:bg-stone-200" />Нечётная</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-stone-400" />Чётная</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-clay-600 dark:bg-clay-400" />Особый день</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm border border-dashed border-stone-400" />Нет пар</span>
      </div>
    </div>
  )
}
