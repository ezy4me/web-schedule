import { BookOpen, FlaskConical, PenTool } from 'lucide-react'

// Цвета бейджей по типу занятия
export const TYPE_STYLES = {
  лек: {
    badge: 'bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:ring-blue-400/30',
    icon: BookOpen,
    label: 'Лекция',
  },
  'л.р.': {
    badge: 'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-400/30',
    icon: FlaskConical,
    label: 'Лабораторная',
  },
  пр: {
    badge: 'bg-orange-100 text-orange-700 ring-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:ring-orange-400/30',
    icon: PenTool,
    label: 'Практика',
  },
}

export const WEEK_TYPE_INFO = {
  odd: { label: 'Нечётная неделя', dot: 'bg-violet-500', chip: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300' },
  even: { label: 'Чётная неделя', dot: 'bg-sky-500', chip: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300' },
  single: { label: 'Особый день', dot: 'bg-rose-500', chip: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' },
}
