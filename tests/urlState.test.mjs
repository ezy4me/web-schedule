import assert from 'node:assert/strict'
import test from 'node:test'
import { buildHash, parseUrlDate, readUrlState } from '../src/utils/urlState.js'

test('buildHash keeps default schedule URL clean', () => {
  assert.equal(buildHash({ date: '2026-10-22' }), '#schedule?date=2026-10-22')
})

test('buildHash restores stats filters and omits defaults', () => {
  const hash = buildHash({
    page: 'stats',
    group: '4433',
    teacher: 'Иванов',
    source: 'excel',
    tab: 'breakdown',
    period: 'month-9',
  })
  const state = readUrlState(hash)
  assert.equal(state.page, 'stats')
  assert.equal(state.group, '4433')
  assert.equal(state.teacher, 'Иванов')
  assert.equal(state.source, 'excel')
  assert.equal(state.tab, 'breakdown')
  assert.equal(state.period, 'month-9')
})

test('readUrlState falls back on unknown tab and period', () => {
  const state = readUrlState('#stats?tab=unknown&period=month-99')
  assert.equal(state.tab, 'overview')
  assert.equal(state.period, 'semester')
})

test('readUrlState treats unknown page as schedule', () => {
  assert.equal(readUrlState('#teachers?group=4433').page, 'schedule')
  assert.equal(readUrlState('').page, 'schedule')
})

test('parseUrlDate accepts valid dates and rejects bad input', () => {
  const date = parseUrlDate('2026-10-22')
  assert.equal(date.getFullYear(), 2026)
  assert.equal(date.getMonth(), 9)
  assert.equal(date.getDate(), 22)
  assert.equal(parseUrlDate('2026-02-31'), null)
  assert.equal(parseUrlDate('22.10.2026'), null)
  assert.equal(parseUrlDate(''), null)
})
