import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, UserResponse } from '../services/api'

interface AuthContextType {
  user: UserResponse | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  googleLogin: (idToken: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  toggleViewMode: () => Promise<void>
  isAdmin: boolean
  isViewingAsAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    
    try {
      const userData = await authApi.me()
      setUser(userData)
    } catch (error) {
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    localStorage.setItem('token', response.token)
    setUser(response.user)
  }

  const register = async (email: string, password: string, name: string) => {
    const response = await authApi.register(email, password, name)
    localStorage.setItem('token', response.token)
    setUser(response.user)
  }

  const googleLogin = async (idToken: string) => {
    const response = await authApi.googleAuth(idToken)
    localStorage.setItem('token', response.token)
    setUser(response.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const toggleViewMode = async () => {
    if (!user || user.role !== 'admin') return
    try {
      const updatedUser = await authApi.toggleViewMode(!user.isViewingAsGuest)
      setUser(updatedUser)
    } catch (error) {
      console.error('Failed to toggle view mode:', error)
    }
  }

  const isAdmin = user?.role === 'admin'
  const isViewingAsAdmin = isAdmin && !user?.isViewingAsGuest

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout, refreshUser, toggleViewMode, isAdmin, isViewingAsAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
