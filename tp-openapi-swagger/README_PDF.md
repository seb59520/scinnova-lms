# Génération du PDF du TP

Ce guide explique comment générer un PDF complet du TP à partir des fichiers markdown.

## 📋 Prérequis

- Node.js 18+ installé
- npm installé

## 🚀 Génération du PDF

### Étape 1 : Installer les dépendances

```bash
npm install
```

Cela installera `puppeteer` nécessaire pour la génération du PDF.

### Étape 2 : Générer le PDF

```bash
npm run generate-pdf
```

Ou directement :

```bash
node generer-pdf.js
```

### Étape 3 : Récupérer le PDF

Le PDF sera généré dans le fichier :
```
TP-OpenAPI-Swagger-COMPLET.pdf
```

## 📄 Contenu du PDF

Le PDF généré contient :

1. **Énoncé du TP** (`TP_ENONCE.md`)
   - Contexte et objectifs
   - Prérequis
   - Périmètre fonctionnel
   - Étapes détaillées
   - Exemples d'appels curl

2. **Actions concrètes** (`ACTIONS_ETUDIANTS.md`)
   - Checklist des actions à réaliser
   - Instructions étape par étape
   - Code complet pour chaque étape
   - Vérifications à faire

3. **Checklist de conformité** (`CHECKLIST.md`)
   - Vérification OpenAPI 3
   - Vérification Swagger UI
   - Vérification de l'implémentation
   - Score de conformité

4. **Exemples et documentation** (`README.md`)
   - Exemples d'appels curl
   - Structure du projet
   - Dépannage

## 🎨 Format du PDF

- **Format** : A4
- **Marges** : 2cm de chaque côté
- **En-têtes et pieds de page** : Numérotation automatique
- **Style** : Professionnel avec code coloré
- **Table des matières** : Navigation facilitée

## 🔧 Personnalisation

Pour modifier le contenu du PDF :

1. Éditez les fichiers markdown source :
   - `TP_ENONCE.md`
   - `ACTIONS_ETUDIANTS.md`
   - `CHECKLIST.md`
   - `README.md`

2. Régénérez le PDF :
   ```bash
   npm run generate-pdf
   ```

## 📦 Partage du PDF

Le PDF généré peut être :
- Partagé directement avec les étudiants
- Mis en ligne sur votre LMS
- Imprimé pour distribution papier
- Archivé pour référence future

## 🐛 Dépannage

### Erreur : Puppeteer non installé

```bash
npm install puppeteer
```

### Erreur : Chrome/Chromium non trouvé

Puppeteer télécharge automatiquement Chromium. Si cela échoue :
- Vérifiez votre connexion internet
- Vérifiez les permissions d'écriture dans le dossier

### Le PDF est vide ou mal formaté

- Vérifiez que tous les fichiers markdown existent
- Vérifiez les erreurs dans la console
- Vérifiez que les fichiers markdown sont valides

---

**Le PDF est prêt à être partagé ! 📄**



