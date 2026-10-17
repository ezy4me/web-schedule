import React from 'react'
import { Clock, MapPin, User, Star, Users, CalendarDays } from 'lucide-react'
import { TYPE_STYLES } from '../constants.js'

export default function LessonCard({ lesson, isNow }) {
  const style = TYPE_STYLES[lesson.type] || {
    badge: 'bg-slate-100 text-slate-700 ring-slate-200/70 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    icon: Clock,
    label: lesson.type,
    accent: 'from-slate-400 to-slate-500',
  }
  const Icon = style.icon

  return (
    <div
      className={`glass group relative flex animate-fade-up gap-4 overflow-hidden rounded-2xl border p-4 shadow-soft transition-all hover:shadow-glass
        ${isNow
          ? 'border-emerald-300/80 ring-2 ring-emerald-300/60 dark:border-emerald-400/40 dark:ring-emerald-500/40'
          : 'border-white/60 dark:border-white/10'}`}
    >
      {/* Цветной акцент по типу занятия */}
      <span className={`absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-gradient-to-b ${style.accent}`} />

      {/* Время */}
      <div className="flex shrink-0 flex-col items-center justify-center pl-1">
        <div className="text-base font-bold tabular-nums text-slate-800 dark:text-slate-100">{lesson.time}</div>
        <Clock size={14} className="mt-1 text-slate-300 dark:text-slate-600" />
      </div>

      <div className="self-stretch border-l border-slate-200/60 dark:border-white/10" />

      {/* Контент */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug text-slate-800 dark:text-slate-100">{lesson.subject}</h3>
          <span className="flex shrink-0 items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${style.badge}`}>
              <Icon size={12} />
              {lesson.type}
            </span>
            {lesson.parity && (
              <span className="rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-600 ring-1 ring-violet-200/70 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-400/25">
                {lesson.parity}
              </span>
            )}
            {isNow && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
                Сейчас идёт
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
          <Users size={14} className="shrink-0 text-slate-400" />
          {lesson.groups && lesson.groups.length > 0 ? (
            lesson.groups.map((g) => (
              <span
                key={g}
                className="rounded-full bg-slate-100/80 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200/70 dark:bg-slate-800/80 dark:text-slate-300 dark:ring-white/10"
              >
                {g}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-slate-100/80 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200/70 dark:bg-slate-800/80 dark:text-slate-300 dark:ring-white/10">
              {lesson.group}
            </span>
          )}
        </div>

        {lesson.dates && lesson.dates.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <CalendarDays size={14} className="shrink-0 text-slate-400" />
            <span className="mr-1 text-xs text-slate-500 dark:text-slate-400">Даты:</span>
            {lesson.dates.map((d) => (
              <span
                key={d}
                className="rounded-md bg-violet-50/80 px-1.5 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-violet-200/60 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/20"
              >
                {d}
              </span>
            ))}
          </div>
        )}

        {lesson.special && (
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-rose-50/80 px-2 py-0.5 text-xs font-medium text-rose-600 ring-1 ring-rose-200/60 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20">
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
