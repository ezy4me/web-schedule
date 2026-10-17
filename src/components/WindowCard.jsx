import React from 'react'

export default function WindowCard({ time }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
      <span className="font-medium tabular-nums text-zinc-500 dark:text-zinc-400">{time}</span>
      <span>Окно — свободное время</span>
    </div>
  )
}
