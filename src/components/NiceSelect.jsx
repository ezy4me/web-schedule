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
        <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">{label}</span>
      )}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2.5 rounded-xl border py-2.5 pl-3.5 pr-3 text-sm transition-all
          ${open
            ? 'border-violet-400 bg-white/90 ring-2 ring-violet-200/80 dark:border-violet-400/60 dark:bg-slate-900/90 dark:ring-violet-500/30'
            : 'border-white/70 bg-white/70 hover:border-violet-300 hover:bg-white dark:border-white/10 dark:bg-slate-900/60 dark:hover:border-violet-500/50 dark:hover:bg-slate-800'}`}
      >
        {Icon && <Icon size={16} className={open ? 'text-violet-500' : 'text-slate-400'} />}
        <span className={`flex-1 truncate text-left ${value === 'all' ? 'text-slate-400 dark:text-slate-500' : 'font-medium text-slate-800 dark:text-slate-100'}`}>
          {current ? current.label : allLabel}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180 text-violet-500' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="glass-strong absolute z-30 mt-2 max-h-64 w-full animate-pop overflow-y-auto rounded-2xl border border-white/70 py-1.5 shadow-glass dark:border-white/10"
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
                  className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors
                    ${i === highlighted ? 'bg-violet-50/80 dark:bg-violet-500/10' : ''}
                    ${active ? 'font-semibold text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-200'}`}
                >
                  {o.icon ? (
                    <span className={active ? 'text-violet-500' : 'text-slate-400'}>{o.icon}</span>
                  ) : Icon ? (
                    <span className="text-slate-300"><Icon size={16} /></span>
                  ) : null}
                  <span className="flex-1">{o.label}</span>
                  {active && <Check size={16} className="text-violet-600 dark:text-violet-400" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
