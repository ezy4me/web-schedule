import React, { useMemo } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarCheck2, Clock3, DoorOpen, Layers, Sparkles, TrendingUp } from 'lucide-react'
import { DAY_LABELS, TYPE_ORDER, TYPE_STYLES } from '../constants.js'
import { buildHeatmap, cumulativeSeries, monthSeries, topN } from '../utils/insights.js'
import { academicHoursLabel, capitalizeFirst, pairsLabel } from '../utils/statsFormat.js'
import { AreaChart, CompareBars, DonutChart, Heatmap, MonthBars, RingProgress } from './Charts.jsx'

const OTHER_COLOR = '#9a9387'

function Panel({ title, subtitle, icon: Icon, children, className = '' }) {
  return (
    <section
      className={`min-w-0 rounded-xl border border-stone-200 bg-white p-3.5 dark:border-stone-800 dark:bg-stone-900 sm:p-4 ${className}`}
    >
      {(title || subtitle) && (
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {Icon && (
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-stone-100 text-ink-muted dark:bg-stone-800 dark:text-stone-300">
                <Icon size={14} />
              </span>
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-ink dark:text-stone-100">{title}</h3>
              {subtitle && <p className="mt-0.5 text-[11px] text-ink-faint dark:text-stone-500">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}
      {children}
    </section>
  )
}

function MiniStat({ value, label }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50/60 px-2.5 py-2 dark:border-stone-800 dark:bg-stone-950/40">
      <div className="text-base font-semibold leading-tight tabular-nums text-ink dark:text-stone-50 sm:text-lg">
        {value}
      </div>
      <div className="mt-0.5 text-[11px] leading-tight text-ink-muted dark:text-stone-400">{label}</div>
    </div>
  )
}

function typeSort(a, b) {
  const ai = TYPE_ORDER.indexOf(a.key)
  const bi = TYPE_ORDER.indexOf(b.key)
  return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
}

export default function StatsAnalytics({ stats, view, group, teacher }) {
  // Занятия выбранной группы/преподавателя за весь семестр — для теплокарты и месяцев.
  const lessons = useMemo(
    () =>
      stats.lessons.filter(
        (lesson) =>
          (group === 'all' || lesson.groups.includes(group)) &&
          (teacher === 'all' || lesson.teacher === teacher)
      ),
    [stats.lessons, group, teacher]
  )

  const heatmap = useMemo(() => buildHeatmap(lessons), [lessons])

  const months = useMemo(
    () => monthSeries(lessons, stats.semester, stats.seasonYear),
    [lessons, stats.semester, stats.seasonYear]
  )
  const monthLabels = useMemo(
    () =>
      months.map((item) =>
        capitalizeFirst(format(new Date(stats.seasonYear, item.month, 1), 'LLL', { locale: ru }))
      ),
    [months, stats.seasonYear]
  )

  const cumulative = useMemo(() => cumulativeSeries(view.byWeek), [view.byWeek])
  const areaPoints = useMemo(
    () => cumulative.map((week) => ({ value: week.cumulative, week: week.week })),
    [cumulative]
  )
  const areaLabels = useMemo(() => {
    if (!cumulative.length) return []
    const first = format(cumulative[0].monday, 'd MMM', { locale: ru })
    const last = format(cumulative[cumulative.length - 1].monday, 'd MMM', { locale: ru })
    return [first, 'недели', last]
  }, [cumulative])

  const typeItems = useMemo(
    () =>
      [...view.byType]
        .sort(typeSort)
        .map((item) => ({
          key: item.key,
          label: TYPE_STYLES[item.key]?.label || item.name,
          value: item.total,
          color: TYPE_STYLES[item.key]?.color,
        })),
    [view.byType]
  )

  const subjectItems = useMemo(() => {
    const rows = [...view.bySubject].sort((a, b) => b.total - a.total)
    const top = rows.slice(0, 5).map((item) => ({
      key: item.key,
      label: item.name,
      value: item.total,
    }))
    const rest = rows.slice(5).reduce((sum, item) => sum + item.total, 0)
    if (rest > 0) top.push({ key: '__other', label: 'Другие предметы', value: rest, color: OTHER_COLOR })
    return top
  }, [view.bySubject])

  const roomItems = useMemo(
    () =>
      topN(view.byRoom, 6).map((room) => ({
        key: room.key,
        label: room.name,
        value: room.total,
      })),
    [view.byRoom]
  )

  const groupItems = useMemo(
    () =>
      topN(view.byGroup, 8).map((item) => ({
        key: item.key,
        label: item.name,
        value: item.total,
      })),
    [view.byGroup]
  )

  const busiestDay = useMemo(
    () =>
      view.byWeekday.reduce(
        (best, day) => (day.total > best.total ? day : best),
        view.byWeekday[0] || { total: 0, weekday: 1 }
      ),
    [view.byWeekday]
  )

  const busiestTime = useMemo(
    () =>
      view.byTime.reduce(
        (best, slot) => (slot.total > best.total ? slot : best),
        view.byTime[0] || { total: 0, time: '—' }
      ),
    [view.byTime]
  )

  const busiestRoom = roomItems[0]
  const avgPerDay = view.totals.studyDays
    ? Math.round((view.totals.pairs / view.totals.studyDays) * 10) / 10
    : 0

  const insightRows = [
    {
      label: 'Самый плотный день',
      value: busiestDay.total
        ? `${DAY_LABELS[busiestDay.weekday - 1]} · ${pairsLabel(busiestDay.total)}`
        : '—',
    },
    {
      label: 'Пиковое время',
      value: busiestTime.total ? `${busiestTime.time} · ${pairsLabel(busiestTime.total)}` : '—',
    },
    {
      label: 'Любимая аудитория',
      value: busiestRoom && busiestRoom.value ? `${busiestRoom.label} · ${busiestRoom.value}` : '—',
    },
    {
      label: 'В среднем за учебный день',
      value: `${avgPerDay} пар`,
    },
  ]

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat value={pairsLabel(view.totals.pairs)} label="в выбранном периоде" />
        <MiniStat value={academicHoursLabel(view.totals.academicHours)} label="нагрузка" />
        <MiniStat value={view.totals.studyDays} label="учебных дней" />
        <MiniStat value={`${view.totals.progress}%`} label="семестр пройден" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
        <Panel title="Структура занятий" subtitle="по видам" icon={Layers}>
          <DonutChart items={typeItems} centerLabel="пар" />
        </Panel>

        <Panel title="Топ предметов" subtitle="по количеству пар" icon={Sparkles}>
          <DonutChart items={subjectItems} centerLabel="пар" />
        </Panel>

        <Panel
          title="Накопительная нагрузка"
          subtitle="пар по неделям семестра"
          icon={TrendingUp}
          className="md:col-span-2"
        >
          {areaPoints.length ? (
            <>
              <AreaChart points={areaPoints} labels={areaLabels} height={150} />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-faint dark:text-stone-500">
                <span>
                  Пик недели:{' '}
                  <span className="font-medium text-ink-muted dark:text-stone-300">
                    {Math.max(0, ...view.byWeek.map((week) => week.total))} пар
                  </span>
                </span>
                <span>
                  Всего:{' '}
                  <span className="font-medium text-ink-muted dark:text-stone-300">
                    {view.totals.pairs}
                  </span>
                </span>
              </div>
            </>
          ) : (
            <p className="py-4 text-center text-xs text-ink-faint dark:text-stone-500">Нет данных</p>
          )}
        </Panel>

        <Panel title="По месяцам" subtitle="за весь семестр" icon={CalendarCheck2}>
          <MonthBars items={months} labels={monthLabels} />
        </Panel>

        <Panel
          title="Прогресс семестра"
          subtitle={`${stats.semester === 'spring' ? 'Весна' : 'Осень'} ${stats.seasonYear}`}
          icon={Clock3}
        >
          <RingProgress
            value={view.totals.progress}
            label={`${view.totals.seasonPast} из ${view.totals.seasonPairs} пар`}
            caption={`Осталось ${pairsLabel(view.totals.seasonRemaining)} · ${view.totals.weeksLeft} нед.`}
          />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <MiniStat value={view.totals.seasonPairs} label="пар в семестре" />
            <MiniStat value={view.totals.streamPairs} label="потоковых пар" />
          </div>
        </Panel>

        <Panel
          title="Теплокарта недели"
          subtitle="когда нагрузка максимальна"
          icon={CalendarCheck2}
          className="md:col-span-2"
        >
          <Heatmap heatmap={heatmap} dayLabels={DAY_LABELS.slice(0, 6)} labels={{ less: 'меньше', more: 'больше' }} />
        </Panel>

        <Panel title="Аудитории" subtitle="топ по загрузке" icon={DoorOpen}>
          {roomItems.length ? (
            <CompareBars items={roomItems} valueLabel="пар" />
          ) : (
            <p className="py-4 text-center text-xs text-ink-faint dark:text-stone-500">Нет данных</p>
          )}
        </Panel>

        <Panel title="Группы" subtitle="по количеству пар" icon={Layers}>
          {groupItems.length ? (
            <CompareBars items={groupItems} valueLabel="пар" />
          ) : (
            <p className="py-4 text-center text-xs text-ink-faint dark:text-stone-500">Нет данных</p>
          )}
        </Panel>

        <Panel title="Инсайты" subtitle="самое заметное в расписании" icon={Sparkles} className="md:col-span-2">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {insightRows.map((row) => (
              <li
                key={row.label}
                className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-stone-50/60 px-3 py-2 dark:border-stone-800 dark:bg-stone-950/40"
              >
                <span className="text-xs text-ink-muted dark:text-stone-400">{row.label}</span>
                <span className="text-right text-xs font-medium text-ink-soft dark:text-stone-100">
                  {row.value}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
