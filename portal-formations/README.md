# Portail Formations

Application web de formation en ligne avec React, Vite, TypeScript et Supabase.

## 🚀 Fonctionnalités

- **Authentification** : Email/password + OAuth Google/Apple
- **Gestion des formations** : CRUD complet avec modules et éléments
- **Types d'éléments** : Ressources, supports, exercices, TP, mini-jeux
- **Stockage** : Upload de fichiers via Supabase Storage
- **Administration** : Interface complète pour gérer le contenu
- **Préparation paiement** : Structure prête pour Stripe (formations payantes)

## 🛠️ Stack Technique

- **Frontend** : React 18 + Vite + TypeScript
- **UI** : TailwindCSS + Lucide Icons
- **Backend** : Supabase (Auth, DB, Storage)
- **Déploiement** : Netlify (SPA)
- **PDF** : react-pdf + pdfjs

## 📦 Installation

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd portal-formations
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration Supabase**
   - Créer un projet sur [supabase.com](https://supabase.com)
   - Copier le schéma SQL depuis `supabase-schema.sql`
   - Créer les buckets Storage :
     - `course-assets` (public)
     - `submissions` (privé)

4. **Variables d'environnement**
   ```bash
   cp .env.example .env
   ```

   Remplir `.env` :
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

5. **Configuration de l'API Gamma (optionnel)**
   
   Pour utiliser la génération de slides avec Gamma, vous devez :
   
   - Obtenir une clé API Gamma (nécessite un abonnement Pro ou supérieur)
   - Configurer la variable d'environnement dans Supabase :
     ```bash
     # Dans le dashboard Supabase, allez dans Settings > Edge Functions > Secrets
     # Ajoutez : GAMMA_API_KEY=votre_cle_api_gamma
     ```
   
   - Déployer l'Edge Function :
     ```bash
     supabase functions deploy generate-gamma
     ```

6. **Démarrage développement**
   ```bash
   npm run dev
   ```

## 🚀 Déploiement Netlify

### Configuration OAuth Supabase

1. **Google OAuth**
   - Aller dans [Google Cloud Console](https://console.cloud.google.com/)
   - Créer un projet ou en sélectionner un
   - Activer Google+ API
   - Créer des identifiants OAuth 2.0
   - URLs de redirection autorisées :
     - Production : `https://votredomaine.netlify.app`
     - Preview : `https://deploy-preview-XX--votredomaine.netlify.dev`

2. **Apple OAuth**
   - Aller dans [Apple Developer](https://developer.apple.com/)
   - Créer un App ID avec Sign In with Apple
   - Créer un Service ID
   - Configurer Sign In with Apple
   - URLs de redirection :
     - Même que Google

3. **Configuration Supabase**
   - Dans Supabase Dashboard > Authentication > Providers
   - Activer Google et Apple
   - Remplir les champs avec les identifiants obtenus

### Déploiement

1. **Push sur Git**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connexion Netlify**
   - Aller sur [netlify.com](https://netlify.com)
   - "New site from Git"
   - Sélectionner le repository
   - Configuration build :
     - Build command : `npm run build`
     - Publish directory : `dist`
   - Variables d'environnement :
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

3. **Domain personnalisé** (optionnel)
   - Dans Netlify > Site settings > Domain management
   - Ajouter votre domaine personnalisé

## 📊 Structure Base de Données

### Tables principales
- `profiles` : Profils utilisateurs (lié à auth.users)
- `courses` : Formations
- `modules` : Modules dans les formations
- `items` : Éléments (ressources, exercices, etc.)
- `enrollments` : Inscriptions aux formations
- `submissions` : Soumissions d'exercices/TP
- `game_scores` : Scores des mini-jeux

### RLS (Row Level Security)
- Activé sur toutes les tables
- Policies détaillées pour admin/student access

## 🔒 Sécurité

- **Authentification** : Gestion complète via Supabase
- **Autorisation** : RLS + vérifications côté client
- **Stockage** : Policies Storage restrictives
- **Headers** : Sécurité configurée dans netlify.toml

## 🎯 Utilisation

### Pour les étudiants
- Inscription/connexion
- Accès aux formations inscrites
- Soumission d'exercices et TP
- Téléchargement de ressources
- **Jeux interactifs** : Mini-jeux pédagogiques pour renforcer l'apprentissage

### Pour les admins
- Gestion complète des formations
- Upload de fichiers
- Gestion des utilisateurs
- Publication/dépublication de contenu
- **Création de jeux** : Créer des jeux interactifs (matching, connection, timeline, category, etc.)

## 🎮 Jeux interactifs

L'application supporte plusieurs types de jeux pédagogiques :

### Types de jeux disponibles
- **Matching** : Association de cartes (terme/définition)
- **Column Matching** : Association de colonnes
- **Connection** : Connexion avec lignes animées
- **Timeline** : Placement chronologique d'événements
- **Category** : Classification d'items dans des catégories
- **API Types** : Choix du type d'API approprié
- **Format Files** : Apprentissage des formats JSON/XML/Protobuf
- **JSON File Types** : Identification de types de fichiers JSON

### Accéder aux jeux

**Si le jeu est un item :**
```
/items/{itemId}
```

**Si le jeu est dans un chapitre :**
```
/courses/{courseId}
```
Naviguez ensuite jusqu'au chapitre contenant le jeu.

**Trouver l'ID d'un jeu :**
```sql
-- Pour un item
SELECT id, title FROM items WHERE type = 'game';

-- Pour un chapitre
SELECT id, title FROM chapters WHERE type = 'game';
```

### Documentation des jeux

- 📖 `STRUCTURE-COMPLETE-JEUX.md` : Structure complète de tous les types de jeux
- 🎯 `NOUVEAUX_JEUX.md` : Guide des nouveaux jeux interactifs (connection, timeline, category)
- 📚 `exemples-jeux/README-JEUX-API.md` : Exemples de jeux pour l'apprentissage des APIs
- 🔧 `GUIDE-FORMAT-JEU-CHAPITRE.md` : Guide pour intégrer un jeu dans un chapitre
- 🔍 `GUIDE-TROUVER-ITEM-ID.md` : Comment trouver l'ID d'un item ou chapitre

## 🚧 Évolutions Prévues

### Phase 2 : Paiements
- Intégration Stripe
- Formations payantes
- Abonnements
- Codes promo

### Phase 3 : Fonctionnalités avancées
- Progression utilisateur
- Badges/certificats
- Forum communautaire
- Analytics d'apprentissage

## 📝 Scripts Disponibles

- `npm run dev` : Démarrage développement
- `npm run build` : Build production
- `npm run preview` : Prévisualisation build
- `npm run lint` : Linting du code

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commit les changements
4. Push et créer une PR

## 📄 Licence

MIT License - voir LICENSE pour plus de détails.
