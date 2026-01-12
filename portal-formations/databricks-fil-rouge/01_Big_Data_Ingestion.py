# Databricks notebook source
# MAGIC %md
# MAGIC # 📦 Notebook 1 — BIG DATA : Ingestion, Delta, Agrégations
# MAGIC 
# MAGIC ## 🎯 Objectif
# MAGIC **Passer du CSV brut à une table exploitable, optimisée pour l'analyse**
# MAGIC 
# MAGIC ---
# MAGIC 
# MAGIC ### Ce que vous allez apprendre
# MAGIC 1. Charger un fichier CSV massif avec Spark
# MAGIC 2. Normaliser les types de données
# MAGIC 3. Persister en format Delta Lake (performant)
# MAGIC 4. Réaliser des analyses BI distribuées
# MAGIC 
# MAGIC ### Durée estimée : 45-60 minutes
# MAGIC 
# MAGIC ---
# MAGIC 
# MAGIC ## 📊 Contexte Métier
# MAGIC 
# MAGIC Vous êtes Data Engineer chez un e-commerçant européen. L'équipe commerciale vous demande :
# MAGIC - Un tableau de bord des ventes par pays
# MAGIC - Le classement des produits best-sellers
# MAGIC - L'évolution du chiffre d'affaires dans le temps
# MAGIC 
# MAGIC Vous disposez d'un export de **2 millions de commandes** sur 2 ans.

# COMMAND ----------

# MAGIC %md
# MAGIC ## 1️⃣ Configuration & Lecture du CSV
# MAGIC 
# MAGIC ### Pourquoi Spark ?
# MAGIC 
# MAGIC | Outil | Limite pratique | Temps 2M lignes |
# MAGIC |-------|-----------------|-----------------|
# MAGIC | Excel | ~1M lignes | ❌ Impossible |
# MAGIC | Pandas | ~10M lignes (RAM) | ~30 secondes |
# MAGIC | **Spark** | **Illimité (distribué)** | **~5 secondes** |
# MAGIC 
# MAGIC Spark distribue le traitement sur plusieurs machines (workers), permettant de scaler horizontalement.

# COMMAND ----------

# 📁 Chemin vers le fichier CSV uploadé
# ⚠️ ADAPTER CE CHEMIN selon votre upload
PATH = "dbfs:/FileStore/tables/sales_2M.csv"

# COMMAND ----------

# Lecture du CSV avec inférence de schéma
df_raw = (
    spark.read
    .option("header", True)      # La première ligne contient les noms de colonnes
    .option("inferSchema", True) # Spark devine les types automatiquement
    .csv(PATH)
)

# Affichage du schéma inféré
print("📋 Schéma inféré par Spark :")
df_raw.printSchema()

# COMMAND ----------

# Aperçu des premières lignes
display(df_raw.limit(10))

# COMMAND ----------

# Nombre total de lignes
nb_lignes = df_raw.count()
print(f"📊 Nombre total de commandes : {nb_lignes:,}")

# COMMAND ----------

# MAGIC %md
# MAGIC ### 🔍 Observations
# MAGIC 
# MAGIC - `order_id` : identifiant unique de commande
# MAGIC - `order_date` : date au format string (à convertir)
# MAGIC - `product`, `category`, `country`, `channel`, `payment` : dimensions catégorielles
# MAGIC - `price`, `quantity` : mesures numériques
# MAGIC 
# MAGIC **⚠️ Problème** : `inferSchema` n'est pas toujours fiable. Vérifions et normalisons les types.

# COMMAND ----------

# MAGIC %md
# MAGIC ## 2️⃣ Normalisation des Types de Données
# MAGIC 
# MAGIC ### Bonnes pratiques
# MAGIC 1. Toujours **caster explicitement** les colonnes critiques
# MAGIC 2. Créer les **colonnes calculées** nécessaires (`revenue`)
# MAGIC 3. Gérer les **valeurs nulles** potentielles

# COMMAND ----------

from pyspark.sql.functions import col, to_date, round as spark_round

# Normalisation des types + calcul du revenue
df = (
    df_raw
    # Conversion de la date
    .withColumn("order_date", to_date(col("order_date"), "yyyy-MM-dd"))
    # Typage explicite des numériques
    .withColumn("price", col("price").cast("double"))
    .withColumn("quantity", col("quantity").cast("int"))
    # Calcul du chiffre d'affaires par ligne
    .withColumn("revenue", spark_round(col("price") * col("quantity"), 2))
)

# Vérification du nouveau schéma
print("✅ Schéma normalisé :")
df.printSchema()

# COMMAND ----------

# Aperçu avec la nouvelle colonne revenue
display(df.limit(10))

# COMMAND ----------

# MAGIC %md
# MAGIC ## 3️⃣ Persistance en Delta Lake
# MAGIC 
# MAGIC ### Pourquoi Delta Lake ?
# MAGIC 
# MAGIC | Caractéristique | CSV | Parquet | **Delta** |
# MAGIC |-----------------|-----|---------|-----------|
# MAGIC | Compression | ❌ | ✅ | ✅ |
# MAGIC | Schéma enforcé | ❌ | ✅ | ✅ |
# MAGIC | Transactions ACID | ❌ | ❌ | ✅ |
# MAGIC | Time Travel | ❌ | ❌ | ✅ |
# MAGIC | Updates/Deletes | ❌ | ❌ | ✅ |
# MAGIC 
# MAGIC **Delta Lake** = Parquet + transaction log + versioning

# COMMAND ----------

# Écriture en table Delta
# mode("overwrite") : remplace si existe déjà
df.write.mode("overwrite").format("delta").saveAsTable("sales_delta")

print("✅ Table 'sales_delta' créée avec succès !")

# COMMAND ----------

# Vérification : lecture depuis la table Delta
sales = spark.table("sales_delta")
print(f"📊 Lignes dans sales_delta : {sales.count():,}")

# COMMAND ----------

# MAGIC %md
# MAGIC ### 🕐 Time Travel (bonus)
# MAGIC 
# MAGIC Delta Lake conserve l'historique des versions. Utile pour :
# MAGIC - Auditer les modifications
# MAGIC - Revenir en arrière en cas d'erreur
# MAGIC - Reproduire des analyses passées

# COMMAND ----------

# Historique de la table
display(spark.sql("DESCRIBE HISTORY sales_delta"))

# COMMAND ----------

# MAGIC %md
# MAGIC ## 4️⃣ Analyses BI Distribuées
# MAGIC 
# MAGIC Maintenant que les données sont propres et optimisées, répondons aux questions métier.

# COMMAND ----------

# MAGIC %md
# MAGIC ### 📈 Analyse 1 : Chiffre d'Affaires par Pays

# COMMAND ----------

from pyspark.sql.functions import sum as _sum, format_number

# CA par pays, trié décroissant
ca_pays = (
    sales
    .groupBy("country")
    .agg(
        _sum("revenue").alias("ca_total"),
        _sum("quantity").alias("nb_articles")
    )
    .withColumn("ca_formatted", format_number("ca_total", 0))
    .orderBy(col("ca_total").desc())
)

display(ca_pays)

# COMMAND ----------

# MAGIC %md
# MAGIC ### 🏆 Analyse 2 : Top 10 Produits (Best-sellers)

# COMMAND ----------

# Top produits par CA
top_produits = (
    sales
    .groupBy("product", "category")
    .agg(
        _sum("revenue").alias("ca_total"),
        _sum("quantity").alias("nb_vendus")
    )
    .orderBy(col("ca_total").desc())
    .limit(10)
)

display(top_produits)

# COMMAND ----------

# MAGIC %md
# MAGIC ### 📅 Analyse 3 : Évolution du CA Journalier

# COMMAND ----------

# CA par jour
ca_journalier = (
    sales
    .groupBy("order_date")
    .agg(_sum("revenue").alias("ca"))
    .orderBy("order_date")
)

display(ca_journalier)

# COMMAND ----------

# MAGIC %md
# MAGIC ### 🛒 Analyse 4 : Performance par Canal de Vente

# COMMAND ----------

from pyspark.sql.functions import avg, count

# Stats par canal
stats_canal = (
    sales
    .groupBy("channel")
    .agg(
        count("*").alias("nb_commandes"),
        _sum("revenue").alias("ca_total"),
        avg("revenue").alias("panier_moyen")
    )
    .orderBy(col("ca_total").desc())
)

display(stats_canal)

# COMMAND ----------

# MAGIC %md
# MAGIC ### 💳 Analyse 5 : Répartition des Moyens de Paiement

# COMMAND ----------

# Répartition par moyen de paiement
paiements = (
    sales
    .groupBy("payment")
    .agg(
        count("*").alias("nb_transactions"),
        _sum("revenue").alias("ca_total")
    )
    .withColumn("part_ca", 
                spark_round(col("ca_total") / sales.agg(_sum("revenue")).collect()[0][0] * 100, 1))
    .orderBy(col("ca_total").desc())
)

display(paiements)

# COMMAND ----------

# MAGIC %md
# MAGIC ## 5️⃣ Statistiques Descriptives Globales

# COMMAND ----------

# Statistiques sur les colonnes numériques
display(sales.select("price", "quantity", "revenue").describe())

# COMMAND ----------

# MAGIC %md
# MAGIC ## ✅ Synthèse Notebook 1
# MAGIC 
# MAGIC ### Ce que nous avons accompli
# MAGIC 
# MAGIC | Étape | Résultat |
# MAGIC |-------|----------|
# MAGIC | Lecture CSV | 2M lignes chargées en ~5 secondes |
# MAGIC | Normalisation | Types corrects + colonne `revenue` |
# MAGIC | Delta Lake | Table persistée, optimisée, versionnée |
# MAGIC | Analyses BI | 5 tableaux/graphiques de pilotage |
# MAGIC 
# MAGIC ### Messages clés
# MAGIC 
# MAGIC 1. **Spark** permet le traitement distribué → scalabilité horizontale
# MAGIC 2. **Delta Lake** = format optimisé + ACID + time travel
# MAGIC 3. Les agrégations sont parallélisées automatiquement
# MAGIC 
# MAGIC ### Prochaine étape
# MAGIC 
# MAGIC 👉 **Notebook 2 : Data Science** — Explorer les données en profondeur et préparer le jeu d'apprentissage ML

# COMMAND ----------

# MAGIC %md
# MAGIC ---
# MAGIC ## 📝 Exercices Pratiques
# MAGIC 
# MAGIC ### Exercice 1 : CA par Catégorie et Mois
# MAGIC Créez une analyse croisant `category` et le mois de `order_date`.
# MAGIC 
# MAGIC ### Exercice 2 : Identifier les Pics de Vente
# MAGIC Trouvez les 10 jours avec le plus fort CA. Y a-t-il un pattern (Black Friday, Noël) ?
# MAGIC 
# MAGIC ### Exercice 3 : Panier Moyen par Pays
# MAGIC Quel pays a le panier moyen le plus élevé ? Le plus bas ?

# COMMAND ----------

# 🎯 EXERCICE 1 : Votre code ici
# Indice : utilisez month(col("order_date")) pour extraire le mois

from pyspark.sql.functions import month

# ca_categorie_mois = (
#     sales
#     .withColumn("mois", month(col("order_date")))
#     .groupBy("category", "mois")
#     .agg(_sum("revenue").alias("ca"))
#     .orderBy("category", "mois")
# )
# display(ca_categorie_mois)

# COMMAND ----------

# 🎯 EXERCICE 2 : Votre code ici
# Indice : groupBy("order_date"), orderBy desc, limit(10)



# COMMAND ----------

# 🎯 EXERCICE 3 : Votre code ici
# Indice : groupBy("country"), agg(avg("revenue"))


