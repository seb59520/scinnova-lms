# 📚 Guide d'intégration du Glossaire Python

Ce guide explique comment intégrer le glossaire Python complet dans votre système.

## 🎯 Méthode 1 : Comme Glossaire dans un Programme (RECOMMANDÉ)

### Avantages
- ✅ Recherche intégrée dans la barre de recherche globale
- ✅ Liens croisés entre termes
- ✅ Accessible depuis la page du programme
- ✅ Section dédiée "Ouvrage de définition" dans les résultats de recherche

### Étapes

1. **Accéder à l'édition d'un programme**
   - Aller dans **Admin > Programmes**
   - Créer un nouveau programme ou modifier un programme existant

2. **Importer le glossaire**
   - Scroller jusqu'à la section **"Glossaire"** (après les informations générales)
   - Cliquer sur le bouton **"Importer"** (icône Upload)
   - Sélectionner le fichier : `glossaire-python-complet.json`

3. **Vérifier l'import**
   - Le glossaire devrait s'afficher avec toutes les catégories et termes
   - Vous pouvez modifier, ajouter ou supprimer des termes si nécessaire

4. **Sauvegarder**
   - Cliquer sur **"Sauvegarder"** en haut à droite
   - Le glossaire est maintenant associé au programme

5. **Accès pour les étudiants**
   - Les étudiants verront un lien "Ouvrir le glossaire" sur la page du programme
   - Ils peuvent rechercher des termes via la barre de recherche globale (Ctrl+K)

---

## 📖 Méthode 2 : Comme Cours

### Avantages
- ✅ Accessible comme une ressource normale
- ✅ Peut être ajouté à un programme comme une formation
- ✅ Suivi de progression possible

### Étapes

1. **Accéder à l'édition JSON d'un cours**
   - Aller dans **Admin > Cours**
   - Cliquer sur **"Nouveau cours"** ou modifier un cours existant
   - Cliquer sur l'onglet **"Édition JSON"**

2. **Importer le fichier converti**
   - Cliquer sur le bouton **"Importer"** (icône Upload)
   - Sélectionner le fichier : `glossaire-python-complet-course.json`
   - ⚠️ **Important** : Utiliser le fichier `-course.json` (format TipTap)

3. **Ajuster les métadonnées**
   - Vérifier le titre : "Glossaire Python - Référence complète"
   - Ajouter une description si nécessaire
   - Définir le statut (Brouillon/Publié)

4. **Sauvegarder**
   - Cliquer sur **"Sauvegarder"**
   - Le cours est maintenant disponible

5. **Ajouter au programme (optionnel)**
   - Dans l'édition du programme, ajouter ce cours comme une formation
   - Il apparaîtra dans la liste des formations du programme

---

## 🔄 Comparaison des deux méthodes

| Caractéristique | Glossaire (Méthode 1) | Cours (Méthode 2) |
|----------------|----------------------|-------------------|
| Recherche globale | ✅ Oui (section dédiée) | ❌ Non |
| Liens croisés | ✅ Oui | ❌ Non |
| Accessible depuis programme | ✅ Oui (lien direct) | ⚠️ Via liste formations |
| Suivi de progression | ❌ Non | ✅ Oui |
| Format | JSON glossaire | JSON cours (TipTap) |
| Fichier à utiliser | `glossaire-python-complet.json` | `glossaire-python-complet-course.json` |

---

## 📝 Recommandation

**Utilisez la Méthode 1 (Glossaire)** si :
- Vous voulez que les étudiants puissent rechercher rapidement des termes
- Vous voulez des liens croisés entre termes
- Vous voulez un accès direct depuis la page du programme

**Utilisez la Méthode 2 (Cours)** si :
- Vous voulez que le glossaire soit une ressource à part entière
- Vous voulez un suivi de progression
- Vous préférez l'intégrer comme une formation dans le programme

---

## 🚀 Utilisation rapide

### Pour un programme Python

1. Créer un programme "Formation Python"
2. Importer `glossaire-python-complet.json` dans la section Glossaire
3. Ajouter les cours Python au programme
4. Publier le programme

Les étudiants pourront :
- Consulter le glossaire depuis la page du programme
- Rechercher des termes via Ctrl+K
- Naviguer entre termes liés

---

## 🔧 Fichiers disponibles

- **`glossaire-python-complet.json`** : Format glossaire (pour Méthode 1)
- **`glossaire-python-complet-course.json`** : Format cours TipTap (pour Méthode 2)

---

## ❓ Questions fréquentes

**Q : Puis-je utiliser les deux méthodes ?**
R : Oui, mais ce n'est pas recommandé car cela créerait une duplication.

**Q : Comment modifier le glossaire après import ?**
R : Dans l'édition du programme, section Glossaire, vous pouvez modifier directement les termes.

**Q : Le glossaire est-il accessible hors programme ?**
R : Non, le glossaire est lié au programme. Pour un accès global, utilisez la Méthode 2.

**Q : Puis-je exporter le glossaire modifié ?**
R : Oui, utilisez le bouton "Exporter" dans l'éditeur de glossaire.
