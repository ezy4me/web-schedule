// Пользовательские настройки, которые сохраняются между визитами.
// defaultSource — id преподавателя (файла расписания), который открывается первым.
// autoSemester — подставлять текущий семестр автоматически.
// defaultView — вид расписания по умолчанию ('day' | 'week').
// compact — компактные карточки пар.
export const DEFAULT_SETTINGS = {
  defaultSource: null,
  autoSemester: true,
  defaultView: 'day',
  compact: false,
}

export const SETTINGS_KEY = 'schedule.settings'

export function normalizeSettings(raw) {
  const value = raw && typeof raw === 'object' ? raw : {}
  return {
    defaultSource:
      typeof value.defaultSource === 'string' && value.defaultSource ? value.defaultSource : null,
    autoSemester: value.autoSemester !== false,
    defaultView: value.defaultView === 'week' ? 'week' : 'day',
    compact: value.compact === true,
  }
}

export function readSettings(storage) {
  try {
    const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null)
    if (!store) return { ...DEFAULT_SETTINGS }
    const raw = store.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return normalizeSettings(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function writeSettings(settings, storage) {
  try {
    const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null)
    if (!store) return
    store.setItem(SETTINGS_KEY, JSON.stringify(normalizeSettings(settings)))
  } catch {
    // localStorage недоступен — настройки просто не сохранятся
  }
}
