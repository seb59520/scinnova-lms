# 🔧 Outil de fusion du Module 6

Cet outil permet de fusionner automatiquement le Module 6 avec le cours "Architecture client–serveur et bases du Web".

## 📋 Prérequis

- Node.js installé sur votre système
- Les fichiers suivants doivent exister :
  - `architecture-client-serveur-web.json` (cours complet)
  - `module-6-client-serveur-api.json` (Module 6 seul)

## 🚀 Utilisation

### Méthode 1 : Exécution directe

```bash
cd portal-formations
node fusionner-module-6.cjs
```

### Méthode 2 : Exécution avec permissions

```bash
chmod +x fusionner-module-6.cjs
./fusionner-module-6.cjs
```

## 📝 Ce que fait le script

1. **Charge les fichiers JSON** :
   - Le cours complet (`architecture-client-serveur-web.json`)
   - Le Module 6 (`module-6-client-serveur-api.json`)

2. **Vérifie si le Module 6 existe déjà** :
   - Si oui : le remplace par la nouvelle version
   - Si non : l'ajoute au cours

3. **Ajuste les positions** :
   - Trie les modules par position
   - Réajuste les positions pour qu'elles soient séquentielles (1, 2, 3, 4, 5, 6...)

4. **Sauvegarde le résultat** :
   - Crée un nouveau fichier : `architecture-client-serveur-web-avec-module-6.json`
   - Le fichier original n'est **pas modifié** (sécurité)

## 📤 Import dans l'interface

Après l'exécution du script :

1. Allez sur `/admin/courses/{courseId}/json`
   - Remplacez `{courseId}` par l'ID de votre cours
2. Cliquez sur **"Importer JSON"**
3. Sélectionnez le fichier `architecture-client-serveur-web-avec-module-6.json`
4. Vérifiez l'aperçu
5. Cliquez sur **"Sauvegarder"**

## ⚠️ Important

- Le fichier original `architecture-client-serveur-web.json` n'est **pas modifié**
- Un nouveau fichier est créé : `architecture-client-serveur-web-avec-module-6.json`
- Si le Module 6 existe déjà, il sera **remplacé** automatiquement
- Tous les modules sont réorganisés avec des positions séquentielles

## 🔍 Vérification

Après l'import, vérifiez que :
- ✅ Tous les modules sont présents (1 à 6)
- ✅ Le Module 6 apparaît bien
- ✅ Tous les items du Module 6 sont visibles (7 items)
- ✅ Les positions sont correctes

## 🆘 En cas de problème

Si le script échoue :

1. **Vérifiez que les fichiers existent** :
   ```bash
   ls -la architecture-client-serveur-web.json
   ls -la module-6-client-serveur-api.json
   ```

2. **Vérifiez que les JSON sont valides** :
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('architecture-client-serveur-web.json', 'utf8'))"
   node -e "JSON.parse(require('fs').readFileSync('module-6-client-serveur-api.json', 'utf8'))"
   ```

3. **Vérifiez la console** pour les messages d'erreur détaillés

## 📊 Exemple de sortie

```
📖 Chargement des fichiers...
✅ Cours chargé: "Architecture client–serveur et bases du Web"
   Modules existants: 5
➕ Ajout du Module 6...
✅ Module 6 ajouté en position 6

✅ Fichier fusionné sauvegardé: architecture-client-serveur-web-avec-module-6.json
   Total modules: 6

📋 Prochaines étapes:
   1. Vérifiez le fichier: architecture-client-serveur-web-avec-module-6.json
   2. Importez-le dans l'interface admin: /admin/courses/{courseId}/json
   3. Cliquez sur "Importer JSON" et sélectionnez le fichier
   4. Cliquez sur "Sauvegarder"
```

