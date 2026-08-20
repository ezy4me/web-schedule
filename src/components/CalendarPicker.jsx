import React, { useMemo, useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, addDays, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getSemesterDates, getWeekType, toDDMM } from '../utils/schedule.js'

const WEEKDAY = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

// Всплывающий календарь-месяц
export default function CalendarPicker({ selected, onSelect, onClose }) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(selected))
  const semesterDates = useMemo(() => getSemesterDates(selected.getFullYear()), [selected])
  const semesterSet = useMemo(
    () => new Set(semesterDates.map((d) => d.toISOString())),
    [semesterDates]
  )

  const cells = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 })
    return Array.from({ length: 42 }, (_, i) => addDays(start, i))
  }, [viewMonth])

  const canPrev = viewMonth > startOfMonth(new Date(selected.getFullYear(), 8, 1)) // сентябрь
  const canNext = viewMonth < startOfMonth(new Date(selected.getFullYear(), 11, 1)) // декабрь

  return (
    <div className="absolute z-20 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 w-[300px]">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => canPrev && setViewMonth(subMonths(viewMonth, 1))}
          disabled={!canPrev}
          className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="font-semibold capitalize">{format(viewMonth, 'LLLL yyyy', { locale: ru })}</div>
        <button
          onClick={() => canNext && setViewMonth(addMonths(viewMonth, 1))}
          disabled={!canNext}
          className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30"
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
          const inSemester = semesterSet.has(cell.toISOString())
          const active = isSameDay(cell, selected)
          const today = isSameDay(cell, new Date())
          const sameMonth = isSameMonth(cell, viewMonth)
          const type = inSemester ? getWeekType(cell) : null
          const dotColor = type === 'odd' ? 'bg-violet-500' : type === 'even' ? 'bg-sky-500' : type === 'single' ? 'bg-rose-500' : ''
          return (
            <button
              key={cell.toISOString()}
              disabled={!inSemester}
              onClick={() => {
                onSelect(cell)
                onClose()
              }}
              className={`relative h-9 rounded-lg text-sm transition-colors flex items-center justify-center
                ${!inSemester ? 'text-slate-200 cursor-not-allowed' : sameMonth ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-100'}
                ${active ? 'bg-indigo-600 text-white hover:bg-indigo-600 font-bold' : ''}
                ${today && !active ? 'ring-2 ring-indigo-300' : ''}`}
            >
              {format(cell, 'd')}
              {inSemester && dotColor && (
                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : dotColor}`} />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500" />Нечётная</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500" />Чётная</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" />Особый день</span>
      </div>
    </div>
  )
}
