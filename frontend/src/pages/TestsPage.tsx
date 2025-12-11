import { useState, useEffect, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { adminApi, CustomTest, TestWithQuestions } from '../services/api'

export default function TestsPage() {
  const { isAdmin, isViewingAsAdmin } = useAuth()
  const { theme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [tests, setTests] = useState<CustomTest[]>([])
  const [selectedTest, setSelectedTest] = useState<TestWithQuestions | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('Все')

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
      setLoading(false)
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

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <header className={`shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                CM
              </div>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>CareerMatch</span>
            </Link>
            <span className={isDark ? 'text-slate-600' : 'text-gray-400'}>|</span>
            <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Тесты</span>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && isViewingAsAdmin && (
              <Link to="/admin" className="text-blue-600 hover:text-blue-700">
                Панель админа
              </Link>
            )}
            <Link to="/" className={isDark ? 'text-slate-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}>
              На главную
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
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
            
            {tests.length === 0 ? (
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
      </div>
    </div>
  )
}
