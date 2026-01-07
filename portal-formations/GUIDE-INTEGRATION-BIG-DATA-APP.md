# 🎮 Guide d'intégration de l'application Big Data Impacts dans le LMS

## 📋 Méthode 1 : Via une ressource avec external_url (Simple)

### Étape 1 : Créer une ressource dans le TP

Dans votre TP `tp-big-data-data-science-impacts.json`, ajoutez un item de type `resource` avec un `external_url` :

```json
{
  "type": "resource",
  "title": "Application interactive - Big Data Impacts",
  "position": 3,
  "published": true,
  "external_url": "http://localhost:5173",
  "content": {
    "description": "Accédez à l'application interactive pour analyser les impacts du Big Data et de la Data Science. L'application permet de créer, visualiser et comparer des cas d'usage."
  }
}
```

### Étape 2 : Lancer l'application React

Avant d'accéder au TP dans le LMS, assurez-vous que l'application React est lancée :

```bash
cd big-data-impacts-app
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Étape 3 : Accéder depuis le LMS

1. Importez le TP dans votre LMS
2. Les étudiants verront un lien "Accéder à la ressource" qui ouvre l'application dans un nouvel onglet

## 📋 Méthode 2 : Intégration via iframe (Recommandée)

Pour une meilleure intégration, vous pouvez modifier le TP pour utiliser un iframe.

### Étape 1 : Modifier le JSON du TP

Ajoutez un item avec un contenu spécial qui sera rendu comme iframe :

```json
{
  "type": "resource",
  "title": "Application interactive - Big Data Impacts",
  "position": 3,
  "published": true,
  "content": {
    "body": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Utilisez l'application interactive ci-dessous pour analyser les impacts du Big Data et de la Data Science."
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "hardBreak"
            }
          ]
        },
        {
          "type": "iframe",
          "attrs": {
            "src": "http://localhost:5173",
            "width": "100%",
            "height": "800px",
            "frameborder": "0"
          }
        }
      ]
    }
  }
}
```

## 📋 Méthode 3 : Déployer l'application (Production)

Pour un déploiement en production, vous devez :

### Option A : Déployer sur Netlify/Vercel

1. Build de l'application :
```bash
cd big-data-impacts-app
npm run build
```

2. Déployer le dossier `dist/` sur Netlify ou Vercel

3. Utiliser l'URL de production dans le TP :
```json
{
  "external_url": "https://votre-app.netlify.app"
}
```

### Option B : Servir depuis le même domaine

1. Copier le build dans le dossier public du LMS
2. Utiliser une route relative dans le TP

## 🚀 Démarrage rapide pour les étudiants

### Pour les étudiants

1. **Lancer l'application** (si en local) :
   - Ouvrir un terminal
   - Aller dans `big-data-impacts-app`
   - Lancer `npm run dev`

2. **Accéder au TP dans le LMS** :
   - Se connecter au LMS
   - Aller dans la formation "Big Data et Machine Learning"
   - Ouvrir le TP "Identifier les impacts du Big Data et de la Data Science"
   - Cliquer sur "Application interactive - Big Data Impacts"

3. **Utiliser l'application** :
   - Créer des cas d'usage
   - Visualiser les impacts
   - Comparer les cas d'usage
   - Générer des rapports

## 📝 Exemple complet d'intégration dans le TP

Voici comment ajouter l'application dans le Module 2 du TP :

```json
{
  "title": "Module 2 : TP pratique - Application interactive",
  "position": 2,
  "items": [
    {
      "type": "tp",
      "title": "TP : Application d'analyse des impacts Big Data et Data Science",
      "position": 1,
      "published": true,
      "content": {
        "instructions": { ... },
        "checklist": [ ... ]
      }
    },
    {
      "type": "resource",
      "title": "🚀 Application interactive - Big Data Impacts",
      "position": 2,
      "published": true,
      "external_url": "http://localhost:5173",
      "content": {
        "description": "Accédez à l'application interactive pour créer et analyser vos cas d'usage. L'application est pré-chargée avec 5 exemples que vous pouvez modifier ou utiliser comme référence."
      }
    },
    {
      "type": "resource",
      "title": "Exemples de cas d'usage à implémenter",
      "position": 3,
      "published": true,
      "content": { ... }
    }
  ]
}
```

## ⚠️ Notes importantes

1. **En développement** : Utilisez `http://localhost:5173`
2. **En production** : Utilisez l'URL de déploiement (Netlify, Vercel, etc.)
3. **CORS** : Si vous avez des problèmes CORS, configurez Vite pour autoriser les iframes
4. **Responsive** : L'application est responsive et fonctionne sur mobile/tablette

## 🔧 Configuration Vite pour iframe

Si vous voulez intégrer via iframe, ajoutez dans `vite.config.ts` :

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    headers: {
      'X-Frame-Options': 'SAMEORIGIN'
    }
  }
})
```

