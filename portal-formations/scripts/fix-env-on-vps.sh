#!/bin/bash

# Script de correction pour les fichiers .env sur le VPS
# À exécuter si les variables d'environnement ne sont pas chargées

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

echo -e "${GREEN}=== Correction des fichiers .env ===${NC}"
echo ""

# Vérifier que .env.production existe
if [ ! -f ".env.production" ]; then
    echo -e "${RED}✗ Fichier .env.production non trouvé${NC}"
    echo "Exécutez d'abord: ./scripts/setup-env-on-vps.sh"
    exit 1
fi

# 1. Créer un lien symbolique .env -> .env.production
echo -e "${BLUE}[1/3] Création du lien .env -> .env.production...${NC}"
if [ -f ".env" ] && [ ! -L ".env" ]; then
    echo -e "${YELLOW}⚠ .env existe déjà (fichier normal)${NC}"
    read -p "Voulez-vous le remplacer par un lien vers .env.production? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        mv .env .env.backup.$(date +%Y%m%d_%H%M%S)
        ln -sf .env.production .env
        echo -e "${GREEN}✓ Lien créé (ancien .env sauvegardé)${NC}"
    else
        echo -e "${YELLOW}⚠ Lien non créé, docker-compose utilisera .env${NC}"
    fi
elif [ ! -f ".env" ]; then
    ln -sf .env.production .env
    echo -e "${GREEN}✓ Lien .env -> .env.production créé${NC}"
else
    echo -e "${GREEN}✓ Lien .env existe déjà${NC}"
fi
echo ""

# 2. Vérifier que les variables essentielles sont définies
echo -e "${BLUE}[2/3] Vérification des variables essentielles...${NC}"
source .env.production

MISSING_VARS=()

if [ -z "$POSTGRES_PASSWORD" ] || [[ "$POSTGRES_PASSWORD" == *"change-me"* ]]; then
    MISSING_VARS+=("POSTGRES_PASSWORD")
fi

if [ -z "$JWT_SECRET" ] || [[ "$JWT_SECRET" == *"change-me"* ]]; then
    MISSING_VARS+=("JWT_SECRET")
fi

if [ -z "$ANON_KEY" ] || [[ "$ANON_KEY" == *"change-me"* ]] || [[ "$ANON_KEY" == *"your-"* ]]; then
    MISSING_VARS+=("ANON_KEY")
fi

if [ -z "$SERVICE_ROLE_KEY" ] || [[ "$SERVICE_ROLE_KEY" == *"change-me"* ]] || [[ "$SERVICE_ROLE_KEY" == *"your-"* ]]; then
    MISSING_VARS+=("SERVICE_ROLE_KEY")
fi

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ Toutes les variables essentielles sont définies${NC}"
else
    echo -e "${YELLOW}⚠ Variables manquantes ou non configurées :${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo -e "${BLUE}Génération automatique...${NC}"
    ./scripts/setup-env-on-vps.sh
fi
echo ""

# 3. Vérifier que docker-compose peut charger les variables
echo -e "${BLUE}[3/3] Test de chargement des variables par docker-compose...${NC}"
if docker-compose config > /dev/null 2>&1; then
    echo -e "${GREEN}✓ docker-compose peut charger les variables${NC}"
    
    # Afficher quelques variables pour vérification
    echo ""
    echo -e "${YELLOW}Variables chargées (extrait) :${NC}"
    docker-compose config | grep -E "POSTGRES_PASSWORD|JWT_SECRET|ANON_KEY" | head -3 | sed 's/^/  /'
else
    echo -e "${RED}✗ Erreur lors du chargement des variables${NC}"
    echo "Vérifiez les erreurs ci-dessus :"
    docker-compose config
    exit 1
fi
echo ""

echo -e "${GREEN}=== Correction terminée ===${NC}"
echo ""
echo -e "${YELLOW}Prochaines étapes :${NC}"
echo "  1. Vérifiez les URLs dans .env.production :"
echo "     - VITE_SUPABASE_URL"
echo "     - SITE_URL"
echo "     - API_EXTERNAL_URL"
echo ""
echo "  2. Démarrer les services :"
echo "     docker-compose up -d"
echo ""
echo "  3. Vérifier les logs :"
echo "     docker-compose logs -f"
