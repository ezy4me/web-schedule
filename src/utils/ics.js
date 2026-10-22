import { format } from 'date-fns'
import { LESSON_DURATION_MIN } from './stats.js'

function escapeText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function foldLine(line) {
  if (line.length <= 75) return line
  const parts = []
  let rest = line
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75))
    rest = rest.slice(75)
  }
  parts.push(rest)
  return parts.join('\r\n ')
}

function hash(value) {
  let result = 0
  for (let i = 0; i < value.length; i++) {
    result = (result * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(result).toString(36)
}

function stamp(date) {
  return format(date, "yyyyMMdd'T'HHmmss")
}

function stampUTC(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export function buildICS(lessons, { calendarName = 'Учебное расписание' } = {}) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//web-schedule//RU',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
  ]

  for (const lesson of lessons) {
    if (!lesson?.date || !lesson.time) continue
    const [hours, minutes] = String(lesson.time).split(':').map(Number)
    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      continue
    }
    const start = new Date(
      lesson.date.getFullYear(),
      lesson.date.getMonth(),
      lesson.date.getDate(),
      hours,
      minutes,
      0,
      0
    )
    const end = new Date(start.getTime() + LESSON_DURATION_MIN * 60000)
    const groups = Array.isArray(lesson.groups) ? lesson.groups.join(', ') : ''
    const details = [
      groups ? `Группы: ${groups}` : '',
      lesson.type ? `Тип: ${lesson.type}` : '',
      lesson.room ? `Аудитория: ${lesson.room}` : '',
      lesson.teacher ? `Преподаватель: ${lesson.teacher}` : '',
    ]
      .filter(Boolean)
      .join('\n')
    const uid = [
      format(start, 'yyyyMMdd'),
      String(lesson.time).replace(':', ''),
      hash(`${lesson.subject}|${groups}|${lesson.type}|${lesson.room}`),
    ].join('-')

    lines.push(
      'BEGIN:VEVENT',
      foldLine(`UID:${uid}@web-schedule`),
      `DTSTAMP:${stampUTC(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      foldLine(`SUMMARY:${escapeText(lesson.subject || 'Занятие')}`),
      foldLine(`DESCRIPTION:${escapeText(details)}`),
      foldLine(`LOCATION:${escapeText(lesson.room || '')}`),
      'END:VEVENT'
    )
  }

  lines.push('END:VCALENDAR')
  return `${lines.join('\r\n')}\r\n`
}

export function downloadICS(filename, content) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
