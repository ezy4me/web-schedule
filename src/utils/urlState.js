const STATS_TABS = new Set(['overview', 'breakdown', 'calendar', 'remaining'])
const STATS_PERIODS = new Set(['semester', 'month-8', 'month-9', 'month-10', 'month-11'])

export function readUrlState(hash = '') {
  const raw = String(hash || '').replace(/^#/, '')
  const [pageRaw, query = ''] = raw.split('?')
  const page = pageRaw === 'stats' ? 'stats' : 'schedule'
  const params = new URLSearchParams(query)
  const tab = params.get('tab')
  const period = params.get('period')
  return {
    page,
    date: params.get('date') || null,
    group: params.get('group') || null,
    teacher: params.get('teacher') || null,
    source: params.get('source') || null,
    tab: STATS_TABS.has(tab) ? tab : 'overview',
    period: STATS_PERIODS.has(period) ? period : 'semester',
  }
}

export function buildHash({
  page = 'schedule',
  date = '',
  group = 'all',
  teacher = 'all',
  source = '',
  tab = 'overview',
  period = 'semester',
} = {}) {
  const params = new URLSearchParams()
  if (date) params.set('date', date)
  if (group && group !== 'all') params.set('group', group)
  if (teacher && teacher !== 'all') params.set('teacher', teacher)
  if (source && source !== 'excel-3') params.set('source', source)
  if (page === 'stats') {
    if (tab !== 'overview') params.set('tab', tab)
    if (period !== 'semester') params.set('period', period)
  }
  const query = params.toString()
  return `#${page === 'stats' ? 'stats' : 'schedule'}${query ? `?${query}` : ''}`
}

export function writeUrlState(state) {
  const hash = buildHash(state)
  const url = `${window.location.pathname}${window.location.search}${hash}`
  window.history.replaceState(null, '', url)
}

export function parseUrlDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''))
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(year, month, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}
