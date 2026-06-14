import { useEffect, useState } from 'react'
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

export default function FamilyEdit({ family, onUpdate }) {
  const [name, setName] = useState(family.name)
  const [members, setMembers] = useState([])
  const [allergens, setAllergens] = useState([])
  const [customAllergen, setCustomAllergen] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const [memRes, alrRes] = await Promise.all([
      supabase
        .from('household_members')
        .select('*')
        .eq('family_id', family.id),
      supabase
        .from('family_allergens')
        .select('*')
        .eq('family_id', family.id),
    ])
    setMembers(memRes.data || [])
    setAllergens((alrRes.data || []).map((a) => a.allergen))
  }

  async function saveName() {
    setSaving(true)
    await supabase
      .from('families')
      .update({ name: name.trim() })
      .eq('id', family.id)
    setSaving(false)
    setMessage('Nimi tallennettu')
    if (onUpdate) await onUpdate()
    setTimeout(() => setMessage(null), 2000)
  }

  async function addMember() {
    const { data } = await supabase
      .from('household_members')
      .insert({ family_id: family.id, age: 30 })
      .select()
      .single()
    if (data) setMembers([...members, data])
  }

  async function updateMember(id, field, value) {
    const next = members.map((m) =>
      m.id === id
        ? { ...m, [field]: field === 'age' ? Number(value) || 0 : value }
        : m
    )
    setMembers(next)
    const updated = next.find((m) => m.id === id)
    await supabase
      .from('household_members')
      .update({ [field]: updated[field] })
      .eq('id', id)
  }

  async function removeMember(id) {
    await supabase.from('household_members').delete().eq('id', id)
    setMembers(members.filter((m) => m.id !== id))
  }

  async function toggleAllergen(a) {
    if (allergens.includes(a)) {
      await supabase
        .from('family_allergens')
        .delete()
        .eq('family_id', family.id)
        .eq('allergen', a)
      setAllergens(allergens.filter((x) => x !== a))
    } else {
      await supabase
        .from('family_allergens')
        .insert({ family_id: family.id, allergen: a })
      setAllergens([...allergens, a])
    }
  }

  async function addCustomAllergen() {
    const trimmed = customAllergen.trim()
    if (!trimmed || allergens.includes(trimmed)) return
    await supabase
      .from('family_allergens')
      .insert({ family_id: family.id, allergen: trimmed })
    setAllergens([...allergens, trimmed])
    setCustomAllergen('')
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl text-leaf-800">Perhe</h1>
        <p className="text-sm text-leaf-600 mt-1">
          Päivitä ruokakunnan tiedot — vaikuttaa annoslaskentaan.
        </p>
      </header>

      {message && (
        <div className="card p-3 bg-leaf-50 text-leaf-800 text-sm">{message}</div>
      )}

      <section className="card p-5 space-y-3">
        <label className="block">
          <span className="text-sm font-medium">Nimi</span>
          <div className="flex gap-2 mt-1">
            <input
              className="field flex-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button onClick={saveName} className="btn-primary" disabled={saving}>
              Tallenna
            </button>
          </div>
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
          {members.map((m) => (
            <div key={m.id} className="flex gap-2 items-center">
              <input
                className="field flex-1"
                placeholder="Nimi"
                value={m.name || ''}
                onChange={(e) => updateMember(m.id, 'name', e.target.value)}
              />
              <input
                type="number"
                min="0"
                max="120"
                className="field w-24"
                value={m.age}
                onChange={(e) => updateMember(m.id, 'age', e.target.value)}
              />
              <button
                onClick={() => removeMember(m.id)}
                className="btn-ghost p-2 text-berry-600"
                aria-label="Poista"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
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
        {allergens.filter((a) => !COMMON_ALLERGENS.includes(a)).length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-birch-100">
            {allergens
              .filter((a) => !COMMON_ALLERGENS.includes(a))
              .map((a) => (
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
    </div>
  )
}
