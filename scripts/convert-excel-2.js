import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const inputPath = path.join(rootDir, 'scripts', 'fixtures', 'excel-2.csv')
const outputPath = path.join(rootDir, 'public', 'excel-2.json')

const DAY_MAP_SHORT = {
  'пн': 'Понедельник',
  'вт': 'Вторник',
  'ср': 'Среда',
  'чт': 'Четверг',
  'пт': 'Пятница',
  'сб': 'Суббота',
  'вс': 'Воскресенье'
}
const DAY_ORDER = {
  'Понедельник': 1,
  'Вторник': 2,
  'Среда': 3,
  'Четверг': 4,
  'Пятница': 5,
  'Суббота': 6,
  'Воскресенье': 7
}
const TIME_ORDER = {
  '08:00': 1,
  '09:40': 2,
  '11:20': 3,
  '13:30': 4,
  '15:10': 5,
  '16:50': 6
}
const TYPE_MAP = {
  'лаб.': 'л.р.',
  'пр.': 'пр',
  'л.': 'лек',
  'л.р.': 'л.р.',
  'пр': 'пр',
  'лек': 'лек'
}

function titleCase(value) {
  return value
    .split(' ')
    .map((word) => (word ? word[0] + word.slice(1).toLowerCase() : word))
    .join(' ')
}

function normalizeTeacher(raw) {
  const text = raw.trim()
  if (!text) return null
  const parts = text.split(/\s+/)
  if (parts.length >= 3) {
    const surname = titleCase(parts[0])
    const initials = `${parts[1][0].toUpperCase()}.${parts[2][0].toUpperCase()}.`
    return `${surname} ${initials}`
  }
  return titleCase(text)
}

function normalizeType(raw, lineNumber) {
  const type = TYPE_MAP[raw.trim()]
  if (!type) {
    throw new Error(`Unknown lesson type ${JSON.stringify(raw)} on line ${lineNumber}`)
  }
  return type
}

function mergeSameLessons(entries) {
  const merged = new Map()
  for (const entry of entries) {
    const key = [
      entry.day,
      entry.time,
      entry.dates.join(','),
      entry.type,
      entry.subject,
      entry.room,
      entry.teacher || '',
      entry.parity || ''
    ].join('|')

    if (!merged.has(key)) {
      merged.set(key, { ...entry })
      continue
    }

    const existing = merged.get(key)
    const groups = existing.group.split(',').map((group) => group.trim()).filter(Boolean)
    const additions = entry.group.split(',').map((group) => group.trim()).filter(Boolean)
    for (const group of additions) {
      if (!groups.includes(group)) groups.push(group)
    }
    groups.sort()
    existing.group = groups.join(', ')
  }

  return [...merged.values()].sort((a, b) => {
    const day = (DAY_ORDER[a.day] || 9) - (DAY_ORDER[b.day] || 9)
    if (day) return day
    const time = (TIME_ORDER[a.time] || 9) - (TIME_ORDER[b.time] || 9)
    if (time) return time
    return a.subject.localeCompare(b.subject, 'ru')
  })
}

function parseRows(text) {
  const lines = text.replace(/^\uFEFF/, '').trim().split('\n').filter((line) => line.trim())
  const header = lines.shift().split(';').map((column) => column.trim())
  const expected = [
    'Группа',
    'День недели',
    'Время',
    'Альтернативное',
    'Дата',
    'Дисциплина',
    'Вид занятий',
    'Аудитория',
    'Здание',
    'Должность',
    'Преподаватель'
  ]
  if (header.length < expected.length || !expected.every((column, index) => header[index] === column)) {
    throw new Error(`Unexpected header: ${header.join(';')}`)
  }

  const entries = []
  lines.forEach((line, index) => {
    const columns = line.split(';')
    if (columns.length < expected.length) {
      throw new Error(`Line ${index + 2} has ${columns.length} columns, expected at least ${expected.length}`)
    }
    const [
      group,
      weekday,
      time,
      parityRaw,
      datesRaw,
      subject,
      typeRaw,
      classroom,
      building,
      ,
      teacherRaw
    ] = columns
    const day = DAY_MAP_SHORT[weekday.trim().toLowerCase()] || weekday.trim()
    const dates = datesRaw.trim().split(/\s+/).filter(Boolean)
    for (const date of dates) {
      if (!/^\d{2}\.\d{2}$/.test(date)) {
        throw new Error(`Invalid date ${JSON.stringify(date)} on line ${index + 2}`)
      }
    }
    if (!/^\d{2}:\d{2}$/.test(time.trim())) {
      throw new Error(`Invalid time ${JSON.stringify(time)} on line ${index + 2}`)
    }

    entries.push({
      day,
      time: time.trim(),
      dates,
      group: group.trim(),
      type: normalizeType(typeRaw, index + 2),
      subject: subject.trim(),
      room: `${building.trim()} / ${classroom.trim()}`,
      teacher: normalizeTeacher(teacherRaw),
      parity: parityRaw.trim() === 'Ч' || parityRaw.trim() === 'Н' ? parityRaw.trim() : null
    })
  })

  return mergeSameLessons(entries)
}

const source = fs.readFileSync(inputPath, 'utf8')
const lessons = parseRows(source)
fs.writeFileSync(outputPath, `${JSON.stringify(lessons, null, 2)}\n`, 'utf8')
console.log(`Parsed ${lessons.length} merged lessons`)
console.log(`Wrote ${path.relative(rootDir, outputPath)}`)
