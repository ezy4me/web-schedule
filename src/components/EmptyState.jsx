import React from 'react'
import { PartyPopper, FilterX } from 'lucide-react'

export default function EmptyState({ hasFilters }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {hasFilters ? (
        <>
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <FilterX size={28} className="text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-lg font-semibold text-slate-600 dark:text-slate-200">Ничего не найдено</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Попробуйте изменить фильтры или запрос</p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center mb-4">
            <PartyPopper size={28} className="text-emerald-500 dark:text-emerald-400" />
          </div>
          <p className="text-lg font-semibold text-slate-600 dark:text-slate-200">В этот день пар нет 🎉</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Наслаждайтесь свободным временем</p>
        </>
      )}
    </div>
  )
}
