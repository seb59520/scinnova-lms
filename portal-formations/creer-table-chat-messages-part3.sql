-- ============================================================================
-- PARTIE 3 : Row Level Security (RLS)
-- ============================================================================
-- Exécutez cette partie après la partie 2
-- ============================================================================

-- Activer RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Admins and instructors can view all messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can create messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON chat_messages;

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

-- Politique : Les utilisateurs peuvent mettre à jour leurs propres messages
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

