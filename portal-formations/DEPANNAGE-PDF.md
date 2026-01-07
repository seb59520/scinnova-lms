# Dépannage : Erreur "Load failed" lors du téléchargement PDF

## 🔍 Diagnostic

L'erreur "Load failed" peut avoir plusieurs causes. Suivez ces étapes pour identifier le problème :

### 1. Vérifier que le serveur backend est démarré

Le serveur backend doit être en cours d'exécution pour générer le PDF.

**Vérification :**
```bash
# Option 1 : Depuis la racine du projet
npm run dev:server

# Option 2 : Depuis le dossier server/
cd server
npm run dev
# ou
npm run dev:server
```

Le serveur doit démarrer sur `http://localhost:3001` (ou le port configuré).

**Vérifier que le serveur répond :**
```bash
curl http://localhost:3001/health
```

Vous devriez recevoir une réponse JSON avec `{"status":"ok"}`.

### 2. Vérifier les variables d'environnement

Le serveur backend a besoin des variables d'environnement Supabase.

**Créer un fichier `.env` dans le dossier `server/` :**
```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon
```

**Ou utiliser les variables système :**
```bash
export VITE_SUPABASE_URL=https://votre-projet.supabase.co
export VITE_SUPABASE_ANON_KEY=votre-clé-anon
```

### 3. Vérifier l'URL de l'API dans le frontend

Par défaut, le frontend utilise `http://localhost:3001`. Si votre serveur backend est sur un autre port ou une autre URL, configurez la variable d'environnement :

**Créer un fichier `.env` à la racine du projet :**
```env
VITE_API_URL=http://localhost:3001
```

**Ou pour la production :**
```env
VITE_API_URL=https://votre-api.com
```

### 4. Vérifier que Puppeteer est installé

Puppeteer est nécessaire pour générer le PDF.

**Vérification :**
```bash
cd server
npm list puppeteer
```

**Installation si manquant :**
```bash
cd server
npm install puppeteer
```

### 5. Vérifier les logs

**Côté frontend (console du navigateur) :**
Ouvrez la console du navigateur (F12) et regardez les logs qui commencent par `📥` ou `❌`.

**Côté backend (terminal du serveur) :**
Regardez les logs qui commencent par `[PDF]`.

## 🐛 Solutions aux erreurs courantes

### Erreur : "Impossible de se connecter au serveur"

**Causes possibles :**
1. Le serveur backend n'est pas démarré
2. L'URL de l'API est incorrecte
3. Problème CORS

**Solutions :**
1. Démarrer le serveur backend : `cd server && npm run dev:server`
2. Vérifier l'URL dans `.env` : `VITE_API_URL=http://localhost:3001`
3. Vérifier la configuration CORS dans `server/src/server.ts`

### Erreur : "Configuration Supabase manquante"

**Cause :** Les variables d'environnement Supabase ne sont pas configurées dans le serveur backend.

**Solution :**
```bash
cd server
# Créer un fichier .env
echo "VITE_SUPABASE_URL=https://votre-projet.supabase.co" > .env
echo "VITE_SUPABASE_ANON_KEY=votre-clé-anon" >> .env
```

### Erreur : "Le téléchargement PDF n'est pas activé"

**Cause :** La case "Autoriser le téléchargement PDF" n'est pas cochée dans les paramètres du cours.

**Solution :**
1. Aller dans `/admin/courses/:courseId`
2. Cocher "Autoriser le téléchargement PDF du cours complet"
3. Sauvegarder le cours

### Erreur : "Aucune slide trouvée"

**Cause :** Le cours ne contient pas de slides publiées.

**Solution :**
1. Vérifier que le cours contient des modules avec des slides
2. Vérifier que les slides sont publiées (`published: true`)

### Erreur : "Erreur Puppeteer" ou "browser"

**Cause :** Puppeteer n'est pas installé ou ne peut pas lancer Chrome/Chromium.

**Solutions :**
1. Installer Puppeteer : `cd server && npm install puppeteer`
2. Sur Linux, installer les dépendances système :
   ```bash
   sudo apt-get update
   sudo apt-get install -y \
     ca-certificates \
     fonts-liberation \
     libappindicator3-1 \
     libasound2 \
     libatk-bridge2.0-0 \
     libatk1.0-0 \
     libc6 \
     libcairo2 \
     libcups2 \
     libdbus-1-3 \
     libexpat1 \
     libfontconfig1 \
     libgbm1 \
     libgcc1 \
     libglib2.0-0 \
     libgtk-3-0 \
     libnspr4 \
     libnss3 \
     libpango-1.0-0 \
     libpangocairo-1.0-0 \
     libstdc++6 \
     libx11-6 \
     libx11-xcb1 \
     libxcb1 \
     libxcomposite1 \
     libxcursor1 \
     libxdamage1 \
     libxext6 \
     libxfixes3 \
     libxi6 \
     libxrandr2 \
     libxrender1 \
     libxss1 \
     libxtst6 \
     lsb-release \
     wget \
     xdg-utils
   ```

### Erreur : "Timeout"

**Cause :** La génération du PDF prend trop de temps.

**Solutions :**
1. Vérifier les ressources du serveur (CPU, mémoire)
2. Réduire le nombre de slides dans le cours
3. Vérifier que les images sont accessibles rapidement

## 📋 Checklist de vérification

Avant de signaler un problème, vérifiez :

- [ ] Le serveur backend est démarré (`npm run dev:server` dans `server/`)
- [ ] Les variables d'environnement Supabase sont configurées dans `server/.env`
- [ ] Puppeteer est installé (`npm list puppeteer` dans `server/`)
- [ ] La case "Autoriser le téléchargement PDF" est cochée dans les paramètres du cours
- [ ] Le cours contient au moins une slide publiée
- [ ] L'URL de l'API est correcte dans `.env` (frontend) : `VITE_API_URL=http://localhost:3001`
- [ ] Les logs dans la console du navigateur et du serveur sont consultés

## 🔧 Test manuel de l'API

Vous pouvez tester l'API directement avec curl :

```bash
# Récupérer votre token d'authentification depuis la console du navigateur
# (dans Application > Local Storage > sb-auth-token)

TOKEN="votre-token-ici"
COURSE_ID="votre-course-id"

curl -X GET \
  "http://localhost:3001/api/courses/${COURSE_ID}/pdf" \
  -H "Authorization: Bearer ${TOKEN}" \
  -o test.pdf
```

Si cela fonctionne avec curl mais pas depuis le frontend, le problème vient probablement de :
- La configuration CORS
- L'URL de l'API dans le frontend
- Le token d'authentification

## 📞 Support

Si le problème persiste après avoir suivi ces étapes :

1. Vérifiez les logs complets (frontend et backend)
2. Vérifiez la version de Node.js : `node --version` (doit être >= 18)
3. Vérifiez que toutes les dépendances sont installées : `npm install` dans `server/`
4. Partagez les logs d'erreur complets pour un diagnostic plus approfondi

