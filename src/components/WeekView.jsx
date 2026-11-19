import React, { useMemo } from 'react'
import { addDays, format, isSameDay, isToday, startOfWeek } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DAY_LABELS, TYPE_STYLES } from '../constants.js'
import { buildTimeline, getPairsForDate, parseRoom } from '../utils/schedule.js'

const ACCENTS = {
  лек: 'bg-clay-600 dark:bg-clay-400',
  'л.р.': 'bg-moss-600 dark:bg-moss-500',
  пр: 'bg-steel-600 dark:bg-steel-500',
}

function typeLabel(type) {
  return TYPE_STYLES[type]?.label || type
}

function typeAccent(type) {
  return ACCENTS[type] || 'bg-stone-400'
}

function windowsLabel(count) {
  if (count === 1) return 'окно'
  if (count >= 2 && count < 5) return 'окна'
  return 'окон'
}

// Неделя целиком: 6 дней (пн–сб) в колонках, компактные карточки пар.
export default function WeekView({
  selected,
  semester,
  group,
  teacher,
  type,
  query,
  data,
  onSelectDate,
}) {
  const weekStart = useMemo(
    () => startOfWeek(selected, { weekStartsOn: 1 }),
    [selected]
  )

  const days = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const date = addDays(weekStart, index)
      const pairs = getPairsForDate(date, group, { type, query, teacher }, data)
      const timeline = buildTimeline(pairs)
      const windows = timeline.filter((item) => item.type === 'window')
      return { date, pairs, timeline, windows }
    })
  }, [weekStart, group, teacher, type, query, data])

  const totalPairs = days.reduce((sum, day) => sum + day.pairs.length, 0)
  const totalWindows = days.reduce((sum, day) => sum + day.windows.length, 0)
  const busiest = days.reduce(
    (best, day) => (day.pairs.length > best.pairs.length ? day : best),
    days[0]
  )

  const weekEnd = addDays(weekStart, 5)
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth()
  const rangeLabel = sameMonth
    ? `${format(weekStart, 'd')}–${format(weekEnd, 'd MMMM', { locale: ru })}`
    : `${format(weekStart, 'd MMM', { locale: ru })} – ${format(weekEnd, 'd MMM', { locale: ru })}`

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink dark:text-stone-100">
            Неделя {rangeLabel}
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted dark:text-stone-400">
            {totalPairs} пар
            {totalWindows > 0 ? ` · ${totalWindows} ${windowsLabel(totalWindows)}` : ''}
            {busiest.pairs.length > 0
              ? ` · самый плотный — ${DAY_LABELS[busiest.date.getDay() === 0 ? 6 : busiest.date.getDay() - 1]} (${busiest.pairs.length})`
              : ''}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSelectDate(addDays(weekStart, -7))}
            className="grid h-8 w-8 place-items-center rounded-lg border border-stone-200 text-ink-muted transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-ink dark:border-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            aria-label="Предыдущая неделя"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => onSelectDate(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-ink dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          >
            Сейчас
          </button>
          <button
            type="button"
            onClick={() => onSelectDate(addDays(weekStart, 7))}
            className="grid h-8 w-8 place-items-center rounded-lg border border-stone-200 text-ink-muted transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-ink dark:border-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            aria-label="Следующая неделя"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="-mx-1 mt-3 flex snap-x gap-2 overflow-x-auto px-1 pb-2 scrollbar-thin">
        {days.map(({ date, pairs, timeline }, index) => {
          const active = isSameDay(date, selected)
          const today = isToday(date)
          return (
            <div
              key={date.toISOString()}
              className={`flex min-w-[150px] flex-1 snap-start flex-col rounded-lg border transition-colors ${
                active
                  ? 'border-stone-400 bg-stone-50 dark:border-stone-600 dark:bg-stone-800/60'
                  : 'border-stone-200 bg-stone-50/60 dark:border-stone-800 dark:bg-stone-950/30'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectDate(date)}
                className="flex items-baseline justify-between gap-1 rounded-t-lg px-2.5 pb-1.5 pt-2 text-left transition-colors hover:bg-white/70 dark:hover:bg-stone-900/60"
              >
                <span className="flex items-baseline gap-1.5">
                  <span
                    className={`text-xs font-semibold ${
                      today ? 'text-clay-700 dark:text-clay-300' : 'text-ink dark:text-stone-200'
                    }`}
                  >
                    {DAY_LABELS[index]}
                  </span>
                  <span className="text-[11px] tabular-nums text-ink-faint dark:text-stone-500">
                    {format(date, 'd.MM')}
                  </span>
                </span>
                {today && <span className="h-1.5 w-1.5 rounded-full bg-clay-600 dark:bg-clay-400" />}
              </button>

              <div className="flex flex-1 flex-col gap-1.5 px-1.5 pb-2">
                {pairs.length === 0 && (
                  <span className="py-3 text-center text-[11px] text-ink-faint/80 dark:text-stone-600">
                    нет пар
                  </span>
                )}
                {timeline.map((item, itemIndex) => {
                  if (item.type === 'window') {
                    return (
                      <div
                        key={`window-${item.time}`}
                        title={`Окно · ${item.time}`}
                        className="flex items-center justify-between gap-1 rounded-md border border-dashed border-stone-300 px-1.5 py-1 text-[10px] text-ink-faint dark:border-stone-700 dark:text-stone-500"
                      >
                        <span className="tabular-nums">{item.time}</span>
                        <span>окно</span>
                      </div>
                    )
                  }
                  const lesson = item.lesson
                  return (
                    <button
                      key={`${lesson.time}-${lesson.subject}-${itemIndex}`}
                      type="button"
                      onClick={() => onSelectDate(date)}
                      title={`${lesson.subject} · ${typeLabel(lesson.type)}`}
                      className="group flex w-full items-start gap-1.5 rounded-md border border-stone-200 bg-white p-1.5 text-left transition-colors hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700"
                    >
                      <span className={`mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full ${typeAccent(lesson.type)}`} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-1">
                          <span className="text-[11px] font-semibold tabular-nums text-ink-soft dark:text-stone-200">
                            {lesson.time}
                          </span>
                          {parseRoom(lesson.room).room && (
                            <span className="truncate text-[10px] tabular-nums text-ink-faint dark:text-stone-500">
                              {parseRoom(lesson.room).room}
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-[11px] leading-snug text-ink-muted dark:text-stone-300">
                          {lesson.subject}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
