import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import { summarizeHousehold } from '../lib/portions'

export default function Summary({ family }) {
  const [slots, setSlots] = useState([])
  const [selections, setSelections] = useState([])
  const [dishes, setDishes] = useState({})
  const [families, setFamilies] = useState([])
  const [members, setMembers] = useState([])
  const [claims, setClaims] = useState([])
  const [poolContribs, setPoolContribs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const [slotsRes, selRes, dishRes, famRes, memRes, claimRes, poolRes] =
      await Promise.all([
        supabase.from('meal_slots').select('*').order('sort_order'),
        supabase.from('dish_selections').select('*'),
        supabase.from('dishes').select('*'),
        supabase.from('families').select('id, name'),
        supabase.from('household_members').select('*'),
        supabase.from('shopping_claims').select('*'),
        supabase.from('pool_contributions').select('*'),
      ])

    setSlots(slotsRes.data || [])
    setSelections(selRes.data || [])
    const map = {}
    ;(dishRes.data || []).forEach((d) => (map[d.id] = d))
    setDishes(map)
    setFamilies(famRes.data || [])
    setMembers(memRes.data || [])
    setClaims(claimRes.data || [])
    setPoolContribs(poolRes.data || [])
    setLoading(false)
  }

  function familyName(id) {
    return families.find((f) => f.id === id)?.name || 'Tuntematon'
  }

  function membersOf(famId) {
    return members.filter((m) => m.family_id === famId)
  }

  // Build meal teams: { slotId: [{ dish, families: [], headcount, portions, allergens }] }
  const mealTeams = useMemo(() => {
    const result = {}
    slots.forEach((slot) => {
      const slotSelections = selections.filter(
        (s) => s.meal_slot_id === slot.id
      )
      const byDish = {}
      const flexibleFamilies = []

      slotSelections.forEach((s) => {
        if (s.is_flexible) {
          flexibleFamilies.push(s.family_id)
        } else if (s.dish_id) {
          if (!byDish[s.dish_id]) byDish[s.dish_id] = []
          byDish[s.dish_id].push(s.family_id)
        }
      })

      const teams = Object.entries(byDish).map(([dishId, familyIds]) => {
        const allMembers = familyIds.flatMap(membersOf)
        const summary = summarizeHousehold(allMembers)
        return {
          dishId,
          dish: dishes[dishId],
          families: familyIds,
          headcount: allMembers.length,
          summary,
        }
      })

      result[slot.id] = { teams, flexibleFamilies }
    })
    return result
  }, [slots, selections, dishes, members])

  // claim-logiikka: mode = 'self' | 'all' | null (poista)
  async function setClaim(slotId, dishId, itemName, mode) {
    // Poista ensin kaikki omat claimit tälle itemille
    const existing = claims.find(
      (c) =>
        c.meal_slot_id === slotId &&
        c.dish_id === dishId &&
        c.item_name === itemName &&
        c.claimed_by === family.id
    )

    if (existing) {
      // Jos sama moodi uudelleen → poista (toggle off)
      const sameMode =
        (mode === 'all' && existing.for_all) ||
        (mode === 'self' && !existing.for_all)
      if (sameMode) {
        await supabase.from('shopping_claims').delete().eq('id', existing.id)
        await load()
        return
      }
      // Muuta moodia
      await supabase
        .from('shopping_claims')
        .update({ for_all: mode === 'all' })
        .eq('id', existing.id)
    } else {
      await supabase.from('shopping_claims').insert({
        meal_slot_id: slotId,
        dish_id: dishId,
        item_name: itemName,
        claimed_by: family.id,
        for_all: mode === 'all',
      })
    }
    await load()
  }

  // Kaikki claimit tietylle itemille (myös muilta)
  function claimsFor(slotId, dishId, itemName) {
    return claims.filter(
      (c) =>
        c.meal_slot_id === slotId &&
        c.dish_id === dishId &&
        c.item_name === itemName &&
        c.claimed_by != null
    )
  }

  function ownClaimFor(slotId, dishId, itemName) {
    return claims.find(
      (c) =>
        c.meal_slot_id === slotId &&
        c.dish_id === dishId &&
        c.item_name === itemName &&
        c.claimed_by === family.id
    )
  }

  if (loading) return <div className="text-center py-12">Ladataan…</div>

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl text-leaf-800">Yhteenveto</h1>
        <p className="text-sm text-leaf-600 mt-1">
          Tee-tiimit, annoslaskenta ja ehdotettu ostoslista. Klikkaa raaka-ainetta
          merkitäksesi että tuot sen.
        </p>
      </header>

      {slots.map((slot) => {
        const { teams, flexibleFamilies } = mealTeams[slot.id] || {
          teams: [],
          flexibleFamilies: [],
        }

        if (teams.length === 0 && flexibleFamilies.length === 0) {
          return (
            <section key={slot.id} className="card p-4 opacity-60">
              <h2 className="font-display text-lg">{slot.display_name}</h2>
              <p className="text-sm text-leaf-600 mt-1">Ei valintoja vielä</p>
            </section>
          )
        }

        return (
          <section key={slot.id} className="card p-4 space-y-4">
            <h2 className="font-display text-lg text-leaf-800">
              {slot.display_name}
            </h2>

            {teams.map((team) => {
              // total portions: team summary plus flexible families' portions (they eat what's there)
              const flexMembers = flexibleFamilies.flatMap(membersOf)
              const totalMembers = team.summary.total + flexMembers.length
              const flexPortions = flexMembers.reduce((s, m) => {
                if (m.age < 3) return s + 0.2
                if (m.age < 7) return s + 0.5
                if (m.age < 13) return s + 0.75
                return s + 1
              }, 0)
              const totalPortions = team.summary.portions + flexPortions

              return (
                <div
                  key={team.dishId}
                  className="bg-birch-50 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-display font-semibold text-leaf-800">
                        {team.dish?.name || 'Ruoka'}
                      </div>
                      {team.dish?.description && (
                        <p className="text-sm text-leaf-600 mt-0.5">
                          {team.dish.description}
                        </p>
                      )}
                    </div>
                    <span className="pill-sun shrink-0">
                      🤝 Tiimi
                    </span>
                  </div>

                  {/* Team families */}
                  <div className="flex flex-wrap gap-1.5">
                    {team.families.map((fid) => (
                      <span key={fid} className="pill-leaf">
                        {familyName(fid)}
                      </span>
                    ))}
                  </div>

                  {/* Portions */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white rounded-lg py-2">
                      <div className="text-lg font-display font-semibold">
                        {totalMembers}
                      </div>
                      <div className="text-xs text-leaf-600">syöjää</div>
                    </div>
                    <div className="bg-white rounded-lg py-2">
                      <div className="text-lg font-display font-semibold">
                        {totalPortions.toFixed(1)}
                      </div>
                      <div className="text-xs text-leaf-600">annosta</div>
                    </div>
                    <div className="bg-white rounded-lg py-2">
                      <div className="text-lg font-display font-semibold">
                        {Math.ceil(totalPortions * 1.15)}
                      </div>
                      <div className="text-xs text-leaf-600">
                        + 15 % varmuus
                      </div>
                    </div>
                  </div>

                  {flexibleFamilies.length > 0 && (
                    <div className="text-xs text-leaf-600">
                      Mukana joustavat:{' '}
                      {flexibleFamilies.map(familyName).join(', ')}
                    </div>
                  )}

                  {/* Shopping list */}
                  {team.dish?.suggested_ingredients?.length > 0 && (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-leaf-600 mb-2 mt-2">
                        Ehdotettu ostoslista
                      </div>
                      <ul className="space-y-1.5">
                        {team.dish.suggested_ingredients.map((item) => {
                          const own = ownClaimFor(slot.id, team.dishId, item)
                          const others = claimsFor(slot.id, team.dishId, item).filter(
                            (c) => c.claimed_by !== family.id
                          )
                          const isSelf = own && !own.for_all
                          const isAll = own && own.for_all
                          return (
                            <li key={item} className="bg-white rounded-xl px-3 py-2">
                              {/* Raaka-aine + muiden claimit */}
                              <div className="flex items-center gap-2 mb-2">
                                <span className="flex-1 text-sm font-medium text-leaf-800">
                                  {item}
                                </span>
                                {others.map((c) => (
                                  <span
                                    key={c.id}
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      c.for_all
                                        ? 'bg-sun-200 text-sun-600'
                                        : 'bg-birch-100 text-leaf-600'
                                    }`}
                                  >
                                    {familyName(c.claimed_by)}{' '}
                                    {c.for_all ? '· kaikille' : '· itselle'}
                                  </span>
                                ))}
                              </div>
                              {/* Omat napit */}
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() =>
                                    setClaim(slot.id, team.dishId, item, 'self')
                                  }
                                  className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition ${
                                    isSelf
                                      ? 'bg-leaf-600 text-birch-50'
                                      : 'bg-birch-50 text-leaf-700 hover:bg-leaf-50 border border-birch-200'
                                  }`}
                                >
                                  {isSelf ? '✓ ' : ''}Tuon meille
                                </button>
                                <button
                                  onClick={() =>
                                    setClaim(slot.id, team.dishId, item, 'all')
                                  }
                                  className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition ${
                                    isAll
                                      ? 'bg-sun-400 text-leaf-900'
                                      : 'bg-birch-50 text-leaf-700 hover:bg-sun-200/50 border border-birch-200'
                                  }`}
                                >
                                  {isAll ? '✓ ' : ''}Tuon kaikille
                                </button>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}

                  {team.dish?.recipe && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-leaf-600 hover:text-leaf-800">
                        📖 Resepti
                      </summary>
                      <p className="mt-2 text-leaf-800 whitespace-pre-line">
                        {team.dish.recipe}
                      </p>
                    </details>
                  )}
                </div>
              )
            })}

            {teams.length === 0 && flexibleFamilies.length > 0 && (
              <div className="text-sm text-leaf-600 italic">
                Tällä aterialla on vain joustavia syöjiä — joku saa vielä
                ehdottaa ruokaa.
              </div>
            )}
          </section>
        )
      })}

      {/* Pool: yhteiset lisukkeet & salaatit & jälkkärit */}
      {poolContribs.length > 0 && (
        <section className="card p-4 space-y-3">
          <div>
            <h2 className="font-display text-lg text-leaf-800">
              🥗 Yhteinen lisukepooli
            </h2>
            <p className="text-xs text-leaf-600 mt-1">
              Tarjoillaan kun sopii. Päivätoive on pelkkä ehdotus.
            </p>
          </div>
          {['lisuke', 'salaatti', 'jalkkari'].map((cat) => {
            const inCat = poolContribs.filter(
              (c) => dishes[c.dish_id]?.category === cat
            )
            if (inCat.length === 0) return null
            const label =
              cat === 'lisuke'
                ? 'Lisukkeet & grillattavat'
                : cat === 'salaatti'
                ? 'Salaatit'
                : 'Jälkiruoat'
            return (
              <div key={cat}>
                <div className="text-xs uppercase tracking-wider text-leaf-600 mb-2">
                  {label}
                </div>
                <ul className="space-y-1.5">
                  {inCat.map((c) => {
                    const dish = dishes[c.dish_id]
                    return (
                      <li
                        key={c.id}
                        className="bg-birch-50 rounded-lg px-3 py-2 text-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{dish?.name}</span>
                          <span className="text-leaf-600 text-xs">
                            {familyName(c.family_id)}
                          </span>
                        </div>
                        {(c.quantity_note || c.preferred_slot_id) && (
                          <div className="text-xs text-leaf-600 mt-0.5">
                            {c.quantity_note && <span>{c.quantity_note}</span>}
                            {c.quantity_note && c.preferred_slot_id && (
                              <span> · </span>
                            )}
                            {c.preferred_slot_id && (
                              <span>
                                ehdotus:{' '}
                                {
                                  slots.find(
                                    (s) => s.id === c.preferred_slot_id
                                  )?.display_name
                                }
                              </span>
                            )}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}
