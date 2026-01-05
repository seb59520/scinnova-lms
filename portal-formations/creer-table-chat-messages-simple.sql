-- ============================================================================
-- Version simplifiée - Script complet en une seule exécution
-- ============================================================================
-- Si les parties séparées ne fonctionnent pas, essayez cette version simplifiée
-- ============================================================================

-- Table des messages de chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'file')),
  file_url TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient ON chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Fonction pour updated_at
CREATE OR REPLACE FUNCTION update_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON chat_messages;
CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_messages_updated_at();

-- RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DROP POLICY IF EXISTS "Users can view their own messages" ON chat_messages;
CREATE POLICY "Users can view their own messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Admins can view all messages" ON chat_messages;
CREATE POLICY "Admins can view all messages"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

DROP POLICY IF EXISTS "Users can create messages" ON chat_messages;
CREATE POLICY "Users can create messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Recipients can mark as read" ON chat_messages;
CREATE POLICY "Recipients can mark as read"
  ON chat_messages FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Fonction simplifiée pour les conversations (sans sous-requêtes complexes)
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
  SELECT DISTINCT
    COALESCE(
      CASE WHEN cm.sender_id = user_id THEN cm.recipient_id ELSE cm.sender_id END,
      '00000000-0000-0000-0000-000000000000'::UUID
    ) as interlocutor_id,
    COALESCE(p.full_name, 'Utilisateur supprimé') as interlocutor_name,
    COALESCE(p.role::TEXT, 'student') as interlocutor_role,
    (
      SELECT content 
      FROM chat_messages cm2
      WHERE (
        (cm2.sender_id = user_id AND cm2.recipient_id = COALESCE(
          CASE WHEN cm.sender_id = user_id THEN cm.recipient_id ELSE cm.sender_id END,
          '00000000-0000-0000-0000-000000000000'::UUID
        ))
        OR (cm2.recipient_id = user_id AND cm2.sender_id = COALESCE(
          CASE WHEN cm.sender_id = user_id THEN cm.recipient_id ELSE cm.sender_id END,
          '00000000-0000-0000-0000-000000000000'::UUID
        ))
      )
      ORDER BY cm2.created_at DESC 
      LIMIT 1
    ) as last_message_content,
    MAX(cm.created_at) OVER (PARTITION BY COALESCE(
      CASE WHEN cm.sender_id = user_id THEN cm.recipient_id ELSE cm.sender_id END,
      '00000000-0000-0000-0000-000000000000'::UUID
    )) as last_message_at,
    (
      SELECT COUNT(*)::BIGINT
      FROM chat_messages cm3
      WHERE cm3.recipient_id = user_id 
        AND cm3.sender_id = COALESCE(
          CASE WHEN cm.sender_id = user_id THEN cm.recipient_id ELSE cm.sender_id END,
          '00000000-0000-0000-0000-000000000000'::UUID
        )
        AND cm3.read_at IS NULL
    ) as unread_count
  FROM chat_messages cm
  LEFT JOIN profiles p ON p.id = COALESCE(
    CASE WHEN cm.sender_id = user_id THEN cm.recipient_id ELSE cm.sender_id END,
    '00000000-0000-0000-0000-000000000000'::UUID
  )
  WHERE cm.sender_id = user_id OR cm.recipient_id = user_id
     OR (cm.recipient_id IS NULL AND EXISTS (
       SELECT 1 FROM profiles 
       WHERE profiles.id = user_id 
       AND profiles.role IN ('admin', 'instructor')
     ))
  ORDER BY last_message_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vue simple
CREATE OR REPLACE VIEW chat_messages_with_profiles AS
SELECT 
  cm.*,
  sender.full_name as sender_name,
  sender.role as sender_role,
  recipient.full_name as recipient_name,
  recipient.role as recipient_role
FROM chat_messages cm
LEFT JOIN profiles sender ON sender.id = cm.sender_id
LEFT JOIN profiles recipient ON recipient.id = cm.recipient_id;

