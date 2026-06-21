import { createContext, useContext, useState, useEffect } from 'react'
import api from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token')
      if (savedToken) {
        try {
          const res = await api.get('/auth/me')
          setUser(res.data)
          setToken(savedToken)
        } catch {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setToken(null)
          setUser(null)
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password })
    const { access_token } = res.data
    localStorage.setItem('token', access_token)
    setToken(access_token)
    // Fetch user details immediately using the new token
    const meRes = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    })
    setUser(meRes.data)
    return res.data
  }

  const register = async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password })
    const { access_token } = res.data
    localStorage.setItem('token', access_token)
    setToken(access_token)
    // Fetch user details immediately using the new token
    const meRes = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    })
    setUser(meRes.data)
    return res.data
  }

  const adminLogin = async (username, password) => {
    const res = await api.post('/auth/admin/login', { username, password })
    const { access_token } = res.data
    localStorage.setItem('token', access_token)
    setToken(access_token)
    // Fetch user details immediately using the new token
    const meRes = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    })
    setUser(meRes.data)
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  const isAuthenticated = !!token && !!user
  const isAdmin = isAuthenticated && user?.role === 'admin'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#6366f1] border-t-transparent"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ token, user, login, register, adminLogin, logout, isAuthenticated, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
