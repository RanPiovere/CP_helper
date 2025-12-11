import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi, News } from '../services/api'
import { useTheme } from '../context/ThemeContext'

export default function NewsPage() {
  const { theme } = useTheme()
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isDark = theme === 'dark'

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
            <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Новости</span>
          </div>
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
            На главную
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12">
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
      </div>
    </div>
  )
}
