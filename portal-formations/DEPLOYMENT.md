# Guide de Déploiement - Portal Formations

Ce guide explique comment déployer Portal Formations sur un VPS Ubuntu 20.04 avec Docker et Supabase self-hosted.

## 📋 Prérequis

- VPS Ubuntu 20.04 avec accès root/sudo
- Au moins 4GB de RAM (8GB recommandé)
- Au moins 20GB d'espace disque
- Accès SSH au serveur
- Domaine configuré (optionnel mais recommandé)

## 🚀 Installation sur le VPS

### Étape 1: Préparation du serveur

Connectez-vous à votre VPS et exécutez le script d'installation :

```bash
# Télécharger le script
wget https://raw.githubusercontent.com/votre-repo/portal-formations/main/scripts/setup-vps.sh

# Ou copier depuis votre machine locale
scp scripts/setup-vps.sh root@votre-vps:/tmp/

# Exécuter le script
sudo bash /tmp/setup-vps.sh
```

Ce script installe :
- Docker et Docker Compose
- PostgreSQL client
- Outils nécessaires (curl, wget, jq, etc.)
- Configuration du firewall (UFW)

### Étape 2: Cloner le projet

```bash
cd /opt
git clone https://github.com/votre-repo/portal-formations.git
cd portal-formations
```

### Étape 3: Configuration des variables d'environnement

```bash
# Copier le template
cp .env.production .env

# Éditer avec vos valeurs
nano .env
```

**Variables essentielles à configurer :**

1. **Générer les secrets sécurisés :**
```bash
# Générer POSTGRES_PASSWORD
openssl rand -base64 32

# Générer JWT_SECRET
openssl rand -base64 32

# Générer ANON_KEY
openssl rand -base64 32

# Générer SERVICE_ROLE_KEY
openssl rand -base64 32
```

2. **Configurer les URLs :**
   - `VITE_SUPABASE_URL`: URL de votre Supabase self-hosted (ex: `http://votre-domaine.com:8000`)
   - `SITE_URL`: URL de votre application (ex: `https://votre-domaine.com`)
   - `API_EXTERNAL_URL`: URL externe de l'API (ex: `https://api.votre-domaine.com`)

### Étape 4: Démarrer les services

```bash
# Construire et démarrer tous les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f

# Vérifier le statut
docker-compose ps
```

### Étape 5: Vérifier que tout fonctionne

```bash
# Vérifier la base de données
docker-compose exec supabase-db psql -U postgres -d postgres -c "SELECT version();"

# Vérifier l'API Supabase
curl http://localhost:8000/rest/v1/

# Vérifier le frontend
curl http://localhost/

# Vérifier le backend
curl http://localhost:3001/health
```

## 📦 Migration des données depuis Supabase Cloud

### Étape 1: Exporter la base de données

Ajoutez les variables de connexion Supabase Cloud dans `.env.production` :

```bash
SUPABASE_CLOUD_DB_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
# Ou
SUPABASE_CLOUD_HOST=db.xxxxx.supabase.co
SUPABASE_CLOUD_PASSWORD=votre-mot-de-passe
```

Exécutez le script de migration :

```bash
./scripts/migrate-database.sh
```

Ce script :
1. Exporte la base de données depuis Supabase cloud
2. Importe dans votre base locale
3. Applique les migrations

### Étape 2: Migrer les buckets Storage

```bash
# Ajouter les variables Supabase Cloud dans .env.production
SUPABASE_CLOUD_URL=https://xxxxx.supabase.co
SERVICE_ROLE_KEY=votre-service-role-key-cloud

# Exécuter le script
./scripts/migrate-storage.sh
```

**Note :** Si le script automatique ne fonctionne pas, téléchargez manuellement les fichiers depuis le dashboard Supabase et placez-les dans `backups/storage/`.

### Étape 3: Recréer les politiques RLS Storage

Connectez-vous à votre base de données locale et exécutez les scripts SQL :

```bash
# Se connecter à la base
docker-compose exec supabase-db psql -U postgres -d postgres

# Dans psql, exécuter les scripts
\i /path/to/setup-submissions-storage.sql
\i /path/to/setup-course-assets-storage.sql
\i /path/to/creer-bucket-resources.sql
\i /path/to/setup-item-documents-storage.sql
```

Ou depuis l'extérieur :

```bash
PGPASSWORD=votre-password psql -h localhost -p 54322 -U postgres -d postgres -f setup-submissions-storage.sql
```

## 🔒 Configuration HTTPS avec Nginx

### Installation de Nginx

```bash
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

### Configuration Nginx

Créez `/etc/nginx/sites-available/portal-formations` :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    # Redirection vers HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com;

    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;

    # Configuration SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Headers de sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Supabase API
    location /supabase/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activez le site :

```bash
sudo ln -s /etc/nginx/sites-available/portal-formations /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Obtenir un certificat SSL

```bash
sudo certbot --nginx -d votre-domaine.com
```

Certbot configurera automatiquement le renouvellement.

## 🔄 Gestion des services

### Commandes utiles

```bash
# Démarrer tous les services
docker-compose up -d

# Arrêter tous les services
docker-compose down

# Redémarrer un service spécifique
docker-compose restart frontend

# Voir les logs
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f backend

# Reconstruire les images
docker-compose build --no-cache

# Accéder à la base de données
docker-compose exec supabase-db psql -U postgres -d postgres
```

### Mise à jour de l'application

```bash
# Pull les dernières modifications
git pull

# Reconstruire et redémarrer
docker-compose build
docker-compose up -d

# Appliquer les nouvelles migrations
docker-compose exec supabase-db psql -U postgres -d postgres -f /path/to/new-migration.sql
```

## 💾 Sauvegarde

### Script de sauvegarde automatique

Créez `/opt/portal-formations/scripts/backup.sh` :

```bash
#!/bin/bash
BACKUP_DIR="/opt/portal-formations/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Sauvegarder la base de données
docker-compose exec -T supabase-db pg_dump -U postgres postgres > "$BACKUP_DIR/db_$TIMESTAMP.sql"

# Compresser
gzip "$BACKUP_DIR/db_$TIMESTAMP.sql"

# Garder seulement les 7 derniers backups
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup créé: db_$TIMESTAMP.sql.gz"
```

Ajoutez au crontab :

```bash
# Sauvegarde quotidienne à 2h du matin
0 2 * * * /opt/portal-formations/scripts/backup.sh
```

## 🔍 Monitoring et Troubleshooting

### Vérifier l'état des services

```bash
# Statut des conteneurs
docker-compose ps

# Utilisation des ressources
docker stats

# Espace disque
df -h
```

### Logs importants

```bash
# Logs Supabase
docker-compose logs supabase-db
docker-compose logs supabase-kong

# Logs application
docker-compose logs frontend
docker-compose logs backend
```

### Problèmes courants

**1. Port déjà utilisé :**
```bash
# Vérifier quel processus utilise le port
sudo lsof -i :80
sudo lsof -i :5432

# Arrêter le service conflictuel ou changer le port dans docker-compose.yml
```

**2. Base de données ne démarre pas :**
```bash
# Vérifier les logs
docker-compose logs supabase-db

# Vérifier les permissions des volumes
ls -la docker/volumes/
```

**3. Erreurs de connexion :**
```bash
# Vérifier les variables d'environnement
docker-compose config

# Tester la connexion à la base
docker-compose exec supabase-db psql -U postgres -d postgres -c "SELECT 1;"
```

## 📊 Performance

### Optimisations recommandées

1. **PostgreSQL :** Ajuster `shared_buffers` et `work_mem` dans la configuration
2. **Nginx :** Activer le cache pour les assets statiques
3. **Docker :** Utiliser des volumes nommés pour de meilleures performances
4. **Monitoring :** Installer Prometheus + Grafana pour surveiller les métriques

## 🔐 Sécurité

### Checklist de sécurité

- [ ] Mots de passe forts générés avec `openssl rand -base64 32`
- [ ] Firewall (UFW) configuré et actif
- [ ] HTTPS configuré avec Let's Encrypt
- [ ] Backups automatiques configurés
- [ ] Mises à jour système régulières
- [ ] Accès SSH sécurisé (clés, pas de mots de passe)
- [ ] Variables d'environnement dans `.env` (non commitées)
- [ ] RLS activé sur toutes les tables Supabase

## 📞 Support

En cas de problème :
1. Vérifiez les logs : `docker-compose logs -f`
2. Consultez la documentation Supabase : https://supabase.com/docs
3. Vérifiez les issues GitHub du projet

## 📝 Notes importantes

- Les données sont stockées dans des volumes Docker (`supabase_db_data`, `supabase_storage_data`)
- Pour migrer vers un autre serveur, copiez les volumes Docker
- Les backups doivent être testés régulièrement
- Surveillez l'espace disque (les backups et logs peuvent prendre de la place)
