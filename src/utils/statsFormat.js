import { LESSON_DURATION_MIN } from './schedule.js'

export function plural(n, one, few, many) {
  const abs = Math.abs(n) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return many
  if (last > 1 && last < 5) return few
  if (last === 1) return one
  return many
}

export function pairsLabel(n) {
  return `${n} ${plural(n, 'пара', 'пары', 'пар')}`
}

export function daysLabel(n) {
  return `${n} ${plural(n, 'день', 'дня', 'дней')}`
}

export function weeksLabel(n) {
  return `${n} ${plural(n, 'неделя', 'недели', 'недель')}`
}

export function hoursLabel(hours) {
  const value = Number.isInteger(hours) ? String(hours) : String(hours).replace('.', ',')
  return `${value} ч`
}

export function capitalizeFirst(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value
}

// Подсказка «через сколько» до пары (или «идёт сейчас»)
export function nextLessonHint(lesson, now = new Date()) {
  if (!lesson) return ''
  const [h, m] = String(lesson.time || '').split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return ''
  const start = new Date(lesson.date)
  start.setHours(h, m, 0, 0)
  const end = new Date(start.getTime() + LESSON_DURATION_MIN * 60000)
  if (now >= start && now < end) return 'идёт сейчас'
  if (now >= end) return 'завершилась'
  const minutes = Math.ceil((start.getTime() - now.getTime()) / 60000)
  if (minutes < 60) return `через ${minutes} мин`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours < 24) return `через ${hours} ч${rest ? ` ${rest} мин` : ''}`
  const days = Math.round(hours / 24)
  return `через ${daysLabel(days)}`
}
