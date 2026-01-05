import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface ChatMessage {
  id: string
  sender_id: string
  recipient_id: string | null
  content: string
  message_type: 'text' | 'system' | 'file'
  file_url: string | null
  read_at: string | null
  created_at: string
  sender_name?: string
  sender_role?: string
  recipient_name?: string
  recipient_role?: string
}

export interface ChatConversation {
  interlocutor_id: string
  interlocutor_name: string
  interlocutor_role: string
  last_message_content: string | null
  last_message_at: string | null
  unread_count: number
  is_online?: boolean
  last_seen?: string | null
}

export function useChat(recipientId: string | null = null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Récupérer les messages
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true)
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData?.user) return
      const user = authData.user

      let query = supabase
        .from('chat_messages')
        .select(`
          *,
          sender:profiles!chat_messages_sender_id_fkey(full_name, role),
          recipient:profiles!chat_messages_recipient_id_fkey(full_name, role)
        `)
        .order('created_at', { ascending: true })

      if (recipientId) {
        // Conversation avec un utilisateur spécifique
        query = query.or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
      } else {
        // Messages pour les admins/formateurs (recipient_id IS NULL ou messages reçus)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!profileError && (profile?.role === 'admin' || profile?.role === 'instructor')) {
          query = query.or(`recipient_id.is.null,recipient_id.eq.${user.id}`)
        } else {
          query = query.or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        }
      }

      const { data, error } = await query

      if (error) throw error

      const formattedMessages: ChatMessage[] = (data || []).map((msg: any) => ({
        id: msg.id,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        content: msg.content,
        message_type: msg.message_type,
        file_url: msg.file_url,
        read_at: msg.read_at,
        created_at: msg.created_at,
        sender_name: msg.sender?.full_name || 'Utilisateur',
        sender_role: msg.sender?.role || 'student',
        recipient_name: msg.recipient?.full_name,
        recipient_role: msg.recipient?.role,
      }))

      setMessages(formattedMessages)
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error)
    } finally {
      setLoading(false)
    }
  }, [recipientId])

  // Envoyer un message
  const sendMessage = useCallback(async (content: string, fileUrl?: string) => {
    try {
      setSending(true)
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData?.user) throw new Error('Utilisateur non connecté')
      const user = authData.user

      // Récupérer le profil de l'utilisateur pour afficher son nom et rôle
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

      // Vérifier que les étudiants ne peuvent envoyer des messages qu'aux admins
      if (recipientId && profile?.role === 'student') {
        const { data: recipientProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', recipientId)
          .single()

        if (!recipientProfile || recipientProfile.role !== 'admin') {
          throw new Error('Vous ne pouvez envoyer des messages qu\'aux administrateurs.')
        }
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content,
          message_type: fileUrl ? 'file' : 'text',
          file_url: fileUrl || null,
        })
        .select()
        .single()

      if (error) throw error

      // Ajouter le message localement pour un feedback immédiat
      const newMessage: ChatMessage = {
        ...data,
        sender_name: profile?.full_name || 'Vous',
        sender_role: (profile?.role as 'admin' | 'instructor' | 'student') || 'student',
      }
      setMessages(prev => [...prev, newMessage])

      return data
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
      throw error
    } finally {
      setSending(false)
    }
  }, [recipientId])

  // Marquer les messages comme lus
  const markAsRead = useCallback(async (messageIds: string[]) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData?.user) return
      const user = authData.user

      const { error } = await supabase
        .from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', messageIds)
        .eq('recipient_id', user.id)

      if (error) throw error

      // Mettre à jour localement
      setMessages(prev =>
        prev.map(msg =>
          messageIds.includes(msg.id) ? { ...msg, read_at: new Date().toISOString() } : msg
        )
      )
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error)
    }
  }, [])

  // Récupérer les conversations
  const fetchConversations = useCallback(async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData?.user) return
      const user = authData.user

      const { data, error } = await supabase.rpc('get_chat_conversations', {
        user_id: user.id
      })

      if (error) throw error

      // Récupérer les statuts de présence pour tous les interlocuteurs
      const interlocutorIds = (data || []).map(conv => conv.interlocutor_id).filter(id => id !== '00000000-0000-0000-0000-000000000000')
      
      let presenceMap: Record<string, { is_online: boolean; last_seen: string | null }> = {}
      if (interlocutorIds.length > 0) {
        const { data: presenceData } = await supabase
          .from('user_presence')
          .select('user_id, is_online, last_seen')
          .in('user_id', interlocutorIds)
        
        if (presenceData) {
          presenceMap = presenceData.reduce((acc, p) => {
            acc[p.user_id] = { is_online: p.is_online, last_seen: p.last_seen }
            return acc
          }, {} as Record<string, { is_online: boolean; last_seen: string | null }>)
        }
      }

      // Enrichir les conversations avec les statuts de présence
      const enrichedConversations = (data || []).map(conv => ({
        ...conv,
        is_online: presenceMap[conv.interlocutor_id]?.is_online || false,
        last_seen: presenceMap[conv.interlocutor_id]?.last_seen || null,
      }))

      setConversations(enrichedConversations)
      
      // Calculer le nombre total de messages non lus
      const totalUnread = enrichedConversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)
      setUnreadCount(totalUnread)
    } catch (error) {
      console.error('Erreur lors de la récupération des conversations:', error)
    }
  }, [])

  // Configurer l'écoute en temps réel
  useEffect(() => {
    let mounted = true
    let currentChannel: RealtimeChannel | null = null
    
    const setupRealtime = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData?.user || !mounted) return
      const user = authData.user

      // Se désabonner de l'ancien canal
      if (channel) {
        supabase.removeChannel(channel)
      }

      // Créer un nouveau canal pour écouter les nouveaux messages
      const newChannel = supabase
        .channel(`chat-messages-${user.id}-${recipientId || 'all'}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: recipientId
              ? `or(and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id}))`
              : `or(recipient_id.eq.${user.id},recipient_id.is.null)`,
          },
          (payload) => {
            if (!mounted) return
            
            // Récupérer les informations du sender
            supabase
              .from('profiles')
              .select('full_name, role')
              .eq('id', payload.new.sender_id)
              .single()
              .then(({ data: profile, error: profileError }) => {
                if (!mounted) return
                
                const newMessage: ChatMessage = {
                  ...(payload.new as any),
                  sender_name: profile?.full_name || 'Utilisateur',
                  sender_role: profile?.role || 'student',
                }
                setMessages(prev => [...prev, newMessage])
                
                // Marquer comme lu si c'est la conversation active
                if (recipientId === payload.new.sender_id || !recipientId) {
                  markAsRead([newMessage.id])
                }
              })
              .catch((error) => {
                console.error('Erreur lors de la récupération du profil:', error)
              })
          }
        )
        .subscribe()

      if (mounted) {
        currentChannel = newChannel
        setChannel(newChannel)
      }
    }

    setupRealtime()

    return () => {
      mounted = false
      if (currentChannel) {
        supabase.removeChannel(currentChannel)
      }
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [recipientId, markAsRead])

  // Charger les messages au montage et quand recipientId change
  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Charger les conversations
  useEffect(() => {
    fetchConversations()
    // Rafraîchir toutes les 60 secondes (réduit les rafraîchissements)
    const interval = setInterval(fetchConversations, 60000) // 60 secondes au lieu de 30
    return () => clearInterval(interval)
  }, [fetchConversations])

  // Écouter les changements de présence en temps réel (avec debounce)
  useEffect(() => {
    let mounted = true
    let debounceTimer: NodeJS.Timeout | null = null

    const setupPresenceListener = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData?.user || !mounted) return

      const presenceChannel = supabase
        .channel('user-presence')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_presence',
          },
          () => {
            if (!mounted) return
            // Debounce : attendre 2 secondes avant de rafraîchir (évite les rafraîchissements multiples)
            if (debounceTimer) {
              clearTimeout(debounceTimer)
            }
            debounceTimer = setTimeout(() => {
              if (mounted) {
                fetchConversations()
              }
            }, 2000) // 2 secondes de debounce
          }
        )
        .subscribe()

      return () => {
        if (debounceTimer) {
          clearTimeout(debounceTimer)
        }
        if (presenceChannel) {
          supabase.removeChannel(presenceChannel)
        }
      }
    }

    let cleanup: (() => void) | undefined
    setupPresenceListener().then((cleanupFn) => {
      cleanup = cleanupFn
    })

    return () => {
      mounted = false
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      if (cleanup) cleanup()
    }
  }, [fetchConversations])

  return {
    messages,
    conversations,
    loading,
    sending,
    unreadCount,
    sendMessage,
    markAsRead,
    fetchMessages,
    fetchConversations,
  }
}

