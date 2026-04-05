import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export function useAuth() {
  const { user, session, loading, initialized } = useAuthStore()
  const { setUser, setSession, setLoading, setInitialized, clear } = useAuthStore()

  const initialize = useCallback(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setLoading(false)
      setInitialized(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setSession, setLoading, setInitialized])

  const signUp = useCallback(async (email: string, password: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    return { error }
  }, [setLoading])

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    return { error }
  }, [setLoading])

  const signInWithMagicLink = useCallback(async (email: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    setLoading(false)
    return { error }
  }, [setLoading])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    clear()
  }, [clear])

  return {
    user,
    session,
    loading,
    initialized,
    initialize,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
  }
}
