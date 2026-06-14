import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import DishCard from '../components/DishCard'
import { parseDeadline, timeUntil } from '../lib/deadline'

export default function MealPicker({ family }) {
  const { slotId } = useParams()
  const navigate = useNavigate()
  const [slot, setSlot] = useState(null)
  const [slots, setSlots] = useState([])
  const [dishes, setDishes] = useState([])
  const [allSelections, setAllSelections] = useState([])
  const [families, setFamilies] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deadlineIso, setDeadlineIso] = useState(null)

  useEffect(() => {
    load()
  }, [slotId])

  async function load() {
    setLoading(true)
    const [slotRes, allSlotsRes, dishRes, selRes, famRes, settings] =
      await Promise.all([
        supabase.from('meal_slots').select('*').eq('id', slotId).maybeSingle(),
        supabase.from('meal_slots').select('*').order('sort_order'),
        supabase
          .from('dishes')
          .select('*')
          .eq('is_active', true)
          .eq('is_pool_item', false)
          .order('name'),
        supabase.from('dish_selections').select('*'),
        supabase.from('families').select('id, name'),
        supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'deadline_iso')
          .maybeSingle(),
      ])
    setSlot(slotRes.data)
    setSlots(allSlotsRes.data || [])
    setDishes(dishRes.data || [])
    setAllSelections(selRes.data || [])
    setFamilies(famRes.data || [])
    setDeadlineIso(settings.data?.value)
    setLoading(false)
  }

  // Vain tämän slotin valinnat
  const slotSelections = useMemo(
    () => allSelections.filter((s) => s.meal_slot_id === slotId),
    [allSelections, slotId]
  )

  const ownSelection = slotSelections.find((s) => s.family_id === family.id)
  const deadline = parseDeadline(deadlineIso)
  const isLocked = timeUntil(deadline).passed

  // Mapping: dishId -> { slotId, families[] } jos varattu muualla
  const dishesTakenElsewhere = useMemo(() => {
    const map = {}
    allSelections.forEach((s) => {
      if (!s.dish_id || s.meal_slot_id === slotId) return
      if (!map[s.dish_id]) map[s.dish_id] = { slotId: s.meal_slot_id, families: [] }
      map[s.dish_id].families.push(s.family_id)
    })
    return map
  }, [allSelections, slotId])

  // Tags filtteröinti
  const tags = useMemo(() => {
    const set = new Set()
    dishes.forEach((d) => d.tags?.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [dishes])

  const filtered = useMemo(() => {
    return dishes.filter((d) => {
      if (filter !== 'all' && !d.tags?.includes(filter)) return false
      if (
        search &&
        !d.name.toLowerCase().includes(search.toLowerCase()) &&
        !d.description?.toLowerCase().includes(search.toLowerCase())
      )
        return false
      return true
    })
  }, [dishes, filter, search])

  // Jaa: vapaat / tähän slotille jo valitut / muualla varatut
  const partitioned = useMemo(() => {
    const available = []
    const thisSlotPicked = []
    const elsewhere = []
    filtered.forEach((d) => {
      const taken = dishesTakenElsewhere[d.id]
      const inThisSlot = slotSelections.some((s) => s.dish_id === d.id)
      if (inThisSlot) thisSlotPicked.push(d)
      else if (taken) elsewhere.push(d)
      else available.push(d)
    })
    return { available, thisSlotPicked, elsewhere }
  }, [filtered, dishesTakenElsewhere, slotSelections])

  async function pickDish(dishId) {
    if (isLocked) return
    setSaving(true)
    const payload = {
      family_id: family.id,
      meal_slot_id: slotId,
      dish_id: dishId,
      is_flexible: false,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase
      .from('dish_selections')
      .upsert(payload, { onConflict: 'family_id,meal_slot_id' })
    setSaving(false)
    if (!error) await load()
  }

  async function setFlexible() {
    if (isLocked) return
    setSaving(true)
    const { error } = await supabase.from('dish_selections').upsert(
      {
        family_id: family.id,
        meal_slot_id: slotId,
        dish_id: null,
        is_flexible: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'family_id,meal_slot_id' }
    )
    setSaving(false)
    if (!error) await load()
  }

  async function clearSelection() {
    if (isLocked) return
    setSaving(true)
    await supabase
      .from('dish_selections')
      .delete()
      .eq('family_id', family.id)
      .eq('meal_slot_id', slotId)
    setSaving(false)
    await load()
  }

  function matchInfoForDish(dishId) {
    const others = slotSelections.filter(
      (s) => s.dish_id === dishId && s.family_id !== family.id
    )
    const matchingFamilies = others
      .map((o) => families.find((f) => f.id === o.family_id))
      .filter(Boolean)
    return { count: others.length, matchingFamilies }
  }

  function slotName(id) {
    return slots.find((s) => s.id === id)?.display_name || 'toinen ateria'
  }

  function familyName(id) {
    return families.find((f) => f.id === id)?.name || 'Joku'
  }

  if (loading) return <div className="text-center py-12">Ladataan…</div>
  if (!slot) return <div className="text-center py-12">Ateriaa ei löytynyt</div>

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="btn-ghost text-sm -ml-3">
        ← Takaisin
      </button>

      <header>
        <h1 className="font-display text-2xl text-leaf-800">
          {slot.display_name}
        </h1>
        <p className="text-sm text-leaf-600 mt-1">
          Valitse pääruoka. Jos joku muu valitsee saman, kokkaatte yhdessä.
          Lisukkeet ja salaatit ilmoitat <strong>Lisukepoolissa</strong>.
        </p>
      </header>

      {isLocked && (
        <div className="card p-4 bg-berry-400/10 border-berry-400/30 text-sm text-berry-600">
          Valinta-aika on päättynyt. Valintoja ei voi enää muuttaa.
        </div>
      )}

      {/* Current state */}
      <div className="card p-4">
        <div className="text-xs uppercase tracking-wider text-leaf-600 mb-1">
          Teidän valinta
        </div>
        {ownSelection ? (
          ownSelection.is_flexible ? (
            <div className="flex items-center justify-between">
              <span className="font-medium">🍃 Syötte mitä tarjolla on</span>
              {!isLocked && (
                <button onClick={clearSelection} className="btn-ghost text-sm">
                  Poista
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {dishes.find((d) => d.id === ownSelection.dish_id)?.name ||
                  'Ruoka'}
              </span>
              {!isLocked && (
                <button onClick={clearSelection} className="btn-ghost text-sm">
                  Vaihda
                </button>
              )}
            </div>
          )
        ) : (
          <div className="text-leaf-400 text-sm">Ei valintaa</div>
        )}
      </div>

      {!isLocked && !ownSelection?.is_flexible && (
        <button
          onClick={setFlexible}
          disabled={saving}
          className="btn-secondary w-full"
        >
          🍃 Syömme mitä tarjolla on
        </button>
      )}

      {/* Filters */}
      <div className="space-y-2">
        <input
          type="search"
          placeholder="Etsi ruokaa…"
          className="field"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`pill ${
              filter === 'all'
                ? 'bg-leaf-600 text-birch-50'
                : 'bg-birch-100 text-leaf-800'
            }`}
          >
            Kaikki
          </button>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`pill ${
                filter === t
                  ? 'bg-leaf-600 text-birch-50'
                  : 'bg-birch-100 text-leaf-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tämä slotti: jo valitut (match opportunities) */}
      {partitioned.thisSlotPicked.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-leaf-800 mb-2">
            🤝 Tällä aterialla — voit liittyä tiimiin
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {partitioned.thisSlotPicked.map((dish) => {
              const match = matchInfoForDish(dish.id)
              return (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  selected={ownSelection?.dish_id === dish.id}
                  matchCount={match.count}
                  matchingFamilies={match.matchingFamilies}
                  onClick={() => pickDish(dish.id)}
                  disabled={isLocked || saving}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* Vapaat */}
      {partitioned.available.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-leaf-800 mb-2">
            Vapaat pääruoat
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {partitioned.available.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                selected={ownSelection?.dish_id === dish.id}
                onClick={() => pickDish(dish.id)}
                disabled={isLocked || saving}
              />
            ))}
          </div>
        </section>
      )}

      {/* Muualla varatut */}
      {partitioned.elsewhere.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-leaf-600 mb-2">
            Jo varatut (toiselle aterialle)
          </h2>
          <div className="space-y-2">
            {partitioned.elsewhere.map((dish) => {
              const taken = dishesTakenElsewhere[dish.id]
              return (
                <div
                  key={dish.id}
                  className="card p-3 opacity-60 text-sm flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-medium text-leaf-800">{dish.name}</div>
                    <div className="text-xs text-leaf-600 mt-0.5">
                      Varattu: <strong>{slotName(taken.slotId)}</strong> ·{' '}
                      {taken.families.map(familyName).join(', ')}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/ateria/${taken.slotId}`)}
                    className="btn-ghost text-xs shrink-0"
                  >
                    Siirry →
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-8 text-leaf-600 text-sm">
          Ei osumia. Kokeile muuttaa hakua tai suodatinta.
        </div>
      )}
    </div>
  )
}
