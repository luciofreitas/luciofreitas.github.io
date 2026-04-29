import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Homologacao from './pages/Homologacao'
import Login from './pages/Login'
import Portal from './pages/Portal'
import './index.css'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

function AppContent() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const toggle = () => setDark((d) => !d)

  return (
    <>
      <Navbar dark={dark} onToggleDark={toggle} />
      {/* Botão raio fixo — canto inferior direito */}
      <button
        onClick={toggle}
        aria-label="Alternar modo escuro"
        className="fixed bottom-5 right-5 z-[9999] transition-all duration-200 hover:scale-110"
      >
        <Zap
          size={42}
          stroke="#facc15"
          fill={dark ? 'none' : '#facc15'}
          strokeWidth={1.5}
        />
      </button>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/portal" element={<ProtectedRoute><Portal /></ProtectedRoute>} />
        <Route path="/homologacao" element={<ProtectedRoute><Homologacao /></ProtectedRoute>} />
      </Routes>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}
