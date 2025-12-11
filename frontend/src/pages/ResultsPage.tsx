import { useLocation, Link } from 'react-router-dom'
import { useState, useMemo, useEffect } from 'react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { MatchResult, RiasecProfile, PartnerCourse, adminApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

interface LocationState {
  result: MatchResult
}

const RIASEC_LABELS: Record<string, string> = {
  realistic: 'Реалистичный',
  investigative: 'Исследовательский',
  artistic: 'Артистический',
  social: 'Социальный',
  enterprising: 'Предприимчивый',
  conventional: 'Конвенциональный'
}

export default function ResultsPage() {
  const location = useLocation()
  const state = location.state as LocationState | null
  const { user } = useAuth()
  
  const [sortBy, setSortBy] = useState<string>('match')
  const [filterWorkType, setFilterWorkType] = useState<string>('')
  const [compareIds, setCompareIds] = useState<number[]>([])
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [coursesByProfession, setCoursesByProfession] = useState<Record<number, PartnerCourse[]>>({})
  const [loadingCourses, setLoadingCourses] = useState<number | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<number[]>([])

  const loadCoursesForProfession = async (professionId: number) => {
    if (coursesByProfession[professionId]) return
    setLoadingCourses(professionId)
    try {
      const courses = await adminApi.getCoursesByProfession(professionId)
      setCoursesByProfession(prev => ({ ...prev, [professionId]: courses }))
    } catch (error) {
      console.error('Failed to load courses:', error)
      setCoursesByProfession(prev => ({ ...prev, [professionId]: [] }))
    } finally {
      setLoadingCourses(null)
    }
  }

  useEffect(() => {
    if (expandedId !== null) {
      loadCoursesForProfession(expandedId)
    }
  }, [expandedId])

  // Поддержка избранного и статистики тестов через localStorage
  useEffect(() => {
    const storedFav = localStorage.getItem('cm_favorite_courses')
    if (storedFav) {
      try {
        const parsed: PartnerCourse[] = JSON.parse(storedFav)
        setFavoriteIds(parsed.map((c) => c.id))
      } catch {
        /* ignore */
      }
    }
  }, [])

  useEffect(() => {
    if (state?.result) {
      const statsRaw = localStorage.getItem('cm_test_stats')
      const stats = statsRaw ? JSON.parse(statsRaw) : []
      stats.push({
        date: new Date().toISOString(),
        matchesCount: state.result.matches.length
      })
      localStorage.setItem('cm_test_stats', JSON.stringify(stats))
    }
  }, [state])

  const toggleFavorite = (course: PartnerCourse) => {
    const storedRaw = localStorage.getItem('cm_favorite_courses')
    const stored: PartnerCourse[] = storedRaw ? JSON.parse(storedRaw) : []
    const exists = stored.find((c) => c.id === course.id)
    let updated: PartnerCourse[]
    if (exists) {
      updated = stored.filter((c) => c.id !== course.id)
    } else {
      updated = [...stored, course]
    }
    localStorage.setItem('cm_favorite_courses', JSON.stringify(updated))
    setFavoriteIds(updated.map((c) => c.id))
  }

  if (!state?.result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Нет данных</h1>
          <Link to="/questionnaire" className="text-blue-600 hover:underline">
            Пройти тест заново
          </Link>
        </div>
      </div>
    )
  }

  const { userProfile, matches } = state.result

  const radarData = Object.entries(userProfile).map(([key, value]) => ({
    subject: RIASEC_LABELS[key] || key,
    value: Math.round(value),
    fullMark: 100
  }))

  const sortedMatches = useMemo(() => {
    let filtered = [...matches]
    
    if (filterWorkType) {
      filtered = filtered.filter(m => m.profession.workType === filterWorkType)
    }

    switch (sortBy) {
      case 'salary':
        return filtered.sort((a, b) => b.profession.avgSalary - a.profession.avgSalary)
      case 'demand':
        return filtered.sort((a, b) => b.profession.demandScore - a.profession.demandScore)
      default:
        return filtered.sort((a, b) => b.matchPercentage - a.matchPercentage)
    }
  }, [matches, sortBy, filterWorkType])

  const toggleCompare = (id: number) => {
    setCompareIds(prev => 
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : prev.length < 3 ? [...prev, id] : prev
    )
  }

  const compareData = useMemo(() => {
    const selected = matches.filter(m => compareIds.includes(m.profession.id))
    if (selected.length < 2) return null

    return Object.keys(RIASEC_LABELS).map(key => {
      const row: Record<string, string | number> = { name: RIASEC_LABELS[key] }
      selected.forEach(m => {
        row[m.profession.name] = Math.round(m.profession.riasecProfile[key as keyof RiasecProfile])
      })
      return row
    })
  }, [compareIds, matches])

  const workTypes = [...new Set(matches.map(m => m.profession.workType))]

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Результаты подбора</h1>
            <Link to="/" className="text-blue-600 hover:underline">На главную</Link>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Ваш RIASEC профиль</h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Профиль" dataKey="value" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {radarData.sort((a, b) => b.value - a.value).map(item => (
                <div key={item.subject} className="flex justify-between items-center">
                  <span className="text-gray-600">{item.subject}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-800 w-8">{item.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="match">По совпадению</option>
                    <option value="salary">По зарплате</option>
                    <option value="demand">По востребованности</option>
                  </select>
                  <select
                    value={filterWorkType}
                    onChange={(e) => setFilterWorkType(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Все типы работы</option>
                    {workTypes.map(wt => (
                      <option key={wt} value={wt}>{wt}</option>
                    ))}
                  </select>
                </div>
                <span className="text-gray-500">Найдено: {sortedMatches.length} профессий</span>
              </div>
            </div>

            <div className="space-y-4">
              {sortedMatches.map((match) => (
                <div 
                  key={match.profession.id} 
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{match.profession.name}</h3>
                      <p className="text-gray-500">{match.profession.educationRequired}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{match.matchPercentage.toFixed(0)}%</div>
                      <div className="text-sm text-gray-500">совпадение</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-semibold text-green-700">
                        {match.profession.avgSalary.toLocaleString('ru-RU')} ₽
                      </div>
                      <div className="text-xs text-green-600">средняя зарплата</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-semibold text-purple-700">
                        {match.profession.demandScore}%
                      </div>
                      <div className="text-xs text-purple-600">востребованность</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-semibold text-orange-700">
                        {match.profession.workType}
                      </div>
                      <div className="text-xs text-orange-600">тип работы</div>
                    </div>
                  </div>

                  {expandedId === match.profession.id && (
                    <div className="mb-4 pt-4 border-t">
                      <p className="text-gray-600 mb-3">{match.profession.description}</p>
                      <div>
                        <span className="text-sm font-semibold text-gray-700">Необходимые навыки:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {match.profession.skills.map(skill => (
                            <span key={skill} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">RIASEC совпадение:</span>
                          <span className="ml-2 font-semibold">{match.riasecMatch.toFixed(0)}%</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Навыки совпадение:</span>
                          <span className="ml-2 font-semibold">{match.skillsMatch.toFixed(0)}%</span>
                        </div>
                      </div>

                      {loadingCourses === match.profession.id ? (
                        <div className="mt-4 flex items-center text-gray-500">
                          <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mr-2"></div>
                          Загрузка курсов...
                        </div>
                      ) : coursesByProfession[match.profession.id]?.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            Рекомендуемые курсы:
                          </span>
                          <div className="mt-3 space-y-3">
                            {coursesByProfession[match.profession.id].map(course => (
                              <div
                                key={course.id}
                                className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <h4 className="font-semibold text-blue-800">{course.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                                    <span className="inline-block mt-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                      {course.provider}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <a
                                      href={course.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline text-sm"
                                    >
                                      Открыть
                                    </a>
                                    <button
                                      onClick={() => toggleFavorite(course)}
                                      className={`text-sm px-3 py-1 rounded-lg border ${
                                        favoriteIds.includes(course.id)
                                          ? 'border-green-200 text-green-700 bg-green-50'
                                          : 'border-gray-200 text-gray-700 hover:bg-gray-100'
                                      }`}
                                      disabled={!user}
                                      title={user ? '' : 'Войдите, чтобы добавить в избранное'}
                                    >
                                      {favoriteIds.includes(course.id) ? 'В избранном' : 'В избранное'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setExpandedId(expandedId === match.profession.id ? null : match.profession.id)}
                      className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                    >
                      {expandedId === match.profession.id ? 'Скрыть' : 'Подробнее'}
                    </button>
                    <button
                      onClick={() => toggleCompare(match.profession.id)}
                      className={`px-4 py-2 rounded-lg ${
                        compareIds.includes(match.profession.id)
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {compareIds.includes(match.profession.id) ? 'Выбрано' : 'Сравнить'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {compareData && compareIds.length >= 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Сравнение профессий</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={compareData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                {matches
                  .filter(m => compareIds.includes(m.profession.id))
                  .map((m, idx) => (
                    <Bar 
                      key={m.profession.id} 
                      dataKey={m.profession.name} 
                      fill={['#3b82f6', '#10b981', '#f59e0b'][idx]} 
                    />
                  ))
                }
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/questionnaire"
            className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            Пройти тест заново
          </Link>
        </div>
      </div>
    </div>
  )
}
