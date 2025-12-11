import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { adminApi, News } from '../services/api'

export default function HomePage() {
  const { user, loading, logout, isAdmin, isViewingAsAdmin, toggleViewMode } = useAuth()
  const [news, setNews] = useState<News[]>([])
  const [newsLoading, setNewsLoading] = useState(true)

  useEffect(() => {
    loadNews()
  }, [])

  const loadNews = async () => {
    try {
      const newsData = await adminApi.getNews()
      setNews(newsData.slice(0, 3))
    } catch (error) {
      console.error('Failed to load news:', error)
    } finally {
      setNewsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">CM</span>
            </div>
            <span className="text-xl font-bold text-gray-800">CareerMatch</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/tests" className="text-gray-600 hover:text-gray-800 transition-colors">
              Тесты
            </Link>
            {loading ? (
              <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                {isAdmin && (
                  <>
                    <button
                      onClick={toggleViewMode}
                      className={`text-xs px-2 py-1 rounded-full ${isViewingAsAdmin ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {isViewingAsAdmin ? 'Админ' : 'Гость'}
                    </button>
                    {isViewingAsAdmin && (
                      <Link to="/admin" className="text-blue-600 hover:text-blue-700 font-medium">
                        Панель
                      </Link>
                    )}
                  </>
                )}
                <span className="text-gray-700">
                  {user.name}
                  {!user.emailVerified && (
                    <span className="ml-2 text-xs text-orange-600">(не подтверждён)</span>
                  )}
                </span>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
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

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Найдите свою идеальную профессию
          </h1>
          <p className="text-xl text-gray-600 mb-8">
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
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">RIASEC тест</h3>
              <p className="text-gray-600">Определяем ваш личностный тип по научной методике Holland</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Анализ навыков</h3>
              <p className="text-gray-600">Учитываем ваши навыки, образование и желаемый доход</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Подбор профессий</h3>
              <p className="text-gray-600">Получите рейтинг профессий с зарплатой и востребованностью</p>
            </div>
          </div>

          {!newsLoading && news.length > 0 && (
            <div className="mt-12 w-full max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-left">Новости</h2>
              <div className="space-y-4">
                {news.map(item => (
                  <div key={item.id} className="bg-white p-6 rounded-xl shadow-md text-left">
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-gray-600 mt-2 line-clamp-3">{item.content}</p>
                    <div className="text-sm text-gray-500 mt-3">
                      {item.authorName} • {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500">
          <p>&copy; 2024 CareerMatch. Помогаем найти призвание.</p>
        </div>
      </footer>
    </div>
  )
}
