import { useState, useEffect, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { adminApi, CustomTest, TestWithQuestions } from '../services/api'

export default function TestsPage() {
  const { user, loading: authLoading, logout, isAdmin, isViewingAsAdmin, toggleViewMode } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [tests, setTests] = useState<CustomTest[]>([])
  const [selectedTest, setSelectedTest] = useState<TestWithQuestions | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)
  const [testsLoading, setTestsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('Все')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [testsOpen, setTestsOpen] = useState(false)

  const isDark = theme === 'dark'

  const RIASEC_CATEGORIES: { label: string; description: string }[] = [
    {
      label: 'Реалистичный (Практический)',
      description: 'Работы с техникой, руками, в лаборатории, строительстве. Примеры: инженер, механик, врач-хирург, строитель.'
    },
    {
      label: 'Исследовательский (Интеллектуальный)',
      description: 'Анализ, наука, исследования, IT. Примеры: ученый, аналитик, программист, биолог.'
    },
    {
      label: 'Артистический (Творческий)',
      description: 'Креатив, дизайн, искусство, музыка. Примеры: дизайнер, художник, актер, музыкант.'
    },
    {
      label: 'Социальный (Коммуникабельный)',
      description: 'Помощь людям, преподавание, медицина. Примеры: педагог, психолог, медсестра, социальный работник.'
    },
    {
      label: 'Предпринимательский (Лидерский)',
      description: 'Управление, бизнес, продажи, организация. Примеры: менеджер, предприниматель, юрист.'
    },
    {
      label: 'Конвенциональный (Организаторский)',
      description: 'Работа с данными, документацией, офисные процессы. Примеры: бухгалтер, офис-менеджер, архивариус.'
    }
  ]

  const navItems = [
    { to: '/', label: 'Главная' },
    { to: '/news', label: 'Новости' },
    { to: '/blogs', label: 'Блоги' },
    {
      to: '/tests',
      label: 'Тесты',
      children: [
        { to: '/tests', label: 'Все тесты' },
        ...RIASEC_CATEGORIES.map((cat) => ({ to: `/tests?category=${encodeURIComponent(cat.label)}`, label: cat.label }))
      ]
    },
    ...(isViewingAsAdmin ? [{ to: '/admin', label: 'Админ-панель' }] : [])
  ]

  useEffect(() => {
    loadTests()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const cat = params.get('category')
    if (cat) setSelectedCategory(cat)
  }, [location.search])

  const loadTests = async () => {
    try {
      const testsData = await adminApi.getTests()
      setTests(testsData)
    } catch (error) {
      console.error('Failed to load tests:', error)
    } finally {
      setTestsLoading(false)
    }
  }

  const startTest = async (testId: number) => {
    try {
      const testData = await adminApi.getTestById(testId)
      setSelectedTest(testData)
      setCurrentQuestion(0)
      setAnswers(new Array(testData.questions.length).fill(-1))
      setShowResults(false)
    } catch (error) {
      console.error('Failed to load test:', error)
    }
  }

  const selectAnswer = (answerIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answerIndex
    setAnswers(newAnswers)
  }

  const nextQuestion = () => {
    if (selectedTest && currentQuestion < selectedTest.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const finishTest = () => {
    setShowResults(true)
  }

  const calculateScore = () => {
    if (!selectedTest) return { correct: 0, total: 0, percentage: 0 }
    let correct = 0
    selectedTest.questions.forEach((q, i) => {
      if (answers[i] === q.correctOptionIndex) {
        correct++
      }
    })
    return {
      correct,
      total: selectedTest.questions.length,
      percentage: Math.round((correct / selectedTest.questions.length) * 100)
    }
  }

  const resetTest = () => {
    setSelectedTest(null)
    setCurrentQuestion(0)
    setAnswers([])
    setShowResults(false)
  }

  const categories = useMemo(() => {
    const unique = new Set<string>()
    tests.forEach((t) => unique.add(t.category || 'Общее'))
    RIASEC_CATEGORIES.forEach((c) => unique.add(c.label))
    return ['Все', ...Array.from(unique)]
  }, [tests])

  const filteredTests = useMemo(() => {
    if (selectedCategory === 'Все') return tests
    return tests.filter((t) => (t.category || 'Общее') === selectedCategory)
  }, [tests, selectedCategory])

  const successText =
    selectedTest?.test.successMessage ||
    'Отличный результат! Вы набрали высокий балл. Продолжайте в том же духе.'

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
                    item.to === '/tests'
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
              {isDark ? '🌙' : '☀️'}
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

      <main className="max-w-5xl mx-auto px-4 py-8 lg:pl-80">
        {!selectedTest && (
          <>
            <div className="flex items-center justify-between mb-6 gap-3">
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Доступные тесты</h1>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  const val = e.target.value
                  navigate(val === 'Все' ? '/tests' : `/tests?category=${encodeURIComponent(val)}`)
                }}
                className={`px-3 py-2 border rounded-lg ${
                  isDark ? 'bg-slate-800 border-slate-600 text-slate-200' : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {testsLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : tests.length === 0 ? (
              <div className={`rounded-xl p-8 text-center ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-white text-gray-500'}`}>
                Пока нет доступных тестов
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredTests.map(test => (
                  <div key={test.id} className={`rounded-xl shadow-sm p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{test.title}</h3>
                        {test.description && <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{test.description}</p>}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                        {test.category || 'Общее'}
                      </span>
                    </div>
                    <button
                      onClick={() => startTest(test.id)}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Начать тест
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedCategory !== 'Все' && (
              <div className={`mt-6 rounded-xl shadow-sm p-4 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Описание категории</h3>
                <p className={isDark ? 'text-slate-300' : 'text-gray-700'}>
                  {RIASEC_CATEGORIES.find((c) => c.label === selectedCategory)?.description || 'Подкатегория тестов.'}
                </p>
              </div>
            )}
          </>
        )}

        {selectedTest && !showResults && (
          <div className={`rounded-xl shadow-sm p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedTest.test.title}</h2>
              <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>
                Вопрос {currentQuestion + 1} из {selectedTest.questions.length}
              </span>
            </div>

            <div className={`mb-4 rounded-full h-2 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestion + 1) / selectedTest.questions.length) * 100}%` }}
              ></div>
            </div>

            <div className="py-6">
              <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {selectedTest.questions[currentQuestion].text}
              </h3>
              <div className="space-y-3">
                {selectedTest.questions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => selectAnswer(index)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      answers[currentQuestion] === index
                        ? 'border-blue-600 bg-blue-50'
                        : isDark
                          ? 'border-slate-600 hover:border-slate-500 text-slate-200'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
                className={`px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark ? 'text-slate-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Назад
              </button>
              <div className="flex gap-2">
                <button
                  onClick={resetTest}
                  className={isDark ? 'px-4 py-2 text-slate-300 hover:text-white' : 'px-4 py-2 text-gray-600 hover:text-gray-900'}
                >
                  Выйти
                </button>
                {currentQuestion < selectedTest.questions.length - 1 ? (
                  <button
                    onClick={nextQuestion}
                    disabled={answers[currentQuestion] === -1}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Далее
                  </button>
                ) : (
                  <button
                    onClick={finishTest}
                    disabled={answers.some(a => a === -1)}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Завершить
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {showResults && selectedTest && (
          <div className={`rounded-xl shadow-sm p-6 text-center ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Результаты теста</h2>
            <p className={`text-xl mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{selectedTest.test.title}</p>

            <div className="my-8">
              <div className="text-6xl font-bold text-blue-600 mb-2">
                {calculateScore().percentage}%
              </div>
              <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                Правильных ответов: {calculateScore().correct} из {calculateScore().total}
              </p>
            </div>

            <div className="space-y-4 text-left mb-8">
              {selectedTest.questions.map((q, i) => (
                <div key={q.id} className={`p-4 rounded-lg ${
                  answers[i] === q.correctOptionIndex
                    ? isDark ? 'bg-green-900/30' : 'bg-green-50'
                    : isDark ? 'bg-red-900/30' : 'bg-red-50'
                }`}>
                  <p className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{q.text}</p>
                  <p className={`text-sm ${answers[i] === q.correctOptionIndex ? 'text-green-600' : 'text-red-600'}`}>
                    Ваш ответ: {q.options[answers[i]]}
                  </p>
                  {answers[i] !== q.correctOptionIndex && (
                    <p className="text-sm text-green-600">
                      Правильный ответ: {q.options[q.correctOptionIndex]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {calculateScore().percentage >= 70 && (
              <div className={`mb-6 border rounded-xl p-4 text-left ${
                isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-100'
              }`}>
                <h3 className="text-lg font-semibold text-green-700 mb-1">Отличный результат!</h3>
                <p className={isDark ? 'text-slate-300' : 'text-gray-700'}>{successText}</p>
              </div>
            )}

            <div className="flex justify-center gap-4">
              <button
                onClick={resetTest}
                className={`px-6 py-2 rounded-lg ${isDark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                К списку тестов
              </button>
              <button
                onClick={() => startTest(selectedTest.test.id)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Пройти ещё раз
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
