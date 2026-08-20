import { BookOpen, FlaskConical, PenTool } from 'lucide-react'

// Цвета бейджей по типу занятия
export const TYPE_STYLES = {
  лек: {
    badge: 'bg-blue-100 text-blue-700 ring-blue-200',
    icon: BookOpen,
    label: 'Лекция',
  },
  'л.р.': {
    badge: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    icon: FlaskConical,
    label: 'Лабораторная',
  },
  пр: {
    badge: 'bg-orange-100 text-orange-700 ring-orange-200',
    icon: PenTool,
    label: 'Практика',
  },
}

export const WEEK_TYPE_INFO = {
  odd: { label: 'Нечётная неделя', dot: 'bg-violet-500', chip: 'bg-violet-100 text-violet-700' },
  even: { label: 'Чётная неделя', dot: 'bg-sky-500', chip: 'bg-sky-100 text-sky-700' },
  single: { label: 'Особый день', dot: 'bg-rose-500', chip: 'bg-rose-100 text-rose-700' },
}
