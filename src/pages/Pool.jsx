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
  const [editingId, setEditingId] = useState(null)
  const [editNote, setEditNote] = useState('')
  const [editSlot, setEditSlot] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const [dishRes, conRes, famRes, slotRes, settings] = await Promise.all([
      supabase
        .from('dishes')
        .select('*')
        .eq('is_active', true)
        .eq('is_pool_item', true)
        .order('name'),
      supabase.from('pool_contributions').select('*'),
      supabase.from('families').select('id, name'),
      supabase.from('meal_slots').select('*').order('sort_order'),
      supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'deadline_iso')
        .maybeSingle(),
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
  function slotName(id) {
    return slots.find((s) => s.id === id)?.display_name || 'milloin sopii'
  }

  const dishesInCategory = useMemo(
    () => dishes.filter((d) => d.category === activeCategory),
    [dishes, activeCategory]
  )

  function contributionsFor(dishId) {
    return contributions.filter((c) => c.dish_id === dishId)
  }

  function ownContribution(dishId) {
    return contributions.find(
      (c) => c.dish_id === dishId && c.family_id === family.id
    )
  }

  async function addContribution(dishId) {
    if (isLocked) return
    const { error } = await supabase.from('pool_contributions').insert({
      family_id: family.id,
      dish_id: dishId,
    })
    if (!error) await load()
  }

  async function removeContribution(id) {
    if (isLocked) return
    await supabase.from('pool_contributions').delete().eq('id', id)
    await load()
  }

  function startEdit(c) {
    setEditingId(c.id)
    setEditNote(c.quantity_note || '')
    setEditSlot(c.preferred_slot_id || '')
  }

  async function saveEdit() {
    if (!editingId) return
    await supabase
      .from('pool_contributions')
      .update({
        quantity_note: editNote.trim() || null,
        preferred_slot_id: editSlot || null,
      })
      .eq('id', editingId)
    setEditingId(null)
    setEditNote('')
    setEditSlot('')
    await load()
  }

  if (loading) return <div className="text-center py-12">Ladataan…</div>

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl text-leaf-800">Lisukepooli</h1>
        <p className="text-sm text-leaf-600 mt-1">
          Lisukkeet, salaatit ja jälkkärit eivät kuulu yhdelle aterialle —
          merkitse mitä tuotte, niin tarjoillaan kun sopii. Voit halutessasi
          ehdottaa päivää.
        </p>
      </header>

      {isLocked && (
        <div className="card p-4 bg-berry-400/10 border-berry-400/30 text-sm text-berry-600">
          Valinta-aika on päättynyt. Muutoksia ei voi enää tehdä.
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-1 bg-white/60 p-1 rounded-full border border-birch-100 overflow-x-auto">
        {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              activeCategory === key
                ? 'bg-leaf-600 text-birch-50'
                : 'text-leaf-800 hover:bg-birch-100'
            }`}
          >
            <span className="mr-1">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {dishesInCategory.map((dish) => {
          const items = contributionsFor(dish.id)
          const mine = ownContribution(dish.id)
          return (
            <section key={dish.id} className="card p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-leaf-800">
                    {dish.name}
                  </h3>
                  {dish.description && (
                    <p className="text-sm text-leaf-600 mt-0.5">
                      {dish.description}
                    </p>
                  )}
                  {dish.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {dish.tags.map((t) => (
                        <span key={t} className="pill-sky">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {items.length > 0 && (
                  <span className="pill-sun shrink-0">
                    {items.length} {items.length === 1 ? 'tuoja' : 'tuojaa'}
                  </span>
                )}
              </div>

              {items.length > 0 && (
                <ul className="space-y-1.5 my-3">
                  {items.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-2 bg-birch-50 rounded-lg px-3 py-2 text-sm"
                    >
                      <div className="flex-1">
                        <span className="font-medium">
                          {familyName(c.family_id)}
                        </span>
                        {c.quantity_note && (
                          <span className="text-leaf-600 ml-2">
                            · {c.quantity_note}
                          </span>
                        )}
                        {c.preferred_slot_id && (
                          <span className="text-leaf-600 ml-2">
                            · ehdottaa: {slotName(c.preferred_slot_id)}
                          </span>
                        )}
                      </div>
                      {c.family_id === family.id && !isLocked && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEdit(c)}
                            className="text-leaf-600 text-xs hover:underline"
                          >
                            Muokkaa
                          </button>
                          <span className="text-leaf-400">·</span>
                          <button
                            onClick={() => removeContribution(c.id)}
                            className="text-berry-600 text-xs hover:underline"
                          >
                            Poista
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {editingId && items.some((c) => c.id === editingId) && (
                <div className="bg-birch-50 rounded-xl p-3 space-y-2 my-2">
                  <input
                    className="field"
                    placeholder="Määrä / kommentti (esim. iso satsi)"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                  />
                  <select
                    className="field"
                    value={editSlot}
                    onChange={(e) => setEditSlot(e.target.value)}
                  >
                    <option value="">Ei päivätoivetta</option>
                    {slots.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.display_name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="btn-primary text-sm">
                      Tallenna
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn-ghost text-sm"
                    >
                      Peruuta
                    </button>
                  </div>
                </div>
              )}

              {!mine && !isLocked && (
                <button
                  onClick={() => addContribution(dish.id)}
                  className="btn-secondary text-sm w-full mt-2"
                >
                  + Me tuomme tämän
                </button>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
