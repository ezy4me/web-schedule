import React, { useEffect, useMemo, useRef } from 'react'
import { format, isSameDay, isSameMonth, addDays, startOfWeek } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getSeasonDates } from '../utils/schedule.js'

function weekLabel(selected) {
  const start = startOfWeek(selected, { weekStartsOn: 1 })
  const end = addDays(start, 6)
  if (isSameMonth(start, end)) {
    return `${format(start, 'd')}–${format(end, 'd MMMM', { locale: ru })}`
  }
  return `${format(start, 'd MMM', { locale: ru })} – ${format(end, 'd MMM', { locale: ru })}`
}

// Горизонтальная лента дней (mobile-first, с прокруткой).
// При открытии и смене даты автоматически прокручивается к актуальной неделе.
export default function DayRibbon({ selected, onSelect, emptyDays }) {
  const dates = useMemo(() => getSeasonDates(selected.getFullYear()), [selected.getFullYear()])
  const listRef = useRef(null)
  const activeRef = useRef(null)
  const firstRender = useRef(true)

  useEffect(() => {
    // Первый рендер — мгновенно, дальше — плавно
    activeRef.current?.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: firstRender.current ? 'auto' : 'smooth',
    })
    firstRender.current = false
  }, [selected])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() => onSelect(addDays(selected, -7))}
          className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="Предыдущая неделя"
        >
          <ChevronLeft size={17} />
        </button>
        <div className="text-sm font-medium capitalize text-zinc-500 dark:text-zinc-400">
          {weekLabel(selected)}
        </div>
        <button
          onClick={() => onSelect(addDays(selected, 7))}
          className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="Следующая неделя"
        >
          <ChevronRight size={17} />
        </button>
      </div>

      <div ref={listRef} className="scrollbar-thin -mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 pb-1.5">
        {dates.map((d) => {
          const active = isSameDay(d, selected)
          const today = isSameDay(d, new Date())
          const isWeekend = !active && emptyDays?.has(d.toISOString())
          return (
            <button
              key={d.toISOString()}
              ref={active ? activeRef : null}
              onClick={() => onSelect(d)}
              title={isWeekend ? 'Выходной — пар нет' : undefined}
              className={`flex w-12 shrink-0 snap-start flex-col items-center justify-center rounded-lg border py-2 transition-colors
                ${active
                  ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500 dark:text-white'
                  : isWeekend
                    ? 'border-amber-200/70 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-400/90 dark:hover:bg-amber-500/20'
                    : 'border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800'}
                ${today && !active ? 'ring-1 ring-inset ring-zinc-400 dark:ring-zinc-500' : ''}`}
            >
              <span className={`text-[10px] uppercase ${active ? 'text-indigo-100' : isWeekend ? 'text-amber-500/90 dark:text-amber-400/70' : 'text-zinc-400'}`}>
                {format(d, 'EEE', { locale: ru })}
              </span>
              <span className="text-base font-semibold leading-tight tabular-nums">{format(d, 'd')}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
