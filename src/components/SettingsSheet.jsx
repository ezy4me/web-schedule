import React, { useEffect } from 'react'
import {
  LayoutGrid,
  LayoutList,
  RotateCcw,
  Settings2,
  Sparkles,
  Star,
  X,
} from 'lucide-react'
import NiceSelect from './NiceSelect.jsx'

function Toggle({ checked, onChange, label, hint }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink dark:text-stone-100">{label}</span>
        {hint && <span className="mt-0.5 block text-[11px] leading-snug text-ink-muted dark:text-stone-400">{hint}</span>}
      </span>
      <span
        className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-clay-600 dark:bg-clay-500' : 'bg-stone-200 dark:bg-stone-700'
        }`}
      >
        <span
          className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}

function SectionLabel({ children }) {
  return (
    <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.08em] text-ink-faint dark:text-stone-500">
      {children}
    </span>
  )
}

const SHORTCUTS = [
  ['t', 'сегодня'],
  ['← / →', 'день назад / вперёд'],
  ['Shift + ← / →', 'неделя назад / вперёд'],
  ['d / w', 'день / неделя'],
  ['s', 'расписание / статистика'],
  ['f', 'поиск'],
]

export default function SettingsSheet({
  open,
  onClose,
  settings,
  onChange,
  sources,
  currentSourceId,
  onResetData,
}) {
  // Блокируем прокрутку страницы, пока открыт лист настроек.
  useEffect(() => {
    if (!open) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (!open) return null

  const sourceOptions = [
    { value: '', label: 'Последний открытый', icon: <Star size={15} /> },
    ...sources.map((source) => ({ value: source.id, label: source.label })),
  ]

  const defaultSourceValue = settings.defaultSource || ''

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink/40 sm:items-center sm:p-4 dark:bg-black/60">
      <div className="absolute inset-0 cursor-default" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Настройки"
        className="relative w-full max-w-md animate-slide-up rounded-t-2xl border border-stone-200 bg-white shadow-pop sm:rounded-xl dark:border-stone-800 dark:bg-stone-900"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-stone-200 sm:hidden dark:bg-stone-700" />

        <div className="flex items-start justify-between gap-2 border-b border-stone-200 px-4 py-3 dark:border-stone-800">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink text-paper dark:bg-stone-100 dark:text-ink">
              <Settings2 size={16} />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-ink dark:text-stone-100">Настройки</h2>
              <p className="text-[11px] text-ink-faint dark:text-stone-500">Сохраняются в этом браузере</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-faint transition-colors hover:bg-stone-100 hover:text-ink dark:hover:bg-stone-800 dark:hover:text-stone-200"
            aria-label="Закрыть настройки"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[72vh] space-y-4 overflow-y-auto p-4 scrollbar-thin">
          <div>
            <SectionLabel>Преподаватель по умолчанию</SectionLabel>
            <NiceSelect
              value={defaultSourceValue}
              onChange={(value) => onChange({ defaultSource: value || null })}
              options={sourceOptions}
              icon={Sparkles}
              allLabel="Последний открытый"
            />
            {sources.some((source) => source.id === currentSourceId) && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ defaultSource: currentSourceId })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[11px] font-medium text-ink-muted transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-ink dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                >
                  <Star size={12} />
                  Сделать текущий ({(sources.find((s) => s.id === currentSourceId) || {}).label || currentSourceId}) по умолчанию
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <SectionLabel>Поведение</SectionLabel>
            <Toggle
              checked={settings.autoSemester}
              onChange={(value) => onChange({ autoSemester: value })}
              label="Автоматически выбирать семестр"
              hint="Открывать текущий семестр, если в нём есть пары"
            />
            <Toggle
              checked={settings.compact}
              onChange={(value) => onChange({ compact: value })}
              label="Компактные карточки"
              hint="Больше пар на экране без лишних деталей"
            />
          </div>

          <div>
            <SectionLabel>Вид по умолчанию</SectionLabel>
            <div className="grid grid-cols-2 gap-0.5 rounded-lg border border-stone-200 bg-stone-100/70 p-0.5 dark:border-stone-800 dark:bg-stone-800/50">
              {[
                { id: 'day', label: 'День', icon: LayoutList },
                { id: 'week', label: 'Неделя', icon: LayoutGrid },
              ].map((option) => {
                const Icon = option.icon
                const active = settings.defaultView === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onChange({ defaultView: option.id })}
                    aria-pressed={active}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-colors ${
                      active
                        ? 'bg-white text-ink shadow-sm dark:bg-stone-900 dark:text-stone-100'
                        : 'text-ink-muted hover:text-ink dark:text-stone-400 dark:hover:text-stone-200'
                    }`}
                  >
                    <Icon size={13} />
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <SectionLabel>Горячие клавиши</SectionLabel>
            <ul className="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800">
              {SHORTCUTS.map(([keys, label]) => (
                <li
                  key={keys}
                  className="flex items-center justify-between gap-2 border-b border-stone-100 px-3 py-1.5 last:border-0 dark:border-stone-800"
                >
                  <span className="text-[11px] text-ink-muted dark:text-stone-400">{label}</span>
                  <kbd className="rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 font-mono text-[10px] text-ink-muted dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300">
                    {keys}
                  </kbd>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-stone-200 px-4 py-3 dark:border-stone-800">
          <button
            type="button"
            onClick={onResetData}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-ink-muted transition-colors hover:bg-stone-100 hover:text-ink dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
          >
            <RotateCcw size={12} />
            Сбросить данные
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-ink px-4 py-2 text-xs font-medium text-paper transition-colors hover:bg-ink-soft dark:bg-stone-100 dark:text-ink dark:hover:bg-white"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  )
}
