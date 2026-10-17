import { BookOpen, FlaskConical, PenTool } from 'lucide-react'

// Цвета бейджей и акцентов по типу занятия
export const TYPE_STYLES = {
  лек: {
    badge: 'bg-blue-50 text-blue-700 ring-blue-200/70 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/25',
    icon: BookOpen,
    label: 'Лекция',
    accent: 'from-blue-500 to-indigo-500',
    glow: 'shadow-[0_8px_24px_-14px_rgba(59,130,246,0.8)]',
  },
  'л.р.': {
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25',
    icon: FlaskConical,
    label: 'Лабораторная',
    accent: 'from-emerald-500 to-teal-500',
    glow: 'shadow-[0_8px_24px_-14px_rgba(16,185,129,0.8)]',
  },
  пр: {
    badge: 'bg-orange-50 text-orange-700 ring-orange-200/70 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-400/25',
    icon: PenTool,
    label: 'Практика',
    accent: 'from-orange-500 to-amber-500',
    glow: 'shadow-[0_8px_24px_-14px_rgba(249,115,22,0.8)]',
  },
}

export const WEEK_TYPE_INFO = {
  odd: {
    label: 'Нечётная неделя',
    dot: 'bg-violet-500',
    chip: 'bg-violet-100/80 text-violet-700 ring-1 ring-violet-200/70 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-400/25',
  },
  even: {
    label: 'Чётная неделя',
    dot: 'bg-sky-500',
    chip: 'bg-sky-100/80 text-sky-700 ring-1 ring-sky-200/70 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/25',
  },
  single: {
    label: 'Особый день',
    dot: 'bg-rose-500',
    chip: 'bg-rose-100/80 text-rose-700 ring-1 ring-rose-200/70 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/25',
  },
}
