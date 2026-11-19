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
export default function DayRibbon({ selected, semester = 'autumn', onSelect, emptyDays }) {
  const dates = useMemo(
    () => getSeasonDates(selected.getFullYear(), semester),
    [selected.getFullYear(), semester]
  )
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
          className="grid h-9 w-9 place-items-center rounded-lg border border-stone-200 bg-white text-ink-muted transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-ink dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          aria-label="Предыдущая неделя"
        >
          <ChevronLeft size={17} />
        </button>
        <div className="text-sm font-medium text-ink-muted dark:text-stone-400">
          {weekLabel(selected)}
        </div>
        <button
          onClick={() => onSelect(addDays(selected, 7))}
          className="grid h-9 w-9 place-items-center rounded-lg border border-stone-200 bg-white text-ink-muted transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-ink dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
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
              title={isWeekend ? 'Пар нет' : undefined}
              aria-label={format(d, 'd MMMM, EEEE', { locale: ru })}
              aria-pressed={active}
              className={`flex w-12 shrink-0 snap-start flex-col items-center justify-center rounded-lg border py-2 transition-colors
                ${active
                  ? 'border-ink bg-ink text-paper dark:border-stone-100 dark:bg-stone-100 dark:text-ink'
                  : isWeekend
                    ? 'border-dashed border-stone-300 bg-transparent text-ink-faint hover:border-stone-400 dark:border-stone-700 dark:text-stone-500 dark:hover:border-stone-600'
                    : 'border-stone-200 bg-white text-ink-soft hover:border-stone-300 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-stone-700 dark:hover:bg-stone-800'}
                ${today && !active ? 'ring-1 ring-inset ring-clay-400 dark:ring-clay-500' : ''}`}
            >
              <span
                className={`text-[10px] uppercase tracking-wide ${
                  active
                    ? 'text-paper/70 dark:text-ink/60'
                    : isWeekend
                      ? 'text-ink-faint/80 dark:text-stone-600'
                      : 'text-ink-faint dark:text-stone-500'
                }`}
              >
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
