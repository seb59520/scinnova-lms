# Instructions d'installation du Chat - Résolution du timeout

Si vous rencontrez une erreur de timeout lors de l'exécution du script SQL, suivez ces instructions :

## 🔧 Solution 1 : Exécution par parties (Recommandé)

Exécutez les scripts dans l'ordre suivant, **un par un**, en attendant que chacun se termine :

### Étape 1 : Créer la table
```sql
-- Exécutez : creer-table-chat-messages-part1.sql
```
Attendez que la requête se termine avant de passer à l'étape suivante.

### Étape 2 : Créer le trigger
```sql
-- Exécutez : creer-table-chat-messages-part2.sql
```

### Étape 3 : Configurer RLS
```sql
-- Exécutez : creer-table-chat-messages-part3.sql
```

### Étape 4 : Créer la fonction
```sql
-- Exécutez : creer-table-chat-messages-part4.sql
```

### Étape 5 : Créer la vue
```sql
-- Exécutez : creer-table-chat-messages-part5.sql
```

## 🔧 Solution 2 : Version simplifiée

Si les parties séparées ne fonctionnent toujours pas, utilisez la version simplifiée :

```sql
-- Exécutez : creer-table-chat-messages-simple.sql
```

Cette version simplifie la fonction `get_chat_conversations` pour éviter les timeouts.

## 🔧 Solution 3 : Création manuelle minimale

Si tout échoue, créez uniquement les éléments essentiels :

```sql
-- 1. Table de base
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  file_url TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Index essentiels
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient ON chat_messages(recipient_id);

-- 3. RLS basique
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can mark as read"
  ON chat_messages FOR UPDATE
  USING (auth.uid() = recipient_id);
```

Vous pourrez ajouter la fonction `get_chat_conversations` plus tard si nécessaire.

## ⚠️ Problèmes courants

### Timeout persistant
- Vérifiez votre connexion internet
- Essayez d'exécuter les scripts pendant les heures creuses
- Réduisez la taille des scripts (utilisez la version simplifiée)

### Erreurs de permissions
- Assurez-vous d'être connecté avec un compte admin dans Supabase
- Vérifiez que vous avez les droits nécessaires sur la base de données

### Erreurs de syntaxe
- Vérifiez que vous copiez bien tout le script
- Assurez-vous qu'il n'y a pas de caractères invisibles

## ✅ Vérification après installation

Après avoir exécuté les scripts, vérifiez que tout fonctionne :

```sql
-- Vérifier que la table existe
SELECT * FROM chat_messages LIMIT 1;

-- Vérifier que RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'chat_messages';

-- Vérifier les politiques
SELECT * FROM pg_policies WHERE tablename = 'chat_messages';
```

## 🚀 Après l'installation

Une fois la table créée, n'oubliez pas de :

1. **Activer Realtime dans Supabase** :
   - Allez dans **Database** > **Replication**
   - Activez la réplication pour `chat_messages`

2. **Tester le chat** :
   - Connectez-vous en tant qu'étudiant
   - Cliquez sur le bouton de chat
   - Envoyez un message de test

