import React, { useState } from 'react'
import { ChevronDown, Search, Users } from 'lucide-react'
import { TYPE_ORDER, TYPE_STYLES } from '../constants.js'
import { StatsCard } from './StatsCharts.jsx'
import { hoursLabel } from '../utils/statsFormat.js'

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

export default function StatsBreakdown({ view, group, onGroupChange }) {
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
    { key: 'hours', label: 'Часы', numeric: true, wideOnly: true },
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
          className={`inline-flex flex-col items-start text-left ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-800 hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400'}`}
        >
          <span className="flex items-center gap-1.5 font-medium">
            <Users size={13} className="text-zinc-400" />
            {row.name}
          </span>
          <span className="text-[11px] font-normal text-zinc-400 dark:text-zinc-500">{subjectCount} предм.</span>
        </button>
      )
    }
    if (current.id === 'types') {
      return (
        <span className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TYPE_STYLES[row.key]?.dot || 'bg-zinc-400'}`} />
          {typeLabel(row.key)}
        </span>
      )
    }
    if (current.id === 'subjects') {
      return (
        <span className="block min-w-0">
          <span className="block max-w-[16rem] truncate" title={row.name}>{row.name}</span>
          <span className="block max-w-[16rem] truncate text-[11px] text-zinc-400 dark:text-zinc-500">
            {row.groups.join(', ')}
          </span>
        </span>
      )
    }
    return <span className="block max-w-[16rem] truncate" title={row.name}>{row.name}</span>
  }

  return (
    <div className="space-y-3">
      {group !== 'all' && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 dark:border-indigo-500/30 dark:bg-indigo-500/10">
          <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Статистика группы {group}</span>
          <button
            type="button"
            onClick={() => onGroupChange('all')}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
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
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              current.id === item.id
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <StatsCard>
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по названию..."
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-800 transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-500 dark:text-zinc-400">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`py-2 font-medium ${column.numeric ? 'text-right' : ''} ${column.wideOnly ? 'hidden sm:table-cell' : ''} ${column.key === 'name' ? 'pr-3' : 'pl-2'}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className={`inline-flex items-center gap-1 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200 ${
                        sort.key === column.key ? 'text-zinc-800 dark:text-zinc-100' : ''
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
                    <tr className="border-t border-zinc-100 dark:border-zinc-800">
                      <td className="py-2 pr-3 text-zinc-700 dark:text-zinc-200">
                        <div className="flex items-center gap-1.5">
                          <div className="min-w-0 flex-1">{renderName(row)}</div>
                          {canExpand && (
                            <button
                              type="button"
                              onClick={() => setExpanded(isOpen ? null : row.key)}
                              aria-label={isOpen ? 'Свернуть' : 'Подробнее'}
                              aria-expanded={isOpen}
                              className="shrink-0 rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            >
                              <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-2 pl-2 text-right tabular-nums text-zinc-600 dark:text-zinc-300">{row.total}</td>
                      <td className="py-2 pl-2 text-right tabular-nums text-zinc-500 dark:text-zinc-400">{row.remaining}</td>
                      <td className="hidden py-2 pl-2 text-right tabular-nums text-zinc-500 dark:text-zinc-400 sm:table-cell">
                        {hoursLabel(row.hours)}
                      </td>
                      <td className="hidden py-2 pl-2 text-right tabular-nums text-zinc-500 dark:text-zinc-400 sm:table-cell">
                        {String(row.share).replace('.', ',')}%
                      </td>
                    </tr>
                    {isOpen && canExpand && (
                      <tr className="border-t border-zinc-100 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-800/30">
                        <td colSpan={columns.length} className="px-3 py-2.5">
                          <div className="space-y-2">
                            {details.filter((detail) => detail.values && detail.values.length > 0).map((detail) => (
                              <div key={detail.label} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                                  {detail.label}
                                </span>
                                {detail.values.map((value) => (
                                  <span
                                    key={value}
                                    className="rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-[11px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
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
          </table>
        </div>

        {rows.length === 0 && (
          <p className="py-4 text-center text-sm text-zinc-400 dark:text-zinc-500">Ничего не найдено</p>
        )}

        {current.id === 'groups' && group === 'all' && view.groupAllocations > view.totals.pairs && (
          <p className="mt-3 text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
            Сумма по группам ({view.groupAllocations}) больше числа занятий ({view.totals.pairs}): совместные лекции учитываются в каждой группе.
          </p>
        )}
      </StatsCard>
    </div>
  )
}
