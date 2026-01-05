-- ============================================================================
-- Table pour les messages de chat du LMS
-- ============================================================================
-- Cette table permet aux utilisateurs de communiquer avec les formateurs/admins
-- via un système de chat en temps réel utilisant Supabase Realtime
-- ============================================================================

-- Table des messages de chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  -- Si recipient_id est NULL, le message est pour tous les admins/formateurs
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'file')),
  file_url TEXT, -- URL du fichier si message_type = 'file'
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient ON chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON chat_messages(recipient_id, read_at) WHERE read_at IS NULL;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_messages_updated_at();

-- ============================================================================
-- RLS (Row Level Security) - Politiques de sécurité
-- ============================================================================

-- Activer RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir leurs propres messages
CREATE POLICY "Users can view their own messages"
  ON chat_messages
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Politique : Les admins/formateurs peuvent voir tous les messages
CREATE POLICY "Admins and instructors can view all messages"
  ON chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Politique : Les utilisateurs peuvent créer des messages
CREATE POLICY "Users can create messages"
  ON chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Politique : Les utilisateurs peuvent mettre à jour leurs propres messages (non lus)
CREATE POLICY "Users can update their own messages"
  ON chat_messages
  FOR UPDATE
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- Politique : Les destinataires peuvent marquer les messages comme lus
CREATE POLICY "Recipients can mark messages as read"
  ON chat_messages
  FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- ============================================================================
-- Fonction pour obtenir les conversations (liste des interlocuteurs)
-- ============================================================================

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
  WITH conversations AS (
    -- Messages envoyés par l'utilisateur
    SELECT 
      COALESCE(cm.recipient_id, '00000000-0000-0000-0000-000000000000'::UUID) as interlocutor_id,
      MAX(cm.created_at) as last_message_at
    FROM chat_messages cm
    WHERE cm.sender_id = user_id
    GROUP BY cm.recipient_id
    
    UNION
    
    -- Messages reçus par l'utilisateur
    SELECT 
      cm.sender_id as interlocutor_id,
      MAX(cm.created_at) as last_message_at
    FROM chat_messages cm
    WHERE cm.recipient_id = user_id OR (cm.recipient_id IS NULL AND EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = user_id AND profiles.role IN ('admin', 'instructor')
    ))
    GROUP BY cm.sender_id
  )
  SELECT DISTINCT
    c.interlocutor_id,
    COALESCE(p.full_name, 'Utilisateur supprimé') as interlocutor_name,
    COALESCE(p.role::TEXT, 'student') as interlocutor_role,
    (
      SELECT content 
      FROM chat_messages 
      WHERE (sender_id = user_id AND recipient_id = c.interlocutor_id)
         OR (recipient_id = user_id AND sender_id = c.interlocutor_id)
         OR (recipient_id IS NULL AND sender_id = c.interlocutor_id AND EXISTS (
           SELECT 1 FROM profiles WHERE profiles.id = user_id AND profiles.role IN ('admin', 'instructor')
         ))
      ORDER BY created_at DESC 
      LIMIT 1
    ) as last_message_content,
    c.last_message_at,
    (
      SELECT COUNT(*) 
      FROM chat_messages 
      WHERE recipient_id = user_id 
        AND sender_id = c.interlocutor_id
        AND read_at IS NULL
    ) as unread_count
  FROM conversations c
  LEFT JOIN profiles p ON p.id = c.interlocutor_id
  ORDER BY c.last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Vue pour faciliter les requêtes de messages
-- ============================================================================

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

-- ============================================================================
-- Commentaires pour la documentation
-- ============================================================================

COMMENT ON TABLE chat_messages IS 'Messages de chat entre utilisateurs et formateurs/admins';
COMMENT ON COLUMN chat_messages.recipient_id IS 'NULL signifie que le message est destiné à tous les admins/formateurs';
COMMENT ON COLUMN chat_messages.read_at IS 'Timestamp de lecture du message (NULL = non lu)';
COMMENT ON FUNCTION get_chat_conversations IS 'Retourne la liste des conversations avec le dernier message et le nombre de messages non lus';

