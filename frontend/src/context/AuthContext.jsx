import { createContext, useContext, useEffect, useState } from 'react'
import { endpoints } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ascend_user'))
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(Boolean(user))

  useEffect(() => {
    if (user) setLoading(false)
  }, [user])

  const login = async (email, password) => {
    const data = await endpoints.login({ email, password })
    localStorage.setItem('ascend_token', data.token)
    localStorage.setItem('ascend_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const register = async (email, password) => {
    const data = await endpoints.register({ email, password })
    localStorage.setItem('ascend_token', data.token)
    localStorage.setItem('ascend_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('ascend_token')
    localStorage.removeItem('ascend_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
