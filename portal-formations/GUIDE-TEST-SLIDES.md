# Guide de test : Slides avec contexte pédagogique

## 🎯 Comment tester

### 1. Importer le JSON de test

1. Allez dans l'interface d'administration
2. Créez un nouveau cours ou éditez un cours existant
3. Importez le fichier `test-big-data-slide-contexte.json`
4. Sauvegardez le cours

### 2. Visualiser le cours

1. Allez sur la page du cours : `/courses/[courseId]`
2. **Cliquez sur le titre du module** pour le déplier (les modules sont repliés par défaut)
3. Vous devriez maintenant voir :

#### ✅ Ce que vous devez voir

**Pour la Slide 1.1 (sans slide) :**
```
┌─────────────────────────────────────────────┐
│ ⚠️ Aucun slide projeté pour cette section    │
│ Le contenu pédagogique sera disponible      │
│ ci-dessous une fois le slide ajouté.         │
└─────────────────────────────────────────────┘

    ┌─────────────────────────────────────────┐
    │ 💬 CONTEXTE PÉDAGOGIQUE                 │
    │                                         │
    │ Dans notre quotidien professionnel     │
    │ et personnel, chaque interaction...     │
    │                                         │
    │ La donnée est générée par les usages,  │
    │ pas par les outils...                   │
    └─────────────────────────────────────────┘
```

**Pour la Slide 1.3 (avec contenu rich text) :**
```
┌─────────────────────────────────────────────┐
│ La donnée est générée par les usages        │
│ Pas par les outils                         │
│ ─────────────────────────────────────────── │
│ • Les processus métiers génèrent...        │
│ • L'infrastructure IT vient ensuite...      │
│ • Comprendre les usages avant...           │
└─────────────────────────────────────────────┘

    ┌─────────────────────────────────────────┐
    │ 💬 CONTEXTE PÉDAGOGIQUE                 │
    │ Cette distinction est fondamentale...   │
    │                                         │
    │ Posez-vous ces questions :              │
    │ • Quels sont les moments clés...        │
    │ • Cette donnée est-elle capturée...     │
    │ • Quelle valeur métier...               │
    └─────────────────────────────────────────┘
```

### 3. Vérifications à faire

- [ ] Le message d'avertissement apparaît pour les slides sans contenu
- [ ] Le contexte pédagogique est indenté vers la droite
- [ ] Le contexte a un fond gris clair avec bordure gauche colorée
- [ ] L'icône "MessageSquare" est visible
- [ ] Le texte du contexte est bien formaté et lisible
- [ ] Sur mobile, l'indentation s'adapte (plus petite)

---

## 🔍 Dépannage

### Je ne vois rien de différent

1. **Vérifiez que le module est déplié** : Cliquez sur le titre du module
2. **Vérifiez que les items sont publiés** : `"published": true` dans le JSON
3. **Vérifiez la console du navigateur** : F12 → Console pour voir les erreurs
4. **Rechargez la page** : Ctrl+R ou Cmd+R

### Les slides ne s'affichent pas

1. Vérifiez que le type est bien `"type": "slide"`
2. Vérifiez que `content.pedagogical_context` existe dans le JSON
3. Vérifiez que le cours a bien été sauvegardé après l'import

### Le contexte pédagogique ne s'affiche pas

1. Vérifiez que `pedagogical_context` contient `text`, `body`, ou `description`
2. Vérifiez la structure JSON (pas d'erreur de syntaxe)
3. Vérifiez dans la console du navigateur s'il y a des erreurs

---

## 📝 Structure JSON attendue

```json
{
  "type": "slide",
  "title": "Titre de la slide",
  "position": 1,
  "published": true,
  "content": {
    "pedagogical_context": {
      "text": "Votre texte ici"
    }
  }
}
```

---

## 🎨 Styles visuels attendus

### Message d'avertissement
- Fond : Jaune clair (#FEF3C7)
- Bordure : Jaune/ambre (#F59E0B), pointillée
- Icône : AlertTriangle (triangle d'alerte)

### Contexte pédagogique
- Indentation : 32px (mobile) ou 48px (desktop)
- Fond : Gris clair (#F9FAFB)
- Bordure gauche : 4px, couleur du thème
- Icône : MessageSquare

---

## ✅ Checklist de test

- [ ] Import du JSON réussi
- [ ] Module déplié et visible
- [ ] Slide 1.1 : Message d'avertissement visible
- [ ] Slide 1.1 : Contexte pédagogique visible et indenté
- [ ] Slide 1.3 : Contenu rich text visible
- [ ] Slide 1.3 : Contexte pédagogique avec formatage (listes, gras)
- [ ] Responsive : Test sur mobile/tablette
- [ ] Pas d'erreurs dans la console

---

## 🚀 Prochaines étapes

Une fois que vous voyez les slides s'afficher correctement :

1. Testez avec vos propres contenus
2. Ajoutez des images dans `asset_path` pour voir les slides avec images
3. Testez différents formats de contexte (texte simple vs TipTap JSON)
4. Vérifiez l'affichage sur différents appareils


