# TP 1 : Big Data - Exploration des données brutes

**Durée estimée :** 1h30  
**Niveau :** Débutant  
**Application :** https://titaniclearning.netlify.app

---

## 📋 Objectifs pédagogiques

À la fin de ce TP, vous serez capable de :
- Comprendre la structure d'un dataset
- Identifier les types de données (numériques, catégorielles)
- Détecter les valeurs manquantes
- Utiliser des filtres pour explorer les données
- Formuler des observations sur la qualité des données

---

## 🎯 Contexte

Vous disposez d'un dataset contenant 25 passagers du Titanic avec les informations suivantes :
- **Sexe** : male ou female
- **Âge** : nombre d'années (peut être vide)
- **Classe** : 1, 2 ou 3
- **Prix** : prix du billet en livres sterling
- **Embarquement** : port d'embarquement (S, C ou Q)
- **Survivant** : oui ou non

---

## 📝 Exercices

### Exercice 1 : Exploration visuelle (15 min)

1. **Ouvrez l'application** et accédez au module "Big Data"
2. **Observez le tableau** de données affiché
3. **Comptez manuellement** le nombre de lignes visibles
4. **Notez** le nombre total de lignes affiché en haut du tableau

**Question à répondre dans l'application :**
- Combien de lignes vois-tu ? (choisissez dans le dropdown puis saisissez le nombre exact)

---

### Exercice 2 : Identification des types de données (20 min)

1. **Examinez chaque colonne** du tableau
2. **Identifiez** les colonnes qui contiennent des nombres
3. **Distinguer** :
   - Les colonnes numériques (nombres entiers ou décimaux)
   - Les colonnes catégorielles (texte avec catégories limitées)
   - Les colonnes booléennes (oui/non)

**Question à répondre dans l'application :**
- Quelles colonnes sont numériques ? (sélectionnez dans le dropdown puis listez-les)

**Réflexion :**
- Pourquoi est-il important de distinguer les types de données ?

---

### Exercice 3 : Détection des valeurs manquantes (20 min)

1. **Parcourez** toutes les lignes du tableau
2. **Cherchez** les cellules vides ou contenant "?"
3. **Notez** dans quelles colonnes se trouvent ces valeurs manquantes
4. **Comptez** le nombre de valeurs manquantes par colonne

**Question à répondre dans l'application :**
- Y a-t-il des valeurs manquantes ? (oui/non)
- Où ? (précisez la colonne et le nombre)

**Réflexion :**
- Quelles sont les conséquences des valeurs manquantes pour l'analyse ?

---

### Exercice 4 : Utilisation des filtres (20 min)

1. **Testez chaque filtre** disponible :
   - Recherche globale
   - Filtre par Sexe
   - Filtre par Classe
   - Filtre par Embarquement
   - Filtre par Survivant
   - Filtres min/max pour Âge et Prix

2. **Combinez plusieurs filtres** pour répondre aux questions suivantes :
   - Combien de femmes de classe 1 ont survécu ?
   - Quel est l'âge minimum des passagers de classe 3 ?
   - Combien de passagers ont payé plus de 50 livres ?

3. **Utilisez le tri** en cliquant sur les en-têtes de colonnes

**Observation :**
- Notez comment le nombre de lignes filtrées change selon vos critères

---

### Exercice 5 : Détection d'ambiguïtés (15 min)

1. **Examinez attentivement** les données
2. **Cherchez** des incohérences ou ambiguïtés potentielles :
   - Valeurs qui semblent étranges
   - Données contradictoires
   - Formats incohérents

**Question à répondre dans l'application :**
- Une donnée te semble ambiguë ? (oui/non)
- Laquelle et pourquoi ? (décrivez l'ambiguïté)

**Exemples d'ambiguïtés possibles :**
- Un passager avec un prix de billet très bas en classe 1
- Un âge de 0 ou très élevé
- Des incohérences entre classe et prix

---

## 🔍 Analyse approfondie (Bonus)

### Exercice bonus 1 : Statistiques descriptives

En utilisant les filtres et le tri, calculez manuellement :
- L'âge moyen des passagers (en ignorant les valeurs manquantes)
- Le prix moyen par classe
- Le taux de survie global
- Le taux de survie par sexe

### Exercice bonus 2 : Questions de recherche

Formulez 3 questions que vous pourriez explorer avec ce dataset :
1. ________________________________
2. ________________________________
3. ________________________________

---

## ✅ Validation

Avant de passer au module suivant, vérifiez que vous avez :
- [ ] Répondu aux 4 questions dans l'application
- [ ] Utilisé tous les types de filtres
- [ ] Testé le tri sur au moins 3 colonnes
- [ ] Identifié les valeurs manquantes
- [ ] Exporté vos réponses (bouton "Exporter mes réponses")

---

## 📊 Critères d'évaluation

| Critère | Points | Description |
|---------|--------|-------------|
| Réponses complètes | 4 pts | Toutes les questions sont répondues |
| Justesse des observations | 3 pts | Les observations sont correctes |
| Utilisation des filtres | 2 pts | Tous les filtres ont été testés |
| Qualité de l'analyse | 1 pt | Détection d'ambiguïtés pertinentes |

**Total : 10 points**

---

## 💡 Conseils

- **Prenez votre temps** : l'exploration de données nécessite de l'attention
- **Notez vos observations** : gardez un carnet de notes à côté
- **Testez les limites** : que se passe-t-il si vous combinez tous les filtres ?
- **Comparez** : utilisez les filtres pour comparer des sous-groupes

---

## 🚀 Prochaines étapes

Une fois ce TP terminé, vous pouvez passer au **TP 2 : Data Science** où vous apprendrez à :
- Créer des visualisations
- Calculer des statistiques
- Identifier des patterns dans les données

---

## 📚 Ressources complémentaires

- [Documentation sur les types de données](https://www.kaggle.com/learn/data-cleaning)
- [Guide sur les valeurs manquantes](https://www.kaggle.com/learn/data-cleaning)
- [Best practices en exploration de données](https://www.kaggle.com/learn/intro-to-machine-learning)

---

**Bon travail ! 🎓**
