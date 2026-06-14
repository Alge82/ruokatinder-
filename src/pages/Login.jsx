import { useState } from 'react'
import { supabase } from '../supabase'
import SummerBackground from '../components/SummerBackground'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <SummerBackground />
      <div className="card p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🌅</div>
          <h1 className="text-3xl font-display font-semibold text-leaf-800">
            Ruokatinder
          </h1>
          <p className="text-leaf-600 mt-2">
            Juhannuksen ruokasuunnittelu kavereille
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-3">
            <div className="text-4xl">📬</div>
            <h2 className="font-display text-xl">Tarkista sähköposti</h2>
            <p className="text-sm text-leaf-600">
              Lähetimme kirjautumislinkin osoitteeseen{' '}
              <span className="font-semibold">{email}</span>. Klikkaa linkkiä ja
              olet sisällä.
            </p>
            <button
              onClick={() => setSent(false)}
              className="btn-ghost text-sm"
            >
              Käytä toista osoitetta
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-leaf-800">
                Sähköpostiosoite
              </span>
              <input
                type="email"
                required
                autoFocus
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="etunimi@example.com"
                className="field mt-1"
              />
            </label>
            {error && (
              <div className="text-sm text-berry-600 bg-berry-400/10 rounded-lg p-3">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !email}
              className="btn-primary w-full"
            >
              {loading ? 'Lähetetään…' : 'Lähetä kirjautumislinkki'}
            </button>
            <p className="text-xs text-leaf-600 text-center">
              Saat sähköpostiisi linkin. Klikkaa sitä — ei salasanoja.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
