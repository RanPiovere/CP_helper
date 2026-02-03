import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { blogApi, BlogPost, CreateBlogRequest } from '../services/api'

const BLOG_CATEGORIES = [
  {
    id: 'lifestyle',
    name: 'Личный опыт / Лайфстайл',
    color: 'from-pink-500 to-rose-500',
    bgLight: 'bg-pink-50',
    bgDark: 'bg-pink-900/30',
    textColor: 'text-pink-600',
    subcategories: ['Путешествия', 'Еда и кулинария', 'Здоровье и фитнес', 'Личные истории / дневники', 'Саморазвитие и мотивация']
  },
  {
    id: 'education',
    name: 'Образование / Обучение',
    color: 'from-blue-500 to-cyan-500',
    bgLight: 'bg-blue-50',
    bgDark: 'bg-blue-900/30',
    textColor: 'text-blue-600',
    subcategories: ['Образовательные статьи', 'Советы студентам и школьникам', 'Онлайн-курсы и обучение', 'Наука и исследования']
  },
  {
    id: 'tech',
    name: 'Технологии и IT',
    color: 'from-violet-500 to-purple-500',
    bgLight: 'bg-violet-50',
    bgDark: 'bg-violet-900/30',
    textColor: 'text-violet-600',
    subcategories: ['Новости технологий', 'Обзоры гаджетов', 'Программирование и разработка', 'AI и машинное обучение', 'Игры и гейминг']
  },
  {
    id: 'business',
    name: 'Бизнес и финансы',
    color: 'from-emerald-500 to-green-500',
    bgLight: 'bg-emerald-50',
    bgDark: 'bg-emerald-900/30',
    textColor: 'text-emerald-600',
    subcategories: ['Предпринимательство', 'Инвестиции и финансы', 'Маркетинг и SMM', 'Карьера и работа']
  },
  {
    id: 'culture',
    name: 'Культура и искусство',
    color: 'from-amber-500 to-orange-500',
    bgLight: 'bg-amber-50',
    bgDark: 'bg-amber-900/30',
    textColor: 'text-amber-600',
    subcategories: ['Книги и литература', 'Кино и сериалы', 'Музыка', 'Живопись и дизайн']
  },
  {
    id: 'society',
    name: 'Общество и политика',
    color: 'from-slate-500 to-gray-500',
    bgLight: 'bg-slate-50',
    bgDark: 'bg-slate-700/30',
    textColor: 'text-slate-600',
    subcategories: ['Социальные вопросы', 'Мнения и аналитика', 'Новости страны и мира']
  },
  {
    id: 'entertainment',
    name: 'Развлечения',
    color: 'from-fuchsia-500 to-pink-500',
    bgLight: 'bg-fuchsia-50',
    bgDark: 'bg-fuchsia-900/30',
    textColor: 'text-fuchsia-600',
    subcategories: ['Юмор и мемы', 'Хобби и творчество', 'Путеводители']
  },
  {
    id: 'sports',
    name: 'Спорт',
    color: 'from-red-500 to-orange-500',
    bgLight: 'bg-red-50',
    bgDark: 'bg-red-900/30',
    textColor: 'text-red-600',
    subcategories: ['Новости спорта', 'Обзоры матчей', 'Фитнес и тренировки']
  },
  {
    id: 'tips',
    name: 'Тематические подборки / Советы',
    color: 'from-teal-500 to-cyan-500',
    bgLight: 'bg-teal-50',
    bgDark: 'bg-teal-900/30',
    textColor: 'text-teal-600',
    subcategories: ['How-to статьи (инструкции, руководства)', 'Лайфхаки', 'Рецензии и обзоры']
  }
]

function getCategoryStyle(categoryId: string) {
  return BLOG_CATEGORIES.find(c => c.id === categoryId) || BLOG_CATEGORIES[0]
}

export default function BlogsPage() {
  const { user, loading, logout, isAdmin, isViewingAsAdmin, toggleViewMode } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [blogsOpen, setBlogsOpen] = useState(true)
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [blogsLoading, setBlogsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null)
  
  const [formData, setFormData] = useState<CreateBlogRequest>({
    title: '',
    content: '',
    category: '',
    subcategory: '',
    authorName: ''
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedCategory = searchParams.get('category') || ''
  const isDark = theme === 'dark'

  const navItems = [
    { to: '/', label: 'Главная' },
    { to: '/news', label: 'Новости' },
    { to: '/blogs', label: 'Блоги' },
    { to: '/tests', label: 'Тесты' },
    ...(isViewingAsAdmin ? [{ to: '/admin', label: 'Админ-панель' }] : [])
  ]

  useEffect(() => {
    loadBlogs()
  }, [selectedCategory])

  const loadBlogs = async () => {
    setBlogsLoading(true)
    try {
      const data = await blogApi.getBlogs(selectedCategory || undefined)
      setBlogs(data)
    } catch (err) {
      console.error('Error loading blogs:', err)
    } finally {
      setBlogsLoading(false)
    }
  }

  const handleCategorySelect = (categoryId: string) => {
    if (categoryId === selectedCategory) {
      setSearchParams({})
    } else {
      setSearchParams({ category: categoryId })
    }
  }

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.content || !formData.category || !formData.subcategory) {
      setError('Заполните все обязательные поля')
      return
    }
    
    setCreateLoading(true)
    setError('')
    try {
      await blogApi.createBlog({
        ...formData,
        authorName: formData.authorName || undefined
      })
      setShowCreateForm(false)
      setFormData({ title: '', content: '', category: '', subcategory: '', authorName: '' })
      loadBlogs()
    } catch (err) {
      setError('Ошибка при создании блога')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleDeleteBlog = async (blogId: number) => {
    if (!confirm('Удалить этот блог?')) return
    try {
      await blogApi.deleteBlog(blogId)
      setSelectedBlog(null)
      loadBlogs()
    } catch (err) {
      console.error('Error deleting blog:', err)
    }
  }

  const selectedCategoryData = formData.category ? getCategoryStyle(formData.category) : null

  const displayName = user?.name || ''
  const avatarFallback = displayName ? displayName[0]?.toUpperCase() : 'U'

  const filteredBlogs = useMemo(() => {
    if (!selectedCategory) return blogs
    return blogs.filter(b => b.category === selectedCategory)
  }, [blogs, selectedCategory])

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
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                item.to === '/blogs'
                  ? isDark ? 'bg-slate-700 text-white' : 'bg-blue-50 text-blue-700'
                  : isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-700 hover:bg-blue-50'
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          
          <div className={`mt-4 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
            <button
              type="button"
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${
                isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-700 hover:bg-blue-50'
              }`}
              onClick={() => setBlogsOpen(o => !o)}
            >
              <span className="font-medium">Категории блогов</span>
              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{blogsOpen ? '▲' : '▼'}</span>
            </button>
            {blogsOpen && (
              <div className="ml-2 mt-2 space-y-1">
                {BLOG_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { handleCategorySelect(cat.id); setSidebarOpen(false) }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedCategory === cat.id
                        ? `bg-gradient-to-r ${cat.color} text-white shadow-md`
                        : isDark
                          ? `${cat.bgDark} ${cat.textColor} hover:brightness-110`
                          : `${cat.bgLight} ${cat.textColor} hover:brightness-95`
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${cat.color}`}></div>
                    <span className="truncate">{cat.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>
      </aside>

      <header className={`sticky top-0 z-10 backdrop-blur shadow-sm ${isDark ? 'bg-slate-800/80' : 'bg-white/80'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              className={`p-2 rounded-lg border lg:hidden ${
                isDark ? 'border-slate-600 bg-slate-700' : 'border-gray-200 bg-white'
              }`}
              onClick={() => setSidebarOpen(true)}
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
                isDark ? 'border-slate-600 bg-slate-700' : 'border-gray-200 bg-white'
              }`}
            >
              <span className="theme-toggle-icon">{isDark ? '🌙' : '☀️'}</span>
            </button>
            {loading ? (
              <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setAccountMenuOpen(o => !o)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                    isDark ? 'border-slate-600 bg-slate-700' : 'border-gray-200 bg-white'
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
                    <Link to="/account" className={`block px-4 py-2 text-sm ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => setAccountMenuOpen(false)}>Личный кабинет</Link>
                    <Link to="/settings" className={`block px-4 py-2 text-sm ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => setAccountMenuOpen(false)}>Настройки</Link>
                    {isAdmin && (
                      <button onClick={() => { toggleViewMode(); setAccountMenuOpen(false) }} className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                        Режим: {isViewingAsAdmin ? 'Админ' : 'Гость'}
                      </button>
                    )}
                    <button onClick={() => { logout(); setAccountMenuOpen(false) }} className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'text-red-400 hover:bg-slate-700' : 'text-red-600 hover:bg-gray-50'}`}>Выйти</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className={`px-4 py-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Войти</Link>
                <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Регистрация</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 lg:pl-80">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Блоги
            </h1>
            <p className={`mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              Делитесь опытом и читайте интересные статьи
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Написать блог
          </button>
        </div>

        {selectedCategory && (
          <div className="mb-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${getCategoryStyle(selectedCategory).color} text-white`}>
              <span>{getCategoryStyle(selectedCategory).name}</span>
              <button onClick={() => setSearchParams({})} className="hover:bg-white/20 rounded-full p-1">✕</button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {BLOG_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`p-4 rounded-xl transition-all transform hover:scale-105 ${
                selectedCategory === cat.id
                  ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                  : isDark
                    ? `${cat.bgDark} border border-slate-700 hover:border-transparent hover:bg-gradient-to-r hover:${cat.color}`
                    : `${cat.bgLight} border border-transparent hover:shadow-md`
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${cat.color}`}></div>
                <span className={`font-medium ${selectedCategory !== cat.id && (isDark ? cat.textColor : cat.textColor)}`}>
                  {cat.name}
                </span>
              </div>
            </button>
          ))}
        </div>

        {blogsLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            <div className="text-6xl mb-4">📝</div>
            <p className="text-xl">Пока нет блогов</p>
            <p className="mt-2">Будьте первым, кто напишет!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.map(blog => {
              const catStyle = getCategoryStyle(blog.category)
              return (
                <article
                  key={blog.id}
                  onClick={() => setSelectedBlog(blog)}
                  className={`cursor-pointer rounded-xl overflow-hidden transition-all hover:shadow-xl hover:scale-[1.02] ${
                    isDark ? 'bg-slate-800' : 'bg-white'
                  }`}
                >
                  <div className={`h-2 bg-gradient-to-r ${catStyle.color}`}></div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${isDark ? catStyle.bgDark : catStyle.bgLight} ${catStyle.textColor}`}>
                        {catStyle.name}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                        {blog.subcategory}
                      </span>
                    </div>
                    <h3 className={`text-lg font-bold mb-2 line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {blog.title}
                    </h3>
                    <p className={`text-sm line-clamp-3 mb-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                      {blog.content}
                    </p>
                    <div className={`flex items-center justify-between text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                      <span>{blog.authorName}</span>
                      <span>{new Date(blog.createdAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`sticky top-0 px-6 py-4 border-b flex items-center justify-between ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Создать блог</h2>
              <button onClick={() => setShowCreateForm(false)} className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>✕</button>
            </div>
            <form onSubmit={handleCreateBlog} className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
              )}
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Категория *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {BLOG_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.id, subcategory: '' })}
                      className={`p-2 rounded-lg text-xs text-left transition-all ${
                        formData.category === cat.id
                          ? `bg-gradient-to-r ${cat.color} text-white`
                          : isDark ? `${cat.bgDark} ${cat.textColor}` : `${cat.bgLight} ${cat.textColor}`
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {selectedCategoryData && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Подкатегория *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategoryData.subcategories.map(sub => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setFormData({ ...formData, subcategory: sub })}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                          formData.subcategory === sub
                            ? `bg-gradient-to-r ${selectedCategoryData.color} text-white`
                            : isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Заголовок *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                  placeholder="Введите заголовок..."
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Содержание *
                </label>
                <textarea
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  className={`w-full px-4 py-3 rounded-lg border resize-none ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                  placeholder="Напишите ваш блог..."
                />
              </div>

              {!user && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Ваше имя (необязательно)
                  </label>
                  <input
                    type="text"
                    value={formData.authorName || ''}
                    onChange={e => setFormData({ ...formData, authorName: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                    placeholder="Гость"
                  />
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className={`flex-1 py-3 rounded-lg border ${isDark ? 'border-slate-600 text-slate-300' : 'border-gray-300 text-gray-700'}`}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
                >
                  {createLoading ? 'Создание...' : 'Опубликовать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedBlog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`h-3 bg-gradient-to-r ${getCategoryStyle(selectedBlog.category).color}`}></div>
            <div className={`sticky top-0 px-6 py-4 border-b flex items-center justify-between ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <span className={`text-sm px-3 py-1 rounded-full ${isDark ? getCategoryStyle(selectedBlog.category).bgDark : getCategoryStyle(selectedBlog.category).bgLight} ${getCategoryStyle(selectedBlog.category).textColor}`}>
                  {getCategoryStyle(selectedBlog.category).name}
                </span>
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{selectedBlog.subcategory}</span>
              </div>
              <div className="flex items-center gap-2">
                {isViewingAsAdmin && (
                  <button
                    onClick={() => handleDeleteBlog(selectedBlog.id)}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                  >
                    Удалить
                  </button>
                )}
                <button onClick={() => setSelectedBlog(null)} className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>✕</button>
              </div>
            </div>
            <div className="p-6">
              <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedBlog.title}</h2>
              <div className={`flex items-center gap-4 mb-6 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                <span>Автор: {selectedBlog.authorName}</span>
                <span>{new Date(selectedBlog.createdAt).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''}`}>
                <p className={`whitespace-pre-wrap leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  {selectedBlog.content}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className={`border-t py-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className={`max-w-7xl mx-auto px-4 text-center ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          <p>&copy; 2024 CareerMatch. Помогаем найти призвание.</p>
        </div>
      </footer>
    </div>
  )
}
