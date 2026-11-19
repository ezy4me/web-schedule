import React, { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { BarChart3, CalendarRange, Clock, Download, Layers, PieChart, Users } from 'lucide-react'
import { aggregateLessonStats, getSemesterInfo } from '../utils/schedule.js'
import { buildICS, downloadICS } from '../utils/ics.js'
import { capitalizeFirst } from '../utils/statsFormat.js'
import StatsOverview from './StatsOverview.jsx'
import StatsAnalytics from './StatsAnalytics.jsx'
import StatsBreakdown from './StatsBreakdown.jsx'
import StatsCalendar from './StatsCalendar.jsx'
import StatsRemaining from './StatsRemaining.jsx'
import NiceSelect from './NiceSelect.jsx'

const TABS = [
  { id: 'overview', label: 'Обзор', icon: BarChart3 },
  { id: 'analytics', label: 'Графики', icon: PieChart },
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
    ? 'border-ink bg-ink text-paper dark:border-stone-100 dark:bg-stone-100 dark:text-ink'
    : 'border-stone-200 bg-white text-ink-muted hover:border-stone-300 hover:bg-stone-50 hover:text-ink dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-100'
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
    () =>
      aggregateLessonStats(stats.lessons, {
        group,
        teacher,
        period,
        now,
        semester: stats.semester,
        year: stats.seasonYear,
      }),
    [stats.lessons, stats.semester, stats.seasonYear, group, teacher, period, now]
  )

  const teacherOptions = [
    { value: 'all', label: 'Все преподаватели' },
    ...stats.teachers.map((item) => ({ value: item, label: item })),
  ]

  const exportLessons = useMemo(
    () =>
      stats.lessons.filter(
        (lesson) =>
          (group === 'all' || lesson.groups.includes(group)) &&
          (teacher === 'all' || lesson.teacher === teacher)
      ),
    [stats.lessons, group, teacher]
  )

  const exportCalendar = () => {
    if (!exportLessons.length) return
    const parts = [
      group !== 'all' ? `группа ${group}` : '',
      teacher !== 'all' ? teacher : '',
    ].filter(Boolean)
    const calendarName = `Расписание${parts.length ? ` — ${parts.join(', ')}` : ''}`
    const filename = `schedule-${(group !== 'all' ? group : teacher !== 'all' ? teacher : 'semester')
      .replace(/[^\wа-яё-]+/gi, '-')
      .toLowerCase()}.ics`
    downloadICS(filename, buildICS(exportLessons, { calendarName }))
  }

  const semesterInfo = getSemesterInfo(stats.semester)
  const periods = [
    ...BASE_PERIODS,
    ...semesterInfo.months.map((month) => ({
      id: `month-${month}`,
      label: capitalizeFirst(format(new Date(stats.seasonYear, month, 1), 'LLL', { locale: ru })),
    })),
  ]

  const showPeriod = tab === 'overview' || tab === 'breakdown' || tab === 'analytics'
  const hasFilter = group !== 'all' || teacher !== 'all'

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="min-w-0 text-xs text-ink-muted dark:text-stone-400">
          {semesterInfo.rangeLabel} {stats.seasonYear}
          {group !== 'all' ? ` · группа ${group}` : ''}
          {teacher !== 'all' ? ` · ${teacher}` : ''}
        </p>
        <div className="flex shrink-0 items-center gap-3">
          {hasFilter && (
            <button
              type="button"
              onClick={() => {
                onGroupChange('all')
                onTeacherChange('all')
              }}
              className="text-xs font-medium text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline dark:text-stone-400 dark:hover:text-stone-100"
            >
              Сбросить
            </button>
          )}
          <button
            type="button"
            onClick={exportCalendar}
            disabled={!exportLessons.length}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 dark:text-stone-400 dark:hover:text-stone-100"
            title="Скачать текущую выборку в формате календаря"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Экспорт .ics</span>
            <span className="sm:hidden">.ics</span>
          </button>
        </div>
      </div>

      <div>
        <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.08em] text-ink-faint dark:text-stone-500">
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
          <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.08em] text-ink-faint dark:text-stone-500">
            Период
          </span>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-thin sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
            {periods.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onPeriodChange(item.id)}
                className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${chipClass(period === item.id)}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="-mx-1 flex gap-0.5 overflow-x-auto rounded-lg border border-stone-200 bg-stone-100/70 p-0.5 scrollbar-thin dark:border-stone-800 dark:bg-stone-900/60">
        {TABS.map((item) => {
          const Icon = item.icon
          const active = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              aria-pressed={active}
              className={`inline-flex min-w-[68px] flex-1 shrink-0 items-center justify-center gap-1.5 rounded-md px-1.5 py-2 text-[11px] font-medium transition-colors sm:text-xs ${
                active
                  ? 'bg-white text-ink shadow-sm dark:bg-stone-800 dark:text-stone-100'
                  : 'text-ink-muted hover:text-ink dark:text-stone-400 dark:hover:text-stone-200'
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

      {tab === 'analytics' && (
        <StatsAnalytics stats={stats} view={view} group={group} teacher={teacher} />
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
