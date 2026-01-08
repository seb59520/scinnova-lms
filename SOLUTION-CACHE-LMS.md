# 🔄 Solution : Le LMS affiche encore l'ancien port

## Problème

Le TP JSON a été mis à jour avec le port 5174, mais le LMS affiche encore le port 5173.

## ✅ Solutions

### Solution 1 : Réimporter le TP (Recommandé)

1. **Dans le LMS, allez dans l'administration**
2. **Trouvez le cours/TP** "Identifier les impacts du Big Data et de la Data Science"
3. **Supprimez l'ancien TP** (ou éditez-le)
4. **Réimportez le fichier** `tp-big-data-data-science-impacts.json`

### Solution 2 : Modifier directement dans le LMS

1. **Allez dans l'administration du LMS**
2. **Trouvez l'item** "🚀 Application interactive - Big Data Impacts"
3. **Éditez l'item**
4. **Modifiez le champ "External URL"** :
   - Ancien : `http://localhost:5173`
   - Nouveau : `http://localhost:5174`
5. **Sauvegardez**

### Solution 3 : Vider le cache du navigateur

1. **Ouvrez les outils de développement** (F12)
2. **Clic droit sur le bouton de rechargement**
3. **Sélectionnez "Vider le cache et actualiser"**

## 🔍 Vérification

Pour vérifier que le TP JSON est correct :

```bash
grep "external_url" portal-formations/tp-big-data-data-science-impacts.json
```

Doit afficher : `"external_url": "http://localhost:5174"`

## 📝 Note

Le fichier JSON est correct. Le problème vient du cache du LMS ou d'une ancienne version importée.


