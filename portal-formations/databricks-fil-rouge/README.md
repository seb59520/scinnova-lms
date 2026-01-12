# 🎯 Fil Rouge Databricks : E-commerce — "Comprendre & Prédire la Performance Commerciale"

## 📋 Vue d'ensemble

Ce fil rouge couvre le parcours complet **Big Data → Data Science → Machine Learning** à travers un cas métier concret : l'analyse et la prédiction de la performance commerciale d'un e-commerce.

### 🎓 Objectifs pédagogiques

À l'issue de ce fil rouge, les participants sauront :

1. **Big Data** : Ingérer et traiter des données massives avec Spark
2. **Data Science** : Explorer, fiabiliser et préparer des données pour le ML
3. **Machine Learning** : Construire, évaluer et déployer un modèle de classification

---

## 📊 Dataset : `sales_2M.csv`

| Colonne      | Type    | Description                                   |
|--------------|---------|-----------------------------------------------|
| `order_id`   | String  | Identifiant unique de commande (ORD-0000001)  |
| `order_date` | Date    | Date de la commande (2023-01-01 à 2024-12-31) |
| `product`    | String  | Nom du produit (Smartphone, Laptop, TV, etc.) |
| `category`   | String  | Catégorie (Électronique, Informatique, Audio) |
| `country`    | String  | Pays (France, Allemagne, Espagne, etc.)       |
| `price`      | Float   | Prix unitaire (€)                             |
| `quantity`   | Integer | Quantité commandée                            |
| `channel`    | String  | Canal de vente (Web, Mobile, Magasin)         |
| `payment`    | String  | Moyen de paiement (Carte, Paypal, etc.)       |

**Caractéristiques clés :**
- 2 millions de lignes
- Période : 2 ans (730 jours)
- Saisonnalité : pics en novembre/décembre
- Distribution réaliste des pays (France dominante à 34%)

---

## 📚 Structure du Cours

### Notebook 1 — BIG DATA (45-60 min)
**"Passer du CSV brut à une table exploitable"**

| Section | Durée | Contenu |
|---------|-------|---------|
| Introduction | 5 min | Contexte, objectifs, présentation du dataset |
| Lecture Spark | 10 min | Chargement CSV, inférence de schéma |
| Normalisation | 10 min | Typage, calcul du revenue |
| Delta Lake | 10 min | Persistance optimisée, time travel |
| Analyses BI | 15 min | CA par pays, top produits, tendances |
| Synthèse | 5 min | Points clés, transition vers Notebook 2 |

### Notebook 2 — DATA SCIENCE (45-60 min)
**"Rendre la donnée fiable + construire une cible ML"**

| Section | Durée | Contenu |
|---------|-------|---------|
| Qualité des données | 10 min | Contrôle nulls, valeurs aberrantes |
| EDA | 15 min | Distributions, corrélations, insights |
| Feature Engineering | 15 min | Variables temporelles, cible ML |
| Préparation ML | 10 min | Sélection colonnes, encodage prévu |
| Synthèse | 5 min | Points clés, transition vers Notebook 3 |

### Notebook 3 — MACHINE LEARNING (45-60 min)
**"Entraîner, évaluer, scorer"**

| Section | Durée | Contenu |
|---------|-------|---------|
| Split Train/Test | 5 min | Stratégie de séparation |
| Pipeline ML | 15 min | Encodage, assemblage, modèle |
| Entraînement | 10 min | Fit du modèle LogisticRegression |
| Évaluation | 15 min | AUC, matrice de confusion |
| Scoring & Interprétation | 10 min | Prédictions, recommandations métier |
| Extensions | 5 min | MLflow, modèles avancés |

---

## 🚀 Prérequis Techniques

### Environnement Databricks
- Cluster avec Spark 3.x
- Runtime ML recommandé
- Au moins 4 workers pour le traitement des 2M lignes

### Upload du Dataset
1. Aller dans **Data** > **Create Table** > **Upload File**
2. Uploader `sales_2M.csv`
3. Noter le chemin (ex: `dbfs:/FileStore/tables/sales_2M.csv`)

---

## 💡 Questions à Poser aux Participants

### Notebook 1 - Big Data
- "Pourquoi Spark plutôt que Pandas pour 2M lignes ?"
- "Quel avantage de Delta Lake vs CSV pour les analyses répétées ?"
- "Comment interpréter les variations de CA par pays ?"

### Notebook 2 - Data Science
- "Quelles colonnes pourraient contenir des valeurs aberrantes ?"
- "Pourquoi créer une cible binaire plutôt que prédire le revenue exact ?"
- "Quelles autres features pourrait-on créer ?"

### Notebook 3 - Machine Learning
- "Pourquoi 80/20 pour le split ?"
- "Que signifie un AUC de 0.85 ?"
- "Comment utiliser ce modèle en production ?"

---

## ⚠️ Pièges Courants

| Piège | Solution |
|-------|----------|
| Oubli du `handleInvalid="keep"` | Valeurs inconnues en test → erreur |
| Colonnes non typées | Toujours caster après lecture CSV |
| Fuite de données (data leakage) | Ne jamais calculer stats sur tout avant split |
| Overfitting | Toujours évaluer sur test, pas sur train |

---

## 📈 Extensions Possibles

### Niveau Intermédiaire
- Ajouter des features : `is_weekend`, `week_of_year`, `basket_size`
- Tester `RandomForestClassifier` au lieu de LogisticRegression
- Comparer les AUC entre modèles

### Niveau Avancé
- Intégrer MLflow pour le tracking
- Cross-validation avec `CrossValidator`
- Feature importance et SHAP values
- Déploiement avec Model Serving

---

## 📁 Fichiers du Cours

```
databricks-fil-rouge/
├── README.md                    # Ce fichier
├── 01_Big_Data_Ingestion.py    # Notebook 1
├── 02_Data_Science_EDA.py      # Notebook 2
├── 03_Machine_Learning.py      # Notebook 3
└── solutions/                   # Solutions complètes (optionnel)
```

---

## 🎯 Compétences Validées

À la fin du fil rouge, les participants peuvent affirmer :

> ✅ **Big Data** : "Je sais ingérer et traiter des données à grande échelle avec Spark"
>
> ✅ **Data Science** : "Je sais explorer, nettoyer et préparer des données pour le ML"  
>
> ✅ **Machine Learning** : "Je sais entraîner un modèle, l'évaluer et produire des recommandations actionnables"

---

*Fil rouge créé pour la formation Data Science & Big Data — Databricks*
