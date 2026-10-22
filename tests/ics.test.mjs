import assert from 'node:assert/strict'
import test from 'node:test'
import { buildICS } from '../src/utils/ics.js'

const date = new Date(2026, 9, 22)

test('buildICS creates a timed event with escaped text', () => {
  const ics = buildICS([
    {
      date,
      time: '10:10',
      subject: 'Математика, практика',
      type: 'Практика',
      room: 'А-101',
      teacher: 'Иванов И.И.',
      groups: ['4433', '4434'],
    },
  ])

  assert.match(ics, /^BEGIN:VCALENDAR/)
  assert.match(ics, /DTSTART:20261022T101000/)
  assert.match(ics, /DTEND:20261022T114000/)
  assert.match(ics, /SUMMARY:Математика\\, практика/)
  assert.match(ics, /LOCATION:А-101/)
  assert.match(ics, /Группы: 4433\\, 4434/)
  assert.match(ics, /END:VCALENDAR\r\n$/)
})

test('buildICS skips lessons without date or valid time', () => {
  const ics = buildICS([
    { date, time: '', subject: 'Без времени' },
    { date, time: '25:99', subject: 'Плохое время' },
    { time: '10:10', subject: 'Без даты' },
  ])
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 0)
})

test('buildICS keeps multiple events and a calendar name', () => {
  const ics = buildICS(
    [
      { date, time: '10:10', subject: 'Физика', groups: ['4433'] },
      { date, time: '12:10', subject: 'Химия', groups: ['4433'] },
    ],
    { calendarName: 'Расписание — группа 4433' }
  )
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 2)
  assert.match(ics, /X-WR-CALNAME:Расписание — группа 4433/)
})
