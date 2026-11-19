import React from 'react'
import { TYPE_STYLES } from '../constants.js'

export default function LessonCard({ lesson, isNow, onGroupClick, compact = false }) {
  const style = TYPE_STYLES[lesson.type] || { dot: 'bg-stone-400', label: lesson.type }
  const groupList = lesson.groups && lesson.groups.length > 0 ? lesson.groups : lesson.group ? [lesson.group] : []
  const hasMeta = isNow || lesson.special || (lesson.notes && lesson.notes !== 'разовое')

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-white transition-colors dark:bg-stone-900
        ${compact ? 'px-3 py-2.5' : 'px-3 py-3 sm:px-4 sm:py-3.5'}
        ${isNow
          ? 'border-clay-300 shadow-card dark:border-clay-500/50'
          : 'border-stone-200 hover:border-stone-300 dark:border-stone-800 dark:hover:border-stone-700'}`}
    >
      <span className={`absolute inset-y-0 left-0 w-[3px] ${style.dot}`} aria-hidden="true" />

      <div className="flex items-start justify-between gap-3 pl-1.5">
        <h3
          className={`min-w-0 font-medium leading-snug text-ink dark:text-stone-100 ${
            compact ? 'text-sm' : 'text-[15px]'
          }`}
        >
          {lesson.subject}
        </h3>
        <span className="flex shrink-0 items-center gap-1.5 pt-0.5 text-[11px] font-medium text-ink-muted dark:text-stone-400">
          {style.label}
        </span>
      </div>

      <div
        className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 pl-1.5 text-ink-muted dark:text-stone-400 ${
          compact ? 'mt-1 text-xs' : 'mt-1.5 text-[13px]'
        }`}
      >
        <span className="font-semibold tabular-nums text-ink-soft dark:text-stone-200">{lesson.time}</span>
        {lesson.room && <span className="tabular-nums">{lesson.room}</span>}
        {lesson.teacher && <span className="min-w-0 truncate">{lesson.teacher}</span>}
        {compact && groupList.length > 0 && (
          <span className="tabular-nums">· {groupList.join(', ')}</span>
        )}
      </div>

      {!compact && (
        <div className="mt-2.5 space-y-1.5 pl-1.5">
          {groupList.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-faint dark:text-stone-500">
                Группа
              </span>
              {groupList.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => onGroupClick && onGroupClick(g)}
                  title={`Статистика группы ${g}`}
                  className="inline-flex items-center rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-ink-muted transition-colors hover:border-clay-300 hover:bg-clay-50 hover:text-clay-800 dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-300 dark:hover:border-clay-500/40 dark:hover:text-clay-300"
                >
                  {g}
                </button>
              ))}
            </div>
          )}
          {lesson.dates && lesson.dates.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-faint dark:text-stone-500">
                Даты
              </span>
              {lesson.dates.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-ink-muted dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-300"
                >
                  {d}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {hasMeta && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 pl-1.5 text-xs">
          {isNow && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-clay-50 px-2 py-0.5 font-medium text-clay-700 dark:bg-clay-500/10 dark:text-clay-300">
              <span className="h-1.5 w-1.5 rounded-full bg-clay-600 dark:bg-clay-400" />
              Сейчас идёт
            </span>
          )}
          {lesson.special && <span className="font-medium text-ink-muted dark:text-stone-400">Особое занятие</span>}
          {lesson.notes && lesson.notes !== 'разовое' && (
            <span className="text-ink-faint dark:text-stone-500">Пометки: {lesson.notes}</span>
          )}
        </div>
      )}
    </div>
  )
}
