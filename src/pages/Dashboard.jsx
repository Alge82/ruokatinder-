import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import Countdown from '../components/Countdown'
import { parseDeadline } from '../lib/deadline'

export default function Dashboard({ family }) {
  const [slots, setSlots] = useState([])
  const [selections, setSelections] = useState([])
  const [dishes, setDishes] = useState({})
  const [families, setFamilies] = useState([])
  const [deadlineIso, setDeadlineIso] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [slotsRes, selRes, dishRes, famRes, settingsRes] = await Promise.all([
      supabase.from('meal_slots').select('*').order('sort_order'),
      supabase.from('dish_selections').select('*'),
      supabase.from('dishes').select('id, name, category, tags'),
      supabase.from('families').select('id, name'),
      supabase.from('app_settings').select('value').eq('key', 'deadline_iso').maybeSingle(),
    ])
    if (slotsRes.data) setSlots(slotsRes.data)
    if (selRes.data) setSelections(selRes.data)
    if (dishRes.data) {
      const map = {}
      dishRes.data.forEach((d) => (map[d.id] = d))
      setDishes(map)
    }
    if (famRes.data) setFamilies(famRes.data)
    if (settingsRes.data?.value) setDeadlineIso(settingsRes.data.value)
    setLoading(false)
  }

  const deadline = parseDeadline(deadlineIso)

  function selectionsForSlot(slotId) {
    return selections.filter((s) => s.meal_slot_id === slotId)
  }
  function ownSelectionFor(slotId) {
    return selections.find((s) => s.meal_slot_id === slotId && s.family_id === family.id)
  }
  function familyName(fid) {
    return families.find((f) => f.id === fid)?.name || 'Tuntematon'
  }
  function dishName(did) {
    return dishes[did]?.name || 'Ruoka'
  }
  function matchesForSlot(slotId) {
    const sels = selectionsForSlot(slotId).filter((s) => s.dish_id)
    const groups = {}
    sels.forEach((s) => {
      if (!groups[s.dish_id]) groups[s.dish_id] = []
      groups[s.dish_id].push(s.family_id)
    })
    return Object.entries(groups)
      .filter(([_, fams]) => fams.length > 1)
      .map(([did, fams]) => ({ dishId: did, families: fams }))
  }

  if (loading) return <div className="text-center py-12 text-leaf-600">Ladataan…</div>

  return (
    <div className="space-y-6">
      <Countdown deadline={deadline} />
      <div>
        <h2 className="font-display text-xl mb-3 text-leaf-800">Ateriat</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {slots.map((slot) => {
            const own = ownSelectionFor(slot.id)
            const matches = matchesForSlot(slot.id)
            const totalSelections = selectionsForSlot(slot.id).length
            return (
              <Link
                key={slot.id}
                to={`/ateria/${slot.id}`}
                className="card p-4 hover:shadow-lift hover:-translate-y-0.5 transition"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-display font-semibold text-leaf-800">
                    {slot.display_name}
                  </div>
                  {totalSelections > 0 && (
                    <span className="pill-leaf">
                      {totalSelections} {totalSelections === 1 ? 'valinta' : 'valintaa'}
                    </span>
                  )}
                </div>
                {own ? (
                  own.is_flexible ? (
                    <div className="text-sm text-leaf-600 italic">🍃 Syöt mitä tarjolla on</div>
                  ) : (
                    <div className="text-sm font-medium text-leaf-800">✓ {dishName(own.dish_id)}</div>
                  )
                ) : (
                  <div className="text-sm text-leaf-400">Ei valintaa vielä</div>
                )}
                {matches.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-birch-100">
                    {matches.map((m) => (
                      <div key={m.dishId} className="text-xs text-leaf-600 flex items-center gap-1.5">
                        <span className="text-sun-600">🤝</span>
                        <span className="font-medium">{dishName(m.dishId)}</span>
                        <span>·</span>
                        <span>{m.families.map(familyName).join(', ')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}