import React, { useEffect, useMemo, useRef, useState } from 'react'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CalendarHeart,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Building2,
  Clock3,
  Database,
  DoorOpen,
  Flower2,
  LayoutGrid,
  LayoutList,
  Leaf,
  Loader2,
  Moon,
  Settings2,
  Share2,
  ShieldCheck,
  Sparkles,
  Sun,
  UploadCloud,
  X,
} from 'lucide-react'
import {
  buildEmptyDaySet,
  buildLessonStats,
  buildTimeline,
  getPairsForDate,
  getSeasonDates,
  getSemesterForDate,
  getSemesterRange,
  getWeekType,
  isDateInSemester,
  isLessonNow,
  isLessonUpcoming,
  normalizeSchedule,
  parseRoom,
  SEMESTER_INFO,
} from './utils/schedule.js'
import { readUrlState, writeUrlState, parseUrlDate } from './utils/urlState.js'
import { validateSchedule } from './utils/validateSchedule.js'
import { WEEK_TYPE_INFO } from './constants.js'
import { readSettings, writeSettings, normalizeSettings } from './utils/settings.js'
import { firstStudyDate, pickAutoSemester, seasonYearFor } from './utils/insights.js'
import { academicHoursLabel, capitalizeFirst, nextLessonHint } from './utils/statsFormat.js'
import { LESSON_ACADEMIC_HOURS } from './utils/stats.js'
import DayRibbon from './components/DayRibbon.jsx'
import CalendarPicker from './components/CalendarPicker.jsx'
import Filters from './components/Filters.jsx'
import LessonCard from './components/LessonCard.jsx'
import WindowCard from './components/WindowCard.jsx'
import EmptyState from './components/EmptyState.jsx'
import NiceSelect from './components/NiceSelect.jsx'
import Statistics from './components/Statistics.jsx'
import WeekView from './components/WeekView.jsx'
import SettingsSheet from './components/SettingsSheet.jsx'
import TypeChip from './components/TypeChip.jsx'
import maximovData from './data/maximov.json'

// Доступные источники расписания (JSON-файлы лежат в public/)
const SCHEDULE_SOURCES = [
  { id: 'maximov', label: 'Максимов Р.С.', url: `${import.meta.env.BASE_URL}maximov.json` },
  { id: 'shumilkin', label: 'Шумилкин А.О.', url: `${import.meta.env.BASE_URL}shumilkin.json` },
  { id: 'gimadeev', label: 'Гимадеев И.Ф.', url: `${import.meta.env.BASE_URL}gimadeev.json` },
  { id: 'valova', label: 'Валова П.А.', url: `${import.meta.env.BASE_URL}valova.json` },
]

const DEFAULT_SOURCE_ID = 'maximov'
const LS_GROUP_KEY = 'schedule.group'
const LS_SOURCE_KEY = 'schedule.source'
const LS_THEME_KEY = 'schedule.theme'

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(LS_THEME_KEY)
    if (saved === 'dark' || saved === 'light') return saved
  } catch {
    // localStorage недоступен — игнорируем
  }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

// Данные по умолчанию — Excel 3.0 (встроены в бандл для мгновенного старта)
function getDefaultData() {
  return normalizeSchedule(maximovData)
}

// Всегда актуальная дата — навигация по году позволяет листать куда угодно
function getDefaultDate() {
  return new Date()
}

// Месяц статистики должен принадлежать выбранному семестру.
function normalizeStatsPeriod(period, semester) {
  const info = SEMESTER_INFO[semester] || SEMESTER_INFO.autumn
  if (typeof period === 'string' && period.startsWith('month-')) {
    return info.months.includes(Number(period.slice(6))) ? period : 'semester'
  }
  return period
}

function getInitialSourceId() {
  try {
    const saved = localStorage.getItem(LS_SOURCE_KEY)
    if (saved && SCHEDULE_SOURCES.some((s) => s.id === saved)) return saved
  } catch {
    // localStorage недоступен — игнорируем
  }
  return DEFAULT_SOURCE_ID
}

function getInitialGroup() {
  try {
    const saved = localStorage.getItem(LS_GROUP_KEY)
    const groups = normalizeSchedule(maximovData).groups
    if (saved && (saved === 'all' || groups.includes(saved))) return saved
  } catch {
    // localStorage недоступен — игнорируем
  }
  return 'all'
}

function hasScheduleData(normalized) {
  if (normalized.schedule_by_date) return Object.keys(normalized.schedule_by_date).length > 0
  return (
    Object.keys(normalized.odd_week).length > 0 ||
    Object.keys(normalized.even_week).length > 0 ||
    Object.keys(normalized.single_events).length > 0
  )
}

// Первичное состояние: URL важнее настроек, настройки важнее прошлого выбора.
function buildBootstrap() {
  const url = readUrlState(window.location.hash)
  const settings = readSettings()
  const defaultData = getDefaultData()
  const now = getDefaultDate()

  let sourceId = DEFAULT_SOURCE_ID
  if (url.source && SCHEDULE_SOURCES.some((s) => s.id === url.source)) {
    sourceId = url.source
  } else if (settings.defaultSource && SCHEDULE_SOURCES.some((s) => s.id === settings.defaultSource)) {
    sourceId = settings.defaultSource
  } else {
    sourceId = getInitialSourceId()
  }

  const baseDate = parseUrlDate(url.date) || now
  const semester =
    url.semester ||
    (settings.autoSemester ? pickAutoSemester(defaultData, now) : getSemesterForDate(baseDate))

  let selected = baseDate
  if (!isDateInSemester(selected, semester)) {
    const year = seasonYearFor(baseDate, semester)
    selected = settings.autoSemester
      ? firstStudyDate(defaultData, year, semester, getPairsForDate)
      : getSemesterRange(year, semester).start
  }

  return { url, settings, sourceId, semester, selected }
}

function shortName(label) {
  return String(label || '').split(' ')[0]
}

// Иконочная кнопка шапки — единый стиль для всех действий
function HeaderButton({ label, onClick, active = false, badge = false, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`relative grid h-9 w-9 place-items-center rounded-lg border transition-colors ${
        active
          ? 'border-stone-300 bg-stone-100 text-ink dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100'
          : 'border-stone-200 bg-white text-ink-muted hover:border-stone-300 hover:bg-stone-50 hover:text-ink dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:border-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-100'
      } ${className}`}
    >
      {children}
      {badge && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-clay-600 dark:bg-clay-400" />}
    </button>
  )
}

export default function App() {
  const [bootstrap] = useState(buildBootstrap)
  const [selected, setSelected] = useState(bootstrap.selected)
  const [semester, setSemester] = useState(bootstrap.semester)
  const [settings, setSettings] = useState(bootstrap.settings)
  const [viewMode, setViewMode] = useState(bootstrap.settings.defaultView)
  const [showPicker, setShowPicker] = useState(false)
  const [showData, setShowData] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [group, setGroup] = useState(() => bootstrap.url.group || getInitialGroup())
  const [teacher, setTeacher] = useState(() => bootstrap.url.teacher || 'all')
  const [type, setType] = useState('all')
  const [query, setQuery] = useState('')
  const [data, setData] = useState(getDefaultData)
  const [sourceId, setSourceId] = useState(bootstrap.sourceId)
  const [loadedSourceId, setLoadedSourceId] = useState(DEFAULT_SOURCE_ID)
  const [loading, setLoading] = useState(false)
  const [importMsg, setImportMsg] = useState(null)
  const [theme, setTheme] = useState(getInitialTheme)
  const [now, setNow] = useState(() => new Date())
  const [statsTab, setStatsTab] = useState(bootstrap.url.tab)
  const [statsPeriod, setStatsPeriod] = useState(() =>
    normalizeStatsPeriod(bootstrap.url.period, bootstrap.semester)
  )
  const [page, setPage] = useState(bootstrap.url.page)
  const [toast, setToast] = useState(null)
  const fileInputRef = useRef(null)
  const semesterLockedRef = useRef(Boolean(bootstrap.url.semester))

  // Живые часы для подсветки идущей пары (обновление каждые 30 секунд)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  // Тёмная тема: класс на <html>, сохранение выбора, цвет theme-color
  useEffect(() => {
    const dark = theme === 'dark'
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem(LS_THEME_KEY, theme)
    } catch {
      // игнорируем
    }
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', dark ? '#121110' : '#faf9f6')
  }, [theme])

  // Пользовательские настройки переживают перезагрузку
  useEffect(() => {
    writeSettings(settings)
  }, [settings])

  // Сохраняем выбор группы и источника между визитами
  useEffect(() => {
    try {
      localStorage.setItem(LS_GROUP_KEY, group)
    } catch {
      // игнорируем
    }
  }, [group])

  useEffect(() => {
    try {
      localStorage.setItem(LS_SOURCE_KEY, sourceId)
    } catch {
      // игнорируем
    }
  }, [sourceId])

  const weekType = getWeekType(selected, data, semester)
  const weekInfo = WEEK_TYPE_INFO[weekType]

  const pairs = useMemo(
    () => getPairsForDate(selected, group, { type, query, teacher }, data),
    [selected, group, teacher, type, query, data]
  )

  const timeline = useMemo(() => buildTimeline(pairs), [pairs])
  const windowCount = timeline.filter((it) => it.type === 'window').length

  // Дни без пар (выходные) для текущей группы — маркировка в ленте и календаре
  const emptyDays = useMemo(
    () => buildEmptyDaySet(getSeasonDates(selected.getFullYear(), semester), group, data),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected.getFullYear(), semester, group, data]
  )

  const isTodaySelected = isSameDay(selected, now)

  // Страница: расписание или статистика. Состояние синхронизируется с URL.
  const switchPage = (next) => setPage(next)

  // Статистика по парам: разрезы по группам/предметам/типам + оставшиеся пары.
  // Семестр берём из выбранной даты, чтобы статистика не уезжала в другой год.
  const seasonYear = selected.getFullYear()
  const stats = useMemo(
    () => buildLessonStats(data, new Date(seasonYear, 0, 1), semester),
    [data, seasonYear, semester]
  )
  const health = useMemo(
    () => validateSchedule(stats.lessons, data.groups),
    [stats.lessons, data.groups]
  )
  const semesterRange = useMemo(
    () => getSemesterRange(seasonYear, semester),
    [seasonYear, semester]
  )

  // Ближайшая пара с учётом фильтров — для hero-карточки
  const nextLesson = useMemo(
    () =>
      stats.lessons.find(
        (lesson) =>
          (group === 'all' || lesson.groups.includes(group)) &&
          (teacher === 'all' || lesson.teacher === teacher) &&
          isLessonUpcoming(lesson, now)
      ) || null,
    [stats.lessons, group, teacher, now]
  )

  useEffect(() => {
    writeUrlState({
      page,
      date: format(selected, 'yyyy-MM-dd'),
      group,
      teacher,
      source: sourceId === 'custom' ? '' : sourceId,
      semester,
      tab: statsTab,
      period: statsPeriod,
    })
  }, [page, selected, group, teacher, sourceId, semester, statsTab, statsPeriod])

  // Ссылка из URL может ссылаться на группу/преподавателя из другого файла.
  // Проверяем только после загрузки нужного источника, иначе сбросим фильтр раньше времени.
  useEffect(() => {
    if (loadedSourceId !== sourceId) return
    if (group !== 'all' && !data.groups.includes(group)) setGroup('all')
    if (teacher !== 'all' && !stats.teachers.includes(teacher)) setTeacher('all')
  }, [loadedSourceId, sourceId, data.groups, stats.teachers, group, teacher])

  // Если URL изменили вручную или вернулись назад — подхватываем состояние.
  useEffect(() => {
    const onHashChange = () => {
      const next = readUrlState(window.location.hash)
      setPage(next.page)
      const nextDate = parseUrlDate(next.date)
      if (nextDate) setSelected(nextDate)
      const nextSemester =
        next.semester || getSemesterForDate(nextDate || getDefaultDate())
      setSemester(nextSemester)
      if (next.group) setGroup(next.group)
      if (next.teacher) setTeacher(next.teacher)
      setStatsTab(next.tab)
      setStatsPeriod(normalizeStatsPeriod(next.period, nextSemester))
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Если в прошлый раз был выбран другой источник — догружаем его при старте
  useEffect(() => {
    if (sourceId === DEFAULT_SOURCE_ID) return
    const src = SCHEDULE_SOURCES.find((s) => s.id === sourceId)
    if (src) loadUrl(src.url, src.label, sourceId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasFilters = group !== 'all' || teacher !== 'all' || type !== 'all' || query.trim() !== ''

  const selectDate = (date) => {
    semesterLockedRef.current = true
    setSelected(date)
    const nextSemester = getSemesterForDate(date)
    if (nextSemester !== semester) setSemester(nextSemester)
  }

  const goToday = () => selectDate(getDefaultDate())
  const goTomorrow = () => selectDate(addDays(getDefaultDate(), 1))
  const goCurrentWeek = () => {
    const monday = startOfWeek(getDefaultDate(), { weekStartsOn: 1 })
    selectDate(monday)
  }

  const changeSemester = (next) => {
    if (next === semester) return
    semesterLockedRef.current = true
    const targetYear = seasonYearFor(selected, next)
    const range = getSemesterRange(targetYear, next)
    const today = getDefaultDate()
    let anchor = range.start

    if (today >= range.start && today <= range.end) {
      anchor = today
    } else {
      for (const date of getSeasonDates(targetYear, next)) {
        if (getPairsForDate(date, 'all', {}, data).length) {
          anchor = date
          break
        }
      }
    }

    setSemester(next)
    setSelected(anchor)
    setGroup('all')
    setTeacher('all')
    setType('all')
    setQuery('')
    setStatsPeriod('semester')
  }

  const changeView = (next) => {
    setViewMode(next)
    setSettings((prev) => normalizeSettings({ ...prev, defaultView: next }))
  }

  // Автоматический семестр: текущий по календарю, если в нём есть пары.
  const applyAutoSemester = (normalized, { force = false } = {}) => {
    if (!force && (!settings.autoSemester || semesterLockedRef.current)) return
    const target = pickAutoSemester(normalized, getDefaultDate())
    if (target === semester) return
    const year = seasonYearFor(getDefaultDate(), target)
    const anchor = firstStudyDate(normalized, year, target, getPairsForDate)
    setSemester(target)
    setSelected(anchor)
    setStatsPeriod('semester')
  }

  const updateSettings = (patch) => {
    setSettings((prev) => normalizeSettings({ ...prev, ...patch }))
    if (patch.defaultView) setViewMode(patch.defaultView)
    if (patch.autoSemester === true) {
      semesterLockedRef.current = false
      applyAutoSemester(data, { force: true })
    }
  }

  // Переход из статистики в расписание на конкретную дату
  const openDateInSchedule = (date) => {
    setSelected(date)
    setSemester(getSemesterForDate(date))
    setShowPicker(false)
    switchPage('schedule')
  }

  // Быстрый переход к статистике конкретной группы (из карточки пары)
  const openGroupStats = (value) => {
    setGroup(value)
    setTeacher('all')
    setStatsTab('overview')
    switchPage('stats')
  }

  const handleQuick = (fn) => {
    fn()
    setShowPicker(false)
  }

  const copyShareLink = async () => {
    const url = window.location.href
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const area = document.createElement('textarea')
        area.value = url
        area.style.position = 'fixed'
        area.style.opacity = '0'
        document.body.appendChild(area)
        area.select()
        document.execCommand('copy')
        area.remove()
      }
      setToast('Ссылка скопирована')
    } catch {
      setToast('Не удалось скопировать ссылку')
    }
    setTimeout(() => setToast(null), 2500)
  }

  // Применение нормализованных данных
  function applyData(normalized, label, ok, sourceKey = DEFAULT_SOURCE_ID) {
    setData({ ...normalized, isCustom: true, sourceLabel: label })
    setLoadedSourceId(sourceKey)
    setImportMsg(ok ? { ok: true, text: label } : { ok: false, text: label })
    setTimeout(() => setImportMsg(null), 4000)
    applyAutoSemester(normalized)
  }

  // Загрузка расписания по URL (JSON-файл из public/)
  async function loadUrl(url, label, sourceKey) {
    setLoading(true)
    setImportMsg(null)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const parsed = await res.json()
      const normalized = normalizeSchedule(parsed)
      if (!hasScheduleData(normalized)) throw new Error('Файл не содержит данных расписания')
      applyData(normalized, `Загружено: ${label} (${normalized.groups.length} групп)`, true, sourceKey)
    } catch (err) {
      setSourceId(DEFAULT_SOURCE_ID)
      applyData(getDefaultData(), `Не удалось загрузить ${label} (${err.message}). Показано КАИ (Excel 3.0).`, false)
    } finally {
      setLoading(false)
    }
  }

  // Смена источника расписания
  function handleSourceChange(id) {
    setSourceId(id)
    setGroup('all')
    setTeacher('all')
    setType('all')
    setQuery('')
    if (settings.autoSemester) semesterLockedRef.current = false
    const src = SCHEDULE_SOURCES.find((s) => s.id === id)
    if (!src) return
    loadUrl(src.url, src.label, id)
  }

  // Загрузка JSON-файла с расписанием (локальный файл)
  function handleFile(e) {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        const normalized = normalizeSchedule(parsed)
        if (!hasScheduleData(normalized)) {
          throw new Error('Файл не содержит данных расписания')
        }
        setSourceId('custom')
        setGroup('all')
        setTeacher('all')
        setType('all')
        setQuery('')
        applyData(normalized, `Расписание загружено (${file.name}) · ${normalized.groups.length} групп`, true, 'custom')
      } catch (err) {
        setImportMsg({ ok: false, text: `Ошибка: ${err.message}` })
        setTimeout(() => setImportMsg(null), 5000)
      }
    }
    reader.readAsText(file)
  }

  function resetData() {
    setSourceId(DEFAULT_SOURCE_ID)
    setLoadedSourceId(DEFAULT_SOURCE_ID)
    setData(getDefaultData())
    setGroup('all')
    setTeacher('all')
    setType('all')
    setQuery('')
    setImportMsg(null)
  }

  // Горячие клавиши: навигация и переключение видов
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }

      const key = event.key
      if (key === 'Escape') {
        setShowPicker(false)
        setShowSettings(false)
        return
      }

      if (key === 't' || key === 'е') {
        selectDate(getDefaultDate())
      } else if (key === 'ArrowLeft') {
        event.preventDefault()
        selectDate(addDays(selected, event.shiftKey ? -7 : -1))
      } else if (key === 'ArrowRight') {
        event.preventDefault()
        selectDate(addDays(selected, event.shiftKey ? 7 : 1))
      } else if (key === 'd' || key === 'в') {
        switchPage('schedule')
        changeView('day')
      } else if (key === 'w' || key === 'ц') {
        switchPage('schedule')
        changeView('week')
      } else if (key === 's' || key === 'ы') {
        switchPage(page === 'stats' ? 'schedule' : 'stats')
      } else if (key === 'f' || key === '/') {
        event.preventDefault()
        switchPage('schedule')
        requestAnimationFrame(() => document.getElementById('schedule-search')?.focus())
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const sourceLabel = (SCHEDULE_SOURCES.find((s) => s.id === sourceId) || {}).label || data.sourceLabel || 'Своё расписание'
  const isCompact = settings.compact
  const pairCountLabel = `${pairs.length} ${pairs.length === 1 ? 'пара' : pairs.length < 5 ? 'пары' : 'пар'}`
  const nextRoom = parseRoom(nextLesson ? nextLesson.room : '')

  return (
    <div className="min-h-screen bg-paper text-ink transition-colors dark:bg-[#121110] dark:text-stone-100">
      <header className="relative z-30 border-b border-stone-200 bg-paper sm:sticky sm:top-0 dark:border-stone-800 dark:bg-[#121110]">
        <div className="mx-auto max-w-5xl px-3 pb-2.5 pt-5 sm:px-4 sm:pt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink text-paper dark:bg-stone-100 dark:text-ink">
                <CalendarDays size={17} />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-[15px] font-semibold tracking-tight text-ink dark:text-stone-50">
                  Учебное расписание
                </h1>
                <p className="truncate text-xs text-ink-muted dark:text-stone-400">
                  {page === 'schedule'
                    ? `${capitalizeFirst(format(selected, 'EEEE', { locale: ru }))}, ${format(selected, 'd MMMM', { locale: ru })}`
                    : `Статистика · ${sourceLabel}`}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <HeaderButton label="Настройки" onClick={() => setShowSettings(true)}>
                <Settings2 size={17} />
              </HeaderButton>
              <HeaderButton
                label="Данные расписания"
                onClick={() => setShowData((value) => !value)}
                active={showData}
                badge={sourceId !== DEFAULT_SOURCE_ID}
              >
                <Database size={17} />
              </HeaderButton>
              <HeaderButton
                label="Скопировать ссылку"
                onClick={copyShareLink}
                className="hidden sm:grid"
              >
                <Share2 size={17} />
              </HeaderButton>
              <HeaderButton
                label={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
                onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </HeaderButton>
            </div>
          </div>

          {/* Быстрый выбор преподавателя */}
          <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-0.5 scrollbar-thin">
            {SCHEDULE_SOURCES.map((source) => {
              const active = sourceId === source.id
              return (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => handleSourceChange(source.id)}
                  aria-pressed={active}
                  title={source.label}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'border-ink bg-ink text-paper dark:border-stone-100 dark:bg-stone-100 dark:text-ink'
                      : 'border-stone-200 bg-white text-ink-muted hover:border-stone-300 hover:text-ink dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:border-stone-700 dark:hover:text-stone-100'
                  }`}
                >
                  {active && loading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        active ? 'bg-clay-400 dark:bg-clay-600' : 'bg-stone-300 dark:bg-stone-600'
                      }`}
                    />
                  )}
                  <span className="sm:hidden">{shortName(source.label)}</span>
                  <span className="hidden sm:inline">{source.label}</span>
                </button>
              )
            })}
          </div>

          {/* Семестр + вид */}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <div className="grid grid-cols-2 gap-0.5 rounded-lg border border-stone-200 bg-white p-0.5 dark:border-stone-800 dark:bg-stone-900">
              {Object.values(SEMESTER_INFO).map((info) => {
                const active = semester === info.id
                const Icon = info.id === 'spring' ? Flower2 : Leaf
                return (
                  <button
                    key={info.id}
                    type="button"
                    onClick={() => changeSemester(info.id)}
                    aria-pressed={active}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? 'bg-ink text-paper dark:bg-stone-100 dark:text-ink'
                        : 'text-ink-muted hover:bg-stone-100 hover:text-ink dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100'
                    }`}
                  >
                    <Icon size={13} />
                    {info.label}
                  </button>
                )
              })}
            </div>

            {settings.autoSemester && (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-clay-200 bg-clay-50 px-2 py-0.5 text-[10px] font-medium text-clay-700 dark:border-clay-500/30 dark:bg-clay-500/10 dark:text-clay-300"
                title="Семестр выбирается автоматически"
              >
                <Sparkles size={10} />
                авто
              </span>
            )}

            <span className="hidden text-[11px] tabular-nums text-ink-faint sm:inline dark:text-stone-500">
              {format(semesterRange.start, 'd MMM yyyy', { locale: ru })} —{' '}
              {format(semesterRange.end, 'd MMM yyyy', { locale: ru })}
              {' · '}
              {stats.lessons.length} пар
            </span>

            <span className={`hidden items-center gap-1.5 text-[11px] font-medium sm:inline-flex ${weekInfo.chip}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${weekInfo.dot}`} />
              {weekInfo.label}
            </span>

            {page === 'schedule' && (
              <div className="ml-auto flex items-center gap-0.5 rounded-lg border border-stone-200 bg-white p-0.5 dark:border-stone-800 dark:bg-stone-900">
                <button
                  type="button"
                  onClick={() => changeView('day')}
                  aria-pressed={viewMode === 'day'}
                  title="День"
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    viewMode === 'day'
                      ? 'bg-ink text-paper dark:bg-stone-100 dark:text-ink'
                      : 'text-ink-muted hover:text-ink dark:text-stone-400 dark:hover:text-stone-100'
                  }`}
                >
                  <LayoutList size={14} />
                  <span className="hidden sm:inline">День</span>
                </button>
                <button
                  type="button"
                  onClick={() => changeView('week')}
                  aria-pressed={viewMode === 'week'}
                  title="Неделя"
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    viewMode === 'week'
                      ? 'bg-ink text-paper dark:bg-stone-100 dark:text-ink'
                      : 'text-ink-muted hover:text-ink dark:text-stone-400 dark:hover:text-stone-100'
                  }`}
                >
                  <LayoutGrid size={14} />
                  <span className="hidden sm:inline">Неделя</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 pb-28 pt-3 sm:px-4 sm:pb-16 sm:pt-4">
        {/* Переключение страниц: расписание / статистика (на мобильных — нижняя навигация) */}
        <div className="mb-4 hidden grid-cols-2 gap-0.5 rounded-lg border border-stone-200 bg-stone-100/70 p-0.5 sm:grid dark:border-stone-800 dark:bg-stone-900/60">
          <button
            onClick={() => switchPage('schedule')}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              page === 'schedule'
                ? 'bg-white text-ink shadow-sm dark:bg-stone-800 dark:text-stone-100'
                : 'text-ink-muted hover:text-ink dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            <CalendarDays size={15} />
            Расписание
          </button>
          <button
            onClick={() => switchPage('stats')}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              page === 'stats'
                ? 'bg-white text-ink shadow-sm dark:bg-stone-800 dark:text-stone-100'
                : 'text-ink-muted hover:text-ink dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            <BarChart3 size={15} />
            Статистика
          </button>
        </div>

        {stats.lessons.length === 0 && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>
              За {semester === 'spring' ? 'весенний' : 'осенний'} семестр расписания нет.
              Выберите другой семестр или загрузите свой JSON.
            </span>
          </div>
        )}

        {showData && (
          <section className="mb-4 animate-fade-in rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-ink dark:text-stone-100">Данные расписания</h2>
                <p className="mt-0.5 truncate text-xs text-ink-muted dark:text-stone-400">
                  {loading ? 'Загрузка…' : data.sourceLabel || `${data.groups.length} групп`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowData(false)}
                className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-faint transition-colors hover:bg-stone-100 hover:text-ink dark:hover:bg-stone-800 dark:hover:text-stone-100"
                aria-label="Закрыть панель данных"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <div className="w-full sm:w-64">
                <NiceSelect
                  label="Расписание"
                  value={sourceId}
                  onChange={handleSourceChange}
                  options={SCHEDULE_SOURCES.map((s) => ({ value: s.id, label: s.label }))}
                  icon={CalendarHeart}
                  allLabel="Выберите расписание"
                />
              </div>
              <button
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-stone-300 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
              >
                <UploadCloud size={16} />
                Свой JSON
              </button>
              {loading && (
                <span className="inline-flex items-center gap-2 pb-2.5 text-sm text-ink-muted dark:text-stone-400">
                  <Loader2 size={16} className="animate-spin" />
                  Загрузка...
                </span>
              )}
              {sourceId !== DEFAULT_SOURCE_ID && !loading && (
                <button
                  onClick={resetData}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-ink dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                >
                  <X size={15} />
                  Сбросить
                </button>
              )}
            </div>

            {data.isCustom && sourceId !== DEFAULT_SOURCE_ID && !importMsg && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-moss-700 dark:text-moss-300">
                  <CheckCircle2 size={13} />
                  {data.sourceLabel || `Загружено (${data.groups.length} групп)`}
                </span>
              </div>
            )}

            {importMsg && (
              <div
                className={`mt-2 rounded-lg border px-3 py-2 text-sm ${
                  importMsg.ok
                    ? 'border-moss-300/60 text-moss-700 dark:border-moss-500/30 dark:text-moss-300'
                    : 'border-rose-200 text-rose-700 dark:border-rose-500/30 dark:text-rose-300'
                }`}
              >
                {importMsg.text}
              </div>
            )}

            <div className="mt-3 border-t border-stone-100 pt-3 dark:border-stone-800">
              <div className="flex items-center gap-2 text-xs font-medium text-ink-soft dark:text-stone-300">
                {health.status === 'ok' ? (
                  <ShieldCheck size={14} className="text-moss-600 dark:text-moss-500" />
                ) : (
                  <AlertTriangle size={14} className={health.status === 'error' ? 'text-rose-500' : 'text-amber-500'} />
                )}
                Проверка данных
                <span className="font-normal text-ink-faint dark:text-stone-500">{health.checked} занятий</span>
              </div>
              {health.status === 'ok' ? (
                <p className="mt-1.5 text-xs text-moss-700 dark:text-moss-300">Ошибок и конфликтов не найдено.</p>
              ) : (
                <ul className="mt-1.5 space-y-1">
                  {health.issues.map((issue) => (
                    <li key={issue.id} className="flex gap-2 text-xs">
                      <span
                        className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                          issue.level === 'error' ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                      />
                      <span className="text-ink-muted dark:text-stone-400">
                        <span className="font-medium text-ink-soft dark:text-stone-200">{issue.title}.</span>{' '}
                        {issue.detail}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFile}
              className="hidden"
            />
          </section>
        )}

        {page === 'schedule' && (
          <>
            {/* Ближайшая пара */}
            {nextLesson && (
              <section className="relative mb-3 overflow-hidden rounded-xl border border-stone-200 bg-white px-3 py-3 dark:border-stone-800 dark:bg-stone-900">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-stone-100 text-ink-soft dark:bg-stone-800 dark:text-stone-200">
                    <Clock3 size={16} />
                  </span>
                  <div className="min-w-0 flex-1 basis-[168px]">
                    <div className="flex flex-wrap items-center gap-x-2 text-[10px] font-medium uppercase tracking-[0.08em] text-clay-700 dark:text-clay-300">
                      <span>Следующая пара</span>
                      <TypeChip type={nextLesson.type} size="sm" />
                      <span className="normal-case tracking-normal text-ink-faint dark:text-stone-500">
                        {nextLessonHint(nextLesson, now)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm font-semibold text-ink dark:text-stone-50">
                      {nextLesson.subject}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-ink-muted dark:text-stone-400">
                      <span className="font-medium tabular-nums text-ink-soft dark:text-stone-300">{nextLesson.time}</span>
                      <span>{format(nextLesson.date, 'd MMMM, EEEE', { locale: ru })}</span>
                      {nextRoom.room && (
                        <span className="inline-flex items-center gap-1">
                          <DoorOpen size={11} className="text-ink-faint dark:text-stone-500" />
                          ауд. {nextRoom.room}
                        </span>
                      )}
                      {nextRoom.building && (
                        <span className="inline-flex items-center gap-1">
                          <Building2 size={11} className="text-ink-faint dark:text-stone-500" />
                          корп. {nextRoom.building}
                        </span>
                      )}
                      {nextLesson.groups.length > 0 && <span>гр. {nextLesson.groups.join(', ')}</span>}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openDateInSchedule(nextLesson.date)}
                    className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-ink-soft dark:bg-stone-100 dark:text-ink dark:hover:bg-white"
                  >
                    Открыть
                    <ArrowRight size={13} />
                  </button>
                </div>
              </section>
            )}

            {/* Быстрые кнопки + календарь */}
            <div className="mb-3 flex items-center gap-1.5">
              <button
                onClick={() => handleQuick(goToday)}
                className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-ink px-3 text-sm font-medium text-paper transition-colors hover:bg-ink-soft sm:flex-none dark:bg-stone-100 dark:text-ink dark:hover:bg-white"
              >
                Сегодня
              </button>
              <button
                onClick={() => handleQuick(goTomorrow)}
                className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-ink-soft transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-ink sm:flex-none dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
              >
                Завтра
              </button>
              <button
                onClick={() => handleQuick(goCurrentWeek)}
                className="hidden h-9 items-center justify-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-ink-soft transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-ink sm:inline-flex dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
              >
                Текущая неделя
              </button>
              <div className="relative flex-1 sm:flex-none">
                <button
                  onClick={() => setShowPicker((v) => !v)}
                  className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-ink-soft transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-ink dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                  aria-expanded={showPicker}
                >
                  <CalendarRange size={15} className="text-ink-faint dark:text-stone-500" />
                  Календарь
                </button>
                {showPicker && (
                  <>
                    <div
                      className="fixed inset-0 z-10 cursor-default bg-ink/20 sm:bg-transparent"
                      onClick={() => setShowPicker(false)}
                      aria-hidden="true"
                    />
                    <CalendarPicker
                      selected={selected}
                      semester={semester}
                      onSelect={selectDate}
                      onClose={() => setShowPicker(false)}
                      emptyDays={emptyDays}
                    />
                  </>
                )}
              </div>
              <div className="ml-auto hidden items-center gap-1 min-[380px]:flex">
                <button
                  type="button"
                  onClick={() => selectDate(addDays(selected, -1))}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-stone-200 bg-white text-ink-muted transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-ink dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                  aria-label="Предыдущий день"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => selectDate(addDays(selected, 1))}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-stone-200 bg-white text-ink-muted transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-ink dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                  aria-label="Следующий день"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Лента дней */}
            <DayRibbon
              selected={selected}
              semester={semester}
              onSelect={(date) => {
                selectDate(date)
                setShowPicker(false)
              }}
              emptyDays={emptyDays}
            />

            {/* Фильтры */}
            <div className="mt-4">
              <Filters
                group={group}
                onGroupChange={setGroup}
                teacher={teacher}
                onTeacherChange={setTeacher}
                teachers={stats.teachers}
                type={type}
                onTypeChange={setType}
                query={query}
                onQueryChange={setQuery}
                groups={data.groups}
              />
            </div>

            {/* Расписание */}
            <div className="mt-4">
              {viewMode === 'week' ? (
                <WeekView
                  selected={selected}
                  semester={semester}
                  group={group}
                  teacher={teacher}
                  type={type}
                  query={query}
                  data={data}
                  onSelectDate={selectDate}
                />
              ) : pairs.length === 0 ? (
                <div className="rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
                  <EmptyState hasFilters={hasFilters} />
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="rounded-full bg-white px-2.5 py-1 font-medium text-ink-soft ring-1 ring-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-800">
                      {pairCountLabel}
                    </span>
                    {windowCount > 0 && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-800 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
                        {windowCount} {windowCount === 1 ? 'окно' : windowCount < 5 ? 'окна' : 'окон'}
                      </span>
                    )}
                    <span className="rounded-full bg-white px-2.5 py-1 font-medium text-ink-soft ring-1 ring-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-800">
                      {academicHoursLabel(pairs.length * LESSON_ACADEMIC_HOURS)}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 font-medium sm:hidden ${weekInfo.chip}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${weekInfo.dot}`} />
                      {weekInfo.label}
                    </span>
                    <span className="ml-auto text-ink-faint dark:text-stone-500">
                      {format(selected, 'd MMMM', { locale: ru })}
                    </span>
                  </div>
                  {timeline.map((item, i) =>
                    item.type === 'window' ? (
                      <WindowCard key={`window-${item.time}-${i}`} time={item.time} />
                    ) : (
                      <LessonCard
                        key={`${item.lesson.time}-${item.lesson.subject}-${item.lesson.group}-${i}`}
                        lesson={item.lesson}
                        isNow={isTodaySelected && isLessonNow(item.lesson.time, now)}
                        onGroupClick={openGroupStats}
                        compact={isCompact}
                      />
                    )
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {page === 'stats' && (
          <div className="mt-1">
            <Statistics
              stats={stats}
              group={group}
              teacher={teacher}
              tab={statsTab}
              period={statsPeriod}
              onTabChange={setStatsTab}
              onPeriodChange={setStatsPeriod}
              onGroupChange={setGroup}
              onTeacherChange={setTeacher}
              onOpenDate={openDateInSchedule}
            />
          </div>
        )}
      </main>

      {/* Мобильная навигация по разделам */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-paper sm:hidden dark:border-stone-800 dark:bg-[#121110]"
        aria-label="Разделы"
      >
        <div className="mx-auto grid max-w-5xl grid-cols-2">
          {[
            { id: 'schedule', label: 'Расписание', icon: CalendarDays },
            { id: 'stats', label: 'Статистика', icon: BarChart3 },
          ].map((item) => {
            const Icon = item.icon
            const active = page === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => switchPage(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                  active
                    ? 'text-clay-700 dark:text-clay-300'
                    : 'text-ink-muted dark:text-stone-400'
                }`}
              >
                <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>

      <SettingsSheet
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onChange={updateSettings}
        sources={SCHEDULE_SOURCES}
        currentSourceId={sourceId}
        onResetData={resetData}
      />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 animate-pop-in whitespace-nowrap rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper shadow-pop sm:bottom-6 dark:bg-stone-100 dark:text-ink"
        >
          {toast}
        </div>
      )}
    </div>
  )
}
