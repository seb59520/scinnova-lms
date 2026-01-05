# Installation du Chat avec Recherche et État de Connexion

## 📋 Fonctionnalités ajoutées

✅ **Recherche d'étudiants** : Barre de recherche pour filtrer les conversations  
✅ **État de connexion** : Indicateur visuel (en ligne/hors ligne)  
✅ **Temps de dernière connexion** : Affichage du temps écoulé depuis la dernière connexion  
✅ **Mise à jour en temps réel** : Les statuts se mettent à jour automatiquement via WebSocket

## 🚀 Installation

### Étape 1 : Créer la table de présence

Exécutez le script SQL dans Supabase :

```sql
-- Fichier : creer-table-user-presence.sql
```

Ce script crée :
- Table `user_presence` pour tracker l'état de connexion
- Fonctions `set_user_online()` et `set_user_offline()`
- Politiques RLS pour la sécurité

### Étape 2 : Activer Realtime pour user_presence

Dans Supabase, allez dans **Database** > **Replication** et activez la réplication pour :
- ✅ `chat_messages` (déjà fait)
- ✅ `user_presence` (nouveau)

Ou via SQL :

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
```

### Étape 3 : Vérifier les fichiers

Les fichiers suivants ont été créés/modifiés :
- ✅ `creer-table-user-presence.sql` - Script SQL pour la table de présence
- ✅ `src/hooks/usePresence.ts` - Hook pour gérer la présence
- ✅ `src/hooks/useChat.ts` - Enrichi avec les statuts de présence
- ✅ `src/components/ChatWidget.tsx` - Ajout de la recherche et des indicateurs

## 🎯 Utilisation

### Pour les admins/formateurs

1. **Ouvrir le chat** : Cliquez sur le bouton de chat (en bas à droite)

2. **Voir les conversations** : Cliquez sur l'icône utilisateur dans l'en-tête

3. **Rechercher un étudiant** :
   - Utilisez la barre de recherche en haut de la liste
   - Recherche par nom ou par contenu de message
   - Les résultats se filtrent en temps réel

4. **Voir l'état de connexion** :
   - 🟢 **Point vert** = En ligne
   - **"Il y a X min/h/j"** = Hors ligne (dernière connexion)

5. **Sélectionner une conversation** : Cliquez sur un étudiant dans la liste

6. **Envoyer un message** : Tapez et envoyez votre réponse

## 🔧 Fonctionnement technique

### Tracking de présence

Le système met à jour automatiquement votre statut :
- **En ligne** : Quand vous êtes sur la page
- **Hors ligne** : Quand vous quittez la page ou fermez l'onglet
- **Mise à jour** : Toutes les 30 secondes pour maintenir le statut

### Recherche

La recherche filtre les conversations par :
- Nom de l'étudiant
- Contenu du dernier message

### Mise à jour en temps réel

Les statuts de connexion se mettent à jour automatiquement via Supabase Realtime (WebSocket) :
- Quand un étudiant se connecte → statut passe à "en ligne"
- Quand un étudiant se déconnecte → statut passe à "hors ligne" avec timestamp

## 📊 Indicateurs visuels

### En ligne
- Point vert à côté du nom
- Statut mis à jour instantanément

### Hors ligne
- Pas de point vert
- Affichage du temps écoulé :
  - "Il y a 5 min" (moins d'1h)
  - "Il y a 2h" (moins de 24h)
  - "Il y a 3j" (moins d'1 semaine)
  - Date (plus d'1 semaine)

## 🐛 Dépannage

### Les statuts ne s'affichent pas

1. Vérifiez que la table `user_presence` existe
2. Vérifiez que Realtime est activé pour `user_presence`
3. Vérifiez la console pour les erreurs

### La recherche ne fonctionne pas

1. Vérifiez que les conversations se chargent correctement
2. Vérifiez la console pour les erreurs
3. Assurez-vous que le champ de recherche est visible

### Les statuts ne se mettent pas à jour

1. Vérifiez que Realtime est activé
2. Vérifiez que le hook `usePresence` est appelé
3. Vérifiez la console pour les erreurs de WebSocket

## ✅ Checklist d'installation

- [ ] Table `user_presence` créée
- [ ] Fonctions `set_user_online` et `set_user_offline` créées
- [ ] Realtime activé pour `user_presence`
- [ ] Hook `usePresence` intégré dans `ChatWidget`
- [ ] Recherche fonctionnelle
- [ ] Indicateurs de présence visibles
- [ ] Mise à jour en temps réel fonctionnelle

## 🎨 Personnalisation

### Modifier les couleurs des indicateurs

Dans `ChatWidget.tsx`, modifiez :

```tsx
// Point vert pour en ligne
className="w-2 h-2 bg-green-500 rounded-full"

// Vous pouvez changer la couleur :
className="w-2 h-2 bg-blue-500 rounded-full" // Bleu
className="w-2 h-2 bg-emerald-500 rounded-full" // Vert émeraude
```

### Modifier l'intervalle de mise à jour

Dans `usePresence.ts`, modifiez :

```typescript
// Actuellement : 30 secondes
const interval = setInterval(() => {
  setOnline()
}, 30000) // Changez 30000 pour modifier l'intervalle (en ms)
```

