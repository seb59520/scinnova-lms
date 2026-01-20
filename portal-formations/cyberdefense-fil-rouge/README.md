# 🔐 Fil Rouge Python - Cyberdéfense

## 📋 Présentation

Ce fil rouge vous permet d'apprendre Python en contexte cyberdéfense. Vous allez construire progressivement un outil de surveillance de sécurité capable d'analyser des logs, détecter des comportements suspects et produire des alertes.

## 🎯 Objectif pédagogique

**L'objectif n'est pas "faire de la cyber", mais maîtriser Python DANS un environnement cyber.**

À la fin de ce fil rouge, vous maîtriserez :
- ✅ Python fondamental
- ✅ Lecture / écriture de fichiers
- ✅ Structures de données (listes, dictionnaires)
- ✅ Fonctions propres
- ✅ Logique cyberdéfense
- ✅ Automatisation
- ✅ Esprit analyste sécurité

## 🧩 Contexte scénarisé

Vous êtes **analyste junior en cyberdéfense**. Une entreprise fictive vous confie les logs de ses systèmes. Des incidents de sécurité sont suspectés. Votre mission : comprendre, analyser, détecter et alerter.

## 📁 Structure du projet

```
cyberdefense-fil-rouge/
├── data/
│   └── auth.log              # Fichier de logs d'authentification
├── etape1_lire_logs.py       # Étape 1
├── etape2_ip_suspectes.py    # Étape 2
├── etape3_detection_temporelle.py  # Étape 3
├── etape4_regles_detection.py     # Étape 4
├── etape5_generation_alertes.py   # Étape 5
├── etape6_automatisation.py       # Étape 6
├── etape7_rapport_final.py         # Étape 7
├── solutions/                      # Solutions (à consulter après)
│   ├── solution_etape1.py
│   ├── solution_etape2.py
│   └── ...
└── README.md                        # Ce fichier
```

## 🟢 Étape 1 - Comprendre les logs

**Mission** : Lire et comprendre des logs bruts d'authentification.

**Python appris** :
- `open()`, `read()`, `split()`
- Variables
- Boucles `for`
- Conditions `if`

**Exercice** :
1. Lire le fichier `data/auth.log`
2. Afficher chaque tentative échouée (STATUS=FAIL)
3. Compter le nombre total d'échecs

**Fichier** : `etape1_lire_logs.py`

## 🟢 Étape 2 - Identifier les IP suspectes

**Mission** : Repérer les IP qui échouent trop souvent → détection de brute force.

**Python appris** :
- Dictionnaires `{ip: compteur}`
- Incrémentation
- Comparaisons
- Extraction de données depuis une chaîne

**Exercice** :
1. Compter les échecs par IP
2. Afficher les IP avec 5+ tentatives échouées

**Fichier** : `etape2_ip_suspectes.py`

## 🟡 Étape 3 - Détection temporelle

**Mission** : Détecter des connexions en dehors des heures normales (08h-18h).

**Python appris** :
- Découpage de date/heure (`split()`)
- Conditions imbriquées
- Logique métier

**Exercice** :
1. Extraire l'heure de chaque ligne de log
2. Vérifier si l'heure est entre 08h et 18h
3. Alerter si tentative hors plage

**Fichier** : `etape3_detection_temporelle.py`

## 🟡 Étape 4 - Règles de détection (mini IDS)

**Mission** : Créer un moteur de règles simple.

**Règles à implémenter** :
- +5 échecs → suspect
- Connexion de nuit → suspect
- User = admin → critique

**Python appris** :
- Fonctions
- Structuration du code
- Listes de règles

**Fichier** : `etape4_regles_detection.py`

## 🟡 Étape 5 - Génération d'alertes

**Mission** : Produire un rapport d'alerte exploitable.

**Python appris** :
- Écriture de fichiers
- Formatage de texte
- Fonctions réutilisables

**Exercice** :
1. Générer `alertes.txt`
2. Une alerte = une ligne claire

**Fichier** : `etape5_generation_alertes.py`

## 🔵 Étape 6 - Automatisation de la surveillance

**Mission** : Surveiller les logs en continu.

**Python appris** :
- `while True`
- `time.sleep()`
- Scripts autonomes

**Exercice** :
1. Vérifier le log toutes les 30 secondes
2. Nouvelle ligne → analyse

**Fichier** : `etape6_automatisation.py`

## 🔵 Étape 7 - Analyse globale & rapport final

**Mission** : Produire une synthèse de sécurité.

**Python appris** :
- Statistiques simples
- Structuration du code
- Lisibilité et propreté

**Exercice** :
1. Nombre d'attaques
2. IP les plus dangereuses
3. Heures critiques

**Fichier** : `etape7_rapport_final.py`

## 🚀 Comment utiliser ce fil rouge

1. **Lisez les instructions** dans le cours en ligne
2. **Travaillez sur chaque étape** dans l'ordre
3. **Testez votre code** avec le fichier `data/auth.log`
4. **Consultez les solutions** uniquement après avoir essayé
5. **Comparez** votre code avec les solutions pour apprendre

## 💡 Conseils

- **Ne brûlez pas les étapes** : chaque étape construit sur la précédente
- **Testez régulièrement** : exécutez votre code après chaque modification
- **Lisez les erreurs** : Python vous donne des indices précieux
- **Expérimentez** : modifiez le code pour voir ce qui se passe

## 🧪 Bonus (optionnels)

Une fois les 7 étapes terminées, vous pouvez :
- Ajouter une liste noire d'IP
- Générer un CSV pour Excel
- Ajouter un score de danger (0-100)
- Simuler une attaque pour tester
- Créer une interface graphique simple (Tkinter)

## 📚 Ressources

- [Documentation Python officielle](https://docs.python.org/fr/3/)
- [Tutoriel Python](https://docs.python.org/fr/3/tutorial/)

## ✅ Checklist finale

À la fin du fil rouge, vous devriez être capable de :
- [ ] Lire et analyser des fichiers de logs
- [ ] Utiliser des dictionnaires pour compter des occurrences
- [ ] Extraire des informations depuis des chaînes de caractères
- [ ] Créer des fonctions réutilisables
- [ ] Générer des rapports formatés
- [ ] Automatiser des tâches répétitives
- [ ] Produire des statistiques et analyses

---

**Bon courage et bonne analyse ! 🔐**
