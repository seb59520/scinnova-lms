#!/bin/bash

# Script pour déployer le projet sur le VPS
# Usage: ./scripts/deploy-to-vps.sh [vps-user@vps-ip]

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

VPS_TARGET="${1:-root@votre-vps-ip}"
VPS_DIR="/opt/portal-formations"

echo -e "${GREEN}=== Déploiement vers VPS ===${NC}"
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Erreur: Ce script doit être exécuté depuis la racine du projet${NC}"
    exit 1
fi

# Vérifier la connexion SSH
echo -e "${BLUE}[1/5] Vérification de la connexion SSH...${NC}"
if ! ssh -o ConnectTimeout=5 "$VPS_TARGET" "echo 'Connexion OK'" 2>/dev/null; then
    echo -e "${RED}✗ Impossible de se connecter au VPS${NC}"
    echo "Usage: $0 user@vps-ip"
    exit 1
fi
echo -e "${GREEN}✓ Connexion SSH établie${NC}"
echo ""

# Créer l'archive
echo -e "${BLUE}[2/5] Création de l'archive...${NC}"
ARCHIVE_NAME="portal-formations-$(date +%Y%m%d_%H%M%S).tar.gz"

tar -czf "/tmp/$ARCHIVE_NAME" \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='backups' \
  --exclude='.env' \
  --exclude='.env.production' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  .

ARCHIVE_SIZE=$(du -h "/tmp/$ARCHIVE_NAME" | cut -f1)
echo -e "${GREEN}✓ Archive créée: $ARCHIVE_NAME (${ARCHIVE_SIZE})${NC}"
echo ""

# Transférer l'archive
echo -e "${BLUE}[3/5] Transfert vers le VPS...${NC}"
scp "/tmp/$ARCHIVE_NAME" "$VPS_TARGET:/tmp/"
echo -e "${GREEN}✓ Archive transférée${NC}"
echo ""

# Extraire sur le VPS
echo -e "${BLUE}[4/5] Extraction sur le VPS...${NC}"
ssh "$VPS_TARGET" << EOF
    # Créer le répertoire si nécessaire
    mkdir -p $VPS_DIR
    
    # Sauvegarder l'ancienne version si elle existe
    if [ -d "$VPS_DIR" ] && [ "\$(ls -A $VPS_DIR)" ]; then
        echo "Sauvegarde de l'ancienne version..."
        mv $VPS_DIR "${VPS_DIR}.backup.\$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Extraire la nouvelle version
    cd /opt
    tar -xzf "/tmp/$ARCHIVE_NAME" -C "$VPS_DIR" --strip-components=0
    
    # Nettoyer
    rm "/tmp/$ARCHIVE_NAME"
    
    echo "✓ Extraction terminée"
EOF
echo -e "${GREEN}✓ Extraction terminée${NC}"
echo ""

# Instructions finales
echo -e "${BLUE}[5/5] Instructions finales${NC}"
echo ""
echo -e "${YELLOW}Sur le VPS, exécutez :${NC}"
echo ""
echo "  cd $VPS_DIR"
echo ""
echo "  # 1. Configurer automatiquement les fichiers .env"
echo "  chmod +x scripts/setup-env-on-vps.sh"
echo "  ./scripts/setup-env-on-vps.sh"
echo ""
echo "  # 2. Éditer les variables importantes (URLs, etc.)"
echo "  nano .env.production"
echo ""
echo "  # 3. Démarrer les services"
echo "  docker-compose up -d"
echo ""
echo "  # 4. Migrer les données (si nécessaire)"
echo "  ./scripts/migrate-database.sh"
echo "  ./scripts/migrate-storage.sh"
echo ""
echo -e "${GREEN}=== Déploiement terminé ===${NC}"
echo ""
echo "Consultez MIGRATION-VPS.md pour les instructions complètes"

# Nettoyer l'archive locale
rm "/tmp/$ARCHIVE_NAME"
