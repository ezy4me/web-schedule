import React from 'react'
import { CalendarOff, FilterX } from 'lucide-react'

export default function EmptyState({ hasFilters }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-full border border-zinc-200 text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
        {hasFilters ? <FilterX size={20} /> : <CalendarOff size={20} />}
      </div>
      {hasFilters ? (
        <>
          <p className="font-medium text-zinc-600 dark:text-zinc-300">Ничего не найдено</p>
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">Измените фильтры или запрос</p>
        </>
      ) : (
        <>
          <p className="font-medium text-zinc-600 dark:text-zinc-300">В этот день пар нет</p>
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">Свободный день</p>
        </>
      )}
    </div>
  )
}
