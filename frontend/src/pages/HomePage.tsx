import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function HomePage() {
  const { user, loading, logout, isAdmin, isViewingAsAdmin, toggleViewMode } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [profileOverride, setProfileOverride] = useState<{ name?: string; avatar?: string } | null>(null)

  const riasecCategories = [
    'Реалистичный (Практический)',
    'Исследовательский (Интеллектуальный)',
    'Артистический (Творческий)',
    'Социальный (Коммуникабельный)',
    'Предпринимательский (Лидерский)',
    'Конвенциональный (Организаторский)'
  ]
  const [testsOpen, setTestsOpen] = useState(false)

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
    const storedProfile = localStorage.getItem('cm_profile_override')
    if (storedProfile) {
      try {
        setProfileOverride(JSON.parse(storedProfile))
      } catch {
        /* ignore */
      }
    }
  }, [])

  const displayName = useMemo(
    () => profileOverride?.name || user?.name || '',
    [profileOverride, user]
  )

  const avatarSrc = profileOverride?.avatar
  const avatarFallback = displayName ? displayName[0]?.toUpperCase() : 'U'

  const isDark = theme === 'dark'

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
            <span className="sr-only">Close</span>
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
                    isDark 
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
                  {item.children.map((child) => (
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
        <div className={`px-6 py-4 border-t text-sm ${isDark ? 'border-slate-700 text-slate-500' : 'border-gray-200 text-gray-500'}`}></div>
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
              <span className="sr-only">Menu</span>
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
              {isDark ? '🌙' : '☀️'}
            </button>
            {loading ? (
              <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setAccountMenuOpen((o) => !o)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                    isDark 
                      ? 'border-slate-600 bg-slate-700 hover:bg-slate-600' 
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center overflow-hidden">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-semibold">{avatarFallback}</span>
                    )}
                  </div>
                  <span className={`font-medium hidden sm:block ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{displayName || 'Аккаунт'}</span>
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

      <main className="max-w-7xl mx-auto px-4 py-12 lg:pl-80">
        <div className="max-w-4xl text-center mx-auto">
          <h1 className={`text-4xl md:text-5xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Найдите свою идеальную профессию
          </h1>
          <p className={`text-xl mb-8 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
            Подберём подходящую профессию с учётом ваших навыков, интересов и личностного типа по методике Holland (RIASEC)
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              to="/questionnaire"
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              Начать подбор
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className={`p-6 rounded-xl shadow-md ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${isDark ? 'bg-blue-900' : 'bg-blue-100'}`}>
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>RIASEC тест</h3>
              <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>Определяем ваш личностный тип по научной методике Holland</p>
            </div>

            <div className={`p-6 rounded-xl shadow-md ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${isDark ? 'bg-green-900' : 'bg-green-100'}`}>
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Анализ навыков</h3>
              <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>Учитываем ваши навыки, образование и желаемый доход</p>
            </div>

            <div className={`p-6 rounded-xl shadow-md ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${isDark ? 'bg-purple-900' : 'bg-purple-100'}`}>
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Подбор профессий</h3>
              <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>Получите рейтинг профессий с зарплатой и востребованностью</p>
            </div>
          </div>

          <div className={`mt-16 rounded-xl shadow-md p-8 text-left ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>О сервисе</h2>
            <p className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              CareerMatch помогает подобрать профессию на основе методики Holland (RIASEC), ваших навыков, образования
              и желаемых условий. Мы предлагаем персонализированный рейтинг профессий, актуальные данные о спросе и
              доходе, а также партнёрские курсы для развития. Начните с теста — результаты останутся на главной странице,
              чтобы вы могли сразу перейти к подбору.
            </p>
          </div>
        </div>
      </main>

      <footer className={`border-t py-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className={`max-w-7xl mx-auto px-4 text-center ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          <p>&copy; 2024 CareerMatch. Помогаем найти призвание.</p>
        </div>
      </footer>
    </div>
  )
}
