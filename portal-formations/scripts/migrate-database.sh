#!/bin/bash

# Script de migration de la base de données Supabase
# Export depuis Supabase cloud et import vers Supabase self-hosted

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="${BACKUP_DIR}/supabase_dump_${TIMESTAMP}.sql"

# Charger les variables d'environnement
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Vérifier les variables nécessaires
if [ -z "$SUPABASE_CLOUD_DB_URL" ] && [ -z "$SUPABASE_CLOUD_HOST" ]; then
    echo -e "${RED}Erreur: Variables d'environnement Supabase cloud manquantes${NC}"
    echo "Définissez SUPABASE_CLOUD_DB_URL ou SUPABASE_CLOUD_HOST dans .env.production"
    exit 1
fi

if [ -z "$POSTGRES_PASSWORD" ]; then
    echo -e "${RED}Erreur: POSTGRES_PASSWORD non défini${NC}"
    exit 1
fi

# Créer le dossier de backup
mkdir -p "$BACKUP_DIR"

echo -e "${GREEN}=== Migration de la base de données Supabase ===${NC}"

# Étape 1: Export depuis Supabase cloud
echo -e "${YELLOW}[1/4] Export de la base de données depuis Supabase cloud...${NC}"

if [ ! -z "$SUPABASE_CLOUD_DB_URL" ]; then
    # Utiliser l'URL complète
    pg_dump "$SUPABASE_CLOUD_DB_URL" > "$DUMP_FILE"
else
    # Utiliser les variables séparées
    pg_dump -h "$SUPABASE_CLOUD_HOST" \
            -p "${SUPABASE_CLOUD_PORT:-5432}" \
            -U "$SUPABASE_CLOUD_USER" \
            -d "$SUPABASE_CLOUD_DB" \
            > "$DUMP_FILE"
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Export réussi: $DUMP_FILE${NC}"
    DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
    echo "  Taille: $DUMP_SIZE"
else
    echo -e "${RED}✗ Erreur lors de l'export${NC}"
    exit 1
fi

# Étape 2: Attendre que la base de données locale soit prête
echo -e "${YELLOW}[2/4] Vérification de la connexion à la base locale...${NC}"

MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Base de données locale accessible${NC}"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "  Tentative $RETRY_COUNT/$MAX_RETRIES..."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}✗ Impossible de se connecter à la base de données locale${NC}"
    echo "  Vérifiez que les conteneurs Docker sont démarrés: docker-compose up -d"
    exit 1
fi

# Étape 3: Nettoyer la base locale (optionnel, commenté par défaut)
# echo -e "${YELLOW}[3/4] Nettoyage de la base locale...${NC}"
# PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -p 54322 -U postgres -d postgres -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"

# Étape 3: Restore dans la base locale
echo -e "${YELLOW}[3/4] Import dans la base de données locale...${NC}"

PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -p 54322 -U postgres -d postgres < "$DUMP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Import réussi${NC}"
else
    echo -e "${RED}✗ Erreur lors de l'import${NC}"
    exit 1
fi

# Étape 4: Appliquer les migrations
echo -e "${YELLOW}[4/4] Application des migrations...${NC}"

MIGRATIONS_DIR="./supabase/migrations"

if [ -d "$MIGRATIONS_DIR" ]; then
    for migration in $(ls -1 "$MIGRATIONS_DIR"/*.sql | sort); do
        echo "  Application: $(basename $migration)"
        PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -p 54322 -U postgres -d postgres -f "$migration" > /dev/null 2>&1 || true
    done
    echo -e "${GREEN}✓ Migrations appliquées${NC}"
else
    echo -e "${YELLOW}⚠ Dossier de migrations non trouvé: $MIGRATIONS_DIR${NC}"
fi

echo -e "${GREEN}=== Migration terminée avec succès ===${NC}"
echo ""
echo "Prochaines étapes:"
echo "  1. Vérifier les données: docker-compose exec supabase-db psql -U postgres -d postgres"
echo "  2. Migrer les buckets: ./scripts/migrate-storage.sh"
echo "  3. Vérifier l'application: http://localhost"
