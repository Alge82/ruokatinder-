import { useState } from 'react'
import { supabase } from '../supabase'
import SummerBackground from '../components/SummerBackground'

export default function NameLogin({ onLogin }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setError(null)
    setLoading(true)

    const { data: existing } = await supabase
      .from('families')
      .select('*')
      .ilike('name', trimmed)
      .maybeSingle()

    if (existing) {
      setLoading(false)
      onLogin(existing)
      return
    }

    const { data: created, error: err } = await supabase
      .from('families')
      .insert({ name: trimmed, email: '' })
      .select()
      .single()

    setLoading(false)
    if (err) { setError('Jokin meni pieleen, yritä uudelleen.'); return }
    onLogin(created)
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <SummerBackground />
      <div className="card p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🌅</div>
          <h1 className="text-3xl font-display font-semibold text-leaf-800">Grillinder</h1>
          <p className="text-leaf-600 mt-2 text-sm">Juhannuksen ruokasuunnittelu</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-leaf-800">Perheen nimi</span>
            <input type="text" required autoFocus autoComplete="off"
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="esim. Virtaset" className="field mt-1" />
          </label>
          {error && <div className="text-sm text-berry-600 bg-berry-400/10 rounded-lg p-3">{error}</div>}
          <button type="submit" disabled={loading || !name.trim()} className="btn-primary w-full">
            {loading ? 'Ladataan…' : 'Sisään →'}
          </button>
          <p className="text-xs text-leaf-600 text-center">Kirjoita sama nimi joka kerta — ei salasanoja.</p>
        </form>
      </div>
    </div>
  )
}