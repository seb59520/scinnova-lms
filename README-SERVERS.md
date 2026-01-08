# 🚀 Guide de démarrage des serveurs

Ce projet nécessite deux serveurs pour fonctionner complètement :

## 📦 Serveurs nécessaires

### 1. Backend - Portal Formations (Express + Swagger)
- **Port** : 3001
- **URL** : http://localhost:3001
- **Swagger UI** : http://localhost:3001/docs
- **Répertoire** : `portal-formations/server`

### 2. Frontend - Big Data Impacts App (React + Vite)
- **Port** : 5173
- **URL** : http://localhost:5173
- **Répertoire** : `big-data-impacts-app`

## 🎯 Méthode 1 : Script automatique (Recommandé)

Un script est disponible pour lancer les deux serveurs en parallèle :

```bash
./start-all-servers.sh
```

Ce script :
- ✅ Lance les deux serveurs en parallèle
- ✅ Affiche les URLs d'accès
- ✅ Permet d'arrêter les deux serveurs avec Ctrl+C
- ✅ Affiche les logs dans des fichiers séparés

## 🎯 Méthode 2 : Lancer manuellement

### Terminal 1 - Backend
```bash
cd portal-formations/server
npm run dev:server
```

### Terminal 2 - Frontend
```bash
cd big-data-impacts-app
npm run dev
```

## 📋 Vérification

Une fois les serveurs lancés, vous devriez voir :

### Backend
- ✅ Serveur Express démarré sur le port 3001
- ✅ Swagger UI accessible sur http://localhost:3001/docs

### Frontend
- ✅ Serveur Vite démarré sur le port 5173
- ✅ Application React accessible sur http://localhost:5173

## 🔍 Logs

Si vous utilisez le script automatique, les logs sont disponibles dans :
- Backend : `/tmp/backend.log`
- Frontend : `/tmp/frontend.log`

Pour suivre les logs en temps réel :
```bash
# Backend
tail -f /tmp/backend.log

# Frontend
tail -f /tmp/frontend.log
```

## ⚠️ Dépannage

### Port déjà utilisé
Si un port est déjà utilisé, vous pouvez :
1. Arrêter le processus qui utilise le port
2. Modifier le port dans les fichiers de configuration

### Erreurs de dépendances
Si vous avez des erreurs, assurez-vous d'avoir installé les dépendances :
```bash
# Backend
cd portal-formations/server && npm install

# Frontend
cd big-data-impacts-app && npm install
```

## 🛑 Arrêt des serveurs

### Avec le script automatique
Appuyez sur `Ctrl+C` dans le terminal où le script tourne.

### Manuellement
Appuyez sur `Ctrl+C` dans chaque terminal où un serveur tourne.


