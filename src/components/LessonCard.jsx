import React from 'react'
import { Building2, DoorOpen } from 'lucide-react'
import { TYPE_STYLES } from '../constants.js'
import { parseRoom } from '../utils/schedule.js'
import TypeChip from './TypeChip.jsx'

export default function LessonCard({ lesson, isNow, onGroupClick, compact = false }) {
  const style = TYPE_STYLES[lesson.type]
  const { building, room } = parseRoom(lesson.room)
  const groupList = lesson.groups && lesson.groups.length > 0 ? lesson.groups : lesson.group ? [lesson.group] : []
  const dates = Array.isArray(lesson.dates) ? lesson.dates : []
  const hasMeta = isNow || lesson.special || (lesson.notes && lesson.notes !== 'разовое')

  if (compact) {
    return (
      <article
        className={`flex items-center gap-2.5 rounded-lg border bg-white px-3 py-2 transition-colors dark:bg-stone-900 ${
          isNow
            ? 'border-clay-300 dark:border-clay-500/50'
            : 'border-stone-200 hover:border-stone-300 dark:border-stone-800 dark:hover:border-stone-700'
        }`}
      >
        <span className="shrink-0 text-sm font-semibold tabular-nums text-ink dark:text-stone-100">{lesson.time}</span>
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style?.dot || 'bg-stone-400'}`} />
        <span className="min-w-0 flex-1 truncate text-sm text-ink-soft dark:text-stone-200">{lesson.subject}</span>
        {room && (
          <span className="shrink-0 text-[11px] tabular-nums text-ink-faint dark:text-stone-500">
            ауд. {room}
          </span>
        )}
      </article>
    )
  }

  return (
    <article
      className={`rounded-xl border bg-white transition-colors dark:bg-stone-900 ${
        isNow
          ? 'border-clay-300 shadow-card dark:border-clay-500/50'
          : 'border-stone-200 hover:border-stone-300 dark:border-stone-800 dark:hover:border-stone-700'
      }`}
    >
      <div className="px-3 py-3 sm:px-4 sm:py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <TypeChip type={lesson.type} />
            {isNow && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-clay-50 px-2 py-0.5 text-[11px] font-medium text-clay-700 dark:bg-clay-500/10 dark:text-clay-300">
                <span className="h-1.5 w-1.5 rounded-full bg-clay-600 dark:bg-clay-400" />
                Сейчас идёт
              </span>
            )}
          </div>
          <span className="shrink-0 text-[15px] font-semibold leading-tight tabular-nums text-ink dark:text-stone-100">
            {lesson.time}
          </span>
        </div>

        <h3 className="mt-1.5 text-[15px] font-medium leading-snug text-ink dark:text-stone-100">
          {lesson.subject}
        </h3>

        {(room || building || lesson.teacher) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-muted dark:text-stone-400">
            {room && (
              <span className="inline-flex items-center gap-1">
                <DoorOpen size={13} className="shrink-0 text-ink-faint dark:text-stone-500" />
                ауд. {room}
              </span>
            )}
            {building && (
              <span className="inline-flex items-center gap-1">
                <Building2 size={13} className="shrink-0 text-ink-faint dark:text-stone-500" />
                корп. {building}
              </span>
            )}
            {lesson.teacher && <span className="min-w-0 truncate">{lesson.teacher}</span>}
          </div>
        )}

        {(groupList.length > 0 || dates.length > 0) && (
          <div className="mt-2.5 flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
            {groupList.length > 0 && (
              <span className="inline-flex flex-wrap items-center gap-1.5">
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
              </span>
            )}
            {dates.length > 0 && (
              <span className="inline-flex min-w-0 flex-wrap items-baseline gap-1.5 text-[11px]">
                <span className="font-medium uppercase tracking-[0.08em] text-ink-faint dark:text-stone-500">Даты</span>
                <span className="tabular-nums text-ink-muted dark:text-stone-400">{dates.join(' · ')}</span>
              </span>
            )}
          </div>
        )}

        {hasMeta && (lesson.special || (lesson.notes && lesson.notes !== 'разовое')) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {lesson.special && <span className="font-medium text-ink-muted dark:text-stone-400">Особое занятие</span>}
            {lesson.notes && lesson.notes !== 'разовое' && (
              <span className="text-ink-faint dark:text-stone-500">Пометки: {lesson.notes}</span>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
