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
    <div className="glass-strong absolute right-0 z-20 mt-2 w-[300px] max-w-[calc(100vw-2rem)] animate-pop rounded-2xl border border-white/70 p-4 shadow-glass dark:border-white/10">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => canPrev && setViewMonth(subMonths(viewMonth, 1))}
          disabled={!canPrev}
          className="rounded-lg p-1.5 text-slate-700 transition-colors hover:bg-white/70 disabled:opacity-30 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="font-semibold capitalize text-slate-800 dark:text-slate-100">{format(viewMonth, 'LLLL yyyy', { locale: ru })}</div>
        <button
          onClick={() => canNext && setViewMonth(addMonths(viewMonth, 1))}
          disabled={!canNext}
          className="rounded-lg p-1.5 text-slate-700 transition-colors hover:bg-white/70 disabled:opacity-30 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {WEEKDAY.map((w) => (
          <div key={w} className="text-[10px] font-medium text-slate-400 py-1">{w}</div>
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
          const dotColor = type === 'odd' ? 'bg-violet-500' : type === 'even' ? 'bg-sky-500' : type === 'single' ? 'bg-rose-500' : ''
          return (
            <button
              key={cell.toISOString()}
              disabled={!inRange}
              onClick={() => {
                onSelect(cell)
                onClose()
              }}
              className={`relative flex h-9 items-center justify-center rounded-lg text-sm transition-colors
                ${!inRange
                  ? 'cursor-not-allowed text-slate-200 dark:text-slate-700'
                  : isWeekend
                    ? 'bg-amber-50/80 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20'
                    : sameMonth
                      ? 'text-slate-700 hover:bg-violet-50/70 dark:text-slate-200 dark:hover:bg-slate-800'
                      : 'text-slate-300 hover:bg-violet-50/70 dark:text-slate-600 dark:hover:bg-slate-800'}
                ${active ? 'bg-brand-gradient font-bold text-white shadow-glow-sm hover:bg-brand-gradient' : ''}
                ${today && !active ? 'ring-2 ring-violet-400/70 dark:ring-violet-500/60' : ''}`}
            >
              {format(cell, 'd')}
              {inRange && dotColor && (
                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : dotColor}`} />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500" />Нечётная</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500" />Чётная</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" />Особый день</span>
      </div>
    </div>
  )
}
