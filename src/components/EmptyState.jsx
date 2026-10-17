import React from 'react'
import { PartyPopper, FilterX } from 'lucide-react'

export default function EmptyState({ hasFilters }) {
  return (
    <div className="flex animate-fade-up flex-col items-center justify-center px-6 py-16 text-center">
      {hasFilters ? (
        <>
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-slate-100/90 ring-1 ring-slate-200/70 dark:bg-slate-800/80 dark:ring-white/10">
            <FilterX size={28} className="text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-lg font-semibold text-slate-600 dark:text-slate-200">Ничего не найдено</p>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Попробуйте изменить фильтры или запрос</p>
        </>
      ) : (
        <>
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20 ring-1 ring-emerald-300/40 dark:from-emerald-500/20 dark:to-teal-500/20 dark:ring-emerald-400/20">
            <PartyPopper size={28} className="text-emerald-500 dark:text-emerald-400" />
          </div>
          <p className="text-lg font-semibold text-slate-600 dark:text-slate-200">В этот день пар нет</p>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Наслаждайтесь свободным временем</p>
        </>
      )}
    </div>
  )
}
