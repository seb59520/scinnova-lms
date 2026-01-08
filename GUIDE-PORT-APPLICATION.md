# 🔌 Guide : Gérer le port de l'application

## Problème

L'application React peut se lancer sur un port différent de 5173 si le port est occupé.

## ✅ Solution rapide

### Option 1 : Utiliser le script automatique

```bash
./update-tp-port.sh
```

Le script détecte le port utilisé et met à jour automatiquement le TP JSON.

### Option 2 : Mettre à jour manuellement

1. **Lancer l'application** et noter le port affiché :
   ```bash
   cd big-data-impacts-app
   npm run dev
   ```
   
   Vite affichera quelque chose comme :
   ```
   ➜  Local:   http://localhost:5174/
   ```

2. **Mettre à jour le TP JSON** :
   - Ouvrir `portal-formations/tp-big-data-data-science-impacts.json`
   - Chercher `"external_url": "http://localhost:5173"`
   - Remplacer par le port affiché (ex: `5174`)

### Option 3 : Forcer le port 5173

1. **Libérer le port 5173** :
   ```bash
   lsof -ti:5173 | xargs kill -9
   ```

2. **Relancer l'application** :
   ```bash
   cd big-data-impacts-app
   npm run dev
   ```

   Avec `strictPort: true` dans `vite.config.ts`, Vite affichera une erreur si le port est occupé.

## 🔍 Vérifier le port utilisé

```bash
# Voir tous les ports utilisés par Node/Vite
lsof -i -P | grep LISTEN | grep node

# Voir spécifiquement le port 5173
lsof -i:5173
```

## 📝 Configuration actuelle

- **Port configuré** : 5173 (dans `vite.config.ts`)
- **Strict port** : Activé (`strictPort: true`)
- **TP JSON** : Pointe vers `http://localhost:5173`

Si vous changez de port, n'oubliez pas de mettre à jour le TP JSON !


