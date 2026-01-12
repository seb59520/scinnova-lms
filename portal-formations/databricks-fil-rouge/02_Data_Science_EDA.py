# Databricks notebook source
# MAGIC %md
# MAGIC # 🔬 Notebook 2 — DATA SCIENCE : Qualité, EDA, Features
# MAGIC 
# MAGIC ## 🎯 Objectif
# MAGIC **Rendre la donnée fiable et construire une cible ML pertinente**
# MAGIC 
# MAGIC ---
# MAGIC 
# MAGIC ### Ce que vous allez apprendre
# MAGIC 1. Contrôler la qualité des données (nulls, aberrations)
# MAGIC 2. Explorer les distributions et corrélations (EDA)
# MAGIC 3. Créer des features pertinentes pour le ML
# MAGIC 4. Définir une cible métier compréhensible
# MAGIC 
# MAGIC ### Durée estimée : 45-60 minutes
# MAGIC 
# MAGIC ---
# MAGIC 
# MAGIC ## 📊 Contexte Métier
# MAGIC 
# MAGIC L'équipe Marketing vous demande d'identifier les **commandes à forte valeur** pour :
# MAGIC - Prioriser le service client premium
# MAGIC - Déclencher des offres de fidélisation
# MAGIC - Anticiper la charge logistique
# MAGIC 
# MAGIC Vous devez préparer un jeu de données pour entraîner un modèle de classification.

# COMMAND ----------

# MAGIC %md
# MAGIC ## 1️⃣ Chargement des Données depuis Delta

# COMMAND ----------

# Chargement de la table Delta créée dans le Notebook 1
sales = spark.table("sales_delta")

print(f"📊 Nombre de lignes : {sales.count():,}")
sales.printSchema()

# COMMAND ----------

display(sales.limit(5))

# COMMAND ----------

# MAGIC %md
# MAGIC ## 2️⃣ Contrôle Qualité des Données
# MAGIC 
# MAGIC ### Objectif : détecter les problèmes avant qu'ils ne biaisent nos analyses
# MAGIC 
# MAGIC Checklist qualité :
# MAGIC - ✅ Valeurs nulles
# MAGIC - ✅ Valeurs aberrantes (outliers)
# MAGIC - ✅ Cohérence des domaines (valeurs attendues)
# MAGIC - ✅ Doublons éventuels

# COMMAND ----------

# MAGIC %md
# MAGIC ### 🔍 2.1 Détection des Valeurs Nulles

# COMMAND ----------

from pyspark.sql.functions import col, when, isnan, sum as _sum, count

# Comptage des nulls et NaN par colonne
null_counts = sales.select([
    _sum(
        when(col(c).isNull() | (col(c) == "") | isnan(col(c)), 1).otherwise(0)
    ).alias(c)
    for c in sales.columns
])

display(null_counts)

# COMMAND ----------

# Version en pourcentage
total_rows = sales.count()

null_pct = sales.select([
    (
        _sum(when(col(c).isNull() | (col(c) == ""), 1).otherwise(0)) / total_rows * 100
    ).alias(c)
    for c in sales.columns
])

print("📊 Pourcentage de valeurs nulles par colonne :")
display(null_pct)

# COMMAND ----------

# MAGIC %md
# MAGIC ### ✅ Résultat Qualité Nulls
# MAGIC 
# MAGIC Notre dataset simulé est propre (0% de nulls). En production, vous auriez probablement :
# MAGIC - Des dates manquantes
# MAGIC - Des pays non renseignés
# MAGIC - Des prix à 0 ou négatifs
# MAGIC 
# MAGIC **Actions typiques** : imputation, suppression, signalement

# COMMAND ----------

# MAGIC %md
# MAGIC ### 🔍 2.2 Détection des Valeurs Aberrantes

# COMMAND ----------

from pyspark.sql.functions import min as _min, max as _max, avg, stddev

# Statistiques sur les numériques
stats_num = sales.select(
    _min("price").alias("price_min"),
    _max("price").alias("price_max"),
    avg("price").alias("price_avg"),
    stddev("price").alias("price_std"),
    _min("quantity").alias("qty_min"),
    _max("quantity").alias("qty_max"),
    avg("quantity").alias("qty_avg"),
    _min("revenue").alias("rev_min"),
    _max("revenue").alias("rev_max"),
    avg("revenue").alias("rev_avg"),
)

display(stats_num)

# COMMAND ----------

# Vérification : y a-t-il des prix négatifs ou nuls ?
prix_invalides = sales.filter((col("price") <= 0) | (col("quantity") <= 0))
print(f"⚠️ Lignes avec prix/quantité invalide : {prix_invalides.count()}")

# COMMAND ----------

# MAGIC %md
# MAGIC ### 🔍 2.3 Vérification des Domaines Catégoriels

# COMMAND ----------

# Valeurs uniques par colonne catégorielle
cat_cols = ["product", "category", "country", "channel", "payment"]

for col_name in cat_cols:
    distinct_values = sales.select(col_name).distinct().count()
    print(f"📋 {col_name}: {distinct_values} valeurs uniques")

# COMMAND ----------

# Détail des valeurs par dimension
for col_name in cat_cols:
    print(f"\n📋 Valeurs de '{col_name}':")
    display(sales.groupBy(col_name).count().orderBy(col("count").desc()))

# COMMAND ----------

# MAGIC %md
# MAGIC ## 3️⃣ Analyse Exploratoire (EDA)
# MAGIC 
# MAGIC ### Objectif : comprendre les distributions et identifier des patterns

# COMMAND ----------

# MAGIC %md
# MAGIC ### 📊 3.1 Distribution du Revenue

# COMMAND ----------

# Statistiques descriptives du revenue
display(sales.select("revenue").describe())

# COMMAND ----------

# Distribution par tranches de revenue
from pyspark.sql.functions import when, lit

tranches = (
    sales
    .withColumn("tranche_revenue", 
        when(col("revenue") < 100, "< 100€")
        .when(col("revenue") < 500, "100-500€")
        .when(col("revenue") < 1000, "500-1000€")
        .when(col("revenue") < 2000, "1000-2000€")
        .otherwise("> 2000€")
    )
    .groupBy("tranche_revenue")
    .count()
    .orderBy("tranche_revenue")
)

display(tranches)

# COMMAND ----------

# MAGIC %md
# MAGIC ### 📊 3.2 Panier Moyen par Dimension

# COMMAND ----------

from pyspark.sql.functions import round as spark_round

# Panier moyen par pays
panier_pays = (
    sales
    .groupBy("country")
    .agg(
        spark_round(avg("revenue"), 2).alias("panier_moyen"),
        count("*").alias("nb_commandes")
    )
    .orderBy(col("panier_moyen").desc())
)

display(panier_pays)

# COMMAND ----------

# Panier moyen par canal
panier_canal = (
    sales
    .groupBy("channel")
    .agg(
        spark_round(avg("revenue"), 2).alias("panier_moyen"),
        count("*").alias("nb_commandes")
    )
    .orderBy(col("panier_moyen").desc())
)

display(panier_canal)

# COMMAND ----------

# Panier moyen par catégorie de produit
panier_categorie = (
    sales
    .groupBy("category")
    .agg(
        spark_round(avg("revenue"), 2).alias("panier_moyen"),
        count("*").alias("nb_commandes")
    )
    .orderBy(col("panier_moyen").desc())
)

display(panier_categorie)

# COMMAND ----------

# MAGIC %md
# MAGIC ### 📊 3.3 Analyse Temporelle

# COMMAND ----------

from pyspark.sql.functions import month, dayofweek, year

# CA par mois
ca_mensuel = (
    sales
    .withColumn("mois", month(col("order_date")))
    .groupBy("mois")
    .agg(_sum("revenue").alias("ca_total"))
    .orderBy("mois")
)

display(ca_mensuel)

# COMMAND ----------

# CA par jour de la semaine (1=Dimanche, 7=Samedi)
ca_jour_semaine = (
    sales
    .withColumn("jour_semaine", dayofweek(col("order_date")))
    .groupBy("jour_semaine")
    .agg(
        _sum("revenue").alias("ca_total"),
        count("*").alias("nb_commandes")
    )
    .orderBy("jour_semaine")
)

display(ca_jour_semaine)

# COMMAND ----------

# MAGIC %md
# MAGIC ### 💡 Insights EDA
# MAGIC 
# MAGIC Observations clés à noter :
# MAGIC 1. **Saisonnalité** : pics en novembre/décembre (Black Friday, Noël)
# MAGIC 2. **Canal Web** : panier moyen plus élevé que Mobile
# MAGIC 3. **Informatique** : catégorie avec le CA moyen le plus fort
# MAGIC 4. **France** : marché dominant en volume

# COMMAND ----------

# MAGIC %md
# MAGIC ## 4️⃣ Création de la Cible ML
# MAGIC 
# MAGIC ### Problématique Métier
# MAGIC 
# MAGIC > "Comment identifier à l'avance les commandes à forte valeur ?"
# MAGIC 
# MAGIC ### Choix : Classification Binaire
# MAGIC 
# MAGIC Nous créons une cible **`high_value_order`** :
# MAGIC - `1` si la commande est dans le **top 20%** des revenues
# MAGIC - `0` sinon
# MAGIC 
# MAGIC Cette approche est :
# MAGIC - ✅ Simple à expliquer métier
# MAGIC - ✅ Équilibrée (80/20)
# MAGIC - ✅ Actionnable (priorisation client)

# COMMAND ----------

# Calcul du seuil : percentile 80
seuil_p80 = sales.approxQuantile("revenue", [0.80], 0.01)[0]
print(f"💰 Seuil top 20% : {seuil_p80:.2f} €")

# COMMAND ----------

# Création de la cible + features temporelles
ds = (
    sales
    # Cible binaire
    .withColumn("high_value_order", 
                when(col("revenue") >= seuil_p80, 1).otherwise(0).cast("int"))
    # Features temporelles
    .withColumn("month", month(col("order_date")))
    .withColumn("dow", dayofweek(col("order_date")))  # Day of Week
    .withColumn("year", year(col("order_date")))
)

# Vérification de la distribution de la cible
display(
    ds
    .groupBy("high_value_order")
    .agg(
        count("*").alias("nb_commandes"),
        spark_round(avg("revenue"), 2).alias("revenue_moyen")
    )
)

# COMMAND ----------

# MAGIC %md
# MAGIC ### ✅ Équilibre de la Cible
# MAGIC 
# MAGIC - **~80%** des commandes sont classées `0` (valeur normale)
# MAGIC - **~20%** des commandes sont classées `1` (haute valeur)
# MAGIC 
# MAGIC C'est un déséquilibre modéré, acceptable pour un premier modèle.

# COMMAND ----------

# MAGIC %md
# MAGIC ## 5️⃣ Préparation du Dataset ML
# MAGIC 
# MAGIC ### Sélection des Features
# MAGIC 
# MAGIC | Type | Colonnes |
# MAGIC |------|----------|
# MAGIC | **Numériques** | `price`, `quantity`, `month`, `dow` |
# MAGIC | **Catégorielles** | `country`, `channel`, `payment`, `category`, `product` |
# MAGIC | **Cible** | `high_value_order` |
# MAGIC 
# MAGIC ⚠️ On **exclut** `revenue` car c'est la variable utilisée pour créer la cible (fuite de données)

# COMMAND ----------

# Sélection des colonnes pour le ML
ml_df = ds.select(
    # Features numériques
    "price", "quantity", "month", "dow",
    # Features catégorielles
    "country", "channel", "payment", "category", "product",
    # Cible
    "high_value_order"
)

print(f"📊 Dataset ML : {ml_df.count():,} lignes, {len(ml_df.columns)} colonnes")
ml_df.printSchema()

# COMMAND ----------

display(ml_df.limit(10))

# COMMAND ----------

# MAGIC %md
# MAGIC ## 6️⃣ Sauvegarde du Dataset ML

# COMMAND ----------

# Sauvegarde en table Delta pour le Notebook 3
ml_df.write.mode("overwrite").format("delta").saveAsTable("sales_ml_ready")

print("✅ Table 'sales_ml_ready' créée avec succès !")

# COMMAND ----------

# MAGIC %md
# MAGIC ## ✅ Synthèse Notebook 2
# MAGIC 
# MAGIC ### Ce que nous avons accompli
# MAGIC 
# MAGIC | Étape | Résultat |
# MAGIC |-------|----------|
# MAGIC | Qualité | 0 null, pas d'aberration, domaines cohérents |
# MAGIC | EDA | Patterns identifiés (saisonnalité, canaux, pays) |
# MAGIC | Cible ML | `high_value_order` binaire (top 20%) |
# MAGIC | Features | 9 colonnes (4 num + 5 cat) |
# MAGIC 
# MAGIC ### Messages clés
# MAGIC 
# MAGIC 1. **Data Quality** = fondation de tout projet data
# MAGIC 2. **EDA** = comprendre avant de modéliser
# MAGIC 3. **Feature Engineering** = transformer la connaissance métier en variables
# MAGIC 
# MAGIC ### Prochaine étape
# MAGIC 
# MAGIC 👉 **Notebook 3 : Machine Learning** — Entraîner un modèle de classification

# COMMAND ----------

# MAGIC %md
# MAGIC ---
# MAGIC ## 📝 Exercices Pratiques
# MAGIC 
# MAGIC ### Exercice 1 : Feature "is_weekend"
# MAGIC Créez une colonne binaire `is_weekend` (1 si samedi/dimanche, 0 sinon).
# MAGIC 
# MAGIC ### Exercice 2 : Analyse Croisée
# MAGIC Quel canal a le plus fort taux de commandes "high value" par pays ?
# MAGIC 
# MAGIC ### Exercice 3 : Seuil Alternatif
# MAGIC Que se passe-t-il si on utilise le percentile 90 au lieu de 80 ?

# COMMAND ----------

# 🎯 EXERCICE 1 : Votre code ici
# Indice : dow == 1 (dimanche) ou dow == 7 (samedi)

# ds_weekend = ds.withColumn("is_weekend", 
#     when((col("dow") == 1) | (col("dow") == 7), 1).otherwise(0)
# )

# COMMAND ----------

# 🎯 EXERCICE 2 : Votre code ici
# Indice : groupBy("country", "channel"), calculer le taux de high_value_order



# COMMAND ----------

# 🎯 EXERCICE 3 : Votre code ici
# Indice : recalculer avec approxQuantile(..., [0.90], ...)


