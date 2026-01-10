# 📊 Datasets DataLogis

## Présentation de l'entreprise

**DataLogis** est une entreprise fictive de logistique e-commerce créée pour les exercices pratiques de cette formation.

### Caractéristiques
- **Secteur** : Logistique e-commerce B2C
- **Effectif** : 270 employés
- **Entrepôts** : 3 sites (Paris-Nord, Lyon-Est, Marseille-Sud)
- **Volume** : ~300 000 colis/mois
- **Chiffre d'affaires** : ~35M€/an

---

## 📁 Fichiers disponibles

### 1. Données Clients (`clients.json` / `clients.csv`)

| Champ | Description |
|-------|-------------|
| `id` | Identifiant unique client |
| `nom` | Nom du client |
| `segment` | Premium / Standard / Occasionnel |
| `anciennete_mois` | Durée de la relation client |
| `nb_commandes` | Nombre total de commandes |
| `panier_moyen` | Valeur moyenne des commandes (€) |
| `taux_retour` | Proportion de produits retournés |
| `satisfaction_nps` | Score NPS (0-10) |
| `canal_prefere` | Canal d'achat principal |
| `region` | Région de livraison |

### 2. Données Commandes (`commandes.json` / `commandes.csv`)

| Champ | Description |
|-------|-------------|
| `id` | Identifiant commande |
| `client_id` | Référence client |
| `date` | Date de commande |
| `montant` | Valeur totale (€) |
| `nb_articles` | Nombre d'articles |
| `entrepot` | Entrepôt d'expédition |
| `statut` | Livrée / En cours / Retournée / Annulée |
| `delai_livraison_jours` | Délai de livraison |
| `mode_livraison` | Express / Standard / Économique |

### 3. Données Opérations (`operations.json` / `operations.csv`)

| Champ | Description |
|-------|-------------|
| `entrepot` | Informations par site |
| `capacite` | Capacité journalière |
| `effectif` | Nombre d'employés |
| `taux_occupation` | Remplissage des stocks |
| `couts` | Ventilation des coûts |
| `performance` | KPIs opérationnels |

---

## 🎯 Utilisation dans les exercices

Ces données vous permettent de :
- **Identifier des opportunités** : Quels segments sont les plus rentables ?
- **Analyser les décisions** : Comment optimiser les délais de livraison ?
- **Évaluer les risques** : L'entrepôt Marseille-Sud est-il en surcharge ?
- **Proposer des améliorations** : Quelles données manquent pour mieux décider ?

---

## 📥 Téléchargement

- **Format JSON** : Pour analyse dans un outil de visualisation
- **Format CSV** : Pour import dans Excel, Google Sheets, ou Python/R
