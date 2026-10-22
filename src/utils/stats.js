// Учебные константы и формулы, не зависящие от формата расписания.
// 1 академический час = 45 минут, одна пара = 90 минут = 2 ак. часа.
export const ACADEMIC_HOUR_MIN = 45
export const LESSON_DURATION_MIN = 90
export const LESSON_ACADEMIC_HOURS = LESSON_DURATION_MIN / ACADEMIC_HOUR_MIN

export const round1 = (value) => Math.round(value * 10) / 10

export const academicHours = (pairs) => pairs * LESSON_ACADEMIC_HOURS
