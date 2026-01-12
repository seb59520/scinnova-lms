# TP 2 : Data Science - Analyse et visualisation

**Durée estimée :** 2h  
**Niveau :** Intermédiaire  
**Application :** https://titaniclearning.netlify.app  
**Prérequis :** TP 1 - Big Data terminé

---

## 📋 Objectifs pédagogiques

À la fin de ce TP, vous serez capable de :
- Interpréter des graphiques statistiques
- Calculer des taux et proportions
- Identifier des corrélations dans les données
- Formuler des hypothèses basées sur des visualisations
- Comprendre les biais potentiels dans les données

---

## 🎯 Contexte

Maintenant que vous avez exploré les données brutes, vous allez extraire du sens en utilisant des visualisations et des analyses statistiques simples. L'objectif est de comprendre quels facteurs influencent la survie des passagers.

---

## 📝 Exercices

### Exercice 1 : Analyse du taux de survie par sexe (25 min)

1. **Observez le graphique** "Taux de survie par Sexe"
2. **Calculez mentalement** les pourcentages :
   - Combien de femmes au total ?
   - Combien de femmes ont survécu ?
   - Quel est le pourcentage de survie des femmes ?
   - Répétez pour les hommes

3. **Utilisez les filtres** pour vérifier vos calculs :
   - Filtrez par "female" et "survivant: oui" → comptez
   - Filtrez par "male" et "survivant: oui" → comptez

**Question à répondre dans l'application :**
- Qui survit le plus ? (Femmes / Hommes / Aucune différence)
- Justification : Expliquez votre réponse en vous basant sur les données observées

**Réflexion :**
- Pourquoi observez-vous cette différence ?
- Quels facteurs sociaux ou culturels pourraient expliquer cela ?

---

### Exercice 2 : Impact de la classe sur la survie (25 min)

1. **Observez le graphique** "Taux de survie par Classe"
2. **Comparez** les trois barres :
   - Quelle classe a le meilleur taux de survie ?
   - Quelle classe a le pire taux de survie ?
   - Y a-t-il une progression évidente ?

3. **Analysez la relation** entre classe et prix :
   - Utilisez les filtres pour voir les prix moyens par classe
   - La classe 1 correspond-elle toujours aux prix les plus élevés ?

**Question à répondre dans l'application :**
- La classe influence-t-elle la survie ? (Beaucoup / Un peu / Pas du tout)
- Justification : Décrivez l'impact observé et son importance

**Réflexion :**
- Pourquoi la classe sociale pourrait influencer la survie ?
- Quels sont les mécanismes possibles (proximité des canots, priorité d'évacuation, etc.) ?

---

### Exercice 3 : Distribution de l'âge (20 min)

1. **Observez l'histogramme** "Distribution de l'Âge"
2. **Identifiez** :
   - La tranche d'âge la plus représentée
   - Les tranches d'âge avec peu ou pas de passagers
   - La forme générale de la distribution (normale, asymétrique, etc.)

3. **Analysez** la relation âge/survie :
   - Utilisez les filtres pour comparer les âges moyens des survivants vs non-survivants
   - Y a-t-il une différence notable ?

**Observation :**
- Notez si les enfants (âge < 18) semblent avoir un taux de survie différent

---

### Exercice 4 : Analyse du prix (20 min)

1. **Observez le résumé** "Prix par Survivant"
2. **Comparez** :
   - Le prix moyen des survivants
   - Le prix moyen des non-survivants
   - Y a-t-il une différence significative ?

3. **Explorez** avec les filtres :
   - Filtrez par "survivant: oui" → triez par prix décroissant
   - Filtrez par "survivant: non" → triez par prix décroissant
   - Observez les extrêmes

**Réflexion :**
- Le prix du billet est-il un bon indicateur de survie ?
- Pourquoi le prix pourrait être corrélé avec la survie ?

---

### Exercice 5 : Facteur le plus influent (20 min)

Maintenant que vous avez analysé plusieurs facteurs, vous devez déterminer lequel semble le plus important.

**Méthodologie :**
1. **Listez** tous les facteurs analysés :
   - Sexe
   - Classe
   - Âge
   - Prix
   - Embarquement

2. **Pour chaque facteur**, évaluez :
   - L'ampleur de la différence observée
   - La cohérence du pattern
   - L'importance pratique

3. **Comparez** les graphiques entre eux

**Question à répondre dans l'application :**
- Quel facteur semble le plus fort ? (Sexe / Classe / Age / Prix / Embarquement)
- Justification : Expliquez pourquoi ce facteur vous semble le plus déterminant

---

### Exercice 6 : Décision éthique (20 min)

Imaginez que vous êtes le capitaine du Titanic et que vous devez prendre des décisions sur qui sauver en priorité.

**Scénario :**
- Les canots de sauvetage sont limités
- Vous devez établir des priorités
- Vous avez accès aux données que vous venez d'analyser

**Question à répondre dans l'application :**
- Quelle décision humaine proposerais-tu ? (Priorité femmes & enfants / Priorité classe 1 / Priorité proches canots / Autre)
- Détails : Décrivez votre stratégie et justifiez-la

**Réflexion éthique :**
- Quels sont les enjeux éthiques de votre décision ?
- Y a-t-il des biais dans votre approche ?
- Comment équilibrer efficacité et équité ?

---

## 🔍 Analyse approfondie (Bonus)

### Exercice bonus 1 : Analyse croisée

Créez des analyses croisées en combinant les filtres :
- Taux de survie des femmes de classe 1 vs femmes de classe 3
- Taux de survie des hommes de classe 1 vs femmes de classe 3
- Impact de l'âge sur la survie selon le sexe

### Exercice bonus 2 : Hypothèses de recherche

Formulez 3 hypothèses testables basées sur vos observations :
1. ________________________________
2. ________________________________
3. ________________________________

### Exercice bonus 3 : Limites de l'analyse

Identifiez les limites de cette analyse :
- Taille de l'échantillon
- Variables manquantes
- Biais potentiels
- Généralisabilité

---

## ✅ Validation

Avant de passer au module suivant, vérifiez que vous avez :
- [ ] Répondu aux 4 questions dans l'application
- [ ] Analysé tous les graphiques proposés
- [ ] Utilisé les filtres pour vérifier vos observations
- [ ] Formulé des hypothèses basées sur les données
- [ ] Exporté vos réponses

---

## 📊 Critères d'évaluation

| Critère | Points | Description |
|---------|--------|-------------|
| Interprétation des graphiques | 3 pts | Compréhension correcte des visualisations |
| Justesse des conclusions | 3 pts | Conclusions cohérentes avec les données |
| Qualité de la justification | 2 pts | Justifications claires et argumentées |
| Réflexion éthique | 2 pts | Conscience des enjeux éthiques |

**Total : 10 points**

---

## 💡 Conseils méthodologiques

- **Comparez toujours** : Ne regardez pas un graphique isolément, comparez-les
- **Vérifiez vos intuitions** : Utilisez les filtres pour confirmer ce que vous voyez
- **Soyez critique** : Questionnez les patterns que vous observez
- **Pensez aux biais** : Les données peuvent refléter des biais sociaux

---

## 🚀 Prochaines étapes

Une fois ce TP terminé, vous pouvez passer au **TP 3 : Machine Learning** où vous apprendrez à :
- Faire des prédictions
- Évaluer la performance d'un modèle
- Identifier les biais dans les prédictions

---

## 📚 Ressources complémentaires

- [Guide d'interprétation des graphiques](https://www.kaggle.com/learn/data-visualization)
- [Statistiques descriptives](https://www.kaggle.com/learn/intro-to-machine-learning)
- [Éthique en data science](https://www.kaggle.com/learn/ethics)

---

**Bon travail ! 🎓**
