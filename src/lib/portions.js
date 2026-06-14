// Annoslaskenta iän perusteella.
// Aikuinen = 1 annos. Lapset annosvähennyksellä.
export function ageToPortion(age) {
  if (age == null) return 1
  if (age < 3) return 0.2
  if (age < 7) return 0.5
  if (age < 13) return 0.75
  return 1
}

export function householdPortions(members = []) {
  return members.reduce((sum, m) => sum + ageToPortion(m.age), 0)
}

export function summarizeHousehold(members = []) {
  const adults = members.filter((m) => m.age >= 13).length
  const kids = members.filter((m) => m.age < 13).length
  return { adults, kids, total: members.length, portions: householdPortions(members) }
}
