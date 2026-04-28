import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Zap } from 'lucide-react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Homologacao from './pages/Homologacao'
import './index.css'

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const toggle = () => setDark((d) => !d)

  return (
    <BrowserRouter>
      <Navbar dark={dark} onToggleDark={toggle} />
      {/* Botão raio fixo no canto superior direito */}
      <button
        onClick={toggle}
        aria-label="Alternar modo escuro"
        className="fixed top-3 right-4 z-[9999] transition-all duration-200 hover:scale-110"
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
        <Route path="/homologacao" element={<Homologacao />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}
