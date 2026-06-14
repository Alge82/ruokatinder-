import { useEffect, useState } from 'react'
import { timeUntil, formatDeadlineLocal } from '../lib/deadline'

export default function Countdown({ deadline, compact = false }) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const t = timeUntil(deadline, now)

  if (t.passed) {
    return (
      <div
        className={
          compact
            ? 'pill-berry'
            : 'card p-4 text-center bg-berry-400/10 border-berry-400/30'
        }
      >
        <span className="font-semibold">Valinta-aika päättynyt</span>
        {!compact && (
          <div className="text-sm mt-1 text-leaf-600">
            Deadline oli: {formatDeadlineLocal(deadline)}
          </div>
        )}
      </div>
    )
  }

  if (compact) {
    return (
      <span className="pill-sun">
        🌅 {t.days}pv {t.hours}h {t.minutes}min
      </span>
    )
  }

  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wider text-leaf-600 mb-2">
        Aikaa valintaan
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { v: t.days, l: 'päivää' },
          { v: t.hours, l: 'tuntia' },
          { v: t.minutes, l: 'min' },
          { v: t.seconds, l: 'sek' },
        ].map((b, i) => (
          <div key={i} className="bg-birch-50 rounded-xl py-3">
            <div className="text-2xl font-display font-semibold text-leaf-800">
              {String(b.v).padStart(2, '0')}
            </div>
            <div className="text-xs text-leaf-600">{b.l}</div>
          </div>
        ))}
      </div>
      <div className="text-xs text-leaf-600 mt-3 text-center">
        Deadline: {formatDeadlineLocal(deadline)}
      </div>
    </div>
  )
}
