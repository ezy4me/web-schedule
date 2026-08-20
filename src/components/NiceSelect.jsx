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
        <span className="block text-xs font-medium text-slate-500 mb-1.5">{label}</span>
      )}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2.5 pl-3.5 pr-3 py-2.5 text-sm rounded-xl border transition-all
          ${open
            ? 'border-indigo-400 ring-2 ring-indigo-200 bg-white shadow-sm'
            : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30'}`}
      >
        {Icon && <Icon size={16} className={open ? 'text-indigo-500' : 'text-slate-400'} />}
        <span className={`flex-1 text-left truncate ${value === 'all' ? 'text-slate-400' : 'font-medium text-slate-800'}`}>
          {current ? current.label : allLabel}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180 text-indigo-500' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-30 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto py-1.5"
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
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left transition-colors
                    ${i === highlighted ? 'bg-indigo-50' : ''}
                    ${active ? 'font-semibold text-indigo-700' : 'text-slate-700'}`}
                >
                  {o.icon ? (
                    <span className={active ? 'text-indigo-500' : 'text-slate-400'}>{o.icon}</span>
                  ) : Icon ? (
                    <span className="text-slate-300"><Icon size={16} /></span>
                  ) : null}
                  <span className="flex-1">{o.label}</span>
                  {active && <Check size={16} className="text-indigo-600" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
