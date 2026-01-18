#!/bin/bash

# Script pour créer les fichiers .env directement sur le VPS
# À exécuter sur le VPS si les fichiers .env.example n'existent pas

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"

echo -e "${GREEN}=== Création des fichiers .env ===${NC}"
echo ""

# Créer le répertoire docker/supabase si nécessaire
mkdir -p docker/supabase

# 1. Créer docker/supabase/.env
echo -e "${BLUE}[1/2] Création de docker/supabase/.env...${NC}"
if [ ! -f "docker/supabase/.env" ]; then
    cat > docker/supabase/.env << 'EOF'
# Supabase Self-Hosted Configuration
# Générer des secrets sécurisés avec: openssl rand -base64 32

# Database
POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password-change-this

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long-change-this
JWT_EXP=3600

# API Keys (générer avec: openssl rand -base64 32)
ANON_KEY=your-anon-key-here-change-this
SERVICE_ROLE_KEY=your-service-role-key-here-change-this

# URLs
API_EXTERNAL_URL=http://localhost:8000
SITE_URL=http://localhost:3000

# Studio
STUDIO_DEFAULT_ORGANIZATION=Default Organization
STUDIO_DEFAULT_PROJECT=Default Project

# Auth Configuration
DISABLE_SIGNUP=false
ENABLE_EMAIL_SIGNUP=true
ENABLE_PHONE_SIGNUP=false
URI_ALLOW_LIST=

# Email Configuration (optionnel)
SMTP_ADMIN_EMAIL=
SMTP_ADMIN_PASSWORD=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SENDER_NAME=Portal Formations

# OAuth Providers (optionnel)
ENABLE_GOOGLE_SIGNUP=false
GOOGLE_CLIENT_ID=
GOOGLE_SECRET=

ENABLE_APPLE_SIGNUP=false
APPLE_CLIENT_ID=
APPLE_SECRET=

# PostgREST
PGRST_DB_SCHEMAS=public,storage,graphql_public

# Image Proxy
IMGPROXY_ENABLE_WEBP_DETECTION=true
EOF
    echo -e "${GREEN}✓ docker/supabase/.env créé${NC}"
else
    echo -e "${YELLOW}⚠ docker/supabase/.env existe déjà${NC}"
fi
echo ""

# 2. Générer les secrets et les remplacer
echo -e "${BLUE}[2/2] Génération des secrets...${NC}"

# Fonction pour générer et remplacer un secret
generate_and_replace() {
    local var_name=$1
    local current_value=$(grep "^${var_name}=" docker/supabase/.env 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    
    if [ -z "$current_value" ] || [[ "$current_value" == *"change-this"* ]] || [[ "$current_value" == *"your-"* ]]; then
        local new_secret=$(openssl rand -base64 32)
        # Échapper les caractères spéciaux pour sed
        local escaped_secret=$(echo "$new_secret" | sed 's/[[\.*^$()+?{|]/\\&/g')
        
        if grep -q "^${var_name}=" docker/supabase/.env; then
            # Remplacer la valeur existante
            sed -i "s|^${var_name}=.*|${var_name}=${escaped_secret}|" docker/supabase/.env
        else
            # Ajouter la nouvelle variable
            echo "${var_name}=${new_secret}" >> docker/supabase/.env
        fi
        echo -e "  ${GREEN}✓ ${var_name} généré${NC}"
    else
        echo -e "  ${YELLOW}⚠ ${var_name} existe déjà (non modifié)${NC}"
    fi
}

generate_and_replace "POSTGRES_PASSWORD"
generate_and_replace "JWT_SECRET"
generate_and_replace "ANON_KEY"
generate_and_replace "SERVICE_ROLE_KEY"

echo ""
echo -e "${GREEN}=== Fichiers .env créés ===${NC}"
echo ""
echo -e "${YELLOW}⚠ Important : Vérifiez et complétez les URLs dans :${NC}"
echo "  - .env.production (VITE_SUPABASE_URL, SITE_URL, etc.)"
echo "  - docker/supabase/.env (API_EXTERNAL_URL, SITE_URL)"
echo ""
echo -e "${BLUE}Pour éditer :${NC}"
echo "  nano .env.production"
echo "  nano docker/supabase/.env"
