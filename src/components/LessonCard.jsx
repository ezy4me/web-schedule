import React from 'react'
import { Clock, MapPin, User, Star, Users } from 'lucide-react'
import { TYPE_STYLES } from '../constants.js'

export default function LessonCard({ lesson }) {
  const style = TYPE_STYLES[lesson.type] || { badge: 'bg-slate-100 text-slate-700', icon: Clock, label: lesson.type }
  const Icon = style.icon

  return (
    <div className="flex gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      {/* Время */}
      <div className="flex flex-col items-center justify-center shrink-0">
        <div className="text-base font-bold text-slate-800">{lesson.time}</div>
        <Clock size={14} className="text-slate-300 mt-1" />
      </div>

      <div className="border-l border-slate-100 self-stretch" />

      {/* Контент */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-800 leading-snug">{lesson.subject}</h3>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 shrink-0 ${style.badge}`}>
            <Icon size={12} />
            {lesson.type}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <User size={14} className="text-slate-400" />
            {lesson.teacher || '—'}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={14} className="text-slate-400" />
            {lesson.room || '—'}
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={14} className="text-slate-400" />
            {lesson.group}
          </span>
        </div>

        {lesson.special && (
          <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
            <Star size={12} />
            Особое занятие
          </div>
        )}
        {lesson.notes && lesson.notes !== 'разовое' && (
          <div className="mt-1 text-xs text-slate-400">
            Пометки: {lesson.notes}
          </div>
        )}
      </div>
    </div>
  )
}
