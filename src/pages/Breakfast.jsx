import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { parseDeadline, timeUntil } from '../lib/deadline'

const CATEGORIES = [
  { key: 'hedelma', label: 'Hedelmät', icon: '🍓', suggestions: ['Mansikat', 'Mustikat', 'Vesimeloni', 'Banaani', 'Omenat', 'Viinirypäleet'] },
  { key: 'leipa', label: 'Leivät', icon: '🥖', suggestions: ['Ruisleipä', 'Vaalea leipä', 'Croissantit', 'Sämpylät', 'Bagelit', 'Patonki'] },
  { key: 'juusto', label: 'Juustot', icon: '🧀', suggestions: ['Brie', 'Cheddar', 'Edam', 'Vuohenjuusto', 'Sinihomejuusto'] },
  { key: 'leikkele', label: 'Leikkeleet', icon: '🥓', suggestions: ['Kinkku', 'Salami', 'Prosciutto', 'Kalkkunaleike', 'Graavilohi'] },
  { key: 'muu', label: 'Muut', icon: '🥑', suggestions: ['Avokado', 'Tomaatti', 'Kurkku', 'Munakas', 'Jogurtti', 'Granola', 'Hummus'] },
]

export default function Breakfast({ family }) {
  const [contributions, setContributions] = useState([])
  const [families, setFamilies] = useState([])
  const [deadlineIso, setDeadlineIso] = useState(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState({ category: null, name: '' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [conRes, famRes, settings] = await Promise.all([
      supabase.from('breakfast_contributions').select('*'),
      supabase.from('families').select('id, name'),
      supabase.from('app_settings').select('value').eq('key', 'deadline_iso').maybeSingle(),
    ])
    setContributions(conRes.data || [])
    setFamilies(famRes.data || [])
    setDeadlineIso(settings.data?.value)
    setLoading(false)
  }

  const deadline = parseDeadline(deadlineIso)
  const isLocked = timeUntil(deadline).passed

  function familyName(id) {
    return families.find((f) => f.id === id)?.name || 'Tuntematon'
  }

  function itemsFor(category) {
    return contributions.filter((c) => c.category === category)
  }

  function ownItem(category, itemName) {
    return contributions.find(
      (c) => c.category === category && c.item_name === itemName && c.family_id === family.id
    )
  }

  async function setMode(category, itemName, mode) {
    if (isLocked) return
    const existing = ownItem(category, itemName)
    if (existing) {
      const sameMode = (mode === 'bringing' && !existing.joining) || (mode === 'joining' && existing.joining)
      if (sameMode) {
        await supabase.from('breakfast_contributions').delete().eq('id', existing.id)
      } else {
        await supabase.from('breakfast_contributions').update({ joining: mode === 'joining' }).eq('id', existing.id)
      }
    } else {
      await supabase.from('breakfast_contributions').insert({
        family_id: family.id,
        day: 'all',
        category,
        item_name: itemName,
        joining: mode === 'joining',
      })
    }
    await load()
  }

  async function addItem(category, name) {
    const trimmed = name.trim()
    if (!trimmed) return
    await supabase.from('breakfast_contributions').insert({
      family_id: family.id,
      day: 'all',
      category,
      item_name: trimmed,
      joining: false,
    })
    setAdding({ category: null, name: '' })
    await load()
  }

  if (loading) return <div className="text-center py-12">Ladataan…</div>

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl text-leaf-800">Aamiaiset</h1>
        <p className="text-sm text-leaf-600 mt-1">
          Merkitse mitä tuot tai mistä olet kiinnostunut syömään.
        </p>
      </header>

      {isLocked && (
        <div className="card p-4 bg-berry-400/10 border-berry-400/30 text-sm text-berry-600">
          Valinta-aika on päättynyt.
        </div>
      )}

      <div className="space-y-4">
        {CATEGORIES.map((cat) => {
          const items = itemsFor(cat.key)
          // Kaikki uniikit itemit tässä kategoriassa
          const uniqueItems = [...new Set(items.map((i) => i.item_name))]

          return (
            <section key={cat.key} className="card p-4">
              <h2 className="font-display text-lg flex items-center gap-2 mb-3">
                <span>{cat.icon}</span>{cat.label}
              </h2>

              <div className="space-y-2 mb-3">
                {uniqueItems.map((itemName) => {
                  const allForItem = items.filter((c) => c.item_name === itemName)
                  const bringers = allForItem.filter((c) => !c.joining)
                  const joiners = allForItem.filter((c) => c.joining)
                  const mine = ownItem(cat.key, itemName)
                  const isBringing = mine && !mine.joining
                  const isJoining = mine && mine.joining

                  return (
                    <div key={itemName} className="bg-birch-50 rounded-xl p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-medium text-sm">{itemName}</span>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {bringers.map((c) => (
                            <span key={c.id} className="text-xs bg-leaf-100 text-leaf-800 px-2 py-0.5 rounded-full">
                              🧺 {familyName(c.family_id)}
                            </span>
                          ))}
                          {joiners.map((c) => (
                            <span key={c.id} className="text-xs bg-sun-200 text-sun-600 px-2 py-0.5 rounded-full">
                              🍽️ {familyName(c.family_id)}
                            </span>
                          ))}
                        </div>
                      </div>
                      {!isLocked && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setMode(cat.key, itemName, 'bringing')}
                            className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition ${
                              isBringing ? 'bg-leaf-600 text-birch-50' : 'bg-white border border-birch-200 text-leaf-800 hover:bg-leaf-50'
                            }`}
                          >
                            {isBringing ? '✓ ' : ''}🧺 Tuon
                          </button>
                          <button
                            onClick={() => setMode(cat.key, itemName, 'joining')}
                            className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition ${
                              isJoining ? 'bg-sun-400 text-leaf-900' : 'bg-white border border-birch-200 text-leaf-800 hover:bg-sun-200/50'
                            }`}
                          >
                            {isJoining ? '✓ ' : ''}🍽️ Syön
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Lisää uusi */}
              {adding.category === cat.key ? (
                <div className="space-y-2">
                  <input autoFocus className="field"
                    placeholder={`esim. ${cat.suggestions[0]}`}
                    value={adding.name}
                    onChange={(e) => setAdding({ ...adding, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addItem(cat.key, adding.name)
                      if (e.key === 'Escape') setAdding({ category: null, name: '' })
                    }}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {cat.suggestions.map((s) => (
                      <button key={s} onClick={() => addItem(cat.key, s)}
                        className="pill bg-birch-100 text-leaf-800 hover:bg-leaf-200">
                        + {s}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => addItem(cat.key, adding.name)} className="btn-primary text-sm">Lisää</button>
                    <button onClick={() => setAdding({ category: null, name: '' })} className="btn-ghost text-sm">Peruuta</button>
                  </div>
                </div>
              ) : (
                !isLocked && (
                  <button onClick={() => setAdding({ category: cat.key, name: '' })}
                    className="btn-secondary text-sm w-full">
                    + Lisää tuotava
                  </button>
                )
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}