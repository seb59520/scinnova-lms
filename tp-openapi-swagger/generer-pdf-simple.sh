#!/bin/bash

# Script simple pour générer un PDF avec Pandoc
# Prérequis: pandoc et un moteur LaTeX (xelatex, pdflatex, etc.)

echo "📄 Génération du PDF complet du TP..."
echo ""

# Vérifier si pandoc est installé
if ! command -v pandoc &> /dev/null; then
    echo "❌ Pandoc n'est pas installé."
    echo "   Installation:"
    echo "   - macOS: brew install pandoc basictex"
    echo "   - Linux: sudo apt-get install pandoc texlive-latex-base"
    echo "   - Windows: Téléchargez depuis https://pandoc.org/installing.html"
    exit 1
fi

# Vérifier si les fichiers existent
FILES=("TP_ENONCE.md" "ACTIONS_ETUDIANTS.md" "CHECKLIST.md" "README.md")
for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "⚠️  Fichier $file non trouvé"
    fi
done

# Générer le PDF
echo "🔄 Génération en cours..."
pandoc \
    TP_ENONCE.md \
    ACTIONS_ETUDIANTS.md \
    CHECKLIST.md \
    README.md \
    -o TP-OpenAPI-Swagger-COMPLET.pdf \
    --pdf-engine=xelatex \
    -V geometry:margin=2cm \
    -V fontsize=11pt \
    --toc \
    --toc-depth=3 \
    -V colorlinks=true \
    -V linkcolor=blue \
    -V urlcolor=blue \
    --highlight-style=tango

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ PDF généré avec succès !"
    echo "📄 Fichier: TP-OpenAPI-Swagger-COMPLET.pdf"
    echo ""
    # Afficher la taille du fichier
    if command -v du &> /dev/null; then
        SIZE=$(du -h TP-OpenAPI-Swagger-COMPLET.pdf | cut -f1)
        echo "📊 Taille: $SIZE"
    fi
else
    echo ""
    echo "❌ Erreur lors de la génération du PDF"
    echo "   Vérifiez que xelatex est installé"
    exit 1
fi

