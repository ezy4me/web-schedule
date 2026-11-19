import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

// Красивый кастомный select-компонент (dropdown с клавиатурной навигацией)
export default function NiceSelect({ value, onChange, options, icon: Icon, label, allLabel }) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const rootRef = useRef(null)

  const list = options
  const current = list.find((o) => o.value === value)
  const currentIndex = list.findIndex((o) => o.value === value)

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (open) setHighlighted(currentIndex >= 0 ? currentIndex : 0)
  }, [open, currentIndex])

  function handleKeyDown(e) {
    if (!open && (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ')) {
      e.preventDefault()
      setOpen(true)
      return
    }
    if (!open) return
    if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => (h + 1) % list.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => (h - 1 + list.length) % list.length)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onChange(list[highlighted].value)
      setOpen(false)
    }
  }

  function select(v) {
    onChange(v)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative" onKeyDown={handleKeyDown}>
      {label && (
        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.08em] text-ink-faint dark:text-stone-500">
          {label}
        </span>
      )}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2.5 rounded-lg border py-2.5 pl-3 pr-2.5 text-sm transition-colors
          ${open
            ? 'border-stone-400 bg-white dark:border-stone-600 dark:bg-stone-900'
            : 'border-stone-200 bg-white hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700'}`}
      >
        {Icon && <Icon size={16} className="shrink-0 text-ink-faint dark:text-stone-500" />}
        <span className={`min-w-0 flex-1 truncate text-left ${value === 'all' ? 'text-ink-faint dark:text-stone-500' : 'font-medium text-ink dark:text-stone-100'}`}>
          {current ? current.label : allLabel}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-ink-faint transition-transform duration-200 dark:text-stone-500 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1.5 max-h-64 w-full overflow-y-auto rounded-lg border border-stone-200 bg-white py-1 shadow-pop scrollbar-thin dark:border-stone-700 dark:bg-stone-900"
        >
          {list.map((o, i) => {
            const active = o.value === value
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setHighlighted(i)}
                  onClick={() => select(o.value)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors
                    ${i === highlighted ? 'bg-stone-100 dark:bg-stone-800' : ''}
                    ${active ? 'font-medium text-ink dark:text-stone-100' : 'text-ink-muted dark:text-stone-300'}`}
                >
                  {o.icon ? (
                    <span className="shrink-0 text-ink-faint dark:text-stone-500">{o.icon}</span>
                  ) : Icon ? (
                    <span className="shrink-0 text-stone-300 dark:text-stone-600"><Icon size={16} /></span>
                  ) : null}
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {active && <Check size={16} className="shrink-0 text-clay-600 dark:text-clay-400" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
