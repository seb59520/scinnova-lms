# Dépannage des fichiers .env

## Problème : Les variables d'environnement ne sont pas chargées

### Symptômes
- `docker-compose up` affiche des erreurs comme `${POSTGRES_PASSWORD}` non résolu
- Les services démarrent mais ne peuvent pas se connecter
- Les variables sont vides dans les conteneurs

### Solution rapide

```bash
# Sur le VPS
cd /opt/portal-formations

# 1. Configurer automatiquement les .env
./scripts/setup-env-on-vps.sh

# 2. Corriger les problèmes de chargement
./scripts/fix-env-on-vps.sh

# 3. Vérifier
docker-compose config | head -20
```

### Solution manuelle

#### Étape 1 : Créer les fichiers .env

```bash
cd /opt/portal-formations

# Créer .env.production
cp env.production.example .env.production

# Créer docker/supabase/.env
cp docker/supabase/.env.example docker/supabase/.env
```

#### Étape 2 : Générer les secrets

```bash
# Générer les secrets et les ajouter à .env.production
POSTGRES_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
ANON_KEY=$(openssl rand -base64 32)
SERVICE_ROLE_KEY=$(openssl rand -base64 32)

# Ajouter au fichier
cat >> .env.production << EOF
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
JWT_SECRET=$JWT_SECRET
ANON_KEY=$ANON_KEY
SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
EOF
```

#### Étape 3 : Créer le lien .env

Docker Compose charge automatiquement le fichier `.env` (pas `.env.production`).

```bash
# Créer un lien symbolique
ln -sf .env.production .env

# Vérifier
ls -la .env
# Devrait afficher: .env -> .env.production
```

#### Étape 4 : Vérifier le chargement

```bash
# Tester que docker-compose peut charger les variables
docker-compose config | grep POSTGRES_PASSWORD

# Si ça affiche la valeur (pas ${POSTGRES_PASSWORD}), c'est bon !
```

### Vérification des variables

```bash
# Voir toutes les variables chargées
docker-compose config

# Voir une variable spécifique
docker-compose config | grep POSTGRES_PASSWORD

# Tester dans un conteneur
docker-compose run --rm backend env | grep SUPABASE
```

### Problèmes courants

#### 1. Le fichier .env n'existe pas

```bash
# Créer le lien
ln -sf .env.production .env
```

#### 2. Les variables contiennent encore "change-me"

```bash
# Régénérer les secrets
./scripts/setup-env-on-vps.sh
```

#### 3. docker-compose ne trouve pas les variables

```bash
# Vérifier que le fichier .env existe et est lisible
ls -la .env
cat .env | head -5

# Vérifier les permissions
chmod 600 .env.production
```

#### 4. Les variables sont chargées mais vides dans les conteneurs

Vérifiez que les variables sont bien exportées dans `docker-compose.yml` :

```yaml
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

Si vous utilisez `env_file`, vérifiez le chemin :

```yaml
env_file:
  - .env.production  # Chemin relatif depuis docker-compose.yml
```

### Structure recommandée

```
portal-formations/
├── .env                    # Lien symbolique vers .env.production
├── .env.production         # Fichier principal (versionné comme .example)
├── docker/
│   └── supabase/
│       └── .env            # Configuration Supabase spécifique
└── docker-compose.yml      # Charge .env automatiquement
```

### Commandes utiles

```bash
# Voir les variables chargées
docker-compose config

# Tester une commande avec les variables
docker-compose run --rm backend env

# Recharger les variables (redémarrer les services)
docker-compose down
docker-compose up -d

# Vérifier les variables dans un conteneur
docker-compose exec backend env | grep SUPABASE
```

### Scripts disponibles

- `./scripts/setup-env-on-vps.sh` : Configuration initiale automatique
- `./scripts/fix-env-on-vps.sh` : Correction des problèmes de chargement

### Support

Si le problème persiste :

1. Vérifiez les logs : `docker-compose logs`
2. Vérifiez la configuration : `docker-compose config`
3. Vérifiez les fichiers : `ls -la .env*`
4. Testez manuellement : `source .env.production && echo $POSTGRES_PASSWORD`
