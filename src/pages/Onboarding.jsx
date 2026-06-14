import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const COMMON_ALLERGENS = [
  'gluteeniton',
  'maidoton',
  'laktoositon',
  'kasvis',
  'vegaani',
  'pähkinätön',
  'kalaton',
  'kananmunaton',
]

export default function Onboarding({ session, onComplete }) {
  const [familyName, setFamilyName] = useState('')
  const [members, setMembers] = useState([{ name: '', age: '' }])
  const [allergens, setAllergens] = useState([])
  const [customAllergen, setCustomAllergen] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  function addMember() {
    setMembers([...members, { name: '', age: '' }])
  }
  function updateMember(i, field, value) {
    const next = [...members]
    next[i][field] = value
    setMembers(next)
  }
  function removeMember(i) {
    setMembers(members.filter((_, idx) => idx !== i))
  }
  function toggleAllergen(a) {
    setAllergens((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    )
  }
  function addCustomAllergen() {
    const trimmed = customAllergen.trim()
    if (trimmed && !allergens.includes(trimmed)) {
      setAllergens([...allergens, trimmed])
      setCustomAllergen('')
    }
  }

  async function handleSave() {
    setError(null)
    if (!familyName.trim()) {
      setError('Perheen nimi puuttuu')
      return
    }
    const validMembers = members.filter(
      (m) => m.age !== '' && Number(m.age) >= 0
    )
    if (validMembers.length === 0) {
      setError('Lisää ainakin yksi jäsen')
      return
    }
    setSaving(true)

    const { data: family, error: famErr } = await supabase
      .from('families')
      .insert({
        auth_user_id: session.user.id,
        name: familyName.trim(),
        email: session.user.email,
      })
      .select()
      .single()

    if (famErr) {
      setSaving(false)
      setError(famErr.message)
      return
    }

    if (validMembers.length > 0) {
      const { error: memErr } = await supabase.from('household_members').insert(
        validMembers.map((m) => ({
          family_id: family.id,
          name: m.name || null,
          age: Number(m.age),
        }))
      )
      if (memErr) {
        setSaving(false)
        setError(memErr.message)
        return
      }
    }

    if (allergens.length > 0) {
      const { error: alrErr } = await supabase.from('family_allergens').insert(
        allergens.map((a) => ({ family_id: family.id, allergen: a }))
      )
      if (alrErr) {
        setSaving(false)
        setError(alrErr.message)
        return
      }
    }

    setSaving(false)
    if (onComplete) await onComplete()
    navigate('/')
  }

  return (
    <div className="min-h-dvh px-4 py-8 sm:py-12">
      <div className="max-w-xl mx-auto space-y-6">
        <header className="text-center">
          <div className="text-4xl mb-2">🍓</div>
          <h1 className="text-3xl font-display font-semibold text-leaf-800">
            Tervetuloa!
          </h1>
          <p className="text-leaf-600 mt-1">
            Kerro ruokakuntasi tiedot, jotta annoslaskenta toimii.
          </p>
        </header>

        <section className="card p-5 space-y-3">
          <label className="block">
            <span className="text-sm font-medium">Perheen / porukan nimi</span>
            <input
              className="field mt-1"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="esim. Virtaset"
            />
          </label>
        </section>

        <section className="card p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-lg">Jäsenet</h2>
            <button onClick={addMember} className="btn-secondary text-sm">
              + Lisää
            </button>
          </div>
          <div className="space-y-2">
            {members.map((m, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  className="field flex-1"
                  placeholder="Nimi (vapaaehtoinen)"
                  value={m.name}
                  onChange={(e) => updateMember(i, 'name', e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  max="120"
                  className="field w-24"
                  placeholder="Ikä"
                  value={m.age}
                  onChange={(e) => updateMember(i, 'age', e.target.value)}
                />
                {members.length > 1 && (
                  <button
                    onClick={() => removeMember(i)}
                    className="btn-ghost p-2 text-berry-600"
                    aria-label="Poista jäsen"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-leaf-600">
            Ikä määrää annoskoon: aikuinen 1 annos, alle 13-vuotiaat
            pienemmillä määrillä.
          </p>
        </section>

        <section className="card p-5 space-y-3">
          <h2 className="font-display text-lg">Allergiat ja rajoitteet</h2>
          <div className="flex flex-wrap gap-2">
            {COMMON_ALLERGENS.map((a) => (
              <button
                key={a}
                onClick={() => toggleAllergen(a)}
                className={`pill ${
                  allergens.includes(a)
                    ? 'bg-leaf-600 text-birch-50'
                    : 'bg-birch-100 text-leaf-800'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="field flex-1"
              placeholder="Lisää muu (esim. seesami)"
              value={customAllergen}
              onChange={(e) => setCustomAllergen(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomAllergen()}
            />
            <button onClick={addCustomAllergen} className="btn-secondary">
              Lisää
            </button>
          </div>
          {allergens.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-birch-100">
              {allergens.map((a) => (
                <button
                  key={a}
                  onClick={() => toggleAllergen(a)}
                  className="pill bg-leaf-600 text-birch-50"
                >
                  {a} ✕
                </button>
              ))}
            </div>
          )}
        </section>

        {error && (
          <div className="card p-4 bg-berry-400/10 border-berry-400/30 text-berry-600 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full"
        >
          {saving ? 'Tallennetaan…' : 'Valmis — aloita valitseminen'}
        </button>
      </div>
    </div>
  )
}
