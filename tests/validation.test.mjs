import assert from 'node:assert/strict'
import test from 'node:test'
import { validateSchedule } from '../src/utils/validateSchedule.js'

const date = new Date(2026, 9, 22)

function lesson(overrides = {}) {
  return {
    date,
    time: '10:10',
    subject: 'Математика',
    type: 'Лекция',
    room: 'А-101',
    teacher: 'Иванов',
    groups: ['4433'],
    ...overrides,
  }
}

test('clean schedule has no issues', () => {
  const result = validateSchedule([lesson()], ['4433'])
  assert.equal(result.status, 'ok')
  assert.equal(result.checked, 1)
  assert.deepEqual(result.issues, [])
})

test('missing fields are errors and empty rooms are warnings', () => {
  const result = validateSchedule(
    [lesson({ subject: '' }), lesson({ room: '', time: '12:10' })],
    ['4433', '4434']
  )
  assert.equal(result.status, 'error')
  assert.ok(result.issues.some((issue) => issue.id === 'invalid'))
  assert.ok(result.issues.some((issue) => issue.id === 'rooms-missing'))
  assert.ok(result.issues.some((issue) => issue.id === 'empty-groups'))
})

test('exact duplicates are reported', () => {
  const result = validateSchedule([lesson(), lesson()], ['4433'])
  assert.equal(result.status, 'warning')
  assert.equal(result.issues.find((issue) => issue.id === 'duplicates').count, 1)
})

test('room and teacher conflicts across subjects are errors', () => {
  const result = validateSchedule(
    [
      lesson(),
      lesson({ subject: 'Физика', teacher: 'Петров' }),
      lesson({ subject: 'Химия', room: 'Б-202', teacher: 'Иванов' }),
    ],
    ['4433']
  )
  assert.equal(result.status, 'error')
  assert.equal(result.issues.find((issue) => issue.id === 'rooms').count, 1)
  assert.equal(result.issues.find((issue) => issue.id === 'teachers').count, 1)
})
