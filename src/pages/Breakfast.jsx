import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const DAYS = [
  { key: 'fri', label: 'Perjantai aamu' },
  { key: 'sat', label: 'Lauantai aamu' },
  { key: 'sun', label: 'Sunnuntai aamu' },
]

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
  const [activeDay, setActiveDay] = useState('fri')
  const [adding, setAdding] = useState({ category: null, name: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const [conRes, famRes] = await Promise.all([
      supabase.from('breakfast_contributions').select('*'),
      supabase.from('families').select('id, name'),
    ])
    setContributions(conRes.data || [])
    setFamilies(famRes.data || [])
    setLoading(false)
  }

  function familyName(id) {
    return families.find((f) => f.id === id)?.name || 'Tuntematon'
  }

  function dayItems(day, category) {
    return contributions.filter(
      (c) => c.day === day && c.category === category
    )
  }

  async function addItem(day, category, name) {
    const trimmed = name.trim()
    if (!trimmed) return
    await supabase.from('breakfast_contributions').insert({
      family_id: family.id,
      day,
      category,
      item_name: trimmed,
    })
    setAdding({ category: null, name: '' })
    await load()
  }

  async function removeItem(id) {
    await supabase.from('breakfast_contributions').delete().eq('id', id)
    await load()
  }

  if (loading) return <div className="text-center py-12">Ladataan…</div>

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl text-leaf-800">Aamiaiset</h1>
        <p className="text-sm text-leaf-600 mt-1">
          Jokainen tuo jotain. Klikkaa kategoriaa ja lisää mitä aiotte tuoda.
        </p>
      </header>

      {/* Day tabs */}
      <div className="flex gap-1 bg-white/60 p-1 rounded-full border border-birch-100 overflow-x-auto">
        {DAYS.map((d) => (
          <button
            key={d.key}
            onClick={() => setActiveDay(d.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              activeDay === d.key
                ? 'bg-leaf-600 text-birch-50'
                : 'text-leaf-800 hover:bg-birch-100'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {CATEGORIES.map((cat) => {
          const items = dayItems(activeDay, cat.key)
          return (
            <section key={cat.key} className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg flex items-center gap-2">
                  <span>{cat.icon}</span>
                  {cat.label}
                </h2>
                <span className="text-xs text-leaf-600">
                  {items.length} {items.length === 1 ? 'tuotava' : 'tuotavaa'}
                </span>
              </div>

              {/* Existing items */}
              {items.length > 0 && (
                <ul className="space-y-1.5 mb-3">
                  {items.map((it) => (
                    <li
                      key={it.id}
                      className="flex items-center justify-between gap-2 bg-birch-50 rounded-lg px-3 py-2 text-sm"
                    >
                      <div>
                        <span className="font-medium">{it.item_name}</span>
                        <span className="text-leaf-600 ml-2">
                          · {familyName(it.family_id)}
                        </span>
                      </div>
                      {it.family_id === family.id && (
                        <button
                          onClick={() => removeItem(it.id)}
                          className="text-berry-600 text-xs hover:underline"
                        >
                          Poista
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {/* Add */}
              {adding.category === `${activeDay}_${cat.key}` ? (
                <div className="space-y-2">
                  <input
                    autoFocus
                    className="field"
                    placeholder="esim. Mansikat 500g"
                    value={adding.name}
                    onChange={(e) =>
                      setAdding({ ...adding, name: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter')
                        addItem(activeDay, cat.key, adding.name)
                      if (e.key === 'Escape')
                        setAdding({ category: null, name: '' })
                    }}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {cat.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => addItem(activeDay, cat.key, s)}
                        className="pill bg-birch-100 text-leaf-800 hover:bg-leaf-200"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        addItem(activeDay, cat.key, adding.name)
                      }
                      className="btn-primary text-sm"
                    >
                      Lisää
                    </button>
                    <button
                      onClick={() => setAdding({ category: null, name: '' })}
                      className="btn-ghost text-sm"
                    >
                      Peruuta
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() =>
                    setAdding({ category: `${activeDay}_${cat.key}`, name: '' })
                  }
                  className="btn-secondary text-sm w-full"
                >
                  + Lisää tuotava
                </button>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
