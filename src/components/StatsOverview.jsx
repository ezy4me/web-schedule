import React from 'react'
import { format, isToday, isTomorrow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ArrowUpRight } from 'lucide-react'
import { DAY_LABELS, TYPE_ORDER } from '../constants.js'
import { BarList, StatsCard, TypeSplit, WeeklyBars } from './StatsCharts.jsx'
import { academicHoursLabel, capitalizeFirst, nextLessonHint, pairsLabel } from '../utils/statsFormat.js'

function StatBox({ value, label }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xl font-semibold leading-7 tabular-nums text-zinc-900 dark:text-zinc-50">{value}</div>
      <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
    </div>
  )
}

function insightRows(view, group) {
  const rows = []
  const busiest = view.byWeekday.reduce((best, day) => (day.total > (best ? best.total : 0) ? day : best), null)
  if (busiest && busiest.total) {
    rows.push({ label: 'Самый плотный день', value: `${DAY_LABELS[busiest.weekday - 1]} · ${pairsLabel(busiest.total)}` })
  }
  const topSubject = view.bySubject.reduce((best, item) => (item.total > (best ? best.total : 0) ? item : best), null)
  if (topSubject) {
    rows.push({ label: 'Топ-предмет', value: `${topSubject.name} · ${topSubject.total}` })
  }
  if (view.totals.studyDays) {
    const avg = Math.round((view.totals.pairs / view.totals.studyDays) * 10) / 10
    rows.push({ label: 'В среднем за учебный день', value: `${String(avg).replace('.', ',')} пары` })
  }
  if (group !== 'all') {
    rows.push({ label: 'Окон за период', value: String(view.totals.windows) })
  }
  rows.push({ label: 'До конца семестра', value: `${view.totals.weeksLeft} нед.` })
  return rows
}

export default function StatsOverview({ view, group, now, onOpenDate }) {
  const next = view.totals.nextLesson
  const typeRows = [...view.byType].sort((a, b) => {
    const ia = TYPE_ORDER.indexOf(a.key)
    const ib = TYPE_ORDER.indexOf(b.key)
    return (ia === -1 ? TYPE_ORDER.length : ia) - (ib === -1 ? TYPE_ORDER.length : ib)
  })

  const weekdayItems = view.byWeekday.map((day) => ({
    key: day.weekday,
    label: DAY_LABELS[day.weekday - 1],
    value: day.total,
  }))

  const timeItems = view.byTime.map((slot) => ({ key: slot.time, label: slot.time, value: slot.total }))

  const weeksWithPairs = view.byWeek.filter((week) => week.total > 0).length
  const avgWeek = weeksWithPairs ? Math.round((view.totals.pairs / weeksWithPairs) * 10) / 10 : 0

  let nextWhen = ''
  if (next) {
    if (isToday(next.date)) nextWhen = `Сегодня, ${next.time}`
    else if (isTomorrow(next.date)) nextWhen = `Завтра, ${next.time}`
    else nextWhen = `${capitalizeFirst(format(next.date, 'd MMMM, EEEE', { locale: ru }))}, ${next.time}`
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatBox value={view.totals.pairs} label={group === 'all' ? 'Пар (уникальных)' : 'Пар'} />
        <StatBox value={view.totals.remaining} label="Осталось пар" />
        <StatBox value={academicHoursLabel(view.totals.academicHours)} label="Ауд. нагрузка" />
        <StatBox value={view.totals.subjects} label="Предметов" />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white px-3 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <span className="font-medium text-zinc-700 dark:text-zinc-200">Прогресс семестра</span>
          <span className="tabular-nums text-zinc-500 dark:text-zinc-400">{view.totals.progress}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-indigo-500"
            style={{ width: `${Math.min(100, Math.max(0, view.totals.progress))}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span>
            Пройдено {view.totals.seasonPast} из {view.totals.seasonPairs} пар
          </span>
          <span>
            Осталось {view.totals.seasonRemaining} пар · {academicHoursLabel(view.totals.seasonRemainingHours)}
          </span>
        </div>
      </div>

      {group === 'all' && view.totals.streamPairs > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white px-3 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Потоковые лекции</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {view.totals.streamPairs} пар · {view.totals.streamGroupSlots} участий
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            В общей нагрузке лекция считается один раз. В нагрузку каждой группы входит по 2 ак. ч.
          </p>
          <p className="mt-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
            {academicHoursLabel(view.totals.streamSavedHours)} не дублируется
          </p>
        </div>
      )}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {view.totals.groups} групп · {view.totals.rooms} аудиторий · {view.totals.studyDays} учебных дней
        {view.totals.teachers > 0 ? ` · ${view.totals.teachers} преподавателей` : ''}
      </p>

      {view.totals.pairs === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-6 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500">
          В выбранном периоде пар нет
        </div>
      ) : (
        <>
          {next && (
            <button
              type="button"
              onClick={() => onOpenDate(next.date)}
              className="group flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className="min-w-0">
                <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  Следующая пара
                </div>
                <div className="mt-0.5 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{next.subject}</div>
                <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {nextWhen}
                  {next.room ? ` · ${next.room}` : ''}
                  {next.groups.length ? ` · ${next.groups.join(', ')}` : ''}
                </div>
              </div>
              <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                {nextLessonHint(next, now)}
                <ArrowUpRight size={14} />
              </span>
            </button>
          )}

          <StatsCard title="Нагрузка по неделям" subtitle={`в среднем ${String(avgWeek).replace('.', ',')} в неделю`}>
            <WeeklyBars weeks={view.byWeek} />
          </StatsCard>

          <div className="grid gap-3 sm:grid-cols-2">
            <StatsCard title="По дням недели">
              {weekdayItems.length ? <BarList items={weekdayItems} /> : <p className="text-xs text-zinc-400">Нет данных</p>}
            </StatsCard>
            <StatsCard title="По времени">
              {timeItems.length ? <BarList items={timeItems} /> : <p className="text-xs text-zinc-400">Нет данных</p>}
            </StatsCard>
          </div>

          <StatsCard title="По типам занятий" subtitle={pairsLabel(view.totals.pairs)}>
            <TypeSplit rows={typeRows} />
          </StatsCard>

          <StatsCard title="Наблюдения">
            <dl className="divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
              {insightRows(view, group).map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0">
                  <dt className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{row.label}</dt>
                  <dd className="min-w-0 truncate text-right text-xs font-medium text-zinc-800 dark:text-zinc-200" title={row.value}>
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </StatsCard>
        </>
      )}
    </div>
  )
}
