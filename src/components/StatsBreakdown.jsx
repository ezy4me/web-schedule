import React, { useState } from 'react'
import { ChevronDown, Search, Users } from 'lucide-react'
import { TYPE_ORDER, TYPE_STYLES } from '../constants.js'
import { StatsCard } from './StatsCharts.jsx'
import { academicHoursLabel } from '../utils/statsFormat.js'

const DIMENSIONS = [
  { id: 'groups', label: 'Группы', head: 'Группа' },
  { id: 'subjects', label: 'Предметы', head: 'Предмет' },
  { id: 'types', label: 'Типы', head: 'Тип' },
  { id: 'rooms', label: 'Аудитории', head: 'Аудитория' },
  { id: 'teachers', label: 'Преподаватели', head: 'Преподаватель' },
]

function typeLabel(key) {
  return TYPE_STYLES[key]?.label || key || '—'
}

function detailsFor(dimension, row, view) {
  if (dimension === 'groups') {
    const subjects = view.bySubject.filter((s) => s.groups.includes(row.key))
    const rooms = [...new Set(subjects.flatMap((s) => s.rooms))].sort((a, b) => a.localeCompare(b, 'ru'))
    return [
      { label: 'Предметы', values: subjects.map((s) => `${s.name} · ${s.total}`) },
      { label: 'Аудитории', values: rooms },
    ]
  }
  if (dimension === 'subjects') {
    const typeKeys = [...new Set([...TYPE_ORDER, ...Object.keys(row.types)])].filter((key) => row.types[key])
    return [
      { label: 'Типы', values: typeKeys.map((key) => `${typeLabel(key)} · ${row.types[key]}`) },
      { label: 'Группы', values: row.groups },
      { label: 'Аудитории', values: row.rooms },
      { label: 'Преподаватели', values: row.teachers },
    ]
  }
  if (dimension === 'rooms') {
    return [{ label: 'Предметы', values: row.subjects }]
  }
  if (dimension === 'teachers') {
    return [
      { label: 'Предметы', values: row.subjects },
      { label: 'Аудитории', values: row.rooms },
    ]
  }
  return []
}

export default function StatsBreakdown({ view, group, teacher, onGroupChange, onTeacherChange }) {
  const [dimension, setDimension] = useState('groups')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: 'total', dir: 'desc' })
  const [expanded, setExpanded] = useState(null)

  const available = DIMENSIONS.filter((d) => d.id !== 'teachers' || view.byTeacher.length > 0)
  const current = available.find((d) => d.id === dimension) || available[0]

  const allRows =
    current.id === 'groups'
      ? view.byGroup
      : current.id === 'subjects'
        ? view.bySubject
        : current.id === 'types'
          ? view.byType
          : current.id === 'rooms'
            ? view.byRoom
            : view.byTeacher

  const normalizedQuery = query.trim().toLowerCase()
  const rows = allRows
    .filter((row) => !normalizedQuery || row.name.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1
      const va = a[sort.key]
      const vb = b[sort.key]
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb), 'ru') * dir
    })

  const selectDimension = (id) => {
    setDimension(id)
    setQuery('')
    setExpanded(null)
  }

  const toggleSort = (key) => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' }))
  }

  const columns = [
    { key: 'name', label: current.head, numeric: false },
    { key: 'total', label: 'Пар', numeric: true },
    { key: 'remaining', label: 'Осталось', numeric: true },
    { key: 'academicHours', label: current.id === 'groups' ? 'Ак. ч группы' : 'Ак. ч', numeric: true, wideOnly: true },
    { key: 'share', label: 'Доля', numeric: true, wideOnly: true },
  ]

  const renderName = (row) => {
    if (current.id === 'groups') {
      const active = group === row.key
      const subjectCount = view.bySubject.filter((s) => s.groups.includes(row.key)).length
      return (
        <button
          type="button"
          onClick={() => onGroupChange(active ? 'all' : row.key)}
          title={active ? 'Показать все группы' : `Статистика группы ${row.key}`}
          className={`inline-flex flex-col items-start text-left ${active ? 'text-clay-700 dark:text-clay-300' : 'text-ink-soft hover:text-clay-700 dark:text-stone-100 dark:hover:text-clay-300'}`}
        >
          <span className="flex items-center gap-1.5 font-medium">
            <Users size={13} className="text-ink-faint dark:text-stone-500" />
            {row.name}
          </span>
          <span className="text-[11px] font-normal text-ink-faint dark:text-stone-500">{subjectCount} предм.</span>
        </button>
      )
    }
    if (current.id === 'types') {
      return (
        <span className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TYPE_STYLES[row.key]?.dot || 'bg-stone-400'}`} />
          {typeLabel(row.key)}
        </span>
      )
    }
    if (current.id === 'teachers') {
      const active = teacher === row.key
      return (
        <button
          type="button"
          onClick={() => onTeacherChange(active ? 'all' : row.key)}
          title={active ? 'Показать всех преподавателей' : `Статистика преподавателя ${row.key}`}
          className={`inline-flex max-w-[15rem] items-center gap-1.5 truncate text-left font-medium ${
            active
              ? 'text-clay-700 dark:text-clay-300'
              : 'text-ink-soft hover:text-clay-700 dark:text-stone-100 dark:hover:text-clay-300'
          }`}
        >
          <Users size={13} className="shrink-0 text-ink-faint dark:text-stone-500" />
          <span className="truncate">{row.name}</span>
        </button>
      )
    }
    if (current.id === 'subjects') {
      return (
        <span className="block min-w-0">
          <span className="block max-w-[15rem] truncate" title={row.name}>{row.name}</span>
          <span className="block max-w-[15rem] truncate text-[11px] text-ink-faint dark:text-stone-500">
            {row.groups.join(', ')}
          </span>
        </span>
      )
    }
    return <span className="block max-w-[15rem] truncate" title={row.name}>{row.name}</span>
  }

  return (
    <div className="space-y-3">
      {(group !== 'all' || teacher !== 'all') && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-clay-200 bg-clay-50/70 px-3 py-2 dark:border-clay-500/30 dark:bg-clay-500/10">
          <span className="min-w-0 truncate text-xs font-medium text-clay-800 dark:text-clay-300">
            {group !== 'all' ? `Группа ${group}` : ''}
            {group !== 'all' && teacher !== 'all' ? ' · ' : ''}
            {teacher !== 'all' ? teacher : ''}
          </span>
          <button
            type="button"
            onClick={() => {
              onGroupChange('all')
              onTeacherChange('all')
            }}
            className="shrink-0 text-xs font-medium text-clay-700 underline-offset-4 hover:underline dark:text-clay-300"
          >
            Сбросить
          </button>
        </div>
      )}

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-thin">
        {available.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => selectDimension(item.id)}
            aria-pressed={current.id === item.id}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              current.id === item.id
                ? 'border-ink bg-ink text-paper dark:border-stone-100 dark:bg-stone-100 dark:text-ink'
                : 'border-stone-200 bg-white text-ink-muted hover:border-stone-300 hover:bg-stone-50 hover:text-ink dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <StatsCard>
        <div className="relative mb-3">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint dark:text-stone-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по названию..."
            className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm text-ink transition-colors placeholder:text-ink-faint focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-clay-600/15 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-stone-600"
          />
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[320px] text-sm">
            <thead>
              <tr className="text-left text-[11px] text-ink-muted dark:text-stone-400">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`whitespace-nowrap py-2 font-medium ${column.numeric ? 'text-right' : ''} ${column.wideOnly ? 'hidden sm:table-cell' : ''} ${column.key === 'name' ? 'pr-3' : 'pl-2'}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className={`inline-flex items-center gap-1 transition-colors hover:text-ink dark:hover:text-stone-200 ${
                        sort.key === column.key ? 'text-ink dark:text-stone-100' : ''
                      }`}
                    >
                      {column.label}
                      <span className="text-[9px]">{sort.key === column.key ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const details = detailsFor(current.id, row, view)
                const canExpand = details.some((detail) => detail.values && detail.values.length > 0)
                const isOpen = expanded === row.key
                return (
                  <React.Fragment key={row.key}>
                    <tr className="border-t border-stone-100 dark:border-stone-800">
                      <td className="py-2 pr-3 text-ink-soft dark:text-stone-200">
                        <div className="flex items-center gap-1.5">
                          <div className="min-w-0 flex-1">{renderName(row)}</div>
                          {canExpand && (
                            <button
                              type="button"
                              onClick={() => setExpanded(isOpen ? null : row.key)}
                              aria-label={isOpen ? 'Свернуть' : 'Подробнее'}
                              aria-expanded={isOpen}
                              className="shrink-0 rounded p-1 text-ink-faint transition-colors hover:bg-stone-100 hover:text-ink dark:hover:bg-stone-800 dark:hover:text-stone-200"
                            >
                              <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-2 pl-2 text-right tabular-nums text-ink-soft dark:text-stone-300">{row.total}</td>
                      <td className="py-2 pl-2 text-right tabular-nums text-ink-muted dark:text-stone-400">{row.remaining}</td>
                      <td className="hidden py-2 pl-2 text-right tabular-nums text-ink-muted dark:text-stone-400 sm:table-cell">
                        {academicHoursLabel(row.academicHours)}
                      </td>
                      <td className="hidden py-2 pl-2 text-right tabular-nums text-ink-muted dark:text-stone-400 sm:table-cell">
                        {String(row.share).replace('.', ',')}%
                      </td>
                    </tr>
                    {isOpen && canExpand && (
                      <tr className="border-t border-stone-100 bg-stone-50/60 dark:border-stone-800 dark:bg-stone-800/30">
                        <td colSpan={columns.length} className="px-3 py-2.5">
                          <div className="space-y-2">
                            {details.filter((detail) => detail.values && detail.values.length > 0).map((detail) => (
                              <div key={detail.label} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-faint dark:text-stone-500">
                                  {detail.label}
                                </span>
                                {detail.values.map((value) => (
                                  <span
                                    key={value}
                                    className="rounded-md border border-stone-200 bg-white px-1.5 py-0.5 text-[11px] text-ink-muted dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"
                                  >
                                    {value}
                                  </span>
                                ))}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
            {current.id === 'groups' && (
              <tfoot>
                <tr className="border-t border-stone-200 text-xs font-medium text-ink-soft dark:border-stone-700 dark:text-stone-300">
                  <td className="py-2 pr-3">Итого по группам</td>
                  <td className="py-2 pl-2 text-right tabular-nums">{view.totals.groupPairs}</td>
                  <td className="py-2 pl-2 text-right tabular-nums">{view.totals.groupRemaining}</td>
                  <td className="hidden py-2 pl-2 text-right tabular-nums sm:table-cell">
                    {academicHoursLabel(view.totals.groupAcademicHours)}
                  </td>
                  <td className="hidden py-2 pl-2 text-right tabular-nums sm:table-cell">100%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {rows.length === 0 && (
          <p className="py-4 text-center text-sm text-ink-faint dark:text-stone-500">Ничего не найдено</p>
        )}

        {current.id === 'groups' && group === 'all' && view.groupAllocations > view.totals.pairs && (
          <p className="mt-3 text-[11px] leading-relaxed text-ink-faint dark:text-stone-500">
            Сумма по группам: {view.totals.groupPairs} пар · {academicHoursLabel(view.totals.groupAcademicHours)}.
            Это больше уникальной нагрузки ({view.totals.pairs} пар · {academicHoursLabel(view.totals.academicHours)}),
            потому что потоковые лекции идут в нагрузку каждой группы, но в общем итоге считаются один раз.
          </p>
        )}
      </StatsCard>
    </div>
  )
}
