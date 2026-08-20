import React, { useMemo, useState, useRef } from 'react'
import { format, addDays, startOfWeek } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarDays, CalendarRange, UploadCloud, X, CheckCircle2 } from 'lucide-react'
import { getPairsForDate, getWeekType, getDefaultData, normalizeSchedule } from './utils/schedule.js'
import { WEEK_TYPE_INFO } from './constants.js'
import DayRibbon from './components/DayRibbon.jsx'
import CalendarPicker from './components/CalendarPicker.jsx'
import Filters from './components/Filters.jsx'
import LessonCard from './components/LessonCard.jsx'
import EmptyState from './components/EmptyState.jsx'

function getDefaultDate() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 8, 1)
  const end = new Date(now.getFullYear(), 11, 31)
  return now >= start && now <= end ? now : start
}

export default function App() {
  const [selected, setSelected] = useState(getDefaultDate)
  const [showPicker, setShowPicker] = useState(false)
  const [group, setGroup] = useState('all')
  const [type, setType] = useState('all')
  const [query, setQuery] = useState('')
  const [data, setData] = useState(getDefaultData)
  const [importMsg, setImportMsg] = useState(null)
  const fileInputRef = useRef(null)

  const weekType = getWeekType(selected, data)
  const weekInfo = WEEK_TYPE_INFO[weekType]

  const pairs = useMemo(
    () => getPairsForDate(selected, group, { type, query }, data),
    [selected, group, type, query, data]
  )

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

  // Загрузка JSON-файла с расписанием
  function handleFile(e) {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        const normalized = normalizeSchedule(parsed)
        const hasData = normalized.schedule_by_date
          ? Object.keys(normalized.schedule_by_date).length > 0
          : Object.keys(normalized.odd_week).length > 0 ||
            Object.keys(normalized.even_week).length > 0 ||
            Object.keys(normalized.single_events).length > 0
        if (!hasData) {
          throw new Error('Файл не содержит данных расписания')
        }
        setData({ ...normalized, isCustom: true })
        setGroup('all')
        setType('all')
        setQuery('')
        setImportMsg({ ok: true, text: `Расписание загружено (${file.name})` })
        setTimeout(() => setImportMsg(null), 4000)
      } catch (err) {
        setImportMsg({ ok: false, text: `Ошибка: ${err.message}` })
        setTimeout(() => setImportMsg(null), 5000)
      }
    }
    reader.readAsText(file)
  }

  function resetData() {
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

        {/* Загрузка JSON */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors"
            >
              <UploadCloud size={16} />
              Загрузить JSON
            </button>
            {data.isCustom && (
              <button
                onClick={resetData}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <X size={15} />
                Сбросить к встроенному
              </button>
            )}
            {data.isCustom && !importMsg && (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                <CheckCircle2 size={13} />
                Загружено расписание ({data.groups.length} групп)
              </span>
            )}
          </div>
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
                {pairs.length} пар · {format(selected, 'd MMMM', { locale: ru })}
              </p>
              {pairs.map((p, i) => (
                <LessonCard key={`${p.time}-${p.subject}-${p.group}-${i}`} lesson={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
