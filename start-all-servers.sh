#!/bin/bash

# Script pour lancer les deux serveurs en parallèle

echo "🚀 Démarrage des serveurs..."
echo ""

# Couleurs pour les logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour nettoyer les processus à l'arrêt
cleanup() {
    echo ""
    echo "🛑 Arrêt des serveurs..."
    kill $FRONTEND_PID $BACKEND_PID 2>/dev/null
    exit
}

# Capturer Ctrl+C
trap cleanup SIGINT SIGTERM

# Lancer le serveur backend (portal-formations)
echo -e "${BLUE}📦 Démarrage du serveur backend (Express + Swagger)...${NC}"
cd portal-formations
npm run dev:server > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend démarré (PID: $BACKEND_PID)${NC}"
echo -e "${YELLOW}   → http://localhost:3001${NC}"
echo -e "${YELLOW}   → Swagger UI: http://localhost:3001/docs${NC}"
echo ""

# Retour au répertoire racine
cd ..

# Lancer le serveur frontend (React app)
echo -e "${BLUE}⚛️  Démarrage du serveur frontend (React + Vite)...${NC}"
cd big-data-impacts-app
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend démarré (PID: $FRONTEND_PID)${NC}"
echo -e "${YELLOW}   → http://localhost:5173${NC}"
echo ""

# Retour au répertoire racine
cd ..

echo -e "${GREEN}✅ Les deux serveurs sont démarrés !${NC}"
echo ""
echo "📊 Logs:"
echo "   - Backend: tail -f /tmp/backend.log"
echo "   - Frontend: tail -f /tmp/frontend.log"
echo ""
echo "🛑 Appuyez sur Ctrl+C pour arrêter les serveurs"
echo ""

# Attendre que les processus se terminent
wait

