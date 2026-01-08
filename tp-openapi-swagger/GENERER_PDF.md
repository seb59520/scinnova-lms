# Guide : Générer un PDF complet du TP

Ce guide explique plusieurs méthodes pour générer un PDF à partir des documents du TP.

## 📋 Méthode 1 : Script automatique (recommandé)

### Prérequis

```bash
npm install puppeteer --save-dev
```

### Génération

```bash
npm run generate-pdf
```

Le PDF sera généré dans `TP-OpenAPI-Swagger-COMPLET.pdf`

---

## 📋 Méthode 2 : Utiliser un outil en ligne (simple)

### Option A : Markdown to PDF (markdowntopdf.com)

1. Allez sur [markdowntopdf.com](https://www.markdowntopdf.com/)
2. Copiez le contenu de `TP_ENONCE.md`
3. Collez dans l'éditeur
4. Cliquez sur "Download PDF"
5. Répétez pour `ACTIONS_ETUDIANTS.md` et `CHECKLIST.md`
6. Fusionnez les PDFs avec un outil en ligne

### Option B : Dillinger.io

1. Allez sur [dillinger.io](https://dillinger.io/)
2. Importez ou collez le contenu markdown
3. Cliquez sur "Export as" → "PDF"
4. Répétez pour chaque fichier

---

## 📋 Méthode 3 : Utiliser Pandoc (professionnel)

### Installation

**macOS :**
```bash
brew install pandoc
brew install basictex
```

**Linux :**
```bash
sudo apt-get install pandoc texlive-latex-base
```

**Windows :**
Téléchargez depuis [pandoc.org](https://pandoc.org/installing.html)

### Génération

```bash
# Générer un PDF depuis l'énoncé
pandoc TP_ENONCE.md -o TP-ENONCE.pdf --pdf-engine=xelatex -V geometry:margin=2cm

# Générer un PDF depuis les actions
pandoc ACTIONS_ETUDIANTS.md -o ACTIONS.pdf --pdf-engine=xelatex -V geometry:margin=2cm

# Fusionner tous les documents
pandoc TP_ENONCE.md ACTIONS_ETUDIANTS.md CHECKLIST.md README.md -o TP-COMPLET.pdf --pdf-engine=xelatex -V geometry:margin=2cm --toc
```

---

## 📋 Méthode 4 : Utiliser VS Code (simple)

### Extension Markdown PDF

1. Installez l'extension "Markdown PDF" dans VS Code
2. Ouvrez `TP_ENONCE.md`
3. Clic droit → "Markdown PDF: Export (pdf)"
4. Répétez pour les autres fichiers

---

## 📋 Méthode 5 : Utiliser un service cloud

### Option A : GitHub Actions

Créez un workflow GitHub Actions qui génère automatiquement le PDF à chaque commit.

### Option B : GitLab CI/CD

Utilisez un pipeline GitLab pour générer le PDF.

---

## 📋 Méthode 6 : Conversion manuelle

1. Ouvrez les fichiers markdown dans un éditeur qui supporte l'export PDF
2. Utilisez "Imprimer" → "Enregistrer en PDF"
3. Fusionnez les PDFs avec un outil comme :
   - [PDF24](https://tools.pdf24.org/fr/fusionner-pdf)
   - [ILovePDF](https://www.ilovepdf.com/fr/fusionner-pdf)
   - Adobe Acrobat

---

## 🎯 Recommandation

Pour un résultat professionnel et automatisé, utilisez **Pandoc** (Méthode 3).

Pour une solution rapide sans installation, utilisez **Dillinger.io** (Méthode 2, Option B).

---

## 📄 Contenu à inclure dans le PDF

Le PDF complet devrait contenir :

1. **Page de garde**
   - Titre du TP
   - Niveau et durée
   - Date

2. **Table des matières**

3. **Énoncé du TP** (`TP_ENONCE.md`)
   - Contexte
   - Objectifs
   - Prérequis
   - Périmètre fonctionnel
   - Étapes détaillées
   - Exemples curl

4. **Actions concrètes** (`ACTIONS_ETUDIANTS.md`)
   - Checklist
   - Instructions étape par étape
   - Code complet

5. **Checklist de conformité** (`CHECKLIST.md`)
   - Vérifications OpenAPI
   - Vérifications Swagger UI
   - Score de conformité

6. **Documentation** (`README.md`)
   - Exemples d'appels
   - Structure du projet
   - Dépannage

---

## ✅ Vérification du PDF généré

Avant de partager le PDF, vérifiez :

- [ ] Toutes les pages sont présentes
- [ ] Le code est bien formaté et lisible
- [ ] Les tableaux sont correctement alignés
- [ ] Les liens sont cliquables (si possible)
- [ ] La table des matières fonctionne
- [ ] Les numéros de page sont présents
- [ ] Le style est cohérent

---

**Le PDF est prêt à être partagé ! 📄**



