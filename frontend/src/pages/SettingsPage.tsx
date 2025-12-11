import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const isDark = theme === 'dark'

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <header className={`shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                CM
              </div>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>CareerMatch</span>
            </Link>
            <span className={isDark ? 'text-slate-500' : 'text-gray-400'}>/</span>
            <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Настройки</span>
          </div>
          <Link to="/account" className="text-blue-600 hover:text-blue-700 font-medium">
            Личный кабинет
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className={`rounded-2xl shadow p-6 space-y-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Тема</h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Переключение между светлой и тёмной темой</p>
            </div>
            <button
              onClick={toggleTheme}
              className={`px-4 py-2 rounded-lg border ${
                isDark 
                  ? 'border-slate-600 bg-slate-700 hover:bg-slate-600 text-slate-300' 
                  : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              {isDark ? 'Светлая' : 'Тёмная'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
