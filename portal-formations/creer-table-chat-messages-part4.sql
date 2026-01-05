-- ============================================================================
-- PARTIE 4 : Fonction simplifiée pour obtenir les conversations
-- ============================================================================
-- Exécutez cette partie après la partie 3
-- ============================================================================

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS get_chat_conversations(UUID);

-- Fonction simplifiée pour obtenir les conversations
CREATE OR REPLACE FUNCTION get_chat_conversations(user_id UUID)
RETURNS TABLE (
  interlocutor_id UUID,
  interlocutor_name TEXT,
  interlocutor_role TEXT,
  last_message_content TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH all_conversations AS (
    -- Messages envoyés par l'utilisateur
    SELECT DISTINCT
      COALESCE(cm.recipient_id, '00000000-0000-0000-0000-000000000000'::UUID) as interlocutor_id,
      MAX(cm.created_at) OVER (PARTITION BY COALESCE(cm.recipient_id, '00000000-0000-0000-0000-000000000000'::UUID)) as last_message_at
    FROM chat_messages cm
    WHERE cm.sender_id = user_id
    
    UNION
    
    -- Messages reçus par l'utilisateur
    SELECT DISTINCT
      cm.sender_id as interlocutor_id,
      MAX(cm.created_at) OVER (PARTITION BY cm.sender_id) as last_message_at
    FROM chat_messages cm
    WHERE cm.recipient_id = user_id
       OR (cm.recipient_id IS NULL AND EXISTS (
         SELECT 1 FROM profiles 
         WHERE profiles.id = user_id 
         AND profiles.role IN ('admin', 'instructor')
       ))
  )
  SELECT 
    ac.interlocutor_id,
    COALESCE(p.full_name, 'Utilisateur supprimé') as interlocutor_name,
    COALESCE(p.role::TEXT, 'student') as interlocutor_role,
    (
      SELECT cm.content 
      FROM chat_messages cm
      WHERE (
        (cm.sender_id = user_id AND cm.recipient_id = ac.interlocutor_id)
        OR (cm.recipient_id = user_id AND cm.sender_id = ac.interlocutor_id)
        OR (cm.recipient_id IS NULL AND cm.sender_id = ac.interlocutor_id AND EXISTS (
          SELECT 1 FROM profiles WHERE profiles.id = user_id AND profiles.role IN ('admin', 'instructor')
        ))
      )
      ORDER BY cm.created_at DESC 
      LIMIT 1
    ) as last_message_content,
    ac.last_message_at,
    (
      SELECT COUNT(*)::BIGINT
      FROM chat_messages cm
      WHERE cm.recipient_id = user_id 
        AND cm.sender_id = ac.interlocutor_id
        AND cm.read_at IS NULL
    ) as unread_count
  FROM all_conversations ac
  LEFT JOIN profiles p ON p.id = ac.interlocutor_id
  ORDER BY ac.last_message_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

