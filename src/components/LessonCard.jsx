import React from 'react'
import { Clock, MapPin, User, Star, Users, CalendarDays } from 'lucide-react'
import { TYPE_STYLES } from '../constants.js'

export default function LessonCard({ lesson }) {
  const style = TYPE_STYLES[lesson.type] || { badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300', icon: Clock, label: lesson.type }
  const Icon = style.icon

  return (
    <div className="flex gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
      {/* Время */}
      <div className="flex flex-col items-center justify-center shrink-0">
        <div className="text-base font-bold text-slate-800 dark:text-slate-100">{lesson.time}</div>
        <Clock size={14} className="text-slate-300 dark:text-slate-600 mt-1" />
      </div>

      <div className="border-l border-slate-100 dark:border-slate-800 self-stretch" />

      {/* Контент */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 leading-snug">{lesson.subject}</h3>
          <span className="flex items-center gap-1.5 shrink-0">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${style.badge}`}>
              <Icon size={12} />
              {lesson.type}
            </span>
            {lesson.parity && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-400/30">
                {lesson.parity}
              </span>
            )}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <User size={14} className="text-slate-400" />
            {lesson.teacher || '—'}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={14} className="text-slate-400" />
            {lesson.room || '—'}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Users size={14} className="text-slate-400 shrink-0" />
          {lesson.groups && lesson.groups.length > 0
            ? lesson.groups.map((g) => (
                <span
                  key={g}
                  className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700"
                >
                  {g}
                </span>
              ))
            : (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700">
                  {lesson.group}
                </span>
              )}
        </div>

        {lesson.dates && lesson.dates.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <CalendarDays size={14} className="text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">Даты:</span>
            {lesson.dates.map((d) => (
              <span
                key={d}
                className="px-1.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-400/30"
              >
                {d}
              </span>
            ))}
          </div>
        )}

        {lesson.special && (
          <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full">
            <Star size={12} />
            Особое занятие
          </div>
        )}
        {lesson.notes && lesson.notes !== 'разовое' && (
          <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Пометки: {lesson.notes}
          </div>
        )}
      </div>
    </div>
  )
}
