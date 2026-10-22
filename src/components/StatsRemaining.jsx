import React, { useState } from 'react'
import { format, isSameDay, isTomorrow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ArrowUpRight, ChevronDown } from 'lucide-react'
import { TYPE_STYLES } from '../constants.js'
import { isLessonUpcoming } from '../utils/schedule.js'
import { LESSON_ACADEMIC_HOURS } from '../utils/stats.js'
import { capitalizeFirst, academicHoursLabel, nextLessonHint, pairsLabel } from '../utils/statsFormat.js'

export default function StatsRemaining({ stats, group, teacher, now, onOpenDate }) {
  const [collapsed, setCollapsed] = useState(() => new Set())

  const remaining = stats.lessons.filter(
    (lesson) =>
      (group === 'all' || lesson.groups.includes(group)) &&
      (teacher === 'all' || lesson.teacher === teacher) &&
      isLessonUpcoming(lesson, now)
  )

  const months = []
  for (const lesson of remaining) {
    const monthKey = `${lesson.date.getFullYear()}-${lesson.date.getMonth()}`
    let month = months[months.length - 1]
    if (!month || month.key !== monthKey) {
      month = { key: monthKey, date: new Date(lesson.date.getFullYear(), lesson.date.getMonth(), 1), days: [] }
      months.push(month)
    }
    const dayKey = lesson.date.toISOString()
    let day = month.days[month.days.length - 1]
    if (!day || day.key !== dayKey) {
      day = { key: dayKey, date: lesson.date, lessons: [] }
      month.days.push(day)
    }
    day.lessons.push(lesson)
  }

  const toggle = (key) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const next = remaining[0] || null

  if (!remaining.length) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Все пары прошли</p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          {group !== 'all'
            ? `У группы ${group} занятий больше нет`
            : teacher !== 'all'
              ? `У преподавателя ${teacher} занятий больше нет`
              : 'До конца семестра занятий больше нет'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {next && (
        <button
          type="button"
          onClick={() => onOpenDate(next.date)}
          className="group flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        >
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Ближайшая пара
            </div>
            <div className="mt-0.5 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{next.subject}</div>
            <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {capitalizeFirst(format(next.date, 'd MMMM, EEEE', { locale: ru }))} · {next.time}
              {next.room ? ` · ${next.room}` : ''}
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
            {nextLessonHint(next, now)}
            <ArrowUpRight size={14} />
          </span>
        </button>
      )}

      <p className="text-xs text-zinc-500 dark:text-zinc-400">{pairsLabel(remaining.length)} до конца семестра</p>

      {months.map((month) => {
        const monthPairs = month.days.reduce((sum, day) => sum + day.lessons.length, 0)
        return (
          <section key={month.key}>
            <h3 className="mb-1.5 flex items-baseline justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              <span>{capitalizeFirst(format(month.date, 'LLLL yyyy', { locale: ru }))}</span>
              <span className="font-normal normal-case tracking-normal">{pairsLabel(monthPairs)}</span>
            </h3>

            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              {month.days.map((day, dayIndex) => {
                const isOpen = !collapsed.has(day.key)
                const isDayToday = isSameDay(day.date, now)
                const isDayTomorrow = isTomorrow(day.date)
                return (
                  <div key={day.key} className={dayIndex ? 'border-t border-zinc-100 dark:border-zinc-800' : ''}>
                    <button
                      type="button"
                      onClick={() => toggle(day.key)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    >
                      <ChevronDown
                        size={14}
                        className={`shrink-0 text-zinc-400 transition-transform ${isOpen ? '' : '-rotate-90'}`}
                      />
                      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                        {capitalizeFirst(format(day.date, 'EEEE, d MMMM', { locale: ru }))}
                      </span>
                      {isDayToday && (
                        <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                          Сегодня
                        </span>
                      )}
                      {isDayTomorrow && (
                        <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          Завтра
                        </span>
                      )}
                      <span className="ml-auto shrink-0 text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
                        {day.lessons.length} · {academicHoursLabel(day.lessons.length * LESSON_ACADEMIC_HOURS)}
                      </span>
                    </button>

                    {isOpen && (
                      <ul className="space-y-1 px-3 pb-2.5">
                        {day.lessons.map((lesson, index) => (
                          <li key={`${lesson.time}-${lesson.subject}-${index}`}>
                            <button
                              type="button"
                              onClick={() => onOpenDate(day.date)}
                              className="flex w-full items-center gap-2 rounded-lg bg-zinc-50 px-2.5 py-1.5 text-left transition-colors hover:bg-zinc-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800"
                            >
                              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TYPE_STYLES[lesson.type]?.dot || 'bg-zinc-400'}`} />
                              <span className="shrink-0 text-xs tabular-nums text-zinc-400 dark:text-zinc-500">{lesson.time}</span>
                              <span className="min-w-0 flex-1 truncate text-sm text-zinc-700 dark:text-zinc-200" title={lesson.subject}>
                                {lesson.subject}
                              </span>
                              {group === 'all' && (
                                <span className="hidden shrink-0 text-[11px] text-zinc-400 dark:text-zinc-500 sm:inline">
                                  {lesson.groups.join(', ')}
                                </span>
                              )}
                              {lesson.room && (
                                <span className="shrink-0 text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
                                  {lesson.room}
                                </span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
