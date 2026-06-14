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

  useEffect(() => { load() }, [slotId])

  async function load() {
    setLoading(true)
    const [slotRes, allSlotsRes, dishRes, selRes, famRes, settings] = await Promise.all([
      supabase.from('meal_slots').select('*').eq('id', slotId).maybeSingle(),
      supabase.from('meal_slots').select('*').order('sort_order'),
      supabase.from('dishes').select('*').eq('is_active', true).eq('is_pool_item', false).order('name'),
      supabase.from('dish_selections').select('*'),
      supabase.from('families').select('id, name'),
      supabase.from('app_settings').select('value').eq('key', 'deadline_iso').maybeSingle(),
    ])
    setSlot(slotRes.data)
    setSlots(allSlotsRes.data || [])
    setDishes(dishRes.data || [])
    setAllSelections(selRes.data || [])
    setFamilies(famRes.data || [])
    setDeadlineIso(settings.data?.value)
    setLoading(false)
  }

  const slotSelections = useMemo(
    () => allSelections.filter((s) => s.meal_slot_id === slotId),
    [allSelections, slotId]
  )

  // Oma perhe voi valita useamman ruoan
  const ownSelections = slotSelections.filter((s) => s.family_id === family.id)
  const isFlexible = ownSelections.some((s) => s.is_flexible)

  const deadline = parseDeadline(deadlineIso)
  const isLocked = timeUntil(deadline).passed

  const tags = useMemo(() => {
    const set = new Set()
    dishes.forEach((d) => d.tags?.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [dishes])

  const filtered = useMemo(() => {
    return dishes.filter((d) => {
      if (filter !== 'all' && !d.tags?.includes(filter)) return false
      if (search && !d.name.toLowerCase().includes(search.toLowerCase()) &&
          !d.description?.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [dishes, filter, search])

  async function toggleDish(dishId) {
    if (isLocked) return
    setSaving(true)
    const existing = ownSelections.find((s) => s.dish_id === dishId)
    if (existing) {
      await supabase.from('dish_selections').delete().eq('id', existing.id)
    } else {
      await supabase.from('dish_selections').insert({
        family_id: family.id,
        meal_slot_id: slotId,
        dish_id: dishId,
        is_flexible: false,
      })
    }
    setSaving(false)
    await load()
  }

  async function toggleFlexible() {
    if (isLocked) return
    setSaving(true)
    if (isFlexible) {
      await supabase.from('dish_selections').delete()
        .eq('family_id', family.id).eq('meal_slot_id', slotId).eq('is_flexible', true)
    } else {
      await supabase.from('dish_selections').insert({
        family_id: family.id,
        meal_slot_id: slotId,
        dish_id: null,
        is_flexible: true,
      })
    }
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

  if (loading) return <div className="text-center py-12">Ladataan…</div>
  if (!slot) return <div className="text-center py-12">Ateriaa ei löytynyt</div>

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="btn-ghost text-sm -ml-3">
        ← Takaisin
      </button>

      <header>
        <h1 className="font-display text-2xl text-leaf-800">{slot.display_name}</h1>
        <p className="text-sm text-leaf-600 mt-1">
          Valitse yksi tai useampi pääruoka. Jos joku muu valitsee saman, kokkaatte
          yhdessä sinä päivänä kun haluatte. Lisukkeet ilmoitat Lisukepoolissa.
        </p>
      </header>

      {isLocked && (
        <div className="card p-4 bg-berry-400/10 border-berry-400/30 text-sm text-berry-600">
          Valinta-aika on päättynyt.
        </div>
      )}

      {/* Omat valinnat */}
      {ownSelections.length > 0 && (
        <div className="card p-4">
          <div className="text-xs uppercase tracking-wider text-leaf-600 mb-2">
            Teidän valinnat
          </div>
          <div className="flex flex-wrap gap-2">
            {isFlexible && (
              <span className="pill-leaf">🍃 Syötte mitä tarjolla on</span>
            )}
            {ownSelections.filter(s => !s.is_flexible).map((s) => {
              const dish = dishes.find((d) => d.id === s.dish_id)
              return (
                <button
                  key={s.id}
                  onClick={() => toggleDish(s.dish_id)}
                  disabled={isLocked}
                  className="pill bg-leaf-600 text-birch-50"
                >
                  ✓ {dish?.name} ✕
                </button>
              )
            })}
          </div>
        </div>
      )}

      {!isLocked && (
        <button
          onClick={toggleFlexible}
          disabled={saving}
          className={`w-full ${isFlexible ? 'btn-primary' : 'btn-secondary'}`}
        >
          {isFlexible ? '✓ Syömme mitä tarjolla on' : '🍃 Syömme mitä tarjolla on'}
        </button>
      )}

      {/* Haku ja filtterit */}
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
            className={`pill ${filter === 'all' ? 'bg-leaf-600 text-birch-50' : 'bg-birch-100 text-leaf-800'}`}
          >
            Kaikki
          </button>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`pill ${filter === t ? 'bg-leaf-600 text-birch-50' : 'bg-birch-100 text-leaf-800'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Ruokalista */}
      <div className="grid sm:grid-cols-2 gap-3">
        {filtered.map((dish) => {
          const match = matchInfoForDish(dish.id)
          const isSelected = ownSelections.some((s) => s.dish_id === dish.id)
          return (
            <DishCard
              key={dish.id}
              dish={dish}
              selected={isSelected}
              matchCount={match.count}
              matchingFamilies={match.matchingFamilies}
              onClick={() => toggleDish(dish.id)}
              disabled={isLocked || saving}
            />
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-leaf-600 text-sm">
          Ei osumia.
        </div>
      )}
    </div>
  )
}