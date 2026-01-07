#!/bin/bash

# Script d'installation des dépendances pour la fonctionnalité de téléchargement PDF

echo "📦 Installation des dépendances pour le téléchargement PDF..."

# Aller dans le dossier server
cd server

# Installer Puppeteer et @supabase/supabase-js
echo "Installing puppeteer and @supabase/supabase-js..."
npm install puppeteer @supabase/supabase-js

echo "✅ Dépendances installées avec succès !"
echo ""
echo "📝 Prochaines étapes :"
echo "1. Exécutez la migration SQL : add-pdf-download-feature.sql"
echo "2. Configurez les variables d'environnement dans le serveur backend"
echo "3. Redémarrez le serveur backend"
echo ""
echo "Pour plus d'informations, consultez GUIDE-TELECHARGEMENT-PDF.md"

