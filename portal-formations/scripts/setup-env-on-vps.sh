#!/bin/bash

# Script pour configurer les fichiers .env sur le VPS
# À exécuter sur le VPS après le déploiement
# Usage: ./scripts/setup-env-on-vps.sh

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

echo -e "${GREEN}=== Configuration des fichiers .env ===${NC}"
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Erreur: Ce script doit être exécuté depuis la racine du projet${NC}"
    exit 1
fi

# 1. Créer .env.production depuis le template
echo -e "${BLUE}[1/4] Création de .env.production...${NC}"
if [ ! -f ".env.production" ]; then
    if [ -f "env.production.example" ]; then
        cp env.production.example .env.production
        echo -e "${GREEN}✓ .env.production créé depuis env.production.example${NC}"
    else
        echo -e "${RED}✗ Fichier env.production.example non trouvé${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ .env.production existe déjà (non écrasé)${NC}"
fi
echo ""

# 2. Créer docker/supabase/.env depuis le template
echo -e "${BLUE}[2/4] Création de docker/supabase/.env...${NC}"
mkdir -p docker/supabase
if [ ! -f "docker/supabase/.env" ]; then
    if [ -f "docker/supabase/.env.example" ]; then
        cp docker/supabase/.env.example docker/supabase/.env
        echo -e "${GREEN}✓ docker/supabase/.env créé${NC}"
    else
        echo -e "${YELLOW}⚠ docker/supabase/.env.example non trouvé, création d'un fichier vide${NC}"
        touch docker/supabase/.env
    fi
else
    echo -e "${YELLOW}⚠ docker/supabase/.env existe déjà (non écrasé)${NC}"
fi
echo ""

# 3. Générer les secrets si ils n'existent pas
echo -e "${BLUE}[3/4] Génération des secrets...${NC}"

# Fonction pour générer un secret s'il n'existe pas
generate_secret() {
    local var_name=$1
    local current_value=$(grep "^${var_name}=" .env.production 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    
    if [ -z "$current_value" ] || [[ "$current_value" == *"change-me"* ]] || [[ "$current_value" == *"your-"* ]]; then
        local new_secret=$(openssl rand -base64 32)
        # Échapper les caractères spéciaux pour sed
        local escaped_secret=$(echo "$new_secret" | sed 's/[[\.*^$()+?{|]/\\&/g')
        
        if grep -q "^${var_name}=" .env.production; then
            # Remplacer la valeur existante
            sed -i "s|^${var_name}=.*|${var_name}=${escaped_secret}|" .env.production
        else
            # Ajouter la nouvelle variable
            echo "${var_name}=${new_secret}" >> .env.production
        fi
        echo -e "  ${GREEN}✓ ${var_name} généré${NC}"
        return 0
    else
        echo -e "  ${YELLOW}⚠ ${var_name} existe déjà (non modifié)${NC}"
        return 1
    fi
}

# Générer les secrets principaux
generate_secret "POSTGRES_PASSWORD"
generate_secret "JWT_SECRET"
generate_secret "ANON_KEY"
generate_secret "SERVICE_ROLE_KEY"

# Synchroniser les valeurs entre .env.production et docker/supabase/.env
echo ""
echo -e "${BLUE}[4/4] Synchronisation des valeurs...${NC}"

# Fonction pour synchroniser une variable
sync_var() {
    local var_name=$1
    local value=$(grep "^${var_name}=" .env.production 2>/dev/null | cut -d'=' -f2-)
    
    if [ ! -z "$value" ]; then
        if grep -q "^${var_name}=" docker/supabase/.env; then
            sed -i "s|^${var_name}=.*|${var_name}=${value}|" docker/supabase/.env
        else
            echo "${var_name}=${value}" >> docker/supabase/.env
        fi
    fi
}

# Synchroniser les variables communes
sync_var "POSTGRES_PASSWORD"
sync_var "JWT_SECRET"
sync_var "JWT_EXP"
sync_var "ANON_KEY"
sync_var "SERVICE_ROLE_KEY"
sync_var "API_EXTERNAL_URL"
sync_var "SITE_URL"

echo -e "${GREEN}✓ Synchronisation terminée${NC}"
echo ""

# Résumé
echo -e "${GREEN}=== Configuration terminée ===${NC}"
echo ""
echo -e "${YELLOW}⚠ IMPORTANT : Vérifiez et complétez les fichiers suivants :${NC}"
echo ""
echo "  1. .env.production"
echo "     - VITE_SUPABASE_URL (URL de votre VPS)"
echo "     - SITE_URL"
echo "     - API_EXTERNAL_URL"
echo "     - Variables Supabase Cloud (pour migration)"
echo ""
echo "  2. docker/supabase/.env"
echo "     - Vérifiez que toutes les valeurs sont correctes"
echo ""
echo -e "${BLUE}Commandes pour éditer :${NC}"
echo "  nano .env.production"
echo "  nano docker/supabase/.env"
echo ""
echo -e "${GREEN}Une fois configuré, vous pouvez démarrer les services :${NC}"
echo "  docker-compose up -d"
