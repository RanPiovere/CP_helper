import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const { refreshUser } = useAuth()
  const { theme } = useTheme()

  const isDark = theme === 'dark'

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('Токен подтверждения не найден')
      return
    }

    verifyEmail(token)
  }, [searchParams])

  const verifyEmail = async (token: string) => {
    try {
      const response = await authApi.verifyEmail(token)
      setStatus('success')
      setMessage(response.message)
      await refreshUser()
    } catch (err: any) {
      setStatus('error')
      setMessage(err.response?.data?.error || 'Ошибка при подтверждении email')
    }
  }

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <header className={`shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">CM</span>
            </div>
            <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>CareerMatch</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className={`rounded-xl shadow-lg p-8 text-center ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            {status === 'loading' && (
              <>
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Подтверждение email...
                </h1>
                <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                  Пожалуйста, подождите
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-green-900/30' : 'bg-green-100'}`}>
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Email подтверждён!
                </h1>
                <p className={`mb-6 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  {message}
                </p>
                <Link
                  to="/"
                  className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Перейти на главную
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-red-900/30' : 'bg-red-100'}`}>
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Ошибка подтверждения
                </h1>
                <p className={`mb-6 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  {message}
                </p>
                <Link
                  to="/login"
                  className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Войти в аккаунт
                </Link>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
