#!/bin/bash

# Script pour mettre à jour le port dans le TP JSON

echo "🔍 Détection du port utilisé par l'application..."

# Chercher le processus Vite
VITE_PORT=$(lsof -ti:5173 2>/dev/null && echo "5173" || echo "")

if [ -z "$VITE_PORT" ]; then
  echo "⚠️  Aucun processus trouvé sur le port 5173"
  echo ""
  echo "Lancez d'abord l'application :"
  echo "  cd big-data-impacts-app && npm run dev"
  echo ""
  read -p "Sur quel port l'application tourne-t-elle ? (par défaut 5173): " PORT
  PORT=${PORT:-5173}
else
  PORT=5173
  echo "✅ Port 5173 détecté"
fi

echo ""
echo "📝 Mise à jour du TP avec le port $PORT..."

# Mettre à jour le TP JSON
sed -i '' "s|\"external_url\": \"http://localhost:[0-9]*\"|\"external_url\": \"http://localhost:$PORT\"|g" portal-formations/tp-big-data-data-science-impacts.json

echo "✅ TP mis à jour avec http://localhost:$PORT"
echo ""
echo "Vous pouvez maintenant importer le TP dans le LMS."


