#!/bin/bash

# Script de migration des buckets Storage Supabase
# Export depuis Supabase cloud et upload vers Supabase self-hosted

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups/storage"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Buckets à migrer
BUCKETS=("submissions" "course-assets" "project-files" "resources" "item-documents" "course-resources")

# Charger les variables d'environnement
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Vérifier les variables nécessaires
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$ANON_KEY" ]; then
    echo -e "${RED}Erreur: Variables d'environnement Supabase manquantes${NC}"
    echo "Définissez VITE_SUPABASE_URL et ANON_KEY dans .env.production"
    exit 1
fi

# Vérifier que supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}Supabase CLI non trouvé. Installation...${NC}"
    echo "Installez-le avec: npm install -g supabase"
    echo "Ou téléchargez depuis: https://github.com/supabase/cli"
    exit 1
fi

# Créer le dossier de backup
mkdir -p "$BACKUP_DIR"

echo -e "${GREEN}=== Migration des buckets Storage Supabase ===${NC}"
echo ""

# Fonction pour télécharger un bucket depuis Supabase cloud
download_bucket() {
    local bucket_name=$1
    local backup_path="${BACKUP_DIR}/${bucket_name}_${TIMESTAMP}"
    
    echo -e "${BLUE}📦 Téléchargement du bucket: $bucket_name${NC}"
    
    mkdir -p "$backup_path"
    
    # Utiliser supabase CLI pour lister les fichiers
    # Note: Cette partie nécessite d'être adaptée selon votre méthode d'accès
    # Si vous avez un accès direct au storage S3 de Supabase cloud, utilisez aws-cli
    # Sinon, utilisez l'API Supabase Storage
    
    echo -e "${YELLOW}  ⚠ Méthode manuelle recommandée:${NC}"
    echo "    1. Connectez-vous à votre dashboard Supabase cloud"
    echo "    2. Allez dans Storage > $bucket_name"
    echo "    3. Téléchargez tous les fichiers vers: $backup_path"
    echo ""
    
    # Alternative: Utiliser l'API Supabase Storage avec curl
    # Cette partie nécessite le SERVICE_ROLE_KEY pour accéder à tous les fichiers
    if [ ! -z "$SERVICE_ROLE_KEY" ] && [ ! -z "$SUPABASE_CLOUD_URL" ]; then
        echo -e "${YELLOW}  Tentative de téléchargement via API...${NC}"
        
        # Lister les fichiers du bucket
        FILES_JSON=$(curl -s -X POST \
            "${SUPABASE_CLOUD_URL}/storage/v1/bucket/${bucket_name}/list" \
            -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
            -H "apikey: ${SERVICE_ROLE_KEY}")
        
        if [ $? -eq 0 ]; then
            echo "$FILES_JSON" | jq -r '.[] | .name' | while read file_path; do
                if [ ! -z "$file_path" ]; then
                    echo "    Téléchargement: $file_path"
                    mkdir -p "$backup_path/$(dirname "$file_path")"
                    
                    curl -s -X GET \
                        "${SUPABASE_CLOUD_URL}/storage/v1/object/${bucket_name}/${file_path}" \
                        -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
                        -H "apikey: ${SERVICE_ROLE_KEY}" \
                        -o "$backup_path/$file_path" || true
                fi
            done
        fi
    fi
    
    if [ -d "$backup_path" ] && [ "$(ls -A $backup_path 2>/dev/null)" ]; then
        echo -e "${GREEN}  ✓ Bucket téléchargé: $backup_path${NC}"
        return 0
    else
        echo -e "${YELLOW}  ⚠ Bucket vide ou téléchargement manuel requis${NC}"
        return 1
    fi
}

# Fonction pour uploader un bucket vers Supabase self-hosted
upload_bucket() {
    local bucket_name=$1
    local backup_path="${BACKUP_DIR}/${bucket_name}_${TIMESTAMP}"
    
    if [ ! -d "$backup_path" ] || [ -z "$(ls -A $backup_path 2>/dev/null)" ]; then
        echo -e "${YELLOW}  ⚠ Aucun fichier à uploader pour $bucket_name${NC}"
        return 1
    fi
    
    echo -e "${BLUE}📤 Upload du bucket: $bucket_name${NC}"
    
    # Vérifier que le bucket existe (créer si nécessaire)
    BUCKET_EXISTS=$(curl -s -X GET \
        "${VITE_SUPABASE_URL}/storage/v1/bucket/${bucket_name}" \
        -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
        -H "apikey: ${SERVICE_ROLE_KEY}" | jq -r '.name // empty')
    
    if [ -z "$BUCKET_EXISTS" ]; then
        echo -e "${YELLOW}  Création du bucket $bucket_name...${NC}"
        curl -s -X POST \
            "${VITE_SUPABASE_URL}/storage/v1/bucket" \
            -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
            -H "apikey: ${SERVICE_ROLE_KEY}" \
            -H "Content-Type: application/json" \
            -d "{\"id\":\"${bucket_name}\",\"name\":\"${bucket_name}\",\"public\":false}" > /dev/null
    fi
    
    # Uploader tous les fichiers
    find "$backup_path" -type f | while read file_path; do
        relative_path="${file_path#$backup_path/}"
        echo "    Upload: $relative_path"
        
        curl -s -X POST \
            "${VITE_SUPABASE_URL}/storage/v1/object/${bucket_name}/${relative_path}" \
            -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
            -H "apikey: ${SERVICE_ROLE_KEY}" \
            -H "Content-Type: $(file --mime-type -b "$file_path")" \
            --data-binary "@$file_path" > /dev/null || echo -e "${RED}    ✗ Erreur pour $relative_path${NC}"
    done
    
    echo -e "${GREEN}  ✓ Bucket uploadé${NC}"
}

# Boucle principale
for bucket in "${BUCKETS[@]}"; do
    echo -e "${GREEN}--- Traitement du bucket: $bucket ---${NC}"
    
    # Télécharger
    if download_bucket "$bucket"; then
        # Uploader
        upload_bucket "$bucket"
    else
        echo -e "${YELLOW}⚠ Téléchargement manuel requis pour $bucket${NC}"
    fi
    
    echo ""
done

echo -e "${GREEN}=== Migration des buckets terminée ===${NC}"
echo ""
echo "Note: Les politiques RLS Storage doivent être recréées manuellement"
echo "      Utilisez les scripts SQL dans le dossier racine:"
echo "      - setup-submissions-storage.sql"
echo "      - setup-course-assets-storage.sql"
echo "      - creer-bucket-resources.sql"
echo "      - setup-item-documents-storage.sql"
