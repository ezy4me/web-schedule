import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  aggregateLessonStats,
  buildLessonStats,
  normalizeSchedule,
} from '../src/utils/schedule.js'
import { LESSON_ACADEMIC_HOURS } from '../src/utils/stats.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const now = new Date(2026, 9, 21, 12, 0, 0)
const yearStart = new Date(2026, 0, 1)

const readSource = (name) =>
  normalizeSchedule(JSON.parse(readFileSync(join(root, 'public', name), 'utf8')))

const stats = buildLessonStats(readSource('excel-3.json'), yearStart)
const semester = aggregateLessonStats(stats.lessons, { period: 'semester', now })

const sum = (rows, key) => rows.reduce((total, row) => total + row[key], 0)

test('одна пара равна двум академическим часам', () => {
  assert.equal(LESSON_ACADEMIC_HOURS, 2)
})

test('индекс занятий excel-3', () => {
  assert.equal(stats.lessons.length, 332)
  assert.equal(stats.groups.length, 8)
  assert.equal(stats.teachers.length, 0)
})

test('семестровая нагрузка: уникальная и по группам', () => {
  assert.equal(semester.totals.pairs, 332)
  assert.equal(semester.totals.groupPairs, 392)
  assert.equal(semester.totals.academicHours, 664)
  assert.equal(semester.totals.groupAcademicHours, 784)
  assert.equal(semester.groupAllocations, 392)
})

test('потоковые лекции не дублируются в общей нагрузке', () => {
  assert.equal(semester.totals.streamPairs, 20)
  assert.equal(semester.totals.streamGroupSlots, 80)
  assert.equal(semester.totals.streamSavedHours, 120)
  assert.equal(
    semester.totals.groupAcademicHours - semester.totals.academicHours,
    semester.totals.streamSavedHours
  )
})

test('суммы разрезов сходятся с итогами', () => {
  assert.equal(sum(semester.byGroup, 'total'), semester.totals.groupPairs)
  assert.equal(sum(semester.byGroup, 'academicHours'), semester.totals.groupAcademicHours)
  assert.equal(sum(semester.bySubject, 'total'), semester.totals.pairs)
  assert.equal(sum(semester.bySubject, 'academicHours'), semester.totals.academicHours)
  assert.equal(sum(semester.byType, 'total'), semester.totals.pairs)
  assert.equal(sum(semester.byWeekday, 'total'), semester.totals.pairs)
  assert.equal(sum(semester.byTime, 'total'), semester.totals.pairs)
  assert.equal(sum(semester.byDate, 'total'), semester.totals.pairs)
  assert.equal(sum(semester.byWeek, 'total'), semester.totals.pairs)
})

test('нагрузка по месяцам', () => {
  const months = ['month-8', 'month-9', 'month-10', 'month-11'].map((period) =>
    aggregateLessonStats(stats.lessons, { period, now }).totals.pairs
  )
  assert.deepEqual(months, [128, 134, 55, 15])
  assert.deepEqual(
    months.map((pairs) => pairs * LESSON_ACADEMIC_HOURS),
    [256, 268, 110, 30]
  )
})

test('остаток и прогресс семестра на 21 октября', () => {
  assert.equal(semester.totals.remaining, 118)
  assert.equal(semester.totals.past, 214)
  assert.equal(semester.totals.past * LESSON_ACADEMIC_HOURS, 428)
  assert.equal(semester.totals.remaining * LESSON_ACADEMIC_HOURS, 236)
  assert.equal(semester.totals.progress, 64.5)
  const remaining = aggregateLessonStats(stats.lessons, { period: 'remaining', now })
  assert.equal(remaining.totals.pairs, 118)
  assert.equal(remaining.totals.remaining, 118)
  assert.equal(remaining.totals.past, 0)
})

test('фильтр по группе не подмешивает соседние группы', () => {
  const group = aggregateLessonStats(stats.lessons, { group: '4433', period: 'semester', now })
  assert.equal(group.totals.pairs, 44)
  assert.equal(group.totals.groupPairs, 44)
  assert.equal(group.totals.academicHours, 88)
  assert.equal(group.totals.groups, 1)
  assert.equal(group.totals.streamSavedHours, 0)
  assert.equal(group.byGroup.length, 1)
  assert.equal(group.byGroup[0].key, '4433')
})

test('окна считаются только для выбранной группы', () => {
  const g4435 = aggregateLessonStats(stats.lessons, { group: '4435', now })
  const g4438 = aggregateLessonStats(stats.lessons, { group: '4438', now })
  assert.equal(g4435.totals.windows, 4)
  assert.equal(g4435.totals.windowHours, 8)
  assert.equal(g4438.totals.windows, 3)
  assert.equal(semester.totals.windows, 0)
})

test('фильтр по преподавателю', () => {
  const withTeachers = buildLessonStats(readSource('excel.json'), yearStart)
  assert.equal(withTeachers.teachers.length, 1)
  const teacher = withTeachers.teachers[0]
  const filtered = aggregateLessonStats(withTeachers.lessons, { teacher, now })
  assert.equal(filtered.totals.pairs, withTeachers.lessons.length)
  const missing = aggregateLessonStats(withTeachers.lessons, { teacher: 'Нет такого', now })
  assert.equal(missing.totals.pairs, 0)
})

test('семестр до начала и после конца', () => {
  const before = aggregateLessonStats(stats.lessons, { now: new Date(2026, 6, 1) })
  assert.equal(before.totals.past, 0)
  assert.equal(before.totals.progress, 0)
  assert.equal(before.totals.remaining, 332)
  const after = aggregateLessonStats(stats.lessons, { now: new Date(2027, 0, 15) })
  assert.equal(after.totals.past, 332)
  assert.equal(after.totals.remaining, 0)
  assert.equal(after.totals.progress, 100)
  assert.equal(after.totals.weeksLeft, 0)
})
