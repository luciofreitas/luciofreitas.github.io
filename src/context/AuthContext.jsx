import { createContext, useContext, useState } from 'react'

const USUARIOS = {
  luan: 'dibrownie',
  admin: 'admin123',
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => localStorage.getItem('erp_user') || null)
  const [showTour, setShowTour] = useState(false)

  function login(username, password) {
    const u = username.trim().toLowerCase()
    if (USUARIOS[u] === password) {
      setUser(u)
      localStorage.setItem('erp_user', u)
      const tourFeito = localStorage.getItem(`erp_tour_${u}`)
      if (!tourFeito) setShowTour(true)
      return true
    }
    return false
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('erp_user')
  }

  function finishTour() {
    localStorage.setItem(`erp_tour_${user}`, '1')
    setShowTour(false)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, showTour, finishTour }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
