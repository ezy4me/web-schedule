// Аналитические выборки, которые не зависят от формата источника расписания.
// Используются для новых графиков: теплокарта, накопительный график, месяцы.
import { SEMESTER_INFO, getSemesterInfo, getSemesterRange } from './schedule.js'

const SEMESTER_MONTHS = {
  autumn: new Set(['09', '10', '11', '12']),
  spring: new Set(['01', '02', '03', '04', '05', '06']),
}

// Учебный год, к которому относится семестр для даты.
// Для весны при сентябре–декабре берём следующий календарный год.
export function seasonYearFor(date, semester) {
  if (semester === 'spring') {
    return date.getMonth() >= 7 ? date.getFullYear() + 1 : date.getFullYear()
  }
  return date.getMonth() >= 7 ? date.getFullYear() : date.getFullYear() - 1
}

// Сколько пар в данных относится к семестру (по месяцам дат).
export function countSemesterLessons(data, semester) {
  const months = SEMESTER_MONTHS[semester]
  if (!months) return 0
  const byDate = data?.schedule_by_date
  if (!byDate) return 0
  let total = 0
  for (const [ddmm, list] of Object.entries(byDate)) {
    if (!months.has(String(ddmm).slice(3))) continue
    total += Array.isArray(list) ? list.length : 0
  }
  return total
}

// Автоматический выбор семестра: текущий по календарю, если в нём есть данные,
// иначе — другой семестр с данными.
export function pickAutoSemester(data, now = new Date()) {
  const current = now.getMonth() >= 7 ? 'autumn' : 'spring'
  if (countSemesterLessons(data, current) > 0) return current
  const other = current === 'autumn' ? 'spring' : 'autumn'
  return countSemesterLessons(data, other) > 0 ? other : current
}

// Ближайшая дата с занятиями внутри семестра (или начало семестра).
export function firstStudyDate(data, year, semester, getPairsForDate) {
  const { start } = getSemesterRange(year, semester)
  if (!getPairsForDate) return start
  const info = getSemesterInfo(semester)
  const lastMonth = info.endMonth
  for (let month = info.startMonth; month <= lastMonth; month++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      if (getPairsForDate(date, 'all', {}, data).length) return date
    }
  }
  return start
}

// Матрица «день недели × время» для теплокарты.
export function buildHeatmap(lessons = []) {
  const times = [...new Set(lessons.map((lesson) => lesson.time).filter(Boolean))]
  times.sort((a, b) => a.localeCompare(b))
  const cells = new Map()
  let max = 0
  for (const lesson of lessons) {
    const key = `${lesson.weekday}|${lesson.time}`
    const next = (cells.get(key) || 0) + 1
    cells.set(key, next)
    if (next > max) max = next
  }
  return { times, cells, max }
}

export function heatmapValue(heatmap, weekday, time) {
  return heatmap.cells.get(`${weekday}|${time}`) || 0
}

// Накопительная кривая нагрузки по неделям.
export function cumulativeSeries(byWeek = []) {
  let acc = 0
  return byWeek.map((week) => {
    acc += week.total
    return { ...week, cumulative: acc }
  })
}

// Нагрузка по месяцам выбранного семестра.
export function monthSeries(lessons = [], semester = 'autumn', year = new Date().getFullYear()) {
  const info = SEMESTER_INFO[semester] || SEMESTER_INFO.autumn
  const counts = new Map(info.months.map((month) => [month, 0]))
  for (const lesson of lessons) {
    if (lesson.date.getFullYear() !== year) continue
    const month = lesson.date.getMonth()
    if (counts.has(month)) counts.set(month, counts.get(month) + 1)
  }
  return info.months.map((month) => ({
    month,
    total: counts.get(month),
  }))
}

// Топ-N по значению (не мутирует исходный массив).
export function topN(rows = [], n = 5, valueKey = 'total') {
  return [...rows].sort((a, b) => b[valueKey] - a[valueKey]).slice(0, n)
}

// Уникальные аудитории, упорядоченные по нагрузке.
export function topRooms(byRoom = [], n = 5) {
  return topN(byRoom, n)
}

// Группировка занятий по неделе (для недельного вида расписания).
export function groupByWeekday(lessons = []) {
  const map = new Map()
  for (const lesson of lessons) {
    const key = lesson.weekday
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(lesson)
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.time.localeCompare(b.time))
  }
  return map
}
