-- ============================================================================
-- PARTIE 5 : Vue et commentaires
-- ============================================================================
-- Exécutez cette partie en dernier
-- ============================================================================

-- Vue pour faciliter les requêtes de messages
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

-- Commentaires pour la documentation
COMMENT ON TABLE chat_messages IS 'Messages de chat entre utilisateurs et formateurs/admins';
COMMENT ON COLUMN chat_messages.recipient_id IS 'NULL signifie que le message est destiné à tous les admins/formateurs';
COMMENT ON COLUMN chat_messages.read_at IS 'Timestamp de lecture du message (NULL = non lu)';
COMMENT ON FUNCTION get_chat_conversations IS 'Retourne la liste des conversations avec le dernier message et le nombre de messages non lus';

