import { useEffect, useState } from 'react'
import { adminApi, News } from '../services/api'

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Новости</h1>

      {loading && <div className="text-gray-600">Загрузка...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && news.length === 0 && (
        <div className="text-gray-600">Пока нет новостей.</div>
      )}

      <div className="space-y-4">
        {news.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="font-semibold text-gray-900">{item.title}</h3>
            <p className="text-gray-600 mt-2">{item.content}</p>
            <div className="text-sm text-gray-500 mt-3">
              {item.authorName} • {new Date(item.createdAt).toLocaleDateString('ru-RU')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

