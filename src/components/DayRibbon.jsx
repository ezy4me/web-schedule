import React, { useEffect, useMemo, useRef } from 'react'
import { format, isSameDay, isSameMonth, addDays, startOfWeek } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getYearDates } from '../utils/schedule.js'

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
export default function DayRibbon({ selected, onSelect }) {
  const dates = useMemo(() => getYearDates(selected.getFullYear()), [selected.getFullYear()])
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
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => onSelect(addDays(selected, -7))}
          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          aria-label="Предыдущая неделя"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-sm font-semibold text-slate-700 capitalize">
          {weekLabel(selected)}
        </div>
        <button
          onClick={() => onSelect(addDays(selected, 7))}
          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          aria-label="Следующая неделя"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div ref={listRef} className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {dates.map((d) => {
          const active = isSameDay(d, selected)
          const today = isSameDay(d, new Date())
          return (
            <button
              key={d.toISOString()}
              ref={active ? activeRef : null}
              onClick={() => onSelect(d)}
              className={`snap-start flex flex-col items-center justify-center shrink-0 w-14 py-2 rounded-2xl border transition-colors
                ${active ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}
                ${today && !active ? 'ring-2 ring-indigo-300' : ''}`}
            >
              <span className={`text-[10px] uppercase ${active ? 'text-indigo-100' : 'text-slate-400'}`}>
                {format(d, 'EEE', { locale: ru })}
              </span>
              <span className="text-base font-bold leading-tight">{format(d, 'd')}</span>
              <span className={`text-[10px] ${active ? 'text-indigo-100' : 'text-slate-400'}`}>
                {format(d, 'MMM', { locale: ru })}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
