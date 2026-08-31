import { parse, format, startOfWeek, differenceInCalendarWeeks, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  SEMESTER_START,
  SEMESTER_END,
  SCHEDULE,
  SPECIAL_PAIRS,
  SINGLE_EVENT_DATES,
} from '../data/schedule.js'

export const DDMM = 'dd.MM'
export const FULL_DATE = 'dd.MM.yyyy'

// Преобразование "DD.MM" в полноценную дату текущего года
export function parseDDMM(str, year = new Date().getFullYear()) {
  return parse(str, DDMM, new Date(year, 0, 1))
}

export function toDDMM(date) {
  return format(date, DDMM)
}

// Номер недели с 01.09 (неделя 0 = чётная, неделя 1 = нечётная)
export function getWeekIndex(date) {
  const semesterStart = parseDDMM(SEMESTER_START, date.getFullYear())
  // Понедельник недели, в которую попадает 01.09
  const baseMonday = startOfWeek(semesterStart, { weekStartsOn: 1 })
  const dateMonday = startOfWeek(date, { weekStartsOn: 1 })
  return differenceInCalendarWeeks(dateMonday, baseMonday, { weekStartsOn: 1 })
}

// Тип недели: 'odd' | 'even' | 'single'
export function getWeekType(date, data) {
  const singleDates = data?.single_event_dates || []
  if (singleDates.includes(toDDMM(date))) return 'single'
  const idx = getWeekIndex(date)
  // idx даже => чётная, idx нечёт => нечётная (неделя 0 = чётная)
  return idx % 2 === 0 ? 'even' : 'odd'
}

// Разбор notes вида "+17.11, 01.12, 15.12" -> список дат DD.MM
function parseNotesDates(notes) {
  if (!notes) return []
  return notes
    .split(',')
    .map((s) => s.trim().replace(/^\+/, ''))
    .filter((s) => /^\d{2}\.\d{2}$/.test(s))
}

// Выборка всех пар на конкретную дату с учётом группы и фильтров.
// data — объект расписания:
//   - дата-индекс: { schedule_by_date: { "DD.MM": [lesson,...] }, groups }
//   - недельный:   { odd_week, even_week, single_events, special_pairs, single_event_dates, groups }
export function getPairsForDate(date, group, filters = {}, data) {
  const ddmm = toDDMM(date)
  if (!data) return []

  // Режим «дата-индекс» (формат пользовательского JSON)
  if (data.schedule_by_date) {
    return applyFilters(
      (data.schedule_by_date[ddmm] || []).map((p) => ({ ...p })),
      group,
      filters
    )
  }

  const singleEvents = data.single_events || {}
  const specialPairs = data.special_pairs || []
  const weekSource = data || {}

  const result = []

  // 1) Разовые занятия заменяют регулярные
  if (singleEvents[ddmm]) {
    for (const p of singleEvents[ddmm]) {
      result.push({ ...p, special: true })
    }
    return applyFilters(result, group, filters)
  }

  // 2) Обычные пары по типу недели
  const weekType = getWeekType(date, data)
  const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay() // 1..7
  const weekData = weekSource[weekType === 'odd' ? 'odd_week' : 'even_week']

  if (weekData && weekData[dayOfWeek]) {
    for (const slot of weekData[dayOfWeek]) {
      for (const p of slot.schedule) {
        result.push({ ...p, time: slot.time })
      }
    }
  }

  // 3) Особые пары (notes) — добавляются только в перечисленные даты
  for (const p of specialPairs) {
    const dates = parseNotesDates(p.notes)
    if (dates.includes(ddmm)) {
      result.push({ ...p, special: true })
    }
  }

  return applyFilters(result, group, filters)
}

const RUS_DAYS = { понедельник: 1, вторник: 2, среда: 3, четверг: 4, пятница: 5, суббота: 6, воскресенье: 7 }

// Преобразование пользовательского JSON (плоский массив пар с датами)
// [{ day, time, dates:[...], group, type, subject, room }] -> { schedule_by_date, groups }
function fromFlatArray(entries) {
  const byDate = {}
  const groups = new Set()

  for (const e of entries) {
    const dateList = Array.isArray(e.dates) ? e.dates : []
    const groupList = String(e.group ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    if (!groupList.length) groupList.push('—')

    for (const d of dateList) {
      if (!/^\d{2}\.\d{2}$/.test(d)) continue
      if (!byDate[d]) byDate[d] = []
      for (const g of groupList) {
        groups.add(g)
        byDate[d].push({
          time: e.time,
          group: g,
          type: e.type,
          subject: e.subject,
          room: e.room,
        })
      }
    }
  }

  return {
    schedule_by_date: byDate,
    groups: [...groups].sort(),
  }
}

// Нормализация загруженного JSON в структуру расписания.
// Поддерживает оба формата:
//   1) { odd_week, even_week, single_events, special_pairs, single_event_dates, groups }
//   2) [ { day, time, dates, group, type, subject, room }, ... ]  (плоский список)
export function normalizeSchedule(data) {
  // Формат 2 — плоский массив записей
  if (Array.isArray(data)) {
    return fromFlatArray(data)
  }
  if (data && typeof data === 'object' && !data.odd_week && !data.even_week && Array.isArray(data.lessons)) {
    return fromFlatArray(data.lessons)
  }

  const weekKeys = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, пн: 1, вт: 2, ср: 3, чт: 4, пт: 5, сб: 6, вс: 7 }
  const pick = (obj) => {
    if (!obj) return {}
    const out = {}
    for (const k of Object.keys(obj)) {
      const num = weekKeys[k] ?? weekKeys[String(k).toLowerCase()]
      if (num) out[num] = obj[k]
    }
    return out
  }

  return {
    odd_week: pick(data?.odd_week),
    even_week: pick(data?.even_week),
    single_events: data?.single_events || {},
    special_pairs: Array.isArray(data?.special_pairs) ? data.special_pairs : [],
    single_event_dates: Array.isArray(data?.single_event_dates)
      ? data.single_event_dates
      : [],
    groups: Array.isArray(data?.groups) && data.groups.length ? data.groups : ['ИС-21', 'ИС-22'],
  }
}

// Встроенные данные по умолчанию
export function getDefaultData() {
  return normalizeSchedule({
    odd_week: SCHEDULE.odd_week,
    even_week: SCHEDULE.even_week,
    single_events: SCHEDULE.single_events,
    special_pairs: SPECIAL_PAIRS,
    single_event_dates: SINGLE_EVENT_DATES,
    groups: SCHEDULE.groups,
  })
}

// Объединение одинаковых пар (одинаковое время/предмет/тип/аудитория) в одну,
// собирая все группы в списке — чтобы лекция для нескольких групп была одной карточкой.
function mergeLectures(pairs) {
  const map = new Map()
  for (const p of pairs) {
    const key = [p.time, p.subject, p.type, p.room, p.teacher, p.special ? 's' : ''].join('|')
    if (!map.has(key)) {
      map.set(key, {
        ...p,
        group: String(p.group || ''),
        groups: String(p.group || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      })
      continue
    }
    const existing = map.get(key)
    const add = String(p.group || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    for (const g of add) {
      if (!existing.groups.includes(g)) existing.groups.push(g)
    }
    existing.group = existing.groups.join(', ')
  }
  return [...map.values()]
}

function applyFilters(pairs, group, filters) {
  let out = pairs
  if (group && group !== 'all') {
    const g = String(group)
    out = out.filter((p) => {
      const groups = String(p.group || '')
        .split(',')
        .map((s) => s.trim())
      return groups.includes(g)
    })
  } else {
    // Показываем все группы — объединяем одинаковые пары в одну карточку
    out = mergeLectures(out)
  }
  if (filters.type && filters.type !== 'all') {
    out = out.filter((p) => p.type === filters.type)
  }
  if (filters.query) {
    const q = filters.query.trim().toLowerCase()
    out = out.filter(
      (p) =>
        (p.subject && p.subject.toLowerCase().includes(q)) ||
        (p.room && p.room.toLowerCase().includes(q))
    )
  }
  // Сортировка по времени
  return out.sort((a, b) => a.time.localeCompare(b.time))
}

// Формирование диапазона дат семестра (сентябрь-декабрь текущего года)
export function getSemesterDates(year = new Date().getFullYear()) {
  const start = parseDDMM(SEMESTER_START, year)
  const end = parseDDMM(SEMESTER_END, year)
  const dates = []
  const cur = new Date(start)
  while (cur <= end) {
    dates.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

export { parseISO, ru, format }
