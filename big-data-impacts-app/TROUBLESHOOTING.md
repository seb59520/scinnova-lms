# Guide de dépannage

## Erreurs de build sur Netlify

### Erreur : "Command failed with exit code 2"

#### Solution 1 : Vérifier la version de Node.js

Netlify utilise Node.js 20 par défaut. Vérifiez que votre `netlify.toml` contient :

```toml
[build.environment]
  NODE_VERSION = "20"
```

#### Solution 2 : Utiliser npm ci au lieu de npm install

Le fichier `netlify.toml` utilise maintenant `npm ci` qui est plus fiable pour les builds CI/CD :

```toml
command = "npm ci && npm run build"
```

#### Solution 3 : Vérifier les erreurs TypeScript

Si le build échoue à cause d'erreurs TypeScript, vous pouvez :

1. **Option A** : Corriger les erreurs TypeScript
   ```bash
   npm run build:check
   ```

2. **Option B** : Utiliser le build sans vérification TypeScript stricte
   Le script `build` utilise maintenant directement `vite build` sans `tsc -b`

#### Solution 4 : Vérifier les logs de build

Dans Netlify, allez dans :
- Site settings > Build & deploy > Build logs
- Vérifiez les erreurs spécifiques

### Erreurs courantes

#### "Cannot find module"

Vérifiez que toutes les dépendances sont dans `package.json` :
```bash
npm install
```

#### "Type errors"

Vérifiez les erreurs TypeScript :
```bash
npx tsc --noEmit
```

#### "Build timeout"

Si le build prend trop de temps, vérifiez :
- Les dépendances lourdes
- Les imports inutiles
- Les assets volumineux

### Commandes de débogage

```bash
# Vérifier les erreurs TypeScript
npx tsc --noEmit

# Vérifier les erreurs ESLint
npm run lint

# Build local pour tester
npm run build

# Prévisualiser le build
npm run preview
```

### Vérifier la configuration Netlify

1. Allez dans Site settings > Build & deploy > Build settings
2. Vérifiez que :
   - Base directory : `.` (ou vide)
   - Build command : `npm ci && npm run build`
   - Publish directory : `dist`

### Logs de build détaillés

Pour obtenir plus de détails sur l'erreur :
1. Allez dans Deploys
2. Cliquez sur le déploiement qui a échoué
3. Cliquez sur "View build log"
4. Cherchez les erreurs spécifiques

### Contact

Si le problème persiste, ouvrez une issue sur GitHub avec :
- Les logs de build complets
- La version de Node.js utilisée
- Les erreurs spécifiques


