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
          className="grid h-9 w-9 place-items-center rounded-xl border border-white/60 bg-white/70 text-slate-600 transition-colors hover:bg-white hover:text-violet-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-violet-300"
          aria-label="Предыдущая неделя"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="rounded-full border border-white/60 bg-white/60 px-3 py-1 text-xs font-semibold capitalize text-slate-600 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-300">
          {weekLabel(selected)}
        </div>
        <button
          onClick={() => onSelect(addDays(selected, 7))}
          className="grid h-9 w-9 place-items-center rounded-xl border border-white/60 bg-white/70 text-slate-600 transition-colors hover:bg-white hover:text-violet-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-violet-300"
          aria-label="Следующая неделя"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div ref={listRef} className="scrollbar-thin -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2">
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
              className={`flex w-14 shrink-0 snap-start flex-col items-center justify-center rounded-2xl border py-2 transition-all
                ${active
                  ? 'border-transparent bg-brand-gradient text-white shadow-glow-sm'
                  : isWeekend
                    ? 'border-amber-200/70 bg-amber-50/80 text-slate-700 hover:bg-amber-100 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-slate-300 dark:hover:bg-amber-500/20'
                    : 'border-white/60 bg-white/70 text-slate-700 hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800'}
                ${today && !active ? 'ring-2 ring-violet-400/70 dark:ring-violet-500/60' : ''}`}
            >
              <span className={`text-[10px] uppercase ${active ? 'text-white/80' : 'text-slate-400'}`}>
                {format(d, 'EEE', { locale: ru })}
              </span>
              <span className="text-base font-bold leading-tight">{format(d, 'd')}</span>
              <span className={`text-[10px] ${active ? 'text-white/80' : 'text-slate-400'}`}>
                {format(d, 'MMM', { locale: ru })}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
