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
        <span className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
      )}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2.5 rounded-lg border py-2.5 pl-3.5 pr-3 text-sm transition-colors
          ${open
            ? 'border-zinc-400 bg-white dark:border-zinc-600 dark:bg-zinc-900'
            : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'}`}
      >
        {Icon && <Icon size={16} className="text-zinc-400" />}
        <span className={`flex-1 truncate text-left ${value === 'all' ? 'text-zinc-400 dark:text-zinc-500' : 'font-medium text-zinc-800 dark:text-zinc-100'}`}>
          {current ? current.label : allLabel}
        </span>
        <ChevronDown
          size={16}
          className={`text-zinc-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1.5 max-h-64 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-pop dark:border-zinc-800 dark:bg-zinc-900"
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
                    ${i === highlighted ? 'bg-zinc-100 dark:bg-zinc-800' : ''}
                    ${active ? 'font-medium text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-300'}`}
                >
                  {o.icon ? (
                    <span className="text-zinc-400">{o.icon}</span>
                  ) : Icon ? (
                    <span className="text-zinc-300"><Icon size={16} /></span>
                  ) : null}
                  <span className="flex-1">{o.label}</span>
                  {active && <Check size={16} className="text-zinc-500 dark:text-zinc-400" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
