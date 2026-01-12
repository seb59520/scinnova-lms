# Databricks notebook source
# MAGIC %md
# MAGIC # 🤖 Notebook 3 — MACHINE LEARNING : Modèle, Évaluation, Scoring
# MAGIC 
# MAGIC ## 🎯 Objectif
# MAGIC **Entraîner un modèle de classification, l'évaluer et produire des prédictions actionnables**
# MAGIC 
# MAGIC ---
# MAGIC 
# MAGIC ### Ce que vous allez apprendre
# MAGIC 1. Construire un pipeline ML complet (encodage + modèle)
# MAGIC 2. Entraîner un modèle de classification (Logistic Regression)
# MAGIC 3. Évaluer les performances (AUC, matrice de confusion)
# MAGIC 4. Scorer de nouvelles données et interpréter les résultats
# MAGIC 
# MAGIC ### Durée estimée : 45-60 minutes
# MAGIC 
# MAGIC ---
# MAGIC 
# MAGIC ## 📊 Contexte Métier
# MAGIC 
# MAGIC L'équipe Marketing veut utiliser votre modèle pour :
# MAGIC - **Identifier** les commandes à forte valeur dès leur création
# MAGIC - **Prioriser** le service client pour ces commandes
# MAGIC - **Déclencher** des offres de fidélisation ciblées
# MAGIC 
# MAGIC Vous devez livrer un modèle fiable avec des métriques claires.

# COMMAND ----------

# MAGIC %md
# MAGIC ## 1️⃣ Chargement du Dataset ML

# COMMAND ----------

# Chargement du dataset préparé dans le Notebook 2
ml_df = spark.table("sales_ml_ready")

print(f"📊 Dataset ML : {ml_df.count():,} lignes")
ml_df.printSchema()

# COMMAND ----------

display(ml_df.limit(10))

# COMMAND ----------

# Vérification de la distribution de la cible
display(ml_df.groupBy("high_value_order").count())

# COMMAND ----------

# MAGIC %md
# MAGIC ## 2️⃣ Split Train / Test
# MAGIC 
# MAGIC ### Stratégie
# MAGIC - **80%** pour l'entraînement (apprentissage des patterns)
# MAGIC - **20%** pour le test (évaluation sur données non vues)
# MAGIC 
# MAGIC ⚠️ Le `seed=42` garantit la reproductibilité

# COMMAND ----------

# Split stratifié 80/20
train, test = ml_df.randomSplit([0.8, 0.2], seed=42)

print(f"📊 Train : {train.count():,} lignes")
print(f"📊 Test  : {test.count():,} lignes")

# COMMAND ----------

# Vérification de la distribution dans chaque set
print("Distribution Train :")
display(train.groupBy("high_value_order").count())

print("Distribution Test :")
display(test.groupBy("high_value_order").count())

# COMMAND ----------

# MAGIC %md
# MAGIC ## 3️⃣ Construction du Pipeline ML
# MAGIC 
# MAGIC ### Architecture du Pipeline
# MAGIC 
# MAGIC ```
# MAGIC [Données brutes]
# MAGIC      ↓
# MAGIC [StringIndexer] → Convertit les catégories en indices numériques
# MAGIC      ↓
# MAGIC [OneHotEncoder] → Transforme les indices en vecteurs binaires
# MAGIC      ↓
# MAGIC [VectorAssembler] → Combine toutes les features en un vecteur unique
# MAGIC      ↓
# MAGIC [LogisticRegression] → Modèle de classification
# MAGIC      ↓
# MAGIC [Prédictions]
# MAGIC ```

# COMMAND ----------

from pyspark.ml import Pipeline
from pyspark.ml.feature import StringIndexer, OneHotEncoder, VectorAssembler
from pyspark.ml.classification import LogisticRegression

# Définition des colonnes
cat_cols = ["country", "channel", "payment", "category", "product"]
num_cols = ["price", "quantity", "month", "dow"]

# COMMAND ----------

# MAGIC %md
# MAGIC ### 3.1 Encodage des Variables Catégorielles
# MAGIC 
# MAGIC Spark ML nécessite des **vecteurs numériques**. Pour les catégories :
# MAGIC 
# MAGIC 1. **StringIndexer** : "France" → 0, "Allemagne" → 1, ...
# MAGIC 2. **OneHotEncoder** : 0 → [1,0,0,...], 1 → [0,1,0,...], ...

# COMMAND ----------

# Création des StringIndexers (un par colonne catégorielle)
indexers = [
    StringIndexer(
        inputCol=c, 
        outputCol=f"{c}_idx",
        handleInvalid="keep"  # Garde les valeurs inconnues (safety)
    ) 
    for c in cat_cols
]

# Création des OneHotEncoders
encoders = [
    OneHotEncoder(
        inputCol=f"{c}_idx", 
        outputCol=f"{c}_ohe"
    ) 
    for c in cat_cols
]

print(f"✅ {len(indexers)} indexers + {len(encoders)} encoders créés")

# COMMAND ----------

# MAGIC %md
# MAGIC ### 3.2 Assemblage des Features

# COMMAND ----------

# Colonnes finales à assembler
feature_cols = [f"{c}_ohe" for c in cat_cols] + num_cols
print(f"📋 Features à assembler : {feature_cols}")

# VectorAssembler : combine tout en un seul vecteur "features"
assembler = VectorAssembler(
    inputCols=feature_cols,
    outputCol="features"
)

# COMMAND ----------

# MAGIC %md
# MAGIC ### 3.3 Modèle : Logistic Regression
# MAGIC 
# MAGIC **Pourquoi Logistic Regression ?**
# MAGIC - ✅ Simple et interprétable
# MAGIC - ✅ Rapide à entraîner
# MAGIC - ✅ Bonne baseline pour la classification binaire
# MAGIC - ✅ Probabilités calibrées

# COMMAND ----------

# Création du modèle
lr = LogisticRegression(
    featuresCol="features",
    labelCol="high_value_order",
    maxIter=100,
    regParam=0.01  # Légère régularisation L2
)

# COMMAND ----------

# MAGIC %md
# MAGIC ### 3.4 Assemblage du Pipeline Complet

# COMMAND ----------

# Pipeline = séquence d'étapes
pipeline = Pipeline(stages=indexers + encoders + [assembler, lr])

print("✅ Pipeline créé avec", len(pipeline.getStages()), "étapes")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 4️⃣ Entraînement du Modèle

# COMMAND ----------

# Entraînement (peut prendre 1-2 minutes sur 1.6M lignes)
print("🚀 Entraînement en cours...")
model = pipeline.fit(train)
print("✅ Modèle entraîné !")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 5️⃣ Évaluation du Modèle

# COMMAND ----------

# Prédictions sur le jeu de test
predictions = model.transform(test)

# COMMAND ----------

# Aperçu des prédictions
display(
    predictions.select(
        "country", "channel", "category", "price", "quantity",
        "high_value_order", "rawPrediction", "probability", "prediction"
    ).limit(20)
)

# COMMAND ----------

# MAGIC %md
# MAGIC ### 5.1 Métrique : AUC (Area Under ROC Curve)
# MAGIC 
# MAGIC **Interprétation de l'AUC :**
# MAGIC - `0.5` = modèle aléatoire (inutile)
# MAGIC - `0.7-0.8` = modèle acceptable
# MAGIC - `0.8-0.9` = bon modèle
# MAGIC - `> 0.9` = excellent modèle

# COMMAND ----------

from pyspark.ml.evaluation import BinaryClassificationEvaluator

# Évaluateur AUC
evaluator_auc = BinaryClassificationEvaluator(
    labelCol="high_value_order",
    metricName="areaUnderROC"
)

auc = evaluator_auc.evaluate(predictions)
print(f"📊 AUC (Area Under ROC) : {auc:.4f}")

# COMMAND ----------

# Évaluateur PR-AUC (Area Under Precision-Recall Curve)
evaluator_pr = BinaryClassificationEvaluator(
    labelCol="high_value_order",
    metricName="areaUnderPR"
)

pr_auc = evaluator_pr.evaluate(predictions)
print(f"📊 PR-AUC : {pr_auc:.4f}")

# COMMAND ----------

# MAGIC %md
# MAGIC ### 5.2 Matrice de Confusion
# MAGIC 
# MAGIC | | Prédit 0 | Prédit 1 |
# MAGIC |---|---|---|
# MAGIC | **Réel 0** | TN (True Negative) | FP (False Positive) |
# MAGIC | **Réel 1** | FN (False Negative) | TP (True Positive) |

# COMMAND ----------

from pyspark.sql.functions import col, when

# Création de la colonne de prédiction binaire (seuil 0.5)
pred_binary = predictions.withColumn(
    "pred_label", 
    when(col("probability")[1] >= 0.5, 1).otherwise(0)
)

# Matrice de confusion
confusion_matrix = (
    pred_binary
    .groupBy("high_value_order", "pred_label")
    .count()
    .orderBy("high_value_order", "pred_label")
)

display(confusion_matrix)

# COMMAND ----------

# Calcul des métriques détaillées
from pyspark.sql.functions import sum as _sum

# Extraction des valeurs
cm_values = pred_binary.groupBy("high_value_order", "pred_label").count().collect()

# Parsing (attention à l'ordre)
tp = fn = fp = tn = 0
for row in cm_values:
    if row["high_value_order"] == 1 and row["pred_label"] == 1:
        tp = row["count"]
    elif row["high_value_order"] == 1 and row["pred_label"] == 0:
        fn = row["count"]
    elif row["high_value_order"] == 0 and row["pred_label"] == 1:
        fp = row["count"]
    elif row["high_value_order"] == 0 and row["pred_label"] == 0:
        tn = row["count"]

# Métriques
precision = tp / (tp + fp) if (tp + fp) > 0 else 0
recall = tp / (tp + fn) if (tp + fn) > 0 else 0
f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
accuracy = (tp + tn) / (tp + tn + fp + fn)

print(f"""
📊 Métriques de Classification (seuil = 0.5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Accuracy  : {accuracy:.2%}
🎯 Precision : {precision:.2%}
📈 Recall    : {recall:.2%}
⚖️  F1-Score  : {f1:.2%}

📋 Matrice de Confusion
━━━━━━━━━━━━━━━━━━━━━━━━
True Positives  (TP) : {tp:,}
True Negatives  (TN) : {tn:,}
False Positives (FP) : {fp:,}
False Negatives (FN) : {fn:,}
""")

# COMMAND ----------

# MAGIC %md
# MAGIC ### 💡 Interprétation des Métriques
# MAGIC 
# MAGIC | Métrique | Signification Métier |
# MAGIC |----------|----------------------|
# MAGIC | **Precision** | "Quand je dis high-value, j'ai raison X% du temps" |
# MAGIC | **Recall** | "Je capture X% des vraies commandes high-value" |
# MAGIC | **F1-Score** | Équilibre entre precision et recall |
# MAGIC 
# MAGIC **Trade-off métier** :
# MAGIC - Si coût FP élevé (offres gaspillées) → optimiser Precision
# MAGIC - Si coût FN élevé (clients VIP ignorés) → optimiser Recall

# COMMAND ----------

# MAGIC %md
# MAGIC ## 6️⃣ Scoring : Utilisation Opérationnelle
# MAGIC 
# MAGIC Le modèle produit une **probabilité** d'être high-value, utilisable pour :
# MAGIC - Prioriser le traitement des commandes
# MAGIC - Segmenter les clients
# MAGIC - Déclencher des actions automatiques

# COMMAND ----------

from pyspark.sql.functions import round as spark_round

# Scoring de l'ensemble des données
scored = model.transform(ml_df).select(
    "country", "channel", "payment", "category", "product",
    "price", "quantity", "month", "dow",
    "high_value_order",
    spark_round(col("probability")[1], 4).alias("p_high_value")
)

# COMMAND ----------

# Top 20 commandes avec la plus forte probabilité
print("🏆 Top 20 commandes à plus forte probabilité high-value :")
display(
    scored
    .orderBy(col("p_high_value").desc())
    .limit(20)
)

# COMMAND ----------

# Distribution des scores
print("📊 Distribution des scores de probabilité :")
display(
    scored
    .withColumn("score_bucket", 
        when(col("p_high_value") < 0.2, "0-20%")
        .when(col("p_high_value") < 0.4, "20-40%")
        .when(col("p_high_value") < 0.6, "40-60%")
        .when(col("p_high_value") < 0.8, "60-80%")
        .otherwise("80-100%")
    )
    .groupBy("score_bucket")
    .count()
    .orderBy("score_bucket")
)

# COMMAND ----------

# MAGIC %md
# MAGIC ## 7️⃣ Interprétation Métier
# MAGIC 
# MAGIC ### Quels facteurs influencent les commandes high-value ?

# COMMAND ----------

# Taux de high-value par pays
print("🌍 Taux de commandes high-value par pays :")
display(
    scored
    .groupBy("country")
    .agg(
        count("*").alias("nb_commandes"),
        _sum("high_value_order").alias("nb_high_value"),
        spark_round(avg("p_high_value"), 3).alias("prob_moyenne")
    )
    .withColumn("taux_high_value", 
                spark_round(col("nb_high_value") / col("nb_commandes") * 100, 1))
    .orderBy(col("prob_moyenne").desc())
)

# COMMAND ----------

# Taux de high-value par canal
print("📱 Taux de commandes high-value par canal :")
display(
    scored
    .groupBy("channel")
    .agg(
        count("*").alias("nb_commandes"),
        spark_round(avg("p_high_value"), 3).alias("prob_moyenne"),
        spark_round(avg("high_value_order") * 100, 1).alias("taux_high_value_pct")
    )
    .orderBy(col("prob_moyenne").desc())
)

# COMMAND ----------

# Taux de high-value par catégorie
print("📦 Taux de commandes high-value par catégorie :")
display(
    scored
    .groupBy("category")
    .agg(
        count("*").alias("nb_commandes"),
        spark_round(avg("p_high_value"), 3).alias("prob_moyenne"),
        spark_round(avg("high_value_order") * 100, 1).alias("taux_high_value_pct")
    )
    .orderBy(col("prob_moyenne").desc())
)

# COMMAND ----------

# MAGIC %md
# MAGIC ### 📋 Recommandations Métier
# MAGIC 
# MAGIC Sur la base de notre analyse, voici les actions recommandées :
# MAGIC 
# MAGIC 1. **Service Client Premium** :
# MAGIC    - Prioriser les commandes avec `p_high_value > 0.7`
# MAGIC    - Délai de réponse réduit pour ces clients
# MAGIC 
# MAGIC 2. **Marketing Ciblé** :
# MAGIC    - Focus sur les catégories à forte probabilité (Informatique, Électronique)
# MAGIC    - Campagnes adaptées par canal (Web vs Mobile)
# MAGIC 
# MAGIC 3. **Logistique** :
# MAGIC    - Anticiper les pics (novembre/décembre)
# MAGIC    - Stock renforcé sur les produits high-value

# COMMAND ----------

# MAGIC %md
# MAGIC ## 8️⃣ Extensions (Niveau Avancé)
# MAGIC 
# MAGIC ### 8.1 Tracking avec MLflow

# COMMAND ----------

# MAGIC %md
# MAGIC ```python
# MAGIC import mlflow
# MAGIC import mlflow.spark
# MAGIC 
# MAGIC # Démarrer un run MLflow
# MAGIC with mlflow.start_run(run_name="logistic_regression_v1"):
# MAGIC     # Log des paramètres
# MAGIC     mlflow.log_param("model_type", "LogisticRegression")
# MAGIC     mlflow.log_param("max_iter", 100)
# MAGIC     mlflow.log_param("reg_param", 0.01)
# MAGIC     
# MAGIC     # Log des métriques
# MAGIC     mlflow.log_metric("auc", auc)
# MAGIC     mlflow.log_metric("precision", precision)
# MAGIC     mlflow.log_metric("recall", recall)
# MAGIC     mlflow.log_metric("f1_score", f1)
# MAGIC     
# MAGIC     # Log du modèle
# MAGIC     mlflow.spark.log_model(model, "model")
# MAGIC     
# MAGIC     print("✅ Run MLflow enregistré !")
# MAGIC ```

# COMMAND ----------

# MAGIC %md
# MAGIC ### 8.2 Modèle Alternatif : Random Forest

# COMMAND ----------

# Pour tester un modèle plus puissant (décommentez)

# from pyspark.ml.classification import RandomForestClassifier
# 
# rf = RandomForestClassifier(
#     featuresCol="features",
#     labelCol="high_value_order",
#     numTrees=100,
#     maxDepth=10
# )
# 
# pipeline_rf = Pipeline(stages=indexers + encoders + [assembler, rf])
# model_rf = pipeline_rf.fit(train)
# 
# pred_rf = model_rf.transform(test)
# auc_rf = evaluator_auc.evaluate(pred_rf)
# print(f"📊 AUC Random Forest : {auc_rf:.4f}")

# COMMAND ----------

# MAGIC %md
# MAGIC ### 8.3 Cross-Validation

# COMMAND ----------

# Pour une évaluation plus robuste (décommentez)

# from pyspark.ml.tuning import CrossValidator, ParamGridBuilder
# 
# # Grille de paramètres
# paramGrid = (ParamGridBuilder()
#     .addGrid(lr.regParam, [0.001, 0.01, 0.1])
#     .addGrid(lr.maxIter, [50, 100])
#     .build())
# 
# # Cross-validator
# cv = CrossValidator(
#     estimator=pipeline,
#     estimatorParamMaps=paramGrid,
#     evaluator=evaluator_auc,
#     numFolds=3
# )
# 
# cv_model = cv.fit(train)
# print(f"📊 Meilleur AUC CV : {max(cv_model.avgMetrics):.4f}")

# COMMAND ----------

# MAGIC %md
# MAGIC ## ✅ Synthèse Notebook 3
# MAGIC 
# MAGIC ### Ce que nous avons accompli
# MAGIC 
# MAGIC | Étape | Résultat |
# MAGIC |-------|----------|
# MAGIC | Pipeline ML | Encodage + Assemblage + Modèle |
# MAGIC | Entraînement | LogisticRegression sur 1.6M lignes |
# MAGIC | Évaluation | AUC, Precision, Recall, F1 |
# MAGIC | Scoring | Probabilités pour chaque commande |
# MAGIC | Interprétation | Recommandations métier actionnables |
# MAGIC 
# MAGIC ### Messages clés
# MAGIC 
# MAGIC 1. **Pipeline** = reproductibilité et déploiement simplifié
# MAGIC 2. **Évaluation** = toujours sur données non vues (test set)
# MAGIC 3. **Interprétation** = traduire les scores en décisions business
# MAGIC 
# MAGIC ---
# MAGIC 
# MAGIC ## 🎓 Synthèse Fil Rouge Complet
# MAGIC 
# MAGIC | Notebook | Compétence | Livrable |
# MAGIC |----------|------------|----------|
# MAGIC | **1 - Big Data** | Ingérer & traiter à l'échelle | Table Delta optimisée |
# MAGIC | **2 - Data Science** | Explorer & fiabiliser | Dataset ML avec cible |
# MAGIC | **3 - Machine Learning** | Modéliser & évaluer | Modèle + scores + recommandations |
# MAGIC 
# MAGIC > 💡 **Le Data Scientist complet** maîtrise les 3 étapes : de la donnée brute à la décision business.

# COMMAND ----------

# MAGIC %md
# MAGIC ---
# MAGIC ## 📝 Exercices Pratiques
# MAGIC 
# MAGIC ### Exercice 1 : Seuil Optimal
# MAGIC Au lieu de 0.5, trouvez le seuil qui maximise le F1-Score.
# MAGIC 
# MAGIC ### Exercice 2 : Comparaison de Modèles
# MAGIC Entraînez un GBTClassifier et comparez l'AUC avec LogisticRegression.
# MAGIC 
# MAGIC ### Exercice 3 : Feature Importance
# MAGIC Pour un RandomForest, affichez les features les plus importantes.

# COMMAND ----------

# 🎯 EXERCICE 1 : Votre code ici
# Indice : testez plusieurs seuils [0.3, 0.4, 0.5, 0.6, 0.7] et calculez F1 pour chacun



# COMMAND ----------

# 🎯 EXERCICE 2 : Votre code ici
# from pyspark.ml.classification import GBTClassifier
# Indice : même pipeline, remplacer lr par GBTClassifier



# COMMAND ----------

# 🎯 EXERCICE 3 : Votre code ici
# Indice : model.stages[-1].featureImportances



# COMMAND ----------

# MAGIC %md
# MAGIC ---
# MAGIC 
# MAGIC ## 🏆 Félicitations !
# MAGIC 
# MAGIC Vous avez complété le fil rouge **Big Data → Data Science → Machine Learning** !
# MAGIC 
# MAGIC Vous savez maintenant :
# MAGIC - ✅ Ingérer des données massives avec Spark
# MAGIC - ✅ Les explorer et les préparer pour le ML
# MAGIC - ✅ Construire et évaluer un modèle de classification
# MAGIC - ✅ Produire des recommandations métier actionnables
