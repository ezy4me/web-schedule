import React from 'react'
import { toDDMM } from '../utils/schedule.js'

export default function Statistics({ stats, group }) {
  const { groups, remainingLessons, totalLessons, remainingCount } = stats

  const list =
    group === 'all'
      ? remainingLessons
      : remainingLessons.filter((lesson) => lesson.groups?.includes(group))

  const sorted = [...list].sort(
    (a, b) => a.date - b.date || a.time.localeCompare(b.time)
  )

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Статистика по парам
        </h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Всего {totalLessons} · осталось {remainingCount}
        </span>
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 text-left text-xs text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400">
              <th className="px-3 py-2 font-medium">Группа</th>
              <th className="px-3 py-2 text-right font-medium">Пар</th>
              <th className="px-3 py-2 text-right font-medium">Осталось</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.group} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-1.5 text-zinc-700 dark:text-zinc-200">{g.group}</td>
                <td className="px-3 py-1.5 text-right tabular-nums text-zinc-600 dark:text-zinc-300">
                  {g.total}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                  {g.remaining}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Оставшиеся пары
          </h3>
          <span className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
            {sorted.length}
          </span>
        </div>

        {sorted.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">Пар не осталось</p>
        ) : (
          <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {sorted.map((lesson, i) => (
              <li
                key={`${toDDMM(lesson.date)}-${lesson.time}-${lesson.subject}-${i}`}
                className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg border border-zinc-100 px-3 py-2 dark:border-zinc-800"
              >
                <span className="text-xs font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
                  {toDDMM(lesson.date)}
                </span>
                <span className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
                  {lesson.time}
                </span>
                <span className="text-sm text-zinc-700 dark:text-zinc-200">
                  {lesson.subject}
                </span>
                <span className="ml-auto text-xs text-zinc-400 dark:text-zinc-500">
                  {lesson.type}
                  {lesson.groups && lesson.groups.length
                    ? ` · ${lesson.groups.join(', ')}`
                    : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
