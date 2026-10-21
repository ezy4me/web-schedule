import { parse, format, startOfWeek, differenceInCalendarWeeks, parseISO, startOfDay, addDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  SEMESTER_START,
  SEMESTER_END,
  SCHEDULE,
  SPECIAL_PAIRS,
  SINGLE_EVENT_DATES,
  TIME_SLOTS,
} from '../data/schedule.js'

export const DDMM = 'dd.MM'
export const FULL_DATE = 'dd.MM.yyyy'
export { TIME_SLOTS }

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
          teacher: e.teacher || null,
          parity: e.parity || null,
          dates: [...dateList],
          day: e.day || null,
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
        (p.room && p.room.toLowerCase().includes(q)) ||
        (p.teacher && p.teacher.toLowerCase().includes(q))
    )
  }
  // Сортировка по времени
  return out.sort((a, b) => a.time.localeCompare(b.time))
}

// Построение таймлайна с окнами: между первой и последней парой пустые слоты — «окна»
export function buildTimeline(pairs) {
  if (!pairs.length) return []
  const slots = TIME_SLOTS
  const byTime = new Map()
  for (const p of pairs) {
    if (!byTime.has(p.time)) byTime.set(p.time, [])
    byTime.get(p.time).push(p)
  }
  const indices = pairs.map((p) => slots.indexOf(p.time)).filter((i) => i >= 0)
  if (!indices.length) return pairs.map((p) => ({ type: 'lesson', lesson: p }))
  const firstIdx = Math.min(...indices)
  const lastIdx = Math.max(...indices)
  const items = []
  for (let i = firstIdx; i <= lastIdx; i++) {
    const slot = slots[i]
    const lessons = byTime.get(slot)
    if (lessons && lessons.length) {
      for (const l of lessons) items.push({ type: 'lesson', lesson: l })
    } else {
      items.push({ type: 'window', time: slot })
    }
  }
  // пары с временем вне сетки (если вдруг) — добавим в конец
  for (const p of pairs) {
    if (!slots.includes(p.time) && !items.some((it) => it.type === 'lesson' && it.lesson === p)) {
      items.push({ type: 'lesson', lesson: p })
    }
  }
  return items.sort((a, b) => {
    const ta = a.type === 'window' ? a.time : a.lesson.time
    const tb = b.type === 'window' ? b.time : b.lesson.time
    return ta.localeCompare(tb)
  })
}

// Длительность пары в минутах — для определения идущего сейчас занятия
export const LESSON_DURATION_MIN = 90

// Идёт ли пара прямо сейчас (время старта HH:MM, длительность 90 минут)
export function isLessonNow(timeStr, now = new Date()) {
  const [h, m] = String(timeStr).split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return false
  const start = new Date(now)
  start.setHours(h, m, 0, 0)
  const end = new Date(start.getTime() + LESSON_DURATION_MIN * 60000)
  return now >= start && now < end
}

// Множество ISO-дат без пар (выходные) — для маркировки в ленте и календаре
export function buildEmptyDaySet(dates, group, data) {
  const set = new Set()
  for (const d of dates) {
    if (getPairsForDate(d, group, {}, data).length === 0) set.add(d.toISOString())
  }
  return set
}

// Статистика: разбор групп, индекс занятий и агрегаты по периодам
export const LESSON_HOURS = LESSON_DURATION_MIN / 60 // 1,5 ч на пару

export function splitGroups(value) {
  if (Array.isArray(value)) return value.map((s) => String(s).trim()).filter(Boolean)
  return String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

// Пара ещё не прошла: даты позже сегодняшней — всегда; сегодня — если конец пары позже «сейчас»
export function isLessonUpcoming(lesson, now = new Date()) {
  const day = startOfDay(now)
  if (lesson.date > day) return true
  if (lesson.date.getTime() !== day.getTime()) return false
  const [h, m] = String(lesson.time || '').split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return false
  return day.getTime() + (h * 60 + m + LESSON_DURATION_MIN) * 60000 > now.getTime()
}

// Плоский список всех вхождений семестра (с объединением одинаковых пар по группам)
export function buildLessonIndex(data, year = new Date().getFullYear()) {
  const lessons = []
  for (const date of getSeasonDates(year)) {
    for (const pair of getPairsForDate(date, 'all', {}, data)) {
      const groups = splitGroups(pair.groups && pair.groups.length ? pair.groups : pair.group)
      if (!groups.length) continue
      lessons.push({
        date,
        time: String(pair.time || ''),
        subject: String(pair.subject || '').trim(),
        type: String(pair.type || ''),
        room: String(pair.room || '').trim(),
        teacher: String(pair.teacher || '').trim(),
        groups,
        special: !!pair.special,
        weekday: date.getDay() === 0 ? 7 : date.getDay(),
        week: getWeekIndex(date),
      })
    }
  }
  return lessons.sort((a, b) => a.date - b.date || a.time.localeCompare(b.time))
}

// Базовые данные статистики: индекс занятий и список групп
export function buildLessonStats(data, from = new Date()) {
  const seasonYear = from.getFullYear()
  const lessons = buildLessonIndex(data, seasonYear)
  const groupSet = new Set()
  for (const lesson of lessons) for (const g of lesson.groups) groupSet.add(g)
  return {
    seasonYear,
    lessons,
    groups: [...groupSet].sort((a, b) => a.localeCompare(b, 'ru')),
  }
}

function countWindows(lessons) {
  const byDate = new Map()
  for (const lesson of lessons) {
    const key = lesson.date.toISOString()
    if (!byDate.has(key)) byDate.set(key, new Set())
    byDate.get(key).add(lesson.time)
  }
  let total = 0
  for (const times of byDate.values()) {
    const indices = [...times].map((t) => TIME_SLOTS.indexOf(t)).filter((i) => i >= 0)
    if (indices.length < 2) continue
    const first = Math.min(...indices)
    const last = Math.max(...indices)
    total += last - first + 1 - new Set(indices).size
  }
  return total
}

// Диапазон периода: 'semester' | 'remaining' | 'month-8'..'month-11'
export function statsPeriodRange(period, year, now = new Date()) {
  const seasonStart = parseDDMM(SEMESTER_START, year)
  const seasonEnd = addDays(parseDDMM(SEMESTER_END, year), 1)
  if (period === 'remaining') {
    let from = startOfDay(now)
    if (from < seasonStart) from = seasonStart
    if (from > seasonEnd) from = seasonEnd
    return { from, to: seasonEnd }
  }
  if (typeof period === 'string' && period.startsWith('month-')) {
    const month = Number(period.slice(6))
    return { from: new Date(year, month, 1), to: new Date(year, month + 1, 1) }
  }
  return { from: seasonStart, to: seasonEnd }
}

// Агрегация статистики по группе и периоду
export function aggregateLessonStats(lessons, { group = 'all', period = 'semester', now = new Date() } = {}) {
  const year = lessons.length ? lessons[0].date.getFullYear() : now.getFullYear()
  const seasonStart = parseDDMM(SEMESTER_START, year)
  const seasonEnd = addDays(parseDDMM(SEMESTER_END, year), 1)
  const range = statsPeriodRange(period, year, now)

  const inSeason = group === 'all' ? lessons : lessons.filter((l) => l.groups.includes(group))
  const inRangeAll = inSeason.filter((l) => l.date >= range.from && l.date < range.to)
  // «Остаток» — только ещё не прошедшие пары
  const inRange = period === 'remaining' ? inRangeAll.filter((l) => isLessonUpcoming(l, now)) : inRangeAll
  const remaining = inRange.filter((l) => isLessonUpcoming(l, now))

  const groupStats = new Map()
  const subjectStats = new Map()
  const typeStats = new Map()
  const roomStats = new Map()
  const teacherStats = new Map()
  const weekdayStats = Array.from({ length: 7 }, () => ({ total: 0, remaining: 0 }))
  const timeStats = new Map()
  const weekStats = new Map()
  let groupAllocations = 0

  const add = (map, key) => {
    let stat = map.get(key)
    if (!stat) {
      stat = { total: 0, remaining: 0 }
      map.set(key, stat)
    }
    return stat
  }

  for (const lesson of inRange) {
    const isRemaining = isLessonUpcoming(lesson, now)
    // При фильтре по группе совместные лекции не должны добавлять соседние группы
    const allocatedGroups = group === 'all' ? lesson.groups : [group]

    for (const g of allocatedGroups) {
      const stat = add(groupStats, g)
      stat.total++
      if (isRemaining) stat.remaining++
      groupAllocations++
    }

    const subject = lesson.subject || '—'
    let ss = subjectStats.get(subject)
    if (!ss) {
      ss = { total: 0, remaining: 0, groups: new Set(), rooms: new Set(), teachers: new Set(), types: {} }
      subjectStats.set(subject, ss)
    }
    ss.total++
    if (isRemaining) ss.remaining++
    for (const g of allocatedGroups) ss.groups.add(g)
    if (lesson.room) ss.rooms.add(lesson.room)
    if (lesson.teacher) ss.teachers.add(lesson.teacher)
    ss.types[lesson.type] = (ss.types[lesson.type] || 0) + 1

    const type = lesson.type || '—'
    const ts = add(typeStats, type)
    ts.total++
    if (isRemaining) ts.remaining++

    if (lesson.room) {
      let rs = roomStats.get(lesson.room)
      if (!rs) {
        rs = { total: 0, remaining: 0, subjects: new Set() }
        roomStats.set(lesson.room, rs)
      }
      rs.total++
      if (isRemaining) rs.remaining++
      rs.subjects.add(subject)
    }

    if (lesson.teacher) {
      let tt = teacherStats.get(lesson.teacher)
      if (!tt) {
        tt = { total: 0, remaining: 0, subjects: new Set(), rooms: new Set() }
        teacherStats.set(lesson.teacher, tt)
      }
      tt.total++
      if (isRemaining) tt.remaining++
      tt.subjects.add(subject)
      if (lesson.room) tt.rooms.add(lesson.room)
    }

    const day = weekdayStats[lesson.weekday - 1]
    day.total++
    if (isRemaining) day.remaining++

    const tm = add(timeStats, lesson.time)
    tm.total++
    if (isRemaining) tm.remaining++

    let ws = weekStats.get(lesson.week)
    if (!ws) {
      ws = { total: 0, remaining: 0 }
      weekStats.set(lesson.week, ws)
    }
    ws.total++
    if (isRemaining) ws.remaining++
  }

  // Для календаря-хитмапа: весь семестр, не только выбранный период
  const dateStats = new Map()
  for (const lesson of inSeason) {
    const dateKey = toDDMM(lesson.date)
    let ds = dateStats.get(dateKey)
    if (!ds) {
      ds = { date: lesson.date, total: 0, remaining: 0 }
      dateStats.set(dateKey, ds)
    }
    ds.total++
    if (isLessonUpcoming(lesson, now)) ds.remaining++
  }

  const pairs = inRange.length
  const hours = (n) => Math.round(n * LESSON_HOURS * 10) / 10
  const share = (n, base) => (base ? Math.round((n / base) * 1000) / 10 : 0)

  const byGroup = [...groupStats.entries()]
    .map(([key, s]) => ({
      key,
      name: key,
      total: s.total,
      remaining: s.remaining,
      hours: hours(s.total),
      share: share(s.total, groupAllocations),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))

  const byType = [...typeStats.entries()]
    .map(([key, s]) => ({
      key,
      name: key,
      total: s.total,
      remaining: s.remaining,
      hours: hours(s.total),
      share: share(s.total, pairs),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))

  const bySubject = [...subjectStats.entries()]
    .map(([key, s]) => ({
      key,
      name: key,
      total: s.total,
      remaining: s.remaining,
      hours: hours(s.total),
      share: share(s.total, pairs),
      groups: [...s.groups].sort((a, b) => a.localeCompare(b, 'ru')),
      rooms: [...s.rooms].sort((a, b) => a.localeCompare(b, 'ru')),
      teachers: [...s.teachers].sort((a, b) => a.localeCompare(b, 'ru')),
      types: s.types,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))

  const byRoom = [...roomStats.entries()]
    .map(([key, s]) => ({
      key,
      name: key,
      total: s.total,
      remaining: s.remaining,
      hours: hours(s.total),
      share: share(s.total, pairs),
      subjects: [...s.subjects].sort((a, b) => a.localeCompare(b, 'ru')),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))

  const byTeacher = [...teacherStats.entries()]
    .map(([key, s]) => ({
      key,
      name: key,
      total: s.total,
      remaining: s.remaining,
      hours: hours(s.total),
      share: share(s.total, pairs),
      subjects: [...s.subjects].sort((a, b) => a.localeCompare(b, 'ru')),
      rooms: [...s.rooms].sort((a, b) => a.localeCompare(b, 'ru')),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))

  const byWeekday = weekdayStats.map((s, i) => ({ weekday: i + 1, total: s.total, remaining: s.remaining }))

  const times = [...TIME_SLOTS]
  for (const time of timeStats.keys()) if (!times.includes(time)) times.push(time)
  const byTime = times
    .map((time) => {
      const s = timeStats.get(time)
      return { time, total: s ? s.total : 0, remaining: s ? s.remaining : 0 }
    })
    .filter((t) => t.total > 0)

  const baseMonday = startOfWeek(seasonStart, { weekStartsOn: 1 })
  const seasonLastWeek = getWeekIndex(addDays(seasonEnd, -1))
  const firstWeek = Math.max(0, getWeekIndex(range.from))
  const lastWeek = Math.min(seasonLastWeek, getWeekIndex(addDays(range.to, -1)))
  const byWeek = []
  for (let week = firstWeek; week <= lastWeek; week++) {
    const monday = addDays(baseMonday, week * 7)
    const s = weekStats.get(week)
    byWeek.push({
      week,
      monday,
      total: s ? s.total : 0,
      remaining: s ? s.remaining : 0,
      isCurrent: now >= monday && now < addDays(monday, 7),
    })
  }

  const byDate = [...dateStats.values()].sort((a, b) => a.date - b.date)

  const studyDays = new Set(inRange.map((l) => l.date.getTime())).size
  const subjects = new Set(inRange.map((l) => l.subject).filter(Boolean))
  const groups = new Set()
  for (const lesson of inRange) {
    for (const g of group === 'all' ? lesson.groups : [group]) groups.add(g)
  }
  const rooms = new Set(inRange.map((l) => l.room).filter(Boolean))
  const teachers = new Set(inRange.map((l) => l.teacher).filter(Boolean))
  const upcoming = inSeason
    .filter((l) => isLessonUpcoming(l, now))
    .sort((a, b) => a.date - b.date || a.time.localeCompare(b.time))
  const weeksLeft = Math.max(0, Math.ceil((seasonEnd.getTime() - now.getTime()) / (7 * 86400000)))

  return {
    range,
    totals: {
      pairs,
      remaining: remaining.length,
      hours: hours(pairs),
      subjects: subjects.size,
      groups: groups.size,
      rooms: rooms.size,
      teachers: teachers.size,
      studyDays,
      windows: group === 'all' ? 0 : countWindows(inRange),
      weeksLeft,
      nextLesson: upcoming[0] || null,
    },
    byGroup,
    byType,
    bySubject,
    byRoom,
    byTeacher,
    byWeekday,
    byTime,
    byWeek,
    byDate,
    remainingLessons: remaining,
    groupAllocations,
  }
}

// Формирование диапазона дат для навигации — с 1 сентября по 31 декабря.
// Отсчёт ленты идёт с начала семестра; пары есть только на даты из данных.
export function getSeasonDates(year = new Date().getFullYear()) {
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
