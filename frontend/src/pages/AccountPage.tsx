import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Link, Navigate } from 'react-router-dom'
import { PartnerCourse } from '../services/api'

type SavedTestStat = {
  date: string
  matchesCount: number
}

type SavedFavorites = PartnerCourse[]

type RedeemedCode = {
  code: string
  redeemedAt: string
  benefit: string
}

const STORAGE_KEYS = {
  stats: 'cm_test_stats',
  favorites: 'cm_favorite_courses',
  promo: 'cm_redeemed_promos',
  profile: 'cm_profile_override'
}

const PROMO_CODES: Record<string, string> = {
  CAREER10: 'Скидка 10% на платные консультации',
  PRO20: 'Скидка 20% на партнёрские курсы',
  START5: '5% скидка на первый заказ'
}

export default function AccountPage() {
  const { user, loading } = useAuth()
  const { theme } = useTheme()
  const [stats, setStats] = useState<SavedTestStat[]>([])
  const [favorites, setFavorites] = useState<SavedFavorites>([])
  const [promoInput, setPromoInput] = useState('')
  const [redeemed, setRedeemed] = useState<RedeemedCode[]>([])
  const [promoMessage, setPromoMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [profileForm, setProfileForm] = useState<{ name: string; avatar?: string }>({
    name: user?.name || '',
    avatar: undefined
  })

  const isDark = theme === 'dark'

  useEffect(() => {
    const storedStats = localStorage.getItem(STORAGE_KEYS.stats)
    const storedFav = localStorage.getItem(STORAGE_KEYS.favorites)
    const storedPromo = localStorage.getItem(STORAGE_KEYS.promo)
    const storedProfile = localStorage.getItem(STORAGE_KEYS.profile)
    if (storedStats) setStats(JSON.parse(storedStats))
    if (storedFav) setFavorites(JSON.parse(storedFav))
    if (storedPromo) setRedeemed(JSON.parse(storedPromo))
    if (storedProfile) setProfileForm((prev) => ({ ...prev, ...JSON.parse(storedProfile) }))
  }, [])

  const totalTests = stats.length
  const lastTestDate = useMemo(() => {
    if (!stats.length) return null
    return stats[stats.length - 1].date
  }, [stats])

  const handleRemoveFavorite = (id: number) => {
    const updated = favorites.filter((f) => f.id !== id)
    setFavorites(updated)
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(updated))
  }

  const handleRedeem = () => {
    const code = promoInput.trim().toUpperCase()
    if (!code) return

    if (!PROMO_CODES[code]) {
      setPromoMessage({ type: 'err', text: 'Промокод не найден' })
      return
    }
    if (redeemed.some((r) => r.code === code)) {
      setPromoMessage({ type: 'err', text: 'Промокод уже активирован' })
      return
    }

    const entry: RedeemedCode = {
      code,
      redeemedAt: new Date().toISOString(),
      benefit: PROMO_CODES[code]
    }
    const updated = [...redeemed, entry]
    setRedeemed(updated)
    localStorage.setItem(STORAGE_KEYS.promo, JSON.stringify(updated))
    setPromoInput('')
    setPromoMessage({ type: 'ok', text: `Активировано: ${PROMO_CODES[code]}` })
  }

  const handleAvatarChange = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setProfileForm((p) => ({ ...p, avatar: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = () => {
    const payload = { name: profileForm.name || user?.name || '', avatar: profileForm.avatar }
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(payload))
  }

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
            <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Личный кабинет</span>
          </div>
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
            На главную
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-3 gap-6">
          <section className={`lg:col-span-2 rounded-2xl shadow p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Статистика тестов</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Пройдено тестов</div>
                <div className="text-3xl font-bold text-blue-700">{totalTests}</div>
              </div>
              <div className={`p-4 rounded-xl ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
                <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Последний тест</div>
                <div className="text-lg font-semibold text-green-700">
                  {lastTestDate ? new Date(lastTestDate).toLocaleString('ru-RU') : '—'}
                </div>
              </div>
              <div className={`p-4 rounded-xl ${isDark ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
                <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Среднее совпадение</div>
                <div className="text-3xl font-bold text-purple-700">
                  {stats.length
                    ? Math.round(
                        stats.reduce((acc, s) => acc + (s.matchesCount || 0), 0) / stats.length
                      )
                    : 0}
                  %
                </div>
              </div>
            </div>
            <div className="mt-6">
              <h3 className={`font-semibold mb-3 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>История</h3>
              {stats.length === 0 ? (
                <div className={isDark ? 'text-slate-400' : 'text-gray-500'}>Пока нет данных. Пройдите тест.</div>
              ) : (
                <div className="space-y-2">
                  {stats
                    .slice()
                    .reverse()
                    .map((s, idx) => (
                      <div key={idx} className={`flex justify-between items-center rounded-lg px-4 py-2 ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                        <span className={isDark ? 'text-slate-200' : 'text-gray-700'}>
                          {new Date(s.date).toLocaleString('ru-RU')}
                        </span>
                        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Совпадений: {s.matchesCount}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </section>

          <section className={`rounded-2xl shadow p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Промокоды</h2>
            <div className="space-y-3">
              <input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Введите промокод"
                className={`w-full border rounded-lg px-3 py-2 ${
                  isDark ? 'bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-400' : 'bg-white border-gray-300'
                }`}
              />
              <button
                onClick={handleRedeem}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Активировать
              </button>
              {promoMessage && (
                <div
                  className={`text-sm px-3 py-2 rounded-lg ${
                    promoMessage.type === 'ok' 
                      ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700' 
                      : isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {promoMessage.text}
                </div>
              )}
              <div className={`border-t pt-3 ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Доступные промокоды</h3>
                <ul className={`space-y-1 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  {Object.entries(PROMO_CODES).map(([code, benefit]) => (
                    <li key={code} className="flex justify-between">
                      <span className={`font-mono ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>{code}</span>
                      <span className={isDark ? 'text-slate-500' : 'text-gray-500'}>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {redeemed.length > 0 && (
                <div className={`border-t pt-3 ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                  <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Активированные</h3>
                  <ul className={`space-y-1 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    {redeemed.map((r) => (
                      <li key={r.code} className="flex justify-between">
                        <span className={`font-mono ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>{r.code}</span>
                        <span className={isDark ? 'text-slate-500' : 'text-gray-500'}>{new Date(r.redeemedAt).toLocaleDateString('ru-RU')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className={`mt-8 rounded-2xl shadow p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Профиль</h2>
          <div className="grid md:grid-cols-2 gap-4 items-center">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Имя</label>
              <input
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2 ${
                  isDark ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-gray-300'
                }`}
                placeholder="Ваше имя"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center overflow-hidden">
                {profileForm.avatar ? (
                  <img src={profileForm.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-lg">
                    {(profileForm.name || user?.name || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <label className="cursor-pointer text-blue-600 hover:underline text-sm">
                Загрузить аватар
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarChange(e.target.files?.[0])}
                />
              </label>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleSaveProfile}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Сохранить профиль (локально)
            </button>
            <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Изменения сохраняются в этом браузере. Для синхронизации с сервером нужно добавить соответствующий API.
            </p>
          </div>
        </section>

        <section className={`mt-8 rounded-2xl shadow p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Избранные курсы</h2>
            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Хранится на этом устройстве</span>
          </div>
          {favorites.length === 0 ? (
            <div className={isDark ? 'text-slate-400' : 'text-gray-500'}>Пока нет избранных курсов. Добавьте их из результатов подбора.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {favorites.map((course) => (
                <div key={course.id} className={`border rounded-xl p-4 flex flex-col gap-3 ${isDark ? 'border-slate-700 bg-slate-700' : 'border-gray-200 bg-gray-50'}`}>
                  <div>
                    <div className="text-sm text-blue-600">{course.provider}</div>
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{course.title}</h3>
                    {course.description && <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{course.description}</p>}
                  </div>
                  <div className={`flex items-center justify-between text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    <span>Профессия: {course.professionId}</span>
                    <a href={course.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Открыть
                    </a>
                  </div>
                  <button
                    onClick={() => handleRemoveFavorite(course.id)}
                    className="self-start text-red-600 hover:text-red-700 text-sm"
                  >
                    Удалить из избранного
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
