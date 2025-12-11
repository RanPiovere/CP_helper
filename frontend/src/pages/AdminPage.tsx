import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { adminApi, api, PartnerCourse, News, CustomTest, Profession, CreateCourseRequest, CreateQuestionRequest } from '../services/api'

type AdminTab = 'courses' | 'news' | 'tests'

export default function AdminPage() {
  const { user, isViewingAsAdmin, toggleViewMode, isAdmin, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<AdminTab>('courses')
  const [courses, setCourses] = useState<PartnerCourse[]>([])
  const [news, setNews] = useState<News[]>([])
  const [tests, setTests] = useState<CustomTest[]>([])
  const [professions, setProfessions] = useState<Profession[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  const [showCourseForm, setShowCourseForm] = useState(false)
  const [showNewsForm, setShowNewsForm] = useState(false)
  const [showTestForm, setShowTestForm] = useState(false)

  const [courseForm, setCourseForm] = useState<CreateCourseRequest>({
    professionId: 0,
    title: '',
    description: '',
    url: '',
    provider: ''
  })

  const [newsForm, setNewsForm] = useState<{ title: string; content: string }>({
    title: '',
    content: ''
  })

  const [testForm, setTestForm] = useState<{
    title: string
    description: string
    questions: CreateQuestionRequest[]
  }>({
    title: '',
    description: '',
    questions: [{ text: '', options: ['', '', '', ''], correctOptionIndex: 0 }]
  })

  useEffect(() => {
    if (user && isViewingAsAdmin) {
      loadData()
    }
  }, [user, isViewingAsAdmin])

  const loadData = async () => {
    setDataLoading(true)
    try {
      const [coursesData, newsData, testsData, professionsData] = await Promise.all([
        adminApi.getCourses(),
        adminApi.getNews(),
        adminApi.getTestsAdmin(),
        api.getProfessions()
      ])
      setCourses(coursesData)
      setNews(newsData)
      setTests(testsData)
      setProfessions(professionsData)
    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const newCourse = await adminApi.createCourse(courseForm)
      setCourses([newCourse, ...courses])
      setShowCourseForm(false)
      setCourseForm({ professionId: 0, title: '', description: '', url: '', provider: '' })
    } catch (error) {
      console.error('Failed to create course:', error)
    }
  }

  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm('Удалить курс?')) return
    try {
      await adminApi.deleteCourse(courseId)
      setCourses(courses.filter(c => c.id !== courseId))
    } catch (error) {
      console.error('Failed to delete course:', error)
    }
  }

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const newNews = await adminApi.createNews(newsForm)
      setNews([newNews, ...news])
      setShowNewsForm(false)
      setNewsForm({ title: '', content: '' })
    } catch (error) {
      console.error('Failed to create news:', error)
    }
  }

  const handleDeleteNews = async (newsId: number) => {
    if (!confirm('Удалить новость?')) return
    try {
      await adminApi.deleteNews(newsId)
      setNews(news.filter(n => n.id !== newsId))
    } catch (error) {
      console.error('Failed to delete news:', error)
    }
  }

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const newTest = await adminApi.createTest(testForm)
      setTests([newTest, ...tests])
      setShowTestForm(false)
      setTestForm({
        title: '',
        description: '',
        questions: [{ text: '', options: ['', '', '', ''], correctOptionIndex: 0 }]
      })
    } catch (error) {
      console.error('Failed to create test:', error)
    }
  }

  const handleDeleteTest = async (testId: number) => {
    if (!confirm('Удалить тест?')) return
    try {
      await adminApi.deleteTest(testId)
      setTests(tests.filter(t => t.id !== testId))
    } catch (error) {
      console.error('Failed to delete test:', error)
    }
  }

  const handleToggleTestActive = async (testId: number, currentActive: boolean) => {
    try {
      await adminApi.toggleTestActive(testId, !currentActive)
      setTests(tests.map(t => t.id === testId ? { ...t, isActive: !currentActive } : t))
    } catch (error) {
      console.error('Failed to toggle test:', error)
    }
  }

  const addQuestion = () => {
    setTestForm({
      ...testForm,
      questions: [...testForm.questions, { text: '', options: ['', '', '', ''], correctOptionIndex: 0 }]
    })
  }

  const updateQuestion = (index: number, field: string, value: string | number) => {
    const newQuestions = [...testForm.questions]
    if (field === 'text') {
      newQuestions[index].text = value as string
    } else if (field === 'correctOptionIndex') {
      newQuestions[index].correctOptionIndex = value as number
    }
    setTestForm({ ...testForm, questions: newQuestions })
  }

  const updateQuestionOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...testForm.questions]
    newQuestions[qIndex].options[oIndex] = value
    setTestForm({ ...testForm, questions: newQuestions })
  }

  const removeQuestion = (index: number) => {
    if (testForm.questions.length <= 1) return
    const newQuestions = testForm.questions.filter((_, i) => i !== index)
    setTestForm({ ...testForm, questions: newQuestions })
  }

  const getProfessionName = (professionId: number) => {
    const profession = professions.find(p => p.id === professionId)
    return profession?.name || 'Неизвестно'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isViewingAsAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                CM
              </div>
              <span className="font-semibold text-gray-900">CareerMatch</span>
            </Link>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600 font-medium">Панель администратора</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Режим:</span>
              <button
                onClick={toggleViewMode}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  isViewingAsAdmin
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {isViewingAsAdmin ? 'Админ' : 'Гость'}
              </button>
            </div>
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              На главную
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'courses'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Курсы партнёров
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'news'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Новости
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'tests'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Тесты
          </button>
        </div>

        {activeTab === 'courses' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Курсы партнёров</h2>
              <button
                onClick={() => setShowCourseForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Добавить курс
              </button>
            </div>

            {showCourseForm && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Новый курс</h3>
                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Профессия</label>
                    <select
                      value={courseForm.professionId}
                      onChange={(e) => setCourseForm({ ...courseForm, professionId: parseInt(e.target.value) })}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    >
                      <option value={0}>Выберите профессию</option>
                      {professions.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Название курса</label>
                    <input
                      type="text"
                      value={courseForm.title}
                      onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                    <textarea
                      value={courseForm.description}
                      onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка</label>
                    <input
                      type="url"
                      value={courseForm.url}
                      onChange={(e) => setCourseForm({ ...courseForm, url: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Провайдер</label>
                    <input
                      type="text"
                      value={courseForm.provider}
                      onChange={(e) => setCourseForm({ ...courseForm, provider: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                      Создать
                    </button>
                    <button type="button" onClick={() => setShowCourseForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid gap-4">
              {courses.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                  Нет добавленных курсов
                </div>
              ) : (
                courses.map(course => (
                  <div key={course.id} className="bg-white rounded-xl shadow-sm p-6 flex justify-between items-start">
                    <div>
                      <div className="text-sm text-blue-600 mb-1">{getProfessionName(course.professionId)}</div>
                      <h3 className="font-semibold text-gray-900">{course.title}</h3>
                      {course.description && <p className="text-gray-600 text-sm mt-1">{course.description}</p>}
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>{course.provider}</span>
                        <a href={course.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Открыть курс
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Удалить
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'news' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Новости</h2>
              <button
                onClick={() => setShowNewsForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Добавить новость
              </button>
            </div>

            {showNewsForm && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Новая новость</h3>
                <form onSubmit={handleCreateNews} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок</label>
                    <input
                      type="text"
                      value={newsForm.title}
                      onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Содержание</label>
                    <textarea
                      value={newsForm.content}
                      onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      rows={6}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                      Опубликовать
                    </button>
                    <button type="button" onClick={() => setShowNewsForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid gap-4">
              {news.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                  Нет новостей
                </div>
              ) : (
                news.map(item => (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{item.title}</h3>
                        <p className="text-gray-600 mt-2 whitespace-pre-wrap">{item.content}</p>
                        <div className="text-sm text-gray-500 mt-3">
                          {item.authorName} • {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteNews(item.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'tests' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Тесты</h2>
              <button
                onClick={() => setShowTestForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Создать тест
              </button>
            </div>

            {showTestForm && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Новый тест</h3>
                <form onSubmit={handleCreateTest} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Название теста</label>
                    <input
                      type="text"
                      value={testForm.title}
                      onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                    <textarea
                      value={testForm.description}
                      onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium text-gray-700">Вопросы</label>
                      <button type="button" onClick={addQuestion} className="text-blue-600 text-sm hover:underline">
                        + Добавить вопрос
                      </button>
                    </div>
                    
                    {testForm.questions.map((q, qIndex) => (
                      <div key={qIndex} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Вопрос {qIndex + 1}</span>
                          {testForm.questions.length > 1 && (
                            <button type="button" onClick={() => removeQuestion(qIndex)} className="text-red-600 text-sm">
                              Удалить
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={q.text}
                          onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                          placeholder="Текст вопроса"
                          className="w-full border rounded-lg px-3 py-2"
                          required
                        />
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${qIndex}`}
                                checked={q.correctOptionIndex === oIndex}
                                onChange={() => updateQuestion(qIndex, 'correctOptionIndex', oIndex)}
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => updateQuestionOption(qIndex, oIndex, e.target.value)}
                                placeholder={`Вариант ${oIndex + 1}`}
                                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                                required
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                      Создать тест
                    </button>
                    <button type="button" onClick={() => setShowTestForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid gap-4">
              {tests.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                  Нет созданных тестов
                </div>
              ) : (
                tests.map(test => (
                  <div key={test.id} className="bg-white rounded-xl shadow-sm p-6 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{test.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${test.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {test.isActive ? 'Активен' : 'Неактивен'}
                        </span>
                      </div>
                      {test.description && <p className="text-gray-600 text-sm mt-1">{test.description}</p>}
                      <div className="text-sm text-gray-500 mt-2">
                        Создан: {new Date(test.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleTestActive(test.id, test.isActive)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        {test.isActive ? 'Деактивировать' : 'Активировать'}
                      </button>
                      <button
                        onClick={() => handleDeleteTest(test.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
