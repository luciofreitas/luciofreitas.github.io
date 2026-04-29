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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      // Redireciona para o destino guardado antes do OAuth
      if (_event === 'SIGNED_IN') {
        const dest = localStorage.getItem('oauth_dest')
        if (dest) {
          localStorage.removeItem('oauth_dest')
          window.location.href = dest
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = () => {
    localStorage.setItem('oauth_dest', window.location.origin + '/portal')
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/' },
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
