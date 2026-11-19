import React from 'react'
import { CalendarOff, FilterX } from 'lucide-react'

export default function EmptyState({ hasFilters }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center sm:py-16">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-full border border-stone-200 text-ink-faint dark:border-stone-800 dark:text-stone-500">
        {hasFilters ? <FilterX size={19} /> : <CalendarOff size={19} />}
      </div>
      {hasFilters ? (
        <>
          <p className="font-medium text-ink-soft dark:text-stone-300">Ничего не найдено</p>
          <p className="mt-1 text-sm text-ink-faint dark:text-stone-500">Измените фильтры или запрос</p>
        </>
      ) : (
        <>
          <p className="font-medium text-ink-soft dark:text-stone-300">В этот день пар нет</p>
          <p className="mt-1 text-sm text-ink-faint dark:text-stone-500">Свободный день</p>
        </>
      )}
    </div>
  )
}
