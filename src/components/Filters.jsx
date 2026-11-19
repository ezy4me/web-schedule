import React from 'react'
import { Users, Tag, Search, X, Layers } from 'lucide-react'
import { LESSON_TYPES } from '../data/schedule.js'
import NiceSelect from './NiceSelect.jsx'

export default function Filters({
  group,
  onGroupChange,
  teacher,
  onTeacherChange,
  teachers = [],
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

  const teacherOptions = [
    { value: 'all', label: 'Все преподаватели', icon: <Users size={16} /> },
    ...teachers.map((t) => ({ value: t, label: t })),
  ]

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
      <div className="relative order-first sm:order-none sm:col-span-2">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint dark:text-stone-500" />
        <input
          id="schedule-search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Поиск: дисциплина или аудитория"
          className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pl-9 pr-9 text-sm text-ink transition-colors placeholder:text-ink-faint focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-clay-600/15 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-stone-600 dark:focus:ring-clay-400/20"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            aria-label="Очистить поиск"
            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-ink-faint transition-colors hover:bg-stone-100 hover:text-ink dark:hover:bg-stone-800 dark:hover:text-stone-200"
          >
            <X size={16} />
          </button>
        )}
      </div>

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

      {teachers.length > 0 && (
        <div className="sm:col-span-2">
          <NiceSelect
            label="Преподаватель"
            value={teacher}
            onChange={onTeacherChange}
            options={teacherOptions}
            icon={Users}
            allLabel="Все преподаватели"
          />
        </div>
      )}
    </div>
  )
}
