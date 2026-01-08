# 🚀 Démarrage rapide

## Option 1 : Script automatique (Recommandé)

Lancez les deux serveurs en une seule commande :

```bash
./start-all-servers.sh
```

Ou avec npm :

```bash
npm run dev
```

## Option 2 : Deux terminaux séparés

### Terminal 1 - Backend
```bash
cd portal-formations/server
npm run dev
```
→ http://localhost:3001
→ Swagger: http://localhost:3001/docs

### Terminal 2 - Frontend  
```bash
cd big-data-impacts-app
npm run dev
```
→ http://localhost:5173

## 📋 Vérification

Une fois lancés, vous devriez avoir accès à :

- ✅ **Backend API** : http://localhost:3001
- ✅ **Swagger UI** : http://localhost:3001/docs  
- ✅ **Application React** : http://localhost:5173

## 🛑 Arrêt

Avec le script : Appuyez sur `Ctrl+C`

Manuellement : `Ctrl+C` dans chaque terminal


