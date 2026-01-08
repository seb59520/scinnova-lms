# Comment voir les bases de données de technologies et défis

## 📋 Méthode 1 : Dans l'application (recommandé)

### Pour voir les technologies :

1. **Lancez l'application** :
   ```bash
   cd big-data-impacts-app
   npm run dev
   ```

2. **Allez sur la page de création de cas d'usage** :
   - Cliquez sur "Cas d'usage" dans le menu
   - Cliquez sur "Nouveau cas d'usage"

3. **Dans le champ "Technologies utilisées"** :
   - Commencez à taper le nom d'une technologie (ex: "Kafka", "TensorFlow", "Spark")
   - Vous verrez apparaître une liste déroulante avec les suggestions
   - Chaque suggestion affiche le nom et la description
   - Sélectionnez une technologie pour l'ajouter

4. **Pour voir les détails complets** :
   - Une fois la technologie ajoutée, une icône ℹ️ bleue apparaît à côté
   - Cliquez sur cette icône pour voir :
     - Description complète
     - Fonctions principales
     - Cas d'usage typiques

### Pour voir les défis :

1. **Dans le champ "Défis et risques"** :
   - Commencez à taper le nom d'un défi (ex: "Latence", "Scalabilité", "RGPD")
   - Vous verrez apparaître une liste déroulante avec les suggestions
   - Sélectionnez un défi pour l'ajouter

2. **Pour voir les détails complets** :
   - Une fois le défi ajouté, une icône ℹ️ orange apparaît à côté
   - Cliquez sur cette icône pour voir :
     - Description du défi
     - 💡 Comment identifier ce défi ? (raisonnement guidé)
     - Stratégies de mitigation
     - Exemples de cas d'usage

## 📁 Méthode 2 : Dans le code source

### Technologies

Fichier : `src/data/technologiesData.ts`

Liste des 18 technologies disponibles :
- Apache Kafka
- TensorFlow
- Apache Spark
- PostgreSQL
- MongoDB
- Redis
- Apache Hadoop
- PyTorch
- Kubernetes
- Apache Airflow
- InfluxDB
- Scikit-learn
- AWS S3
- Grafana
- Spark Streaming
- DICOM
- OR-Tools
- Python

Chaque technologie contient :
- `name` : Nom de la technologie
- `description` : Description générale
- `mainFunctions` : Liste des fonctions principales
- `useCases` : Cas d'usage typiques
- `category` : Catégorie (processing, storage, streaming, ml, database, orchestration)

### Défis

Fichier : `src/data/challengesData.ts`

Liste des 17 défis disponibles :
- Latence temps réel
- Faux positifs
- Conformité RGPD
- Scalabilité
- Explicabilité
- Biais algorithmiques
- Intégration systèmes existants
- Cold start problem
- Diversité des recommandations
- Privacy
- Complexité algorithmique
- Données en temps réel
- Coûts infrastructure
- Qualité données capteurs
- Interprétabilité
- Coûts IoT
- Conformité médicale

Chaque défi contient :
- `name` : Nom du défi
- `description` : Description du défi
- `reasoning` : Guide de raisonnement pour identifier le défi
- `mitigation` : Stratégies de mitigation
- `examples` : Exemples de cas d'usage
- `category` : Catégorie (technical, organizational, economic, legal, data-quality)

## 🔍 Méthode 3 : Via la console du navigateur

1. Ouvrez l'application dans votre navigateur
2. Ouvrez la console développeur (F12)
3. Dans la console, tapez :

```javascript
// Pour voir toutes les technologies
import { technologiesDatabase } from './src/data/technologiesData';
console.table(technologiesDatabase);

// Pour voir tous les défis
import { challengesDatabase } from './src/data/challengesData';
console.table(challengesDatabase);
```

## 📊 Méthode 4 : Liste complète dans ce document

### Technologies (18)

1. **Apache Kafka** - Plateforme de streaming distribuée
2. **TensorFlow** - Framework de machine learning
3. **Apache Spark** - Moteur de traitement distribué
4. **PostgreSQL** - Base de données relationnelle
5. **MongoDB** - Base de données NoSQL
6. **Redis** - Base de données en mémoire
7. **Apache Hadoop** - Framework pour Big Data
8. **PyTorch** - Framework de deep learning
9. **Kubernetes** - Orchestrateur de conteneurs
10. **Apache Airflow** - Orchestration de workflows
11. **InfluxDB** - Base de données temporelle
12. **Scikit-learn** - Bibliothèque ML Python
13. **AWS S3** - Stockage objet
14. **Grafana** - Visualisation et monitoring
15. **Spark Streaming** - Traitement de flux
16. **DICOM** - Standard images médicales
17. **OR-Tools** - Optimisation combinatoire
18. **Python** - Langage de programmation

### Défis (17)

1. **Latence temps réel** - Délai de traitement
2. **Faux positifs** - Erreurs de détection
3. **Conformité RGPD** - Protection des données
4. **Scalabilité** - Gestion de la charge
5. **Explicabilité** - Compréhension des décisions IA
6. **Biais algorithmiques** - Discrimination
7. **Intégration systèmes existants** - Compatibilité
8. **Cold start problem** - Nouveaux utilisateurs/produits
9. **Diversité des recommandations** - Éviter les bulles
10. **Privacy** - Vie privée
11. **Complexité algorithmique** - Performance
12. **Données en temps réel** - Traitement continu
13. **Coûts infrastructure** - Investissements
14. **Qualité données capteurs** - Fiabilité IoT
15. **Interprétabilité** - Compréhension des résultats
16. **Coûts IoT** - Investissements capteurs
17. **Conformité médicale** - Normes médicales

## 💡 Astuce

La façon la plus intuitive de voir ces bases de données est d'utiliser l'application directement. L'autocomplétion et les tooltips vous permettront de découvrir progressivement toutes les technologies et défis disponibles.


