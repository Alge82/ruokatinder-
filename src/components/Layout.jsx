import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import SummerBackground from './SummerBackground'

const links = [
  { to: '/', label: 'Ateriat', icon: '🍽️' },
  { to: '/lisukkeet', label: 'Lisukkeet', icon: '🥗' },
  { to: '/aamiainen', label: 'Aamiaiset', icon: '🥐' },
  { to: '/yhteenveto', label: 'Yhteenveto', icon: '📋' },
  { to: '/perhe', label: 'Perhe', icon: '👨‍👩‍👧' },
]

export default function Layout({ family, children }) {
  const navigate = useNavigate()

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-dvh pb-28 sm:pb-8">
      <SummerBackground />

      {/* Header */}
      <header className="px-4 pt-6 pb-4 sm:px-8 sm:pt-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-semibold text-leaf-800">
              Grillinder
            </h1>
            <div className="text-xs text-leaf-600 mt-0.5">
              {family?.name ? `Hei, ${family.name}!` : 'Juhannus 2026'}
            </div>
          </div>
          <button onClick={signOut} className="btn-ghost text-sm">
            Kirjaudu ulos
          </button>
        </div>
      </header>

      {/* Desktop nav */}
      <nav className="hidden sm:block px-8 mb-6">
        <div className="max-w-3xl mx-auto flex gap-1 bg-white/60 p-1 rounded-full border border-birch-100 w-fit">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-sm font-medium transition ${
                  isActive
                    ? 'bg-leaf-600 text-birch-50'
                    : 'text-leaf-800 hover:bg-birch-100'
                }`
              }
            >
              <span className="mr-1">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Main */}
      <main className="px-4 sm:px-8">
        <div className="max-w-3xl mx-auto">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-birch-200 z-30">
        <div className="grid grid-cols-5">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-3 text-xs ${
                  isActive ? 'text-leaf-600 font-semibold' : 'text-leaf-600/70'
                }`
              }
            >
              <span className="text-xl mb-0.5">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
