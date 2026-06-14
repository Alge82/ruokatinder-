import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import MealPicker from './pages/MealPicker'
import Pool from './pages/Pool'
import Breakfast from './pages/Breakfast'
import Summary from './pages/Summary'
import FamilyEdit from './pages/FamilyEdit'
import NameLogin from './pages/NameLogin'

export default function App() {
  const [family, setFamily] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedId = localStorage.getItem('ruokatinder_family_id')
    if (savedId) {
      loadFamily(savedId)
    } else {
      setLoading(false)
    }
  }, [])

  async function loadFamily(id) {
    setLoading(true)
    const { data } = await supabase
      .from('families')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (data) {
      setFamily(data)
    } else {
      localStorage.removeItem('ruokatinder_family_id')
    }
    setLoading(false)
  }

  function handleLogin(familyData) {
    localStorage.setItem('ruokatinder_family_id', familyData.id)
    setFamily(familyData)
  }

  function handleLogout() {
    localStorage.removeItem('ruokatinder_family_id')
    setFamily(null)
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-leaf-600">
        Ladataan…
      </div>
    )
  }

  if (!family) {
    return <NameLogin onLogin={handleLogin} />
  }

  return (
    <Layout family={family} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Dashboard family={family} />} />
        <Route path="/ateria/:slotId" element={<MealPicker family={family} />} />
        <Route path="/lisukkeet" element={<Pool family={family} />} />
        <Route path="/aamiainen" element={<Breakfast family={family} />} />
        <Route path="/yhteenveto" element={<Summary family={family} />} />
        <Route
          path="/perhe"
          element={<FamilyEdit family={family} onUpdate={(f) => setFamily(f)} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}