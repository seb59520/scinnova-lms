# Guide d'intégration du Chat WebSocket dans le LMS

Ce guide explique comment intégrer la fonctionnalité de chat en temps réel dans votre LMS pour permettre aux utilisateurs de communiquer avec les formateurs et administrateurs.

## 📋 Vue d'ensemble

Le système de chat utilise :
- **Supabase Realtime** pour les mises à jour en temps réel (WebSocket)
- **React** pour l'interface utilisateur
- **Row Level Security (RLS)** pour la sécurité des données

## 🚀 Installation

### Étape 1 : Créer la table dans Supabase

Exécutez le script SQL dans l'interface SQL de Supabase :

```bash
# Ouvrez le fichier creer-table-chat-messages.sql
# Copiez son contenu
# Exécutez-le dans l'interface SQL de Supabase
```

Ce script crée :
- La table `chat_messages` pour stocker les messages
- Les index pour améliorer les performances
- Les politiques RLS pour la sécurité
- Une fonction `get_chat_conversations` pour lister les conversations
- Une vue `chat_messages_with_profiles` pour faciliter les requêtes

### Étape 2 : Vérifier les fichiers créés

Les fichiers suivants ont été créés :
- ✅ `src/hooks/useChat.ts` - Hook React pour gérer les messages
- ✅ `src/components/ChatWidget.tsx` - Composant widget de chat
- ✅ `src/pages/Chat.tsx` - Page dédiée au chat
- ✅ `creer-table-chat-messages.sql` - Script SQL

### Étape 3 : Vérifier l'intégration dans App.tsx

Le `ChatWidget` a été ajouté dans `App.tsx` pour être disponible partout dans l'application. Vérifiez que les imports sont corrects :

```typescript
import { ChatWidget } from './components/ChatWidget'
import { Chat } from './pages/Chat'
```

Et que le widget est rendu :
```typescript
<ChatWidget />
```

## 🎯 Fonctionnalités

### Pour les étudiants

- **Bouton flottant** : Un bouton de chat apparaît en bas à droite de l'écran
- **Envoi de messages** : Les étudiants peuvent envoyer des messages aux formateurs/admins
- **Messages en temps réel** : Les nouveaux messages apparaissent instantanément
- **Notifications** : Badge avec le nombre de messages non lus
- **Page dédiée** : Accès via `/chat` pour une vue complète

### Pour les formateurs/admins

- **Liste des conversations** : Voir tous les étudiants qui ont envoyé des messages
- **Messages groupés** : Les messages sans destinataire spécifique sont visibles par tous les admins
- **Compteur de non lus** : Voir le nombre de messages non lus par conversation
- **Réponses** : Répondre directement aux étudiants

## 🔒 Sécurité (RLS)

Les politiques de sécurité Row Level Security (RLS) sont configurées pour :

1. **Lecture** :
   - Les utilisateurs voient leurs propres messages
   - Les admins/formateurs voient tous les messages
   - Les utilisateurs voient les messages qu'ils ont reçus

2. **Écriture** :
   - Les utilisateurs peuvent créer des messages
   - Les utilisateurs peuvent mettre à jour leurs propres messages
   - Les destinataires peuvent marquer les messages comme lus

## 📱 Utilisation

### Pour les étudiants

1. Cliquez sur le bouton de chat en bas à droite
2. Tapez votre message
3. Cliquez sur "Envoyer" ou appuyez sur Entrée
4. Vos messages et les réponses apparaissent en temps réel

### Pour les formateurs/admins

1. Cliquez sur le bouton de chat
2. Cliquez sur l'icône utilisateur pour voir la liste des conversations
3. Sélectionnez une conversation
4. Répondez aux messages des étudiants

## 🎨 Personnalisation

### Modifier les couleurs

Dans `ChatWidget.tsx`, modifiez les classes Tailwind :

```tsx
// En-tête
className="bg-gradient-to-r from-blue-600 to-purple-600"

// Messages envoyés
className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"

// Bouton flottant
className="bg-gradient-to-r from-blue-600 to-purple-600"
```

### Modifier la taille du widget

Dans `ChatWidget.tsx` :

```tsx
// Taille par défaut
className="h-[600px] w-96"  // Hauteur 600px, largeur 384px (w-96)

// Taille minimisée
className="h-16 w-80"  // Hauteur 64px, largeur 320px (w-80)
```

### Désactiver le widget sur certaines pages

Dans `App.tsx`, vous pouvez conditionner l'affichage :

```tsx
import { useLocation } from 'react-router-dom'

function App() {
  const location = useLocation()
  const showChat = !location.pathname.startsWith('/admin')
  
  return (
    // ...
    {showChat && <ChatWidget />}
  )
}
```

## 🔧 Configuration Supabase Realtime

Assurez-vous que Realtime est activé dans Supabase :

1. Allez dans **Project Settings** > **API**
2. Vérifiez que **Realtime** est activé
3. Dans **Database** > **Replication**, activez la réplication pour la table `chat_messages`

Ou via SQL :

```sql
-- Activer la réplication pour chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
```

## 📊 Requêtes utiles

### Voir toutes les conversations d'un utilisateur

```sql
SELECT * FROM get_chat_conversations('user-id-here');
```

### Compter les messages non lus

```sql
SELECT COUNT(*) 
FROM chat_messages 
WHERE recipient_id = 'user-id-here' 
  AND read_at IS NULL;
```

### Voir les messages récents

```sql
SELECT * 
FROM chat_messages_with_profiles 
ORDER BY created_at DESC 
LIMIT 50;
```

## 🐛 Dépannage

### Le widget n'apparaît pas

1. Vérifiez que `ChatWidget` est importé et rendu dans `App.tsx`
2. Vérifiez la console du navigateur pour les erreurs
3. Vérifiez que l'utilisateur est connecté

### Les messages ne s'affichent pas en temps réel

1. Vérifiez que Realtime est activé dans Supabase
2. Vérifiez que la réplication est activée pour `chat_messages`
3. Vérifiez la console pour les erreurs de connexion WebSocket

### Erreurs de permissions

1. Vérifiez que les politiques RLS sont correctement configurées
2. Vérifiez que l'utilisateur a bien un profil dans la table `profiles`
3. Vérifiez les logs Supabase pour les erreurs de sécurité

### Le compteur de non lus ne se met pas à jour

1. Vérifiez que la fonction `get_chat_conversations` est créée
2. Vérifiez que le hook `useChat` appelle `fetchConversations`
3. Vérifiez que `markAsRead` est appelé correctement

## 🚀 Améliorations futures

- [ ] Support des fichiers (images, documents)
- [ ] Notifications push
- [ ] Historique de conversation avec pagination
- [ ] Recherche dans les messages
- [ ] Messages épinglés
- [ ] Réactions aux messages (emoji)
- [ ] Statut de lecture (vu/lecture)
- [ ] Indicateur de frappe ("... est en train d'écrire")

## 📝 Notes importantes

- Les messages sont stockés indéfiniment dans Supabase
- Les messages avec `recipient_id = NULL` sont destinés à tous les admins/formateurs
- Le système utilise Supabase Realtime qui est basé sur WebSocket
- Les messages sont automatiquement marqués comme lus quand la conversation est ouverte

## 🔗 Ressources

- [Documentation Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [React Hooks](https://react.dev/reference/react)


