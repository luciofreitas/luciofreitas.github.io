import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      // Após OAuth redirecionar para a raiz, manda para o portal
      if (event === 'SIGNED_IN' && window.location.pathname === '/') {
        window.location.replace('/portal')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Se já estiver logado com e-mail/senha → vincula o Google à conta existente
  // Se não estiver logado → inicia o fluxo OAuth normalmente
  const signInWithGoogle = () => {
    if (user) {
      return supabase.auth.linkIdentity({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
    }
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
