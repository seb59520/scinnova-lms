# 📤 Guide pour les étudiants : Uploader votre JSON du TP Titanic

## 🎯 Où uploader votre JSON ?

Les étudiants peuvent uploader leur JSON du TP Titanic directement dans le LMS, sur la page du TP correspondant.

### 📍 Chemin d'accès

1. **Connectez-vous au LMS** avec vos identifiants
2. **Accédez au cours** contenant le TP Titanic
3. **Cliquez sur le TP** correspondant (ex: "TP 1 : Big Data - Exploration des données brutes")
4. **Sur la page du TP**, vous verrez automatiquement une section **"Importer vos réponses depuis l'application Titanic"**

### 🔍 Détection automatique

Le système détecte automatiquement si un TP est lié à Titanic en vérifiant :
- Le titre contient "Titanic", "Big Data", "Data Science" ou "Machine Learning"
- OU le champ `content.titanicModule` est défini dans l'item

## 📋 Étapes détaillées

### Étape 1 : Exporter depuis l'application Titanic

1. Allez sur [https://titaniclearning.netlify.app](https://titaniclearning.netlify.app)
2. Accédez au module correspondant :
   - **Module 1 : Big Data** → pour le TP Big Data
   - **Module 2 : Data Science** → pour le TP Data Science
   - **Module 3 : Machine Learning** → pour le TP Machine Learning
3. Répondez aux questions dans l'application
4. Cliquez sur **"Exporter mes réponses"** en bas de la page
5. Un fichier JSON est téléchargé (ex: `big-data-reponses.json`)

### Étape 2 : Importer dans le LMS

1. **Dans le LMS**, accédez à la page du TP correspondant
2. **Trouvez la section** "Importer vos réponses depuis l'application Titanic"
3. **Cliquez sur** "Sélectionner un fichier JSON"
4. **Choisissez le fichier** que vous avez exporté depuis l'application
5. **Cliquez sur** "Importer les réponses"
6. Un message de succès confirme que vos réponses ont été importées

### Étape 3 : Vérification

Après l'importation réussie :
- ✅ Un message de confirmation s'affiche
- ✅ Vos données sont sauvegardées automatiquement
- ✅ Vous pouvez voir un résumé de vos réponses importées
- ✅ Votre formateur peut maintenant accéder à vos réponses

## 🎨 Interface utilisateur

### Avant l'importation

```
┌─────────────────────────────────────────────────┐
│ 📄 Importer vos réponses depuis l'application   │
│    Titanic                                       │
├─────────────────────────────────────────────────┤
│ Instructions :                                  │
│ 1. Exportez vos réponses depuis                 │
│    titaniclearning.netlify.app                  │
│ 2. Cliquez sur "Exporter mes réponses"          │
│ 3. Téléchargez le fichier JSON                  │
│ 4. Importez-le ici                               │
│                                                  │
│ [📎 Sélectionner un fichier JSON]               │
│                                                  │
│ [Importer les réponses]                         │
└─────────────────────────────────────────────────┘
```

### Après l'importation réussie

```
┌─────────────────────────────────────────────────┐
│ ✅ Fichier importé avec succès !                │
│    Vos réponses sont maintenant disponibles     │
│    pour votre formateur.                        │
└─────────────────────────────────────────────────┘
```

### Données importées affichées

```
┌─────────────────────────────────────────────────┐
│ 📄 Réponses importées depuis l'application      │
│    Titanic                                       │
├─────────────────────────────────────────────────┤
│ Module: big-data                                 │
│ Importé le: 15/01/2024                          │
│                                                  │
│ [▶ Voir les données importées]                  │
└─────────────────────────────────────────────────┘
```

## ⚠️ Points importants

### Conditions d'affichage

Le composant d'upload s'affiche uniquement si :
- ✅ Le TP est détecté comme étant un TP Titanic
- ✅ La soumission n'a pas encore été soumise (`status !== 'submitted'`)

### Après soumission

Une fois que vous avez soumis votre TP :
- ❌ Le composant d'upload disparaît
- ✅ Vos données importées restent visibles
- ✅ Vous pouvez toujours voir un résumé de vos réponses

### Format de fichier

- ✅ Le fichier doit être au format **JSON** (`.json`)
- ✅ Le fichier doit provenir de l'application Titanic
- ✅ Le système valide automatiquement le format

## 🔧 Dépannage

### Le composant d'upload n'apparaît pas

**Vérifiez :**
1. Le titre du TP contient "Titanic", "Big Data", "Data Science" ou "Machine Learning"
2. Vous n'avez pas déjà soumis le TP
3. Vous êtes bien connecté au LMS

**Solution :** Contactez votre formateur pour vérifier la configuration du TP.

### Erreur lors de l'importation

**Messages d'erreur possibles :**
- "Le fichier doit être au format JSON (.json)" → Vérifiez l'extension du fichier
- "Format JSON invalide" → Réexportez depuis l'application Titanic
- "Erreur lors de l'upload" → Vérifiez votre connexion internet

**Solution :** Réessayez en suivant les étapes ci-dessus.

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que vous suivez bien toutes les étapes
2. Contactez votre formateur
3. Vérifiez que vous utilisez la dernière version de l'application Titanic

## 🎓 Pour aller plus loin

- **Guide complet d'intégration** : Voir `GUIDE-TITANIC-INTEGRATION.md` dans le dossier `portal-formations`
- **Documentation technique** : Voir `TITANIC-FEATURES-SUMMARY.md`
