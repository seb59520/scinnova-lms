# 👨‍🏫 Guide Formateur — Fil Rouge Databricks

## 📋 Vue d'ensemble de la session

| Élément | Détail |
|---------|--------|
| **Durée totale** | 2h30 - 3h (avec pauses) |
| **Public cible** | Data Analysts, futurs Data Scientists |
| **Prérequis** | SQL de base, notions Python |
| **Format** | TP guidé + exercices pratiques |

---

## ⏱️ Planning Minute par Minute

### 🔵 Notebook 1 — Big Data (50 min)

| Temps | Section | Contenu | Action Formateur |
|-------|---------|---------|------------------|
| 0:00 | Introduction | Contexte e-commerce, objectifs | Présenter le cas métier |
| 0:05 | 1️⃣ Lecture CSV | Charger le fichier, schéma | Expliquer `inferSchema` |
| 0:15 | 2️⃣ Normalisation | Types, calcul revenue | **QUESTION 1** |
| 0:25 | 3️⃣ Delta Lake | Écriture table | Montrer le time travel |
| 0:35 | 4️⃣ Analyses BI | CA pays, top produits | Faire interpréter les graphes |
| 0:45 | Synthèse | Récap + transition | **QUESTION 2** |
| 0:50 | Pause | 10 minutes | ☕ |

### 🟢 Notebook 2 — Data Science (50 min)

| Temps | Section | Contenu | Action Formateur |
|-------|---------|---------|------------------|
| 1:00 | Introduction | Objectif : préparer le ML | Expliquer le rôle DS |
| 1:05 | 2️⃣ Qualité | Nulls, aberrations | **QUESTION 3** |
| 1:15 | 3️⃣ EDA | Distributions, patterns | Faire analyser les graphes |
| 1:30 | 4️⃣ Cible ML | high_value_order | **QUESTION 4** |
| 1:40 | 5️⃣ Features | Sélection colonnes | Expliquer le feature leakage |
| 1:50 | Synthèse | Récap + transition | |
| 1:55 | Pause | 10 minutes | ☕ |

### 🟠 Notebook 3 — Machine Learning (55 min)

| Temps | Section | Contenu | Action Formateur |
|-------|---------|---------|------------------|
| 2:05 | Introduction | Objectif : classifier | Rappeler le contexte |
| 2:10 | 2️⃣ Split | Train/Test 80/20 | **QUESTION 5** |
| 2:15 | 3️⃣ Pipeline | Encodage, assemblage | Schéma au tableau |
| 2:30 | 4️⃣ Entraînement | Fit du modèle | Temps d'attente → discussion |
| 2:35 | 5️⃣ Évaluation | AUC, confusion | **QUESTION 6** |
| 2:45 | 6️⃣ Scoring | Prédictions | Interpréter les scores |
| 2:55 | 7️⃣ Métier | Recommandations | Exercice de synthèse |
| 3:00 | Clôture | Synthèse fil rouge | Récap 3 compétences |

---

## ❓ Questions Clés à Poser

### QUESTION 1 — Pourquoi normaliser les types ?
**Moment** : Après la section 2 du Notebook 1

**Poser** : "Pourquoi Spark a-t-il besoin qu'on caste explicitement les colonnes ?"

**Réponse attendue** :
- `inferSchema` n'est pas toujours fiable (string vs int)
- Les calculs numériques échouent sur des strings
- Performance : les types corrects = moins de mémoire

**Si silence** : "Que se passe-t-il si on multiplie une string par un int ?"

---

### QUESTION 2 — Avantage de Delta Lake
**Moment** : Fin du Notebook 1

**Poser** : "Pourquoi Delta plutôt que laisser le CSV ?"

**Réponse attendue** :
- Compression (moins de stockage)
- Schéma enforcé (pas de surprise)
- Time travel (audit, rollback)
- Updates possibles (ACID)

**Si silence** : "Imaginez qu'on doit corriger 1000 lignes... en CSV vs Delta ?"

---

### QUESTION 3 — Importance de la qualité
**Moment** : Section Qualité du Notebook 2

**Poser** : "Quels problèmes de qualité pourrait-on trouver en production ?"

**Réponse attendue** :
- Nulls (champs manquants)
- Outliers (prix négatif, quantité 0)
- Doublons (commande enregistrée 2x)
- Incohérences (date future)

**Si silence** : "Que se passe-t-il si 10% des prix sont à NULL ?"

---

### QUESTION 4 — Choix de la cible
**Moment** : Après création de `high_value_order`

**Poser** : "Pourquoi créer une cible binaire plutôt que prédire le revenue exact ?"

**Réponse attendue** :
- Classification = plus simple à interpréter
- Métier : "grosse commande oui/non" = décision claire
- Moins sensible aux outliers extrêmes
- Résultats actionnables (seuil = action)

**Si silence** : "Qu'est-ce qui est plus utile pour le marketing : prédire 847.32€ ou dire 'client VIP probable' ?"

---

### QUESTION 5 — Pourquoi le split Train/Test ?
**Moment** : Début Notebook 3

**Poser** : "Pourquoi ne pas entraîner sur 100% des données ?"

**Réponse attendue** :
- Évaluer sur données non vues = vrai test
- Éviter l'overfitting (apprendre par cœur)
- Simuler l'utilisation réelle
- Généralisation vs mémorisation

**Piège à détecter** : "On peut avoir un modèle parfait sur train et nul sur test"

---

### QUESTION 6 — Interpréter l'AUC
**Moment** : Après affichage de l'AUC

**Poser** : "Notre AUC est de 0.85. C'est bien ou pas ?"

**Réponse attendue** :
- 0.5 = aléatoire, inutile
- 0.7-0.8 = acceptable
- 0.8-0.9 = bon
- > 0.9 = excellent

**Puis** : "Que signifie concrètement un AUC de 0.85 ?"

**Réponse** : "Dans 85% des cas, le modèle classe correctement un positif au-dessus d'un négatif"

---

## ⚠️ Pièges Courants & Solutions

### Piège 1 : "Mon CSV ne charge pas"
**Symptôme** : `AnalysisException: Path does not exist`

**Diagnostic** :
```python
dbutils.fs.ls("dbfs:/FileStore/")  # Vérifier le chemin
```

**Solution** : Adapter le PATH dans le notebook

---

### Piège 2 : "Erreur StringIndexer sur test"
**Symptôme** : `Unseen label: XYZ`

**Cause** : Valeur présente dans test mais pas dans train

**Solution** : Toujours utiliser `handleInvalid="keep"`

---

### Piège 3 : "Mon modèle a un AUC de 0.99"
**Symptôme** : AUC "trop beau"

**Cause probable** : Fuite de données (data leakage)

**Vérifier** :
- Est-ce que `revenue` est dans les features ? (interdit !)
- Le split est-il fait avant les transformations ?

---

### Piège 4 : "Le notebook met 20 minutes"
**Symptôme** : Cellules très lentes

**Causes possibles** :
- Cluster non démarré
- Trop petit cluster (1 worker)
- Collect() sur 2M lignes

**Solution** : Utiliser `display()` au lieu de `collect()`, vérifier le cluster

---

### Piège 5 : "Mon accuracy est de 80%"
**Symptôme** : "C'est bien non ?"

**Piège pédagogique** : Avec 80% de classe 0, prédire toujours 0 = 80% accuracy !

**Message** : "L'accuracy seule est trompeuse. Regardez precision/recall/AUC"

---

## 💬 Phrases Clés à Transmettre

### Big Data
> "Spark ne charge pas tout en mémoire — il distribue le travail. C'est ça, le Big Data."

> "Delta Lake = CSV + superpowers. Transactions, versioning, performance."

### Data Science
> "Garbage in, garbage out. La qualité des données détermine la qualité du modèle."

> "Le feature engineering, c'est transformer votre connaissance métier en colonnes."

### Machine Learning
> "Un modèle n'est utile que s'il produit des décisions actionnables."

> "Toujours évaluer sur des données non vues. Sinon, vous testez la mémoire, pas l'intelligence."

---

## 📊 Tableau de Synthèse Final

À afficher/projeter en conclusion :

```
┌──────────────────────────────────────────────────────────────┐
│                 FIL ROUGE : RÉCAPITULATIF                    │
├──────────────────┬───────────────────┬───────────────────────┤
│    BIG DATA      │   DATA SCIENCE    │   MACHINE LEARNING    │
├──────────────────┼───────────────────┼───────────────────────┤
│ ✅ Spark         │ ✅ Qualité        │ ✅ Pipeline           │
│ ✅ Delta Lake    │ ✅ EDA            │ ✅ Train/Test         │
│ ✅ Agrégations   │ ✅ Features       │ ✅ Évaluation         │
│                  │ ✅ Cible ML       │ ✅ Scoring            │
├──────────────────┼───────────────────┼───────────────────────┤
│ "Je sais         │ "Je sais rendre   │ "Je sais produire     │
│ traiter à        │ la donnée         │ des prédictions       │
│ l'échelle"       │ exploitable"      │ actionnables"         │
└──────────────────┴───────────────────┴───────────────────────┘
```

---

## 🎯 Critères de Réussite

### Pour le participant
- [ ] A créé la table Delta avec succès
- [ ] Comprend la différence CSV/Delta
- [ ] A créé la cible `high_value_order`
- [ ] A obtenu un AUC > 0.7
- [ ] Sait interpréter la matrice de confusion
- [ ] Propose une recommandation métier

### Pour le formateur
- [ ] Chaque question clé a été posée
- [ ] Les pièges ont été anticipés
- [ ] La synthèse finale a été faite
- [ ] Le lien théorie/pratique est clair

---

## 📚 Ressources Complémentaires

### Documentation
- [Spark SQL Guide](https://spark.apache.org/docs/latest/sql-programming-guide.html)
- [Delta Lake Quickstart](https://docs.delta.io/latest/quick-start.html)
- [Spark ML Pipeline](https://spark.apache.org/docs/latest/ml-pipeline.html)

### Exercices Avancés
- Ajouter MLflow pour le tracking
- Implémenter un modèle Random Forest
- Faire une cross-validation
- Calculer les feature importances

---

*Guide formateur — Fil Rouge Big Data / Data Science / ML*
