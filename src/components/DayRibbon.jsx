import React from 'react'
import { format, isSameDay, addDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import { getSemesterDates } from '../utils/schedule.js'

// Горизонтальная лента дней (mobile-first, с прокруткой)
export default function DayRibbon({ selected, onSelect }) {
  const dates = getSemesterDates(selected.getFullYear())

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
      {dates.map((d) => {
        const active = isSameDay(d, selected)
        const today = isSameDay(d, new Date())
        return (
          <button
            key={d.toISOString()}
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
  )
}
