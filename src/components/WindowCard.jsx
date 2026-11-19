import React from 'react'

export default function WindowCard({ time }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-stone-300 bg-stone-50/40 px-3 py-3 text-sm text-ink-faint dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-500 sm:px-4">
      <span className="font-medium tabular-nums text-ink-muted dark:text-stone-400">{time}</span>
      <span>Окно — свободное время</span>
    </div>
  )
}
