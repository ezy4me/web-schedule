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
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all placeholder:text-slate-400"
        />
        {query && (
          <button onClick={() => onQueryChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
