import { BookOpen, FlaskConical, PenTool } from 'lucide-react'

// Вид занятия: нейтральный бейдж + цветная точка-индикатор
export const TYPE_STYLES = {
  лек: {
    badge: 'bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700',
    dot: 'bg-indigo-500',
    icon: BookOpen,
    label: 'Лекция',
  },
  'л.р.': {
    badge: 'bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700',
    dot: 'bg-emerald-500',
    icon: FlaskConical,
    label: 'Лабораторная',
  },
  пр: {
    badge: 'bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700',
    dot: 'bg-amber-500',
    icon: PenTool,
    label: 'Практика',
  },
}

export const TYPE_ORDER = ['лек', 'пр', 'л.р.']

export const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export const WEEK_TYPE_INFO = {
  odd: {
    label: 'Нечётная неделя',
    dot: 'bg-indigo-500',
    chip: 'text-zinc-500 dark:text-zinc-400',
  },
  even: {
    label: 'Чётная неделя',
    dot: 'bg-sky-500',
    chip: 'text-zinc-500 dark:text-zinc-400',
  },
  single: {
    label: 'Особый день',
    dot: 'bg-rose-500',
    chip: 'text-zinc-500 dark:text-zinc-400',
  },
}
