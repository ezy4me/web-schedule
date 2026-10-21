import React, { useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { toDDMM } from '../utils/schedule.js'
import { TYPE_STYLES } from '../constants.js'

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

const TYPE_ORDER = ['лек', 'пр', 'л.р.']

const CRITERIA = [
  { id: 'groups', name: 'Группа', label: 'По группам' },
  { id: 'subjects', name: 'Предмет', label: 'По предметам' },
  { id: 'types', name: 'Тип', label: 'По типам' },
]

function StatBox({ value, label }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-2xl font-semibold leading-7 tabular-nums text-zinc-900 dark:text-zinc-50">{value}</div>
      <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
    </div>
  )
}

function StatTable({ nameHead, rows }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-50 text-left text-xs text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400">
            <th className="px-3 py-2 font-medium">{nameHead}</th>
            <th className="px-3 py-2 text-right font-medium">Всего</th>
            <th className="px-3 py-2 text-right font-medium">Осталось</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-zinc-100 dark:border-zinc-800">
              <td className="px-3 py-2 text-zinc-700 dark:text-zinc-200">{r.node}</td>
              <td className="px-3 py-2 text-right tabular-nums text-zinc-600 dark:text-zinc-300">{r.total}</td>
              <td className="px-3 py-2 text-right tabular-nums text-zinc-500 dark:text-zinc-400">{r.remaining}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Статистика по парам (отдельная страница): сводка, разрезы и оставшиеся пары по дням
export default function Statistics({ stats, group }) {
  const [criterionId, setCriterionId] = useState('groups')
  const {
    groups,
    byType,
    bySubject,
    remainingLessons,
    totalLessons,
    remainingCount,
  } = stats

  const current = CRITERIA.find((c) => c.id === criterionId) || CRITERIA[0]

  const rowsByCriterion = {
    groups: groups.map((g) => ({
      key: g.group,
      node: <span className="font-medium">{g.group}</span>,
      total: g.total,
      remaining: g.remaining,
    })),
    subjects: bySubject.map((s) => ({
      key: s.subject,
      node: (
        <span className="block min-w-0">
          <span className="block truncate" title={s.subject}>{s.subject}</span>
          <span className="block truncate text-[11px] text-zinc-400 dark:text-zinc-500">
            {s.groups.join(', ')}
          </span>
        </span>
      ),
      total: s.total,
      remaining: s.remaining,
    })),
    types: [...byType]
      .sort((a, b) => {
        const ia = TYPE_ORDER.indexOf(a.type)
        const ib = TYPE_ORDER.indexOf(b.type)
        return (ia === -1 ? TYPE_ORDER.length : ia) - (ib === -1 ? TYPE_ORDER.length : ib)
      })
      .map((t) => ({
        key: t.type || '—',
        node: (
          <span className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TYPE_STYLES[t.type]?.dot || 'bg-zinc-400'}`} />
            {TYPE_STYLES[t.type]?.label || t.type || '—'}
          </span>
        ),
        total: t.total,
        remaining: t.remaining,
      })),
  }

  // Оставшиеся пары — только для выбранной группы (или все); группируем по дням
  const list =
    group === 'all'
      ? remainingLessons
      : remainingLessons.filter((l) => l.groups?.includes(group))

  const todayDdmm = toDDMM(new Date())

  const sections = []
  for (const lesson of list) {
    const ddmm = toDDMM(lesson.date)
    const last = sections[sections.length - 1]
    if (last && last.ddmm === ddmm) last.items.push(lesson)
    else sections.push({ ddmm, date: lesson.date, items: [lesson] })
  }

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <StatBox value={totalLessons} label="Всего пар" />
        <StatBox value={remainingCount} label="Осталось" />
        <StatBox value={groups.length} label="Групп" />
      </div>

      <div className="space-y-2.5">
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-800/50">
          {CRITERIA.map((c) => (
            <button
              key={c.id}
              onClick={() => setCriterionId(c.id)}
              className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                criterionId === c.id
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <StatTable nameHead={current.name} rows={rowsByCriterion[criterionId]} />
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Оставшиеся пары</h3>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {group !== 'all' ? `группа ${group} · ` : ''}
            {remainingCount === 0 ? 'все прошли' : `${list.length} шт.`}
          </span>
        </div>

        {sections.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white px-3 py-4 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500">
            Пары не остались
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {sections.map((s) => (
                <div key={s.ddmm} className="p-3">
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                      {capitalize(format(s.date, 'EEEE, d MMMM', { locale: ru }))}
                    </span>
                    {s.ddmm === todayDdmm && (
                      <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                        Сегодня
                      </span>
                    )}
                    <span className="ml-auto text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
                      {s.items.length}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {s.items.map((l, i) => (
                      <li
                        key={`${l.time}-${l.subject}-${i}`}
                        className="flex items-center gap-2 rounded-lg bg-zinc-50 px-2.5 py-1.5 dark:bg-zinc-800/40"
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TYPE_STYLES[l.type]?.dot || 'bg-zinc-400'}`} />
                        <span className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500">{l.time}</span>
                        <span className="min-w-0 flex-1 truncate text-sm text-zinc-700 dark:text-zinc-200" title={l.subject}>
                          {l.subject}
                        </span>
                        <span className="whitespace-nowrap text-[11px] text-zinc-400 dark:text-zinc-500">
                          {l.groups.join(', ')}{l.room ? ` · ${l.room}` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
