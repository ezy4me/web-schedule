import React from 'react'
import { Coffee, Clock } from 'lucide-react'

export default function WindowCard({ time }) {
  return (
    <div className="flex animate-fade-up gap-4 rounded-2xl border border-dashed border-slate-300/70 bg-white/40 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/30">
      <div className="flex shrink-0 flex-col items-center justify-center">
        <div className="text-base font-bold tabular-nums text-slate-400 dark:text-slate-500">{time}</div>
        <Clock size={14} className="mt-1 text-slate-300 dark:text-slate-600" />
      </div>

      <div className="self-stretch border-l border-dashed border-slate-200/70 dark:border-white/10" />

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-100/90 dark:bg-amber-500/20">
          <Coffee size={16} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">Окно</div>
          <div className="text-xs text-slate-400 dark:text-slate-500">Свободное время — пар нет</div>
        </div>
      </div>
    </div>
  )
}
