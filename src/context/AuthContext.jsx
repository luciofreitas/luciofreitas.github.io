import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null
      setUser(sessionUser)
      setLoading(false)

      // Verifica destino OAuth ao carregar a sessão (cobre INITIAL_SESSION)
      if (sessionUser) {
        const dest = localStorage.getItem('oauth_dest')
        if (dest) {
          localStorage.removeItem('oauth_dest')
          window.location.href = dest
        }
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      // Cobre SIGNED_IN caso getSession não tenha capturado
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
