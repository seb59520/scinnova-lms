# TP 3 : Machine Learning - Prédictions et biais

**Durée estimée :** 2h  
**Niveau :** Avancé  
**Application :** https://titaniclearning.netlify.app  
**Prérequis :** TP 1 et TP 2 terminés

---

## 📋 Objectifs pédagogiques

À la fin de ce TP, vous serez capable de :
- Faire des prédictions basées sur des patterns observés
- Évaluer la performance d'un modèle de prédiction
- Identifier les biais dans les prédictions
- Comprendre les risques éthiques du machine learning
- Réfléchir aux limites des modèles prédictifs

---

## 🎯 Contexte

Dans ce TP, vous allez jouer le rôle d'un "modèle humain" : vous allez prédire la survie de 8 passagers en vous basant sur les patterns que vous avez observés dans les modules précédents. Ensuite, vous comparerez vos prédictions avec la réalité et analyserez vos biais potentiels.

---

## 📝 Exercices

### Exercice 1 : Prédictions manuelles (40 min)

**Instructions :**
1. **Accédez au module Machine Learning** dans l'application
2. **Pour chaque passager** (8 au total), vous devez :
   - Examiner ses caractéristiques (sexe, âge, classe, prix, embarquement)
   - Faire une prédiction : survivra-t-il ou non ?
   - Justifier votre prédiction

**Méthodologie recommandée :**

Pour chaque passager, suivez cette démarche :

1. **Analysez les caractéristiques** :
   - Quel est le sexe ? (rappelez-vous : les femmes survivent plus)
   - Quelle est la classe ? (rappelez-vous : classe 1 > classe 2 > classe 3)
   - Quel est l'âge ? (les enfants ont-ils plus de chances ?)
   - Quel est le prix ? (corrélé avec la classe)
   - Quel est le port d'embarquement ?

2. **Appliquez vos connaissances** :
   - Utilisez les patterns observés dans le TP 2
   - Combinez plusieurs facteurs
   - Pesez l'importance de chaque facteur

3. **Faites votre prédiction** :
   - Choisissez "Oui" ou "Non" dans le dropdown
   - Rédigez une justification claire

**Exemple de justification :**
> "Je prédits 'Oui' car c'est une femme de classe 1, et d'après les graphiques du module 2, les femmes de classe 1 ont un très haut taux de survie."

**⚠️ Important :**
- Ne trichez pas ! Faites vos prédictions avant de révéler les résultats
- Justifiez chaque prédiction
- Notez vos doutes et incertitudes

---

### Exercice 2 : Évaluation de performance (20 min)

Une fois que vous avez fait toutes vos prédictions :

1. **Cliquez sur "Révéler la vérité"**
2. **Observez vos résultats** :
   - Combien de prédictions correctes ?
   - Combien d'erreurs ?
   - Quel est votre score en pourcentage ?

3. **Analysez vos erreurs** :
   - Pour chaque erreur, examinez :
     - Pourquoi avez-vous prédit cela ?
     - Qu'est-ce qui vous a trompé ?
     - Y a-t-il un pattern dans vos erreurs ?

**Question à répondre dans l'application :**
- Le modèle comprend-il le contexte humain ? (Oui / Non)
- Justification : Expliquez si vos prédictions reflètent une compréhension nuancée ou des règles simplistes

**Réflexion :**
- Un modèle de machine learning aurait-il fait mieux ou moins bien ?
- Quels sont les avantages et limites d'un "modèle humain" ?

---

### Exercice 3 : Détection des biais (25 min)

**Analysez vos prédictions pour détecter des biais :**

1. **Examinez vos prédictions par sexe** :
   - Avez-vous prédit "non" pour tous les hommes ?
   - Avez-vous prédit "oui" pour toutes les femmes ?
   - Y a-t-il un pattern systématique ?

2. **Examinez vos prédictions par classe** :
   - Avez-vous systématiquement favorisé la classe 1 ?
   - Avez-vous systématiquement défavorisé la classe 3 ?

3. **Observez l'alerte de biais** :
   - Si une alerte apparaît, lisez-la attentivement
   - Réfléchissez à ce qu'elle signifie

**Question à répondre dans l'application :**
- Quel risque principal ? (Biais / Surconfiance / Mauvaise donnée / Tous)
- Justification : Décrivez le risque que vous avez identifié et pourquoi il est problématique

**Types de biais à considérer :**

- **Biais de genre** : Discrimination systématique basée sur le sexe
- **Biais de classe** : Discrimination basée sur le statut socio-économique
- **Surconfiance** : Trop de certitude dans des prédictions incertaines
- **Biais de confirmation** : Chercher des preuves qui confirment nos hypothèses

---

### Exercice 4 : Risques en contexte réel (25 min)

Imaginez maintenant que votre modèle de prédiction est utilisé dans un contexte réel.

**Scénarios à considérer :**

1. **Crédit bancaire** :
   - Un modèle prédit qui peut obtenir un prêt
   - Basé sur des données similaires (âge, revenu, historique)
   - Quels sont les risques ?

2. **Recrutement** :
   - Un modèle prédit qui sera embauché
   - Basé sur CV, parcours, caractéristiques démographiques
   - Quels sont les risques ?

3. **Santé** :
   - Un modèle prédit qui recevra un traitement prioritaire
   - Basé sur l'âge, les antécédents, les ressources
   - Quels sont les risques ?

**Question à répondre dans l'application :**
- Dans quel domaine c'est dangereux ? (Crédit / Recrutement / Santé / Tous)
- Justification : Expliquez pourquoi l'utilisation de modèles prédictifs est risquée dans ce(s) domaine(s)

**Réflexion éthique :**
- Quelles sont les conséquences d'une erreur de prédiction dans chaque domaine ?
- Comment équilibrer efficacité et équité ?
- Qui est responsable des biais dans les modèles ?

---

## 🔍 Analyse approfondie (Bonus)

### Exercice bonus 1 : Amélioration du modèle

Réfléchissez à comment améliorer votre modèle :
- Quelles données supplémentaires seraient utiles ?
- Quels facteurs avez-vous négligés ?
- Comment réduire les biais ?

### Exercice bonus 2 : Comparaison avec ML

Comparez votre approche avec celle d'un algorithme de machine learning :
- Avantages de l'approche humaine
- Avantages de l'approche algorithmique
- Quand utiliser l'une ou l'autre ?

### Exercice bonus 3 : Protocole d'éthique

Proposez un protocole pour déployer un modèle prédictif de manière éthique :
1. Étape 1 : ________________________________
2. Étape 2 : ________________________________
3. Étape 3 : ________________________________

---

## ✅ Validation

Avant de terminer, vérifiez que vous avez :
- [ ] Fait des prédictions pour les 8 passagers
- [ ] Justifié chaque prédiction
- [ ] Révélé les résultats et calculé votre score
- [ ] Analysé vos erreurs
- [ ] Identifié vos biais potentiels
- [ ] Répondu aux 3 questions dans l'application
- [ ] Exporté vos réponses

---

## 📊 Critères d'évaluation

| Critère | Points | Description |
|---------|--------|-------------|
| Qualité des prédictions | 2 pts | Prédictions cohérentes avec les patterns observés |
| Justification des prédictions | 2 pts | Justifications claires et argumentées |
| Analyse des erreurs | 2 pts | Compréhension des erreurs et apprentissage |
| Détection des biais | 2 pts | Identification correcte des biais potentiels |
| Réflexion éthique | 2 pts | Conscience des risques et enjeux éthiques |

**Total : 10 points**

---

## 💡 Conseils méthodologiques

- **Soyez honnête** : Ne modifiez pas vos prédictions après avoir vu les résultats
- **Documentez votre processus** : Notez votre raisonnement pour chaque prédiction
- **Acceptez l'incertitude** : Il est normal de ne pas être sûr
- **Apprenez de vos erreurs** : Analysez ce qui vous a trompé

---

## 🎓 Leçons clés

### Ce que vous avez appris :

1. **Les modèles ne sont pas parfaits** :
   - Ils font des erreurs
   - Ils peuvent avoir des biais
   - Ils nécessitent une validation constante

2. **Le contexte compte** :
   - Les mêmes patterns peuvent avoir des significations différentes selon le contexte
   - L'éthique doit être au centre des préoccupations

3. **La transparence est essentielle** :
   - Il faut comprendre comment fonctionne un modèle
   - Il faut pouvoir justifier les prédictions
   - Il faut identifier et corriger les biais

---

## 🚀 Prochaines étapes

Maintenant que vous avez terminé les 3 TP, vous pouvez :
- **Approfondir** : Explorer d'autres datasets
- **Pratiquer** : Créer vos propres analyses
- **Apprendre** : Suivre des cours sur le machine learning
- **Contribuer** : Partager vos analyses et réflexions

---

## 📚 Ressources complémentaires

- [Introduction au Machine Learning](https://www.kaggle.com/learn/intro-to-machine-learning)
- [Éthique en IA](https://www.kaggle.com/learn/ethics)
- [Détection et correction des biais](https://www.kaggle.com/learn/fairness)
- [Responsible AI](https://ai.google/responsibilities/responsible-ai-practices/)

---

## 🎉 Félicitations !

Vous avez terminé les 3 TP sur le dataset Titanic. Vous avez maintenant une compréhension solide de :
- L'exploration de données (Big Data)
- L'analyse statistique (Data Science)
- Les prédictions et leurs limites (Machine Learning)

**Continuez à explorer, analyser et questionner ! 🎓**

---

**Bon travail ! 🎓**
