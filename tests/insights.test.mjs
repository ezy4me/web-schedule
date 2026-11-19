import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeSchedule } from '../src/utils/schedule.js'
import {
  buildHeatmap,
  cumulativeSeries,
  heatmapValue,
  monthSeries,
  pickAutoSemester,
  seasonYearFor,
} from '../src/utils/insights.js'

function scheduleWith(dates) {
  return normalizeSchedule([
    {
      day: 'Понедельник',
      time: '09:40',
      dates,
      group: '101',
      type: 'лек',
      subject: 'Математика',
      room: '1 / 100',
    },
  ])
}

test('seasonYearFor относит семестр к учебному году', () => {
  assert.equal(seasonYearFor(new Date(2026, 10, 1), 'autumn'), 2026)
  assert.equal(seasonYearFor(new Date(2026, 10, 1), 'spring'), 2027)
  assert.equal(seasonYearFor(new Date(2026, 2, 1), 'spring'), 2026)
  assert.equal(seasonYearFor(new Date(2026, 2, 1), 'autumn'), 2025)
})

test('pickAutoSemester выбирает текущий семестр, если в нём есть пары', () => {
  const both = scheduleWith(['07.09', '05.02'])
  assert.equal(pickAutoSemester(both, new Date(2026, 10, 19)), 'autumn')
  assert.equal(pickAutoSemester(both, new Date(2026, 2, 10)), 'spring')
})

test('pickAutoSemester переключается на семестр с данными', () => {
  const autumnOnly = scheduleWith(['07.09'])
  assert.equal(pickAutoSemester(autumnOnly, new Date(2026, 6, 1)), 'autumn')

  const springOnly = scheduleWith(['05.02'])
  assert.equal(pickAutoSemester(springOnly, new Date(2026, 10, 19)), 'spring')
})

test('buildHeatmap считает пары по дню и времени', () => {
  const lessons = [
    { weekday: 1, time: '09:40' },
    { weekday: 1, time: '09:40' },
    { weekday: 2, time: '11:20' },
  ]
  const heatmap = buildHeatmap(lessons)
  assert.deepEqual(heatmap.times, ['09:40', '11:20'])
  assert.equal(heatmap.max, 2)
  assert.equal(heatmapValue(heatmap, 1, '09:40'), 2)
  assert.equal(heatmapValue(heatmap, 2, '09:40'), 0)
  assert.equal(heatmapValue(heatmap, 2, '11:20'), 1)
})

test('cumulativeSeries накапливает нагрузку', () => {
  const series = cumulativeSeries([
    { week: 0, total: 2 },
    { week: 1, total: 3 },
    { week: 2, total: 0 },
  ])
  assert.deepEqual(series.map((item) => item.cumulative), [2, 5, 5])
  assert.equal(series[1].total, 3)
})

test('monthSeries раскладывает занятия по месяцам семестра', () => {
  const lessons = [
    { date: new Date(2026, 8, 7) },
    { date: new Date(2026, 8, 14) },
    { date: new Date(2026, 10, 2) },
    { date: new Date(2026, 1, 5) },
  ]
  const autumn = monthSeries(lessons, 'autumn', 2026)
  assert.deepEqual(
    autumn.map((item) => item.month),
    [8, 9, 10, 11]
  )
  assert.equal(autumn[0].total, 2)
  assert.equal(autumn[2].total, 1)
  assert.equal(autumn[1].total, 0)

  const spring = monthSeries(lessons, 'spring', 2026)
  assert.deepEqual(
    spring.map((item) => item.month),
    [0, 1, 2, 3, 4, 5]
  )
  assert.equal(spring[1].total, 1)
})
