import React from 'react'
import { Coffee, Clock } from 'lucide-react'

export default function WindowCard({ time }) {
  return (
    <div className="flex gap-4 bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4">
      <div className="flex flex-col items-center justify-center shrink-0">
        <div className="text-base font-bold text-slate-400 dark:text-slate-500">{time}</div>
        <Clock size={14} className="text-slate-300 dark:text-slate-600 mt-1" />
      </div>

      <div className="border-l border-dashed border-slate-200 dark:border-slate-700 self-stretch" />

      <div className="flex-1 min-w-0 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
          <Coffee size={16} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <div className="font-semibold text-slate-600 dark:text-slate-300 text-sm">Окно</div>
          <div className="text-xs text-slate-400 dark:text-slate-500">Свободное время — пар нет</div>
        </div>
      </div>
    </div>
  )
}
