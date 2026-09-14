import React, { useEffect, useMemo, useState, useRef } from 'react'
import { format, addDays, startOfWeek } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarDays, CalendarRange, UploadCloud, X, CheckCircle2, CalendarHeart, Loader2 } from 'lucide-react'
import { getPairsForDate, getWeekType, normalizeSchedule, buildTimeline } from './utils/schedule.js'
import { WEEK_TYPE_INFO } from './constants.js'
import DayRibbon from './components/DayRibbon.jsx'
import CalendarPicker from './components/CalendarPicker.jsx'
import Filters from './components/Filters.jsx'
import LessonCard from './components/LessonCard.jsx'
import WindowCard from './components/WindowCard.jsx'
import EmptyState from './components/EmptyState.jsx'
import NiceSelect from './components/NiceSelect.jsx'
import excel2Data from './data/excel-2.json'

// Доступные источники расписания (JSON-файлы лежат в public/)
const SCHEDULE_SOURCES = [
  { id: 'kai', label: 'КАИ (сайт)', url: `${import.meta.env.BASE_URL}kai.json` },
  { id: 'excel', label: 'КАИ (Excel)', url: `${import.meta.env.BASE_URL}excel.json` },
  { id: 'excel-new', label: 'КАИ (Excel, новый)', url: `${import.meta.env.BASE_URL}excel-new.json` },
  { id: 'excel-2', label: 'КАИ (Excel 2.0)', url: `${import.meta.env.BASE_URL}excel-2.json` },
  { id: 'shumilkin', label: 'Шумилкин А.О.', url: `${import.meta.env.BASE_URL}shumilkin.json` },
  { id: 'maximov', label: 'Максимов Р.С.', url: `${import.meta.env.BASE_URL}maximov.json` },
]

const DEFAULT_SOURCE_ID = 'excel-2'
const LS_GROUP_KEY = 'schedule.group'
const LS_SOURCE_KEY = 'schedule.source'

// Данные по умолчанию — Excel 2.0 (встроены в бандл для мгновенного старта)
function getDefaultData() {
  return normalizeSchedule(excel2Data)
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
    const groups = normalizeSchedule(excel2Data).groups
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
  const fileInputRef = useRef(null)

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
      applyData(getDefaultData(), `Не удалось загрузить ${label} (${err.message}). Показано КАИ (Excel 2.0).`, false)
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Шапка */}
        <header className="mb-5">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="text-indigo-600" size={26} />
            Учебное расписание
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {format(selected, 'EEEE, d MMMM yyyy', { locale: ru })}
          </p>

          {/* Индикатор недели */}
          <div className="mt-3 inline-flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${weekInfo.dot}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${weekInfo.dot}`} />
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${weekInfo.chip}`}>
              {weekInfo.label}
            </span>
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
              className="inline-flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors"
            >
              <UploadCloud size={16} />
              Свой JSON
            </button>
            {loading && (
              <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin" />
                Загрузка...
              </span>
            )}
            {sourceId !== DEFAULT_SOURCE_ID && !loading && (
              <button
                onClick={resetData}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <X size={15} />
                Сбросить
              </button>
            )}
          </div>

          {data.isCustom && sourceId !== DEFAULT_SOURCE_ID && !importMsg && (
            <div className="mt-2">
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                <CheckCircle2 size={13} />
                {data.sourceLabel || `Загружено (${data.groups.length} групп)`}
              </span>
            </div>
          )}

          {importMsg && (
            <div className={`mt-2 text-sm rounded-xl px-3 py-2 ${importMsg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
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
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => handleQuick(goToday)} className="px-3 py-1.5 text-sm font-medium bg-white border border-slate-200 rounded-full hover:bg-slate-50">
            Сегодня
          </button>
          <button onClick={() => handleQuick(goTomorrow)} className="px-3 py-1.5 text-sm font-medium bg-white border border-slate-200 rounded-full hover:bg-slate-50">
            Завтра
          </button>
          <button onClick={() => handleQuick(goCurrentWeek)} className="px-3 py-1.5 text-sm font-medium bg-white border border-slate-200 rounded-full hover:bg-slate-50">
            Текущая неделя
          </button>
          <div className="relative ml-auto">
            <button
              onClick={() => setShowPicker((v) => !v)}
              className="px-3 py-1.5 text-sm font-medium bg-white border border-slate-200 rounded-full hover:bg-slate-50 flex items-center gap-1.5"
            >
              <CalendarRange size={15} className="text-indigo-600" />
              Календарь
            </button>
            {showPicker && (
              <CalendarPicker
                selected={selected}
                onSelect={setSelected}
                onClose={() => setShowPicker(false)}
              />
            )}
          </div>
        </div>

        {/* Лента дней */}
        <DayRibbon selected={selected} onSelect={(d) => { setSelected(d); setShowPicker(false) }} />

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
            <div className="space-y-3">
              <p className="text-sm text-slate-500 font-medium">
                {pairs.length} пар{windowCount ? ` · ${windowCount} ${windowCount === 1 ? 'окно' : windowCount < 5 ? 'окна' : 'окон'}` : ''} · {format(selected, 'd MMMM', { locale: ru })}
              </p>
              {timeline.map((item, i) =>
                item.type === 'window' ? (
                  <WindowCard key={`window-${item.time}-${i}`} time={item.time} />
                ) : (
                  <LessonCard key={`${item.lesson.time}-${item.lesson.subject}-${item.lesson.group}-${i}`} lesson={item.lesson} />
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
