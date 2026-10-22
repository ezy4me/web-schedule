import React, { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { BarChart3, CalendarRange, Clock, Layers, Users } from 'lucide-react'
import { aggregateLessonStats } from '../utils/schedule.js'
import { capitalizeFirst } from '../utils/statsFormat.js'
import StatsOverview from './StatsOverview.jsx'
import StatsBreakdown from './StatsBreakdown.jsx'
import StatsCalendar from './StatsCalendar.jsx'
import StatsRemaining from './StatsRemaining.jsx'
import NiceSelect from './NiceSelect.jsx'

const TABS = [
  { id: 'overview', label: 'Обзор', icon: BarChart3 },
  { id: 'breakdown', label: 'Разрезы', icon: Layers },
  { id: 'calendar', label: 'Календарь', icon: CalendarRange },
  { id: 'remaining', label: 'Осталось', icon: Clock },
]

const BASE_PERIODS = [
  { id: 'semester', label: 'Семестр' },
  { id: 'remaining', label: 'Остаток' },
]

function chipClass(active) {
  return active
    ? 'border-indigo-600 bg-indigo-600 text-white'
    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800'
}

export default function Statistics({
  stats,
  group,
  teacher,
  tab,
  period,
  onTabChange,
  onPeriodChange,
  onGroupChange,
  onTeacherChange,
  onOpenDate,
}) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    setNow(new Date())
  }, [stats])

  const view = useMemo(
    () => aggregateLessonStats(stats.lessons, { group, teacher, period, now }),
    [stats.lessons, group, teacher, period, now]
  )

  const teacherOptions = [
    { value: 'all', label: 'Все преподаватели' },
    ...stats.teachers.map((item) => ({ value: item, label: item })),
  ]

  const periods = [
    ...BASE_PERIODS,
    ...[8, 9, 10, 11].map((month) => ({
      id: `month-${month}`,
      label: capitalizeFirst(format(new Date(stats.seasonYear, month, 1), 'LLL', { locale: ru })),
    })),
  ]

  const showPeriod = tab === 'overview' || tab === 'breakdown'
  const hasFilter = group !== 'all' || teacher !== 'all'

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Сентябрь–декабрь {stats.seasonYear}
          {group !== 'all' ? ` · группа ${group}` : ''}
          {teacher !== 'all' ? ` · ${teacher}` : ''}
        </p>
        {hasFilter && (
          <button
            type="button"
            onClick={() => {
              onGroupChange('all')
              onTeacherChange('all')
            }}
            className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Сбросить фильтры
          </button>
        )}
      </div>

      <div>
        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Группа
        </span>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => onGroupChange && onGroupChange('all')}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${chipClass(group === 'all')}`}
          >
            Все
          </button>
          {stats.groups.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onGroupChange && onGroupChange(item)}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium tabular-nums transition-colors ${chipClass(group === item)}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {stats.teachers.length > 0 && (
        <div className="sm:max-w-xs">
          <NiceSelect
            label="Преподаватель"
            value={teacher}
            onChange={onTeacherChange}
            options={teacherOptions}
            icon={Users}
            allLabel="Все преподаватели"
          />
        </div>
      )}

      {showPeriod && (
        <div>
          <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Период
          </span>
          <div className="flex flex-wrap gap-1.5">
            {periods.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onPeriodChange(item.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${chipClass(period === item.id)}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-800/50">
        {TABS.map((item) => {
          const Icon = item.icon
          const active = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-1 py-2 text-[11px] font-medium transition-colors sm:text-xs ${
                active
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Icon size={14} className="hidden sm:block" />
              {item.label}
            </button>
          )
        })}
      </div>

      {tab === 'overview' && (
        <StatsOverview view={view} group={group} now={now} onOpenDate={onOpenDate} />
      )}

      {tab === 'breakdown' && (
        <StatsBreakdown
          view={view}
          group={group}
          teacher={teacher}
          onGroupChange={onGroupChange}
          onTeacherChange={onTeacherChange}
        />
      )}

      {tab === 'calendar' && (
        <StatsCalendar
          stats={stats}
          group={group}
          teacher={teacher}
          period={period}
          onOpenDate={onOpenDate}
        />
      )}

      {tab === 'remaining' && (
        <StatsRemaining
          stats={stats}
          group={group}
          teacher={teacher}
          now={now}
          onOpenDate={onOpenDate}
        />
      )}
    </section>
  )
}
