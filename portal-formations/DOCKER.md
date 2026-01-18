# Guide Docker - Portal Formations

Ce document explique la structure Docker du projet et comment l'utiliser.

## 📁 Structure des fichiers Docker

```
portal-formations/
├── docker/
│   ├── supabase/
│   │   ├── docker-compose.yml      # Configuration Supabase self-hosted
│   │   ├── .env.example            # Template de configuration Supabase
│   │   ├── kong.yml                # Configuration API Gateway Kong
│   │   └── init-scripts/           # Scripts SQL d'initialisation
│   ├── frontend/
│   │   ├── Dockerfile              # Build multi-stage React/Vite
│   │   └── nginx.conf              # Configuration Nginx pour SPA
│   └── backend/
│       └── Dockerfile              # Build serveur Express
├── docker-compose.yml              # Orchestration principale
├── .dockerignore                   # Fichiers exclus du build
└── env.production.example          # Template variables d'environnement
```

## 🚀 Démarrage rapide

### 1. Configuration initiale

```bash
# Copier les templates de configuration
cp env.production.example .env.production
cp docker/supabase/.env.example docker/supabase/.env

# Éditer les fichiers avec vos valeurs
nano .env.production
nano docker/supabase/.env
```

### 2. Générer les secrets

```bash
# Générer tous les secrets nécessaires
openssl rand -base64 32  # Pour POSTGRES_PASSWORD
openssl rand -base64 32  # Pour JWT_SECRET
openssl rand -base64 32  # Pour ANON_KEY
openssl rand -base64 32  # Pour SERVICE_ROLE_KEY
```

### 3. Démarrer les services

```bash
# Construire et démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Vérifier le statut
docker-compose ps
```

## 🏗️ Architecture des services

### Services Supabase

- **supabase-db** : PostgreSQL 15 avec extensions Supabase
- **supabase-kong** : API Gateway (port 8000)
- **supabase-auth** : Service d'authentification (port 9999)
- **supabase-rest** : API REST PostgREST
- **supabase-storage** : Service de stockage S3-compatible (port 5000)
- **supabase-realtime** : WebSockets pour temps réel (port 4000)

### Services Application

- **backend** : Serveur Express (port 3001)
- **frontend** : Application React servie par Nginx (port 80)

## 📦 Volumes Docker

Les données persistantes sont stockées dans des volumes :

- `supabase_db_data` : Base de données PostgreSQL
- `supabase_storage_data` : Fichiers Storage

Pour sauvegarder :

```bash
# Sauvegarder la base de données
docker run --rm -v portal-formations_supabase_db_data:/data -v $(pwd)/backups:/backup \
  alpine tar czf /backup/db_backup_$(date +%Y%m%d).tar.gz -C /data .

# Restaurer
docker run --rm -v portal-formations_supabase_db_data:/data -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/db_backup_YYYYMMDD.tar.gz -C /data
```

## 🔧 Commandes utiles

### Gestion des services

```bash
# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Redémarrer un service
docker-compose restart backend

# Reconstruire après modification
docker-compose build --no-cache
docker-compose up -d
```

### Logs et debugging

```bash
# Tous les logs
docker-compose logs -f

# Logs d'un service
docker-compose logs -f backend

# Logs des 100 dernières lignes
docker-compose logs --tail=100
```

### Accès aux conteneurs

```bash
# Accéder à la base de données
docker-compose exec supabase-db psql -U postgres -d postgres

# Shell dans le backend
docker-compose exec backend sh

# Shell dans le frontend
docker-compose exec frontend sh
```

### Nettoyage

```bash
# Arrêter et supprimer les conteneurs
docker-compose down

# Supprimer aussi les volumes (⚠️ supprime les données)
docker-compose down -v

# Nettoyer les images non utilisées
docker system prune -a
```

## 🔄 Migration depuis Supabase Cloud

Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour les instructions complètes de migration.

Résumé :

```bash
# 1. Configurer les variables Supabase Cloud dans .env.production
# 2. Migrer la base de données
./scripts/migrate-database.sh

# 3. Migrer les buckets Storage
./scripts/migrate-storage.sh
```

## 🐛 Troubleshooting

### Port déjà utilisé

```bash
# Trouver le processus utilisant le port
sudo lsof -i :80
sudo lsof -i :5432

# Arrêter le processus ou changer le port dans docker-compose.yml
```

### Erreur de connexion à la base

```bash
# Vérifier que le service est démarré
docker-compose ps supabase-db

# Vérifier les logs
docker-compose logs supabase-db

# Tester la connexion
docker-compose exec supabase-db psql -U postgres -d postgres -c "SELECT 1;"
```

### Problème de build

```bash
# Nettoyer et reconstruire
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Variables d'environnement non prises en compte

```bash
# Vérifier la configuration
docker-compose config

# Recharger les variables
docker-compose down
docker-compose up -d
```

## 📊 Monitoring

### Utilisation des ressources

```bash
# Stats en temps réel
docker stats

# Espace disque utilisé
docker system df
```

### Health checks

Les services ont des health checks configurés. Vérifier avec :

```bash
docker-compose ps
```

Les services avec `(healthy)` sont opérationnels.

## 🔒 Sécurité

- Ne jamais commiter les fichiers `.env` ou `.env.production`
- Utiliser des secrets forts générés avec `openssl rand -base64 32`
- Limiter l'accès aux ports exposés avec un firewall
- Utiliser HTTPS en production avec un reverse proxy

## 📚 Ressources

- [Documentation Supabase Self-Hosted](https://supabase.com/docs/guides/self-hosting)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Guide de déploiement complet](./DEPLOYMENT.md)
