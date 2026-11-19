import React from 'react'
import { TYPE_STYLES } from '../constants.js'

// Пометка вида занятия: иконка + подпись в приглушённом цвете типа
export default function TypeChip({ type, size = 'md' }) {
  const style = TYPE_STYLES[type]
  if (!style) {
    return type ? (
      <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-ink-muted ring-1 ring-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-700">
        {type}
      </span>
    ) : null
  }
  const Icon = style.icon
  const small = size === 'sm'
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium normal-case ring-1 ${style.chip} ${
        small ? 'gap-1 px-1.5 py-0 text-[10px]' : 'gap-1 px-2 py-0.5 text-[11px]'
      }`}
    >
      <Icon size={small ? 10 : 11} strokeWidth={2.2} />
      {style.label}
    </span>
  )
}
