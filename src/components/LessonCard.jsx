import React from 'react'
import { TYPE_STYLES } from '../constants.js'

export default function LessonCard({ lesson, isNow }) {
  const style = TYPE_STYLES[lesson.type] || { dot: 'bg-zinc-400', label: lesson.type }
  const groups = lesson.groups && lesson.groups.length > 0 ? lesson.groups.join(', ') : lesson.group
  const hasMeta = isNow || lesson.special || (lesson.notes && lesson.notes !== 'разовое')

  return (
    <div
      className={`rounded-xl border bg-white p-4 transition-colors dark:bg-zinc-900
        ${isNow ? 'border-zinc-900 dark:border-zinc-100' : 'border-zinc-200 dark:border-zinc-800'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 font-medium leading-snug text-zinc-900 dark:text-zinc-100">
          {lesson.subject}
        </h3>
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          {style.label}
        </span>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
        <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-300">{lesson.time}</span>
        {lesson.room && <span>{lesson.room}</span>}
        {lesson.teacher && <span>{lesson.teacher}</span>}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 dark:text-zinc-500">
        <span>Гр. {groups}</span>
        {lesson.dates && lesson.dates.length > 0 && <span>Даты: {lesson.dates.join(' · ')}</span>}
      </div>

      {hasMeta && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {isNow && (
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Сейчас идёт
            </span>
          )}
          {lesson.special && <span className="font-medium text-zinc-500 dark:text-zinc-400">Особое занятие</span>}
          {lesson.notes && lesson.notes !== 'разовое' && (
            <span className="text-zinc-400 dark:text-zinc-500">Пометки: {lesson.notes}</span>
          )}
        </div>
      )}
    </div>
  )
}
