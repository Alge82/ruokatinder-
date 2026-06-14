// Helsingin aikavyöhyke huomioiden — keskiviikko klo 18:00
// Käytetään app_settings.deadline_iso jos saatavilla, muuten fallback.
const FALLBACK_DEADLINE = '2026-06-17T18:00:00+03:00'

export function parseDeadline(iso) {
  return new Date(iso || FALLBACK_DEADLINE)
}

export function timeUntil(deadline, now = new Date()) {
  const diff = deadline.getTime() - now.getTime()
  if (diff <= 0) {
    return { passed: true, days: 0, hours: 0, minutes: 0, seconds: 0 }
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)
  return { passed: false, days, hours, minutes, seconds, totalMs: diff }
}

export function formatDeadlineLocal(deadline) {
  return new Intl.DateTimeFormat('fi-FI', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Helsinki',
  }).format(deadline)
}
