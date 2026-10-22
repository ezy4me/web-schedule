function ddmm(date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}`
}

function sample(items, limit = 3) {
  return items.slice(0, limit).join('; ')
}

export function validateSchedule(lessons = [], groups = []) {
  const issues = []
  const invalid = lessons.filter(
    (lesson) => !lesson.subject || !lesson.time || !lesson.groups?.length
  )
  const noRoom = lessons.filter((lesson) => lesson.subject && !lesson.room)

  const duplicateKeys = new Map()
  for (const lesson of lessons) {
    if (!lesson.subject || !lesson.time) continue
    const key = [
      lesson.date.toDateString(),
      lesson.time,
      [...lesson.groups].sort().join(','),
      lesson.subject,
      lesson.type,
    ].join('|')
    duplicateKeys.set(key, (duplicateKeys.get(key) || 0) + 1)
  }
  const duplicates = [...duplicateKeys.entries()].filter(([, count]) => count > 1)

  const roomKeys = new Map()
  const teacherKeys = new Map()
  for (const lesson of lessons) {
    if (!lesson.time) continue
    if (lesson.room) {
      const key = [lesson.date.toDateString(), lesson.time, lesson.room].join('|')
      if (!roomKeys.has(key)) roomKeys.set(key, new Set())
      roomKeys.get(key).add(lesson.subject)
    }
    if (lesson.teacher) {
      const key = [lesson.date.toDateString(), lesson.time, lesson.teacher].join('|')
      if (!teacherKeys.has(key)) teacherKeys.set(key, new Set())
      teacherKeys.get(key).add(lesson.subject)
    }
  }
  const roomConflicts = [...roomKeys.values()].filter((subjects) => subjects.size > 1)
  const teacherConflicts = [...teacherKeys.values()].filter((subjects) => subjects.size > 1)

  const usedGroups = new Set(lessons.flatMap((lesson) => lesson.groups || []))
  const emptyGroups = groups.filter((group) => !usedGroups.has(group))

  if (invalid.length) {
    issues.push({
      id: 'invalid',
      level: 'error',
      title: 'Неполные занятия',
      detail: `Без дисциплины, времени или группы: ${invalid.length}. ${sample(
        invalid.map((lesson) => `${ddmm(lesson.date)} ${lesson.time || '—'}`)
      )}`,
      count: invalid.length,
    })
  }
  if (duplicates.length) {
    issues.push({
      id: 'duplicates',
      level: 'warning',
      title: 'Возможные дубли',
      detail: `Совпадают дата, время, группа и дисциплина: ${duplicates.length}.`,
      count: duplicates.length,
    })
  }
  if (roomConflicts.length) {
    issues.push({
      id: 'rooms',
      level: 'error',
      title: 'Конфликты аудиторий',
      detail: `В одной аудитории одновременно разные дисциплины: ${roomConflicts.length}.`,
      count: roomConflicts.length,
    })
  }
  if (teacherConflicts.length) {
    issues.push({
      id: 'teachers',
      level: 'error',
      title: 'Конфликты преподавателей',
      detail: `Преподаватель ведёт разные дисциплины одновременно: ${teacherConflicts.length}.`,
      count: teacherConflicts.length,
    })
  }
  if (noRoom.length) {
    issues.push({
      id: 'rooms-missing',
      level: 'warning',
      title: 'Не указана аудитория',
      detail: `Занятий без аудитории: ${noRoom.length}.`,
      count: noRoom.length,
    })
  }
  if (emptyGroups.length) {
    issues.push({
      id: 'empty-groups',
      level: 'warning',
      title: 'Группы без пар',
      detail: `Нет занятий у групп: ${sample(emptyGroups)}.`,
      count: emptyGroups.length,
    })
  }

  const status = issues.some((issue) => issue.level === 'error')
    ? 'error'
    : issues.length
      ? 'warning'
      : 'ok'

  return { status, issues, checked: lessons.length }
}
