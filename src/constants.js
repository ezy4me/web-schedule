import { BookOpen, FlaskConical, PenTool } from 'lucide-react'

// Вид занятия: нейтральный бейдж + цветная точка-индикатор.
// Палитра приглушённая: глина, мох, сталь — без «неоновых» сочетаний.
export const TYPE_STYLES = {
  лек: {
    badge: 'bg-stone-100 text-ink-muted ring-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-700',
    dot: 'bg-clay-600 dark:bg-clay-400',
    text: 'text-clay-700 dark:text-clay-300',
    color: '#a2532c',
    icon: BookOpen,
    label: 'Лекция',
  },
  'л.р.': {
    badge: 'bg-stone-100 text-ink-muted ring-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-700',
    dot: 'bg-moss-600 dark:bg-moss-500',
    text: 'text-moss-700 dark:text-moss-300',
    color: '#586a3c',
    icon: FlaskConical,
    label: 'Лабораторная',
  },
  пр: {
    badge: 'bg-stone-100 text-ink-muted ring-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-700',
    dot: 'bg-steel-600 dark:bg-steel-500',
    text: 'text-steel-700 dark:text-steel-300',
    color: '#3d5563',
    icon: PenTool,
    label: 'Практика',
  },
}

export const TYPE_ORDER = ['лек', 'пр', 'л.р.']

export const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export const WEEK_TYPE_INFO = {
  odd: {
    label: 'Нечётная неделя',
    dot: 'bg-ink dark:bg-stone-200',
    chip: 'text-ink-muted dark:text-stone-400',
  },
  even: {
    label: 'Чётная неделя',
    dot: 'bg-stone-400 dark:bg-stone-500',
    chip: 'text-ink-muted dark:text-stone-400',
  },
  single: {
    label: 'Особый день',
    dot: 'bg-clay-600 dark:bg-clay-400',
    chip: 'text-ink-muted dark:text-stone-400',
  },
}
