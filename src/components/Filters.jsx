import React from 'react'
import { Users, Tag, Search, X, Layers } from 'lucide-react'
import { LESSON_TYPES } from '../data/schedule.js'
import NiceSelect from './NiceSelect.jsx'

export default function Filters({
  group,
  onGroupChange,
  type,
  onTypeChange,
  query,
  onQueryChange,
  groups,
}) {
  const groupOptions = [
    { value: 'all', label: 'Все группы', icon: <Users size={16} /> },
    ...groups.map((g) => ({ value: g, label: g })),
  ]

  const typeOptions = [
    { value: 'all', label: 'Все типы', icon: <Layers size={16} /> },
    ...LESSON_TYPES.map((t) => ({ value: t, label: t })),
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <NiceSelect
        label="Группа"
        value={group}
        onChange={onGroupChange}
        options={groupOptions}
        icon={Users}
        allLabel="Все группы"
      />

      <NiceSelect
        label="Тип занятия"
        value={type}
        onChange={onTypeChange}
        options={typeOptions}
        icon={Tag}
        allLabel="Все типы"
      />

      <div className="relative sm:col-span-2">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Поиск: дисциплина или аудитория..."
          className="w-full rounded-xl border border-white/70 bg-white/70 py-2.5 pl-10 pr-9 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200/80 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-violet-400/60 dark:focus:ring-violet-500/30"
        />
        {query && (
          <button onClick={() => onQueryChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
