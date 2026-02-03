import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi, News } from '../services/api'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

export default function NewsPage() {
  const { theme, toggleTheme } = useTheme()
  const { user, loading: authLoading, logout, isAdmin, isViewingAsAdmin, toggleViewMode } = useAuth()
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)

  const riasecCategories = [
    'Реалистичный (Практический)',
    'Исследовательский (Интеллектуальный)',
    'Артистический (Творческий)',
    'Социальный (Коммуникабельный)',
    'Предпринимательский (Лидерский)',
    'Конвенциональный (Организаторский)'
  ]
  const [testsOpen, setTestsOpen] = useState(false)

  const isDark = theme === 'dark'

  const navItems = [
    { to: '/', label: 'Главная' },
    { to: '/news', label: 'Новости' },
    { to: '/blogs', label: 'Блоги' },
    {
      to: '/tests',
      label: 'Тесты',
      children: [
        { to: '/tests', label: 'Все тесты' },
        ...riasecCategories.map((cat) => ({ to: `/tests?category=${encodeURIComponent(cat)}`, label: cat }))
      ]
    },
    ...(isViewingAsAdmin ? [{ to: '/admin', label: 'Админ-панель' }] : [])
  ]

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminApi.getNews()
        setNews(data)
      } catch (err) {
        setError('Не удалось загрузить новости')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const displayName = user?.name || ''
  const avatarFallback = displayName ? displayName[0]?.toUpperCase() : 'U'

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed z-30 inset-y-0 left-0 w-72 shadow-xl transform transition-transform duration-300 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isDark ? 'bg-slate-800' : 'bg-white'}`}
      >
        <div className={`px-6 py-5 border-b flex items-center justify-between ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">CM</span>
            </div>
            <div>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>CareerMatch</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Подбор профессий</p>
            </div>
          </div>
          <button
            className={`lg:hidden p-2 rounded-full ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-600'}`}
            onClick={() => setSidebarOpen(false)}
            aria-label="Закрыть меню"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <div key={item.to}>
              {item.children ? (
                <button
                  type="button"
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${
                    isDark
                      ? 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                  onClick={() => setTestsOpen((o) => !o)}
                >
                  <span>{item.label}</span>
                  <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{testsOpen ? '▲' : '▼'}</span>
                </button>
              ) : (
                <Link
                  to={item.to}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    item.to === '/news'
                      ? isDark
                        ? 'bg-slate-700 text-white'
                        : 'bg-blue-50 text-blue-700'
                      : isDark
                        ? 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span>{item.label}</span>
                </Link>
              )}
              {item.children && testsOpen && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children.map((child: { to: string; label: string }) => (
                    <Link
                      key={child.to + child.label}
                      to={child.to}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        isDark
                          ? 'text-slate-400 hover:bg-slate-700 hover:text-white'
                          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <header className={`sticky top-0 z-10 backdrop-blur shadow-sm ${isDark ? 'bg-slate-800/80' : 'bg-white/80'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              className={`p-2 rounded-lg border lg:hidden ${
                isDark
                  ? 'border-slate-600 bg-slate-700 hover:bg-slate-600 text-slate-300'
                  : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
              }`}
              onClick={() => setSidebarOpen(true)}
              aria-label="Открыть меню"
            >
              ☰
            </button>
            <Link to="/" className="hidden lg:flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">CM</span>
              </div>
              <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>CareerMatch</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg border ${
                isDark
                  ? 'border-slate-600 bg-slate-700 hover:bg-slate-600 text-slate-300'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
              aria-label="Переключить тему"
            >
              <span className="theme-toggle-icon">{isDark ? '🌙' : '☀️'}</span>
            </button>
            {authLoading ? (
              <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setAccountMenuOpen(o => !o)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'border-slate-600 bg-slate-700 hover:bg-slate-600'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <span className="font-semibold">{avatarFallback}</span>
                  </div>
                  <span className={`font-medium hidden sm:block ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{displayName}</span>
                </button>
                {accountMenuOpen && (
                  <div className={`absolute right-0 mt-2 w-48 border rounded-lg shadow-lg py-2 z-20 ${
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
                  }`}>
                    <Link
                      to="/account"
                      className={`block px-4 py-2 text-sm ${
                        isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      Личный кабинет
                    </Link>
                    <Link
                      to="/settings"
                      className={`block px-4 py-2 text-sm ${
                        isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      Настройки
                    </Link>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          toggleViewMode()
                          setAccountMenuOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm ${
                          isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Режим: {isViewingAsAdmin ? 'Админ' : 'Гость'}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        logout()
                        setAccountMenuOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        isDark ? 'text-red-400 hover:bg-slate-700' : 'text-red-600 hover:bg-gray-50'
                      }`}
                    >
                      Выйти
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-4 py-2 transition-colors ${
                    isDark ? 'text-slate-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Войти
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 lg:pl-80">
        <h1 className={`text-3xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Новости</h1>

        {loading && <div className={isDark ? 'text-slate-400' : 'text-gray-600'}>Загрузка...</div>}
        {error && <div className="text-red-600">{error}</div>}

        {!loading && !error && news.length === 0 && (
          <div className={isDark ? 'text-slate-400' : 'text-gray-600'}>Пока нет новостей.</div>
        )}

        <div className="space-y-4">
          {news.map((item) => (
            <div key={item.id} className={`p-6 rounded-xl shadow-md ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
              <p className={`mt-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{item.content}</p>
              <div className={`text-sm mt-3 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                {item.authorName} • {new Date(item.createdAt).toLocaleDateString('ru-RU')}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
