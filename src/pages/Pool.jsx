import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import { parseDeadline, timeUntil } from '../lib/deadline'

const CATEGORY_LABELS = {
  lisuke: { label: 'Lisukkeet & grillattavat', icon: '🌽' },
  salaatti: { label: 'Salaatit', icon: '🥗' },
  jalkkari: { label: 'Jälkiruoat', icon: '🍰' },
}

export default function Pool({ family }) {
  const [dishes, setDishes] = useState([])
  const [contributions, setContributions] = useState([])
  const [families, setFamilies] = useState([])
  const [slots, setSlots] = useState([])
  const [deadlineIso, setDeadlineIso] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('lisuke')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [dishRes, conRes, famRes, slotRes, settings] = await Promise.all([
      supabase.from('dishes').select('*').eq('is_active', true).eq('is_pool_item', true).order('name'),
      supabase.from('pool_contributions').select('*'),
      supabase.from('families').select('id, name'),
      supabase.from('meal_slots').select('*').order('sort_order'),
      supabase.from('app_settings').select('value').eq('key', 'deadline_iso').maybeSingle(),
    ])
    setDishes(dishRes.data || [])
    setContributions(conRes.data || [])
    setFamilies(famRes.data || [])
    setSlots(slotRes.data || [])
    setDeadlineIso(settings.data?.value)
    setLoading(false)
  }

  const deadline = parseDeadline(deadlineIso)
  const isLocked = timeUntil(deadline).passed

  function familyName(id) {
    return families.find((f) => f.id === id)?.name || 'Tuntematon'
  }

  function contributionsFor(dishId) {
    return contributions.filter((c) => c.dish_id === dishId)
  }

  function ownContribution(dishId) {
    return contributions.find((c) => c.dish_id === dishId && c.family_id === family.id)
  }

  // mode: 'bringing' | 'joining' | null (poista)
  async function setMode(dishId, mode) {
    if (isLocked) return
    const existing = ownContribution(dishId)

    if (existing) {
      if (
        (mode === 'bringing' && !existing.joining) ||
        (mode === 'joining' && existing.joining)
      ) {
        // Toggle off — sama nappi uudelleen
        await supabase.from('pool_contributions').delete().eq('id', existing.id)
      } else {
        // Vaihda moodia
        await supabase.from('pool_contributions').update({ joining: mode === 'joining' }).eq('id', existing.id)
      }
    } else {
      await supabase.from('pool_contributions').insert({
        family_id: family.id,
        dish_id: dishId,
        joining: mode === 'joining',
      })
    }
    await load()
  }

  const dishesInCategory = useMemo(
    () => dishes.filter((d) => d.category === activeCategory),
    [dishes, activeCategory]
  )

  if (loading) return <div className="text-center py-12">Ladataan…</div>

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl text-leaf-800">Lisukepooli</h1>
        <p className="text-sm text-leaf-600 mt-1">
          Ilmoita tuotko jotain vai tuletko vain mukaan syömään.
        </p>
      </header>

      {isLocked && (
        <div className="card p-4 bg-berry-400/10 border-berry-400/30 text-sm text-berry-600">
          Valinta-aika on päättynyt.
        </div>
      )}

      <div className="flex gap-1 bg-white/60 p-1 rounded-full border border-birch-100 overflow-x-auto">
        {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => (
          <button key={key} onClick={() => setActiveCategory(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              activeCategory === key ? 'bg-leaf-600 text-birch-50' : 'text-leaf-800 hover:bg-birch-100'
            }`}
          >
            <span className="mr-1">{icon}</span>{label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {dishesInCategory.map((dish) => {
          const items = contributionsFor(dish.id)
          const mine = ownContribution(dish.id)
          const isBringing = mine && !mine.joining
          const isJoining = mine && mine.joining
          const bringers = items.filter((c) => !c.joining)
          const joiners = items.filter((c) => c.joining)

          return (
            <section key={dish.id} className="card p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-display font-semibold text-leaf-800">{dish.name}</h3>
                  {dish.description && (
                    <p className="text-sm text-leaf-600 mt-0.5">{dish.description}</p>
                  )}
                </div>
                {items.length > 0 && (
                  <span className="pill-sun shrink-0">{items.length} mukana</span>
                )}
              </div>

              {/* Kuka tuo / tulee mukaan */}
              {(bringers.length > 0 || joiners.length > 0) && (
                <div className="space-y-1.5 mb-3">
                  {bringers.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 bg-leaf-50 rounded-lg px-3 py-1.5 text-sm">
                      <span>🧺</span>
                      <span className="font-medium">{familyName(c.family_id)}</span>
                      <span className="text-leaf-600 text-xs">tuo</span>
                    </div>
                  ))}
                  {joiners.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 bg-birch-50 rounded-lg px-3 py-1.5 text-sm">
                      <span>🍽️</span>
                      <span className="font-medium">{familyName(c.family_id)}</span>
                      <span className="text-leaf-600 text-xs">tulee mukaan</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Napit */}
              {!isLocked && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode(dish.id, 'bringing')}
                    className={`flex-1 text-sm py-2 rounded-xl font-medium transition ${
                      isBringing
                        ? 'bg-leaf-600 text-birch-50'
                        : 'bg-birch-50 text-leaf-800 border border-birch-200 hover:bg-leaf-50'
                    }`}
                  >
                    {isBringing ? '✓ ' : ''}🧺 Me tuomme
                  </button>
                  <button
                    onClick={() => setMode(dish.id, 'joining')}
                    className={`flex-1 text-sm py-2 rounded-xl font-medium transition ${
                      isJoining
                        ? 'bg-sun-400 text-leaf-900'
                        : 'bg-birch-50 text-leaf-800 border border-birch-200 hover:bg-sun-200/50'
                    }`}
                  >
                    {isJoining ? '✓ ' : ''}🍽️ Tulen mukaan
                  </button>
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}