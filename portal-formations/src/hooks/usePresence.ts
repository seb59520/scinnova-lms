import { useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function usePresence() {
  // Marquer l'utilisateur comme en ligne
  const setOnline = useCallback(async () => {
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData?.user) return

      await supabase.rpc('set_user_online', {
        user_uuid: authData.user.id
      })
    } catch (error) {
      console.error('Erreur lors de la mise en ligne:', error)
    }
  }, [])

  // Marquer l'utilisateur comme hors ligne
  const setOffline = useCallback(async () => {
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData?.user) return

      await supabase.rpc('set_user_offline', {
        user_uuid: authData.user.id
      })
    } catch (error) {
      console.error('Erreur lors de la mise hors ligne:', error)
    }
  }, [])

  // Mettre à jour last_seen périodiquement
  useEffect(() => {
    setOnline() // Marquer comme en ligne au montage

    // Mettre à jour la présence toutes les 30 secondes
    const interval = setInterval(() => {
      setOnline()
    }, 30000)

    // Gérer la visibilité de la page
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline()
      } else {
        setOnline()
      }
    }

    // Gérer la fermeture de la page
    const handleBeforeUnload = () => {
      setOffline()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      setOffline() // Marquer comme hors ligne au démontage
    }
  }, [setOnline, setOffline])

  return { setOnline, setOffline }
}

