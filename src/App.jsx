import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import Layout from './components/Layout'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import MealPicker from './pages/MealPicker'
import Pool from './pages/Pool'
import Breakfast from './pages/Breakfast'
import Summary from './pages/Summary'
import FamilyEdit from './pages/FamilyEdit'

export default function App() {
  const [session, setSession] = useState(null)
  const [family, setFamily] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setFamily(null)
      setLoading(false)
      return
    }
    loadFamily()
  }, [session])

  async function loadFamily() {
    setLoading(true)
    const { data, error } = await supabase
      .from('families')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .maybeSingle()
    if (!error) setFamily(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-leaf-600">
        Ladataan…
      </div>
    )
  }

  if (!session) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  if (!family) {
    return <Onboarding session={session} onComplete={loadFamily} />
  }

  return (
    <Layout family={family}>
      <Routes>
        <Route path="/" element={<Dashboard family={family} />} />
        <Route path="/ateria/:slotId" element={<MealPicker family={family} />} />
        <Route path="/lisukkeet" element={<Pool family={family} />} />
        <Route path="/aamiainen" element={<Breakfast family={family} />} />
        <Route path="/yhteenveto" element={<Summary family={family} />} />
        <Route
          path="/perhe"
          element={<FamilyEdit family={family} onUpdate={loadFamily} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
