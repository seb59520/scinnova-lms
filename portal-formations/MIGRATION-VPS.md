# Guide de Migration vers VPS

Ce guide explique comment migrer votre projet Portal Formations depuis votre machine locale vers votre VPS Ubuntu 20.04.

## 📋 Vue d'ensemble

La migration comprend deux parties :
1. **Code de l'application** : Déployer le code sur le VPS
2. **Données Supabase** : Migrer la base de données et les buckets depuis Supabase cloud

## 🚀 Étape 1 : Préparer le VPS

### Sur votre VPS (Ubuntu 20.04)

```bash
# 1. Se connecter au VPS
ssh root@votre-vps-ip

# 2. Exécuter le script d'installation
wget https://raw.githubusercontent.com/votre-repo/portal-formations/main/scripts/setup-vps.sh
# OU copier depuis votre machine locale :
# scp scripts/setup-vps.sh root@votre-vps:/tmp/
sudo bash /tmp/setup-vps.sh
```

Ce script installe Docker, Docker Compose et configure le serveur.

## 📦 Étape 2 : Déployer le code

### Option A : Via Git (Recommandé)

```bash
# Sur le VPS
cd /opt
git clone https://github.com/votre-repo/portal-formations.git
cd portal-formations
```

### Option B : Via SCP (si pas de Git)

```bash
# Sur votre machine locale
cd /Users/sebastien/ProjectStudies/portal-formations

# Créer une archive
tar -czf portal-formations.tar.gz \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='backups' \
  .

# Transférer vers le VPS
scp portal-formations.tar.gz root@votre-vps:/opt/

# Sur le VPS, extraire
ssh root@votre-vps
cd /opt
tar -xzf portal-formations.tar.gz
cd portal-formations
```

## ⚙️ Étape 3 : Configuration sur le VPS

```bash
# Sur le VPS
cd /opt/portal-formations

# 1. Copier les templates de configuration
cp env.production.example .env.production
cp docker/supabase/.env.example docker/supabase/.env

# 2. Générer les secrets sécurisés
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)" >> .env.production
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env.production
echo "ANON_KEY=$(openssl rand -base64 32)" >> .env.production
echo "SERVICE_ROLE_KEY=$(openssl rand -base64 32)" >> .env.production

# 3. Éditer les fichiers avec vos valeurs
nano .env.production
nano docker/supabase/.env
```

**Variables importantes à configurer :**

Dans `.env.production` :
- `VITE_SUPABASE_URL` : URL de votre VPS (ex: `http://votre-ip:8000` ou `https://votre-domaine.com`)
- `SITE_URL` : URL de votre application
- `API_EXTERNAL_URL` : URL externe de l'API

## 🗄️ Étape 4 : Migrer les données Supabase

### 4.1 Récupérer les credentials Supabase Cloud

Sur votre dashboard Supabase (https://app.supabase.com) :
1. Allez dans **Settings** → **Database**
2. Copiez la **Connection string** (URI) ou notez :
   - Host
   - Port (généralement 5432)
   - Database name
   - User
   - Password

3. Allez dans **Settings** → **API**
   - Copiez la **Project URL**
   - Copiez le **service_role key** (secret)

### 4.2 Configurer les variables de migration

```bash
# Sur le VPS, éditer .env.production
nano .env.production
```

Ajoutez les variables Supabase Cloud :

```bash
# Migration depuis Supabase Cloud
SUPABASE_CLOUD_DB_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
# OU variables séparées :
SUPABASE_CLOUD_HOST=db.xxxxx.supabase.co
SUPABASE_CLOUD_PORT=5432
SUPABASE_CLOUD_USER=postgres
SUPABASE_CLOUD_DB=postgres
SUPABASE_CLOUD_PASSWORD=votre-mot-de-passe

# URL Supabase Cloud pour l'API Storage
SUPABASE_CLOUD_URL=https://xxxxx.supabase.co
SERVICE_ROLE_KEY_CLOUD=votre-service-role-key-cloud
```

### 4.3 Démarrer les services Supabase

```bash
# Démarrer uniquement Supabase d'abord
docker-compose up -d supabase-db supabase-kong supabase-rest supabase-storage

# Attendre que les services soient prêts (30-60 secondes)
docker-compose ps
```

### 4.4 Migrer la base de données

```bash
# Installer PostgreSQL client si nécessaire
sudo apt-get install -y postgresql-client

# Exécuter le script de migration
chmod +x scripts/migrate-database.sh
./scripts/migrate-database.sh
```

Ce script :
- Exporte la base depuis Supabase cloud
- Importe dans votre base locale
- Applique les migrations

### 4.5 Migrer les buckets Storage

```bash
# Installer jq si nécessaire
sudo apt-get install -y jq

# Exécuter le script de migration
chmod +x scripts/migrate-storage.sh
./scripts/migrate-storage.sh
```

**Note :** Si le script automatique ne fonctionne pas, téléchargez manuellement les fichiers depuis le dashboard Supabase et placez-les dans `backups/storage/`.

### 4.6 Recréer les politiques RLS Storage

```bash
# Se connecter à la base de données
docker-compose exec supabase-db psql -U postgres -d postgres

# Dans psql, exécuter les scripts SQL
\i /opt/portal-formations/setup-submissions-storage.sql
\i /opt/portal-formations/setup-course-assets-storage.sql
\i /opt/portal-formations/creer-bucket-resources.sql
\i /opt/portal-formations/setup-item-documents-storage.sql
\q
```

Ou depuis l'extérieur :

```bash
# Récupérer POSTGRES_PASSWORD depuis .env.production
source .env.production

# Exécuter les scripts
PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -p 54322 -U postgres -d postgres -f setup-submissions-storage.sql
PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -p 54322 -U postgres -d postgres -f setup-course-assets-storage.sql
PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -p 54322 -U postgres -d postgres -f creer-bucket-resources.sql
PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -p 54322 -U postgres -d postgres -f setup-item-documents-storage.sql
```

## 🚀 Étape 5 : Démarrer l'application complète

```bash
# Construire et démarrer tous les services
docker-compose build
docker-compose up -d

# Vérifier les logs
docker-compose logs -f

# Vérifier le statut
docker-compose ps
```

## ✅ Étape 6 : Vérifications

```bash
# 1. Vérifier la base de données
docker-compose exec supabase-db psql -U postgres -d postgres -c "SELECT COUNT(*) FROM profiles;"

# 2. Vérifier l'API Supabase
curl http://localhost:8000/rest/v1/

# 3. Vérifier le frontend
curl http://localhost/

# 4. Vérifier le backend
curl http://localhost:3001/health
```

## 🌐 Étape 7 : Configuration du domaine (Optionnel)

Si vous avez un domaine :

1. **Configurer DNS** : Pointer votre domaine vers l'IP du VPS
2. **Installer Nginx et Certbot** :
   ```bash
   sudo apt-get install -y nginx certbot python3-certbot-nginx
   ```

3. **Configurer Nginx** : Voir `DEPLOYMENT.md` section "Configuration HTTPS avec Nginx"

4. **Obtenir certificat SSL** :
   ```bash
   sudo certbot --nginx -d votre-domaine.com
   ```

## 📊 Checklist de migration

- [ ] VPS préparé avec Docker et Docker Compose
- [ ] Code déployé sur le VPS
- [ ] Variables d'environnement configurées
- [ ] Secrets générés (POSTGRES_PASSWORD, JWT_SECRET, etc.)
- [ ] Services Supabase démarrés
- [ ] Base de données migrée depuis Supabase cloud
- [ ] Buckets Storage migrés
- [ ] Politiques RLS Storage recréées
- [ ] Application complète démarrée
- [ ] Tests de fonctionnement effectués
- [ ] Domaine configuré (si applicable)
- [ ] HTTPS configuré (si domaine)
- [ ] Backups automatiques configurés

## 🔄 Mise à jour future

Pour mettre à jour l'application après des modifications :

```bash
# Sur le VPS
cd /opt/portal-formations

# Pull les dernières modifications (si Git)
git pull

# Reconstruire et redémarrer
docker-compose build
docker-compose up -d

# Appliquer les nouvelles migrations si nécessaire
docker-compose exec supabase-db psql -U postgres -d postgres -f /path/to/new-migration.sql
```

## 🐛 Problèmes courants

### Erreur de connexion à Supabase Cloud

```bash
# Vérifier que vous pouvez vous connecter
psql "postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres" -c "SELECT 1;"

# Si erreur, vérifier :
# - Le mot de passe est correct
# - Le firewall autorise la connexion
# - L'URL de connexion est correcte
```

### Les buckets ne se téléchargent pas

Le script automatique peut échouer. Solution manuelle :

1. Aller sur https://app.supabase.com
2. Storage → Sélectionner chaque bucket
3. Télécharger tous les fichiers
4. Les placer dans `backups/storage/[bucket-name]_[timestamp]/`
5. Relancer `./scripts/migrate-storage.sh`

### Services ne démarrent pas

```bash
# Vérifier les logs
docker-compose logs supabase-db
docker-compose logs backend
docker-compose logs frontend

# Vérifier les ports disponibles
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :5432
```

## 📞 Support

En cas de problème :
1. Vérifier les logs : `docker-compose logs -f`
2. Consulter `DEPLOYMENT.md` pour plus de détails
3. Vérifier que tous les services sont "healthy" : `docker-compose ps`
