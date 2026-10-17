import React, { useEffect, useMemo, useState, useRef } from 'react'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarDays, CalendarRange, UploadCloud, X, CheckCircle2, CalendarHeart, Loader2, Sun, Moon } from 'lucide-react'
import { getPairsForDate, getWeekType, normalizeSchedule, buildTimeline, buildEmptyDaySet, getSeasonDates, isLessonNow } from './utils/schedule.js'
import { WEEK_TYPE_INFO } from './constants.js'
import DayRibbon from './components/DayRibbon.jsx'
import CalendarPicker from './components/CalendarPicker.jsx'
import Filters from './components/Filters.jsx'
import LessonCard from './components/LessonCard.jsx'
import WindowCard from './components/WindowCard.jsx'
import EmptyState from './components/EmptyState.jsx'
import NiceSelect from './components/NiceSelect.jsx'
import excel3Data from './data/excel-3.json'

// Доступные источники расписания (JSON-файлы лежат в public/)
const SCHEDULE_SOURCES = [
  { id: 'kai', label: 'КАИ (сайт)', url: `${import.meta.env.BASE_URL}kai.json` },
  { id: 'excel', label: 'КАИ (Excel)', url: `${import.meta.env.BASE_URL}excel.json` },
  { id: 'excel-new', label: 'КАИ (Excel, новый)', url: `${import.meta.env.BASE_URL}excel-new.json` },
  { id: 'excel-2', label: 'КАИ (Excel 2.0)', url: `${import.meta.env.BASE_URL}excel-2.json` },
  { id: 'excel-3', label: 'КАИ (Excel 3.0)', url: `${import.meta.env.BASE_URL}excel-3.json` },
  { id: 'shumilkin', label: 'Шумилкин А.О.', url: `${import.meta.env.BASE_URL}shumilkin.json` },
  { id: 'maximov', label: 'Максимов Р.С.', url: `${import.meta.env.BASE_URL}maximov.json` },
]

const DEFAULT_SOURCE_ID = 'excel-3'
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
  return normalizeSchedule(excel3Data)
}

// Всегда актуальная дата — навигация по году позволяет листать куда угодно
function getDefaultDate() {
  return new Date()
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
    const groups = normalizeSchedule(excel3Data).groups
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

export default function App() {
  const [selected, setSelected] = useState(getDefaultDate)
  const [showPicker, setShowPicker] = useState(false)
  const [group, setGroup] = useState(getInitialGroup)
  const [type, setType] = useState('all')
  const [query, setQuery] = useState('')
  const [data, setData] = useState(getDefaultData)
  const [sourceId, setSourceId] = useState(getInitialSourceId)
  const [loading, setLoading] = useState(false)
  const [importMsg, setImportMsg] = useState(null)
  const [theme, setTheme] = useState(getInitialTheme)
  const [now, setNow] = useState(() => new Date())
  const fileInputRef = useRef(null)

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
    if (meta) meta.setAttribute('content', dark ? '#09090b' : '#fafafa')
  }, [theme])

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

  // Если в прошлый раз был выбран другой источник — догружаем его при старте
  useEffect(() => {
    if (sourceId === DEFAULT_SOURCE_ID) return
    const src = SCHEDULE_SOURCES.find((s) => s.id === sourceId)
    if (src) loadUrl(src.url, src.label)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const weekType = getWeekType(selected, data)
  const weekInfo = WEEK_TYPE_INFO[weekType]

  const pairs = useMemo(
    () => getPairsForDate(selected, group, { type, query }, data),
    [selected, group, type, query, data]
  )

  const timeline = useMemo(() => buildTimeline(pairs), [pairs])
  const windowCount = timeline.filter((it) => it.type === 'window').length

  // Дни без пар (выходные) для текущей группы — маркировка в ленте и календаре
  const emptyDays = useMemo(
    () => buildEmptyDaySet(getSeasonDates(selected.getFullYear()), group, data),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected.getFullYear(), group, data]
  )

  const isTodaySelected = isSameDay(selected, now)

  const hasFilters = group !== 'all' || type !== 'all' || query.trim() !== ''

  const goToday = () => setSelected(getDefaultDate())
  const goTomorrow = () => setSelected(addDays(getDefaultDate(), 1))
  const goCurrentWeek = () => {
    const monday = startOfWeek(getDefaultDate(), { weekStartsOn: 1 })
    setSelected(monday)
  }

  const handleQuick = (fn) => {
    fn()
    setShowPicker(false)
  }

  // Применение нормализованных данных
  function applyData(normalized, label, ok) {
    setData({ ...normalized, isCustom: true, sourceLabel: label })
    setGroup('all')
    setType('all')
    setQuery('')
    setImportMsg(ok ? { ok: true, text: label } : { ok: false, text: label })
    setTimeout(() => setImportMsg(null), 4000)
  }

  // Загрузка расписания по URL (JSON-файл из public/)
  async function loadUrl(url, label) {
    setLoading(true)
    setImportMsg(null)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const parsed = await res.json()
      const normalized = normalizeSchedule(parsed)
      if (!hasScheduleData(normalized)) throw new Error('Файл не содержит данных расписания')
      applyData(normalized, `Загружено: ${label} (${normalized.groups.length} групп)`, true)
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
    const src = SCHEDULE_SOURCES.find((s) => s.id === id)
    if (!src) return
    loadUrl(src.url, src.label)
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
        applyData(normalized, `Расписание загружено (${file.name}) · ${normalized.groups.length} групп`, true)
      } catch (err) {
        setImportMsg({ ok: false, text: `Ошибка: ${err.message}` })
        setTimeout(() => setImportMsg(null), 5000)
      }
    }
    reader.readAsText(file)
  }

  function resetData() {
    setSourceId(DEFAULT_SOURCE_ID)
    setData(getDefaultData())
    setGroup('all')
    setType('all')
    setQuery('')
    setImportMsg(null)
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        {/* Шапка */}
        <header className="mb-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                <CalendarDays size={20} className="text-zinc-400" />
                Учебное расписание
              </h1>
              <p className="mt-1 truncate text-sm capitalize text-zinc-500 dark:text-zinc-400">
                {format(selected, 'EEEE, d MMMM yyyy', { locale: ru })}
              </p>
            </div>
            <button
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              aria-label={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
              title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>

          {/* Индикатор недели */}
          <div className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span className={`h-1.5 w-1.5 rounded-full ${weekInfo.dot}`} />
            {weekInfo.label}
          </div>
        </header>

        {/* Выбор расписания + загрузка JSON */}
        <div className="mb-4">
          <div className="flex flex-wrap items-end gap-3">
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
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <UploadCloud size={16} />
              Свой JSON
            </button>
            {loading && (
              <span className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <Loader2 size={16} className="animate-spin" />
                Загрузка...
              </span>
            )}
            {sourceId !== DEFAULT_SOURCE_ID && !loading && (
              <button
                onClick={resetData}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X size={15} />
                Сбросить
              </button>
            )}
          </div>

          {data.isCustom && sourceId !== DEFAULT_SOURCE_ID && !importMsg && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={13} />
                {data.sourceLabel || `Загружено (${data.groups.length} групп)`}
              </span>
            </div>
          )}

          {importMsg && (
            <div className={`mt-2 rounded-lg border px-3 py-2 text-sm ${importMsg.ok ? 'border-emerald-200 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400' : 'border-rose-200 text-rose-600 dark:border-rose-500/30 dark:text-rose-400'}`}>
              {importMsg.text}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFile}
            className="hidden"
          />
        </div>

        {/* Быстрые кнопки + календарь */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleQuick(goToday)}
            className="rounded-lg bg-zinc-900 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Сегодня
          </button>
          <button
            onClick={() => handleQuick(goTomorrow)}
            className="rounded-lg border border-zinc-200 px-3.5 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            Завтра
          </button>
          <button
            onClick={() => handleQuick(goCurrentWeek)}
            className="rounded-lg border border-zinc-200 px-3.5 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            Текущая неделя
          </button>
          <div className="relative ml-auto">
            <button
              onClick={() => setShowPicker((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3.5 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <CalendarRange size={15} className="text-zinc-400" />
              Календарь
            </button>
            {showPicker && (
              <>
                <div
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setShowPicker(false)}
                  aria-hidden="true"
                />
                <CalendarPicker
                  selected={selected}
                  onSelect={setSelected}
                  onClose={() => setShowPicker(false)}
                  emptyDays={emptyDays}
                />
              </>
            )}
          </div>
        </div>

        {/* Лента дней */}
        <DayRibbon selected={selected} onSelect={(d) => { setSelected(d); setShowPicker(false) }} emptyDays={emptyDays} />

        {/* Фильтры */}
        <div className="mt-4">
          <Filters
            group={group}
            onGroupChange={setGroup}
            type={type}
            onTypeChange={setType}
            query={query}
            onQueryChange={setQuery}
            groups={data.groups}
          />
        </div>

        {/* Расписание */}
        <div className="mt-5">
          {pairs.length === 0 ? (
            <EmptyState hasFilters={hasFilters} />
          ) : (
            <div className="space-y-2.5">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {pairs.length} пар{windowCount ? ` · ${windowCount} ${windowCount === 1 ? 'окно' : windowCount < 5 ? 'окна' : 'окон'}` : ''} · {format(selected, 'd MMMM', { locale: ru })}
              </p>
              {timeline.map((item, i) =>
                item.type === 'window' ? (
                  <WindowCard key={`window-${item.time}-${i}`} time={item.time} />
                ) : (
                  <LessonCard
                    key={`${item.lesson.time}-${item.lesson.subject}-${item.lesson.group}-${i}`}
                    lesson={item.lesson}
                    isNow={isTodaySelected && isLessonNow(item.lesson.time, now)}
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
