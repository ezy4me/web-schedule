import React, { useMemo, useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, addDays, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getSeasonDates, getWeekType, toDDMM } from '../utils/schedule.js'

const WEEKDAY = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

// Всплывающий календарь-месяц
export default function CalendarPicker({ selected, onSelect, onClose, emptyDays }) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(selected))
  const seasonDates = useMemo(() => getSeasonDates(selected.getFullYear()), [selected])
  const seasonSet = useMemo(
    () => new Set(seasonDates.map((d) => d.toISOString())),
    [seasonDates]
  )

  const cells = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 })
    return Array.from({ length: 42 }, (_, i) => addDays(start, i))
  }, [viewMonth])

  const canPrev = viewMonth > startOfMonth(new Date(selected.getFullYear(), 8, 1)) // сентябрь
  const canNext = viewMonth < startOfMonth(new Date(selected.getFullYear(), 11, 1)) // декабрь

  return (
    <div className="absolute right-0 z-20 mt-1.5 w-[300px] max-w-[calc(100vw-2rem)] rounded-lg border border-zinc-200 bg-white p-4 shadow-pop dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => canPrev && setViewMonth(subMonths(viewMonth, 1))}
          disabled={!canPrev}
          className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="font-medium capitalize text-zinc-800 dark:text-zinc-100">{format(viewMonth, 'LLLL yyyy', { locale: ru })}</div>
        <button
          onClick={() => canNext && setViewMonth(addMonths(viewMonth, 1))}
          disabled={!canNext}
          className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center">
        {WEEKDAY.map((w) => (
          <div key={w} className="py-1 text-[10px] font-medium text-zinc-400">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const inRange = seasonSet.has(cell.toISOString())
          const active = isSameDay(cell, selected)
          const isWeekend = inRange && !active && emptyDays?.has(cell.toISOString())
          const today = isSameDay(cell, new Date())
          const sameMonth = isSameMonth(cell, viewMonth)
          const type = inRange ? getWeekType(cell) : null
          const dotColor = type === 'odd' ? 'bg-indigo-500' : type === 'even' ? 'bg-sky-500' : type === 'single' ? 'bg-rose-500' : ''
          return (
            <button
              key={cell.toISOString()}
              disabled={!inRange}
              onClick={() => {
                onSelect(cell)
                onClose()
              }}
              className={`relative flex h-9 items-center justify-center rounded-md text-sm transition-colors
                ${!inRange
                  ? 'cursor-not-allowed text-zinc-200 dark:text-zinc-700'
                  : isWeekend
                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400/90 dark:hover:bg-amber-500/20'
                    : sameMonth
                      ? 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800'
                      : 'text-zinc-300 hover:bg-zinc-100 dark:text-zinc-600 dark:hover:bg-zinc-800'}
                ${active ? 'bg-zinc-900 font-medium text-white hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-100' : ''}
                ${today && !active ? 'ring-1 ring-inset ring-zinc-400 dark:ring-zinc-500' : ''}`}
            >
              {format(cell, 'd')}
              {inRange && dotColor && (
                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : dotColor}`} />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />Нечётная</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-sky-500" />Чётная</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" />Особый день</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Выходной</span>
      </div>
    </div>
  )
}
