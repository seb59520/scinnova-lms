#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour ajouter les modules 2-6 au cours sur les fonctions Python
avec commentaires détaillés ligne par ligne
"""

import json

# Lire le fichier existant
with open("course-python-fonctions.json", "r", encoding="utf-8") as f:
    cours = json.load(f)

print(f"✅ Fichier chargé : {len(cours['modules'])} module(s)")

# Fonction helper pour créer un bloc de code avec commentaires détaillés
def code_block(text):
    return {
        "type": "codeBlock",
        "attrs": {"language": "python"},
        "content": [{"type": "text", "text": text}]
    }

# ============================================
# MODULE 2 : PARAMÈTRES ET ARGUMENTS
# ============================================
module2 = {
    "title": "Module 2 : Paramètres et arguments",
    "position": 1,
    "theme": {"primaryColor": "#3776AB", "secondaryColor": "#FFD43B"},
    "items": []
}

# Item 2.1 : Paramètres et arguments
item2_1 = {
    "type": "resource",
    "title": "2.1 Paramètres et arguments",
    "position": 0,
    "published": True,
    "content": {
        "description": "Comprenez la différence entre paramètres et arguments, avec des explications détaillées ligne par ligne."
    },
    "chapters": [{
        "title": "Paramètres vs Arguments",
        "position": 0,
        "content": {
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": 1},
                    "content": [{"type": "text", "text": "📌 Paramètres et arguments"}]
                },
                {
                    "type": "paragraph",
                    "content": [
                        {"type": "text", "text": "Les "},
                        {"type": "text", "marks": [{"type": "bold"}], "text": "paramètres"},
                        {"type": "text", "text": " sont les variables définies dans la signature de la fonction. Les "},
                        {"type": "text", "marks": [{"type": "bold"}], "text": "arguments"},
                        {"type": "text", "text": " sont les valeurs passées lors de l'appel."}
                    ]
                },
                code_block("""# ============================================
# DIFFÉRENCE ENTRE PARAMÈTRES ET ARGUMENTS
# ============================================

# DÉFINITION DE LA FONCTION
# -------------------------
# 'a' et 'b' sont des PARAMÈTRES
# Ce sont des variables définies dans la signature de la fonction
# Elles attendent de recevoir des valeurs lors de l'appel
def multiplier(a, b):
    # Docstring expliquant la fonction
    \"\"\"
    Multiplie deux nombres.
    
    Args:
        a (int ou float): Premier nombre (PARAMÈTRE)
        b (int ou float): Deuxième nombre (PARAMÈTRE)
    
    Returns:
        int ou float: Le produit de a et b
    \"\"\"
    
    # Corps de la fonction
    # On utilise les paramètres 'a' et 'b' pour faire le calcul
    # 'return' retourne le résultat de la multiplication
    return a * b

# ============================================
# APPEL DE LA FONCTION
# ============================================

# '5' et '3' sont des ARGUMENTS
# Ce sont les valeurs RÉELLES qu'on passe à la fonction
# Python assigne : a = 5, b = 3
resultat = multiplier(5, 3)
# Résultat : a * b = 5 * 3 = 15
# La variable 'resultat' contient maintenant 15

# Affichage du résultat
print(resultat)
# Résultat affiché : 15

# ============================================
# EXEMPLE AVEC PLUSIEURS PARAMÈTRES
# ============================================

# Fonction avec 3 paramètres
def presenter(nom, age, ville):
    \"\"\"
    Présente une personne avec son nom, âge et ville.
    
    Args:
        nom (str): Le nom de la personne (PARAMÈTRE)
        age (int): L'âge de la personne (PARAMÈTRE)
        ville (str): La ville de résidence (PARAMÈTRE)
    
    Returns:
        str: Une chaîne de présentation
    \"\"\"
    
    # f-string pour formater la présentation
    # Les paramètres nom, age, ville sont utilisés ici
    return f\"{nom}, {age} ans, habite à {ville}\"

# Appel avec arguments positionnels
# Python assigne dans l'ordre : nom=\"Alice\", age=30, ville=\"Paris\"
# L'ORDRE est important avec les arguments positionnels !
message1 = presenter(\"Alice\", 30, \"Paris\")
print(message1)
# Résultat affiché : Alice, 30 ans, habite à Paris

# Appel avec arguments nommés (plus lisible)
# L'ordre n'est plus important car on spécifie le nom de chaque paramètre
# Python assigne : nom=\"Bob\", ville=\"Lyon\", age=25
message2 = presenter(nom=\"Bob\", ville=\"Lyon\", age=25)
print(message2)
# Résultat affiché : Bob, 25 ans, habite à Lyon

# IMPORTANT : 
# - PARAMÈTRES = variables dans la définition (a, b, nom, age, ville)
# - ARGUMENTS = valeurs passées lors de l'appel (5, 3, \"Alice\", 30, \"Paris\")""")
            ]
        }
    }]
}

# Item 2.2 : Arguments par défaut
item2_2 = {
    "type": "resource",
    "title": "2.2 Arguments par défaut",
    "position": 1,
    "published": True,
    "content": {
        "description": "Utilisez des valeurs par défaut pour rendre certains paramètres optionnels, avec explications détaillées."
    },
    "chapters": [{
        "title": "Valeurs par défaut",
        "position": 0,
        "content": {
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": 1},
                    "content": [{"type": "text", "text": "⚙️ Arguments par défaut"}]
                },
                {
                    "type": "paragraph",
                    "content": [
                        {"type": "text", "text": "Les arguments par défaut permettent de rendre certains paramètres optionnels. Si vous ne fournissez pas de valeur, la valeur par défaut est utilisée."}
                    ]
                },
                code_block("""# ============================================
# EXEMPLE 1 : Fonction avec un paramètre par défaut
# ============================================

# DÉFINITION DE LA FONCTION
# -------------------------
# 'nom' est un paramètre OBLIGATOIRE (pas de valeur par défaut)
# 'message' est un paramètre OPTIONNEL avec valeur par défaut \"Bonjour\"
# Si on n'utilise pas 'message' lors de l'appel, il prendra la valeur \"Bonjour\"
def saluer(nom, message=\"Bonjour\"):
    \"\"\"
    Salue une personne avec un message personnalisable.
    
    Args:
        nom (str): Le nom de la personne (OBLIGATOIRE)
        message (str): Le message de salutation (OPTIONNEL, défaut=\"Bonjour\")
    \"\"\"
    
    # f-string utilisant les deux paramètres
    print(f\"{message} {nom} !\")

# ============================================
# UTILISATIONS DE LA FONCTION
# ============================================

# Appel 1 : Utilisation avec valeur par défaut
# On ne passe que 'nom', 'message' prend sa valeur par défaut \"Bonjour\"
# Python fait : nom=\"Alice\", message=\"Bonjour\" (valeur par défaut)
saluer(\"Alice\")
# Résultat affiché : Bonjour Alice !

# Appel 2 : Surcharge de la valeur par défaut
# On passe les deux arguments, donc 'message' prend la valeur \"Salut\"
# Python fait : nom=\"Bob\", message=\"Salut\"
saluer(\"Bob\", \"Salut\")
# Résultat affiché : Salut Bob !

# ============================================
# EXEMPLE 2 : Plusieurs paramètres par défaut
# ============================================

def creer_profil(nom, age=18, ville=\"Inconnue\", actif=True):
    \"\"\"
    Crée un profil utilisateur avec des valeurs par défaut.
    
    Args:
        nom (str): Le nom (OBLIGATOIRE)
        age (int): L'âge (OPTIONNEL, défaut=18)
        ville (str): La ville (OPTIONNEL, défaut=\"Inconnue\")
        actif (bool): Statut actif (OPTIONNEL, défaut=True)
    
    Returns:
        dict: Un dictionnaire contenant le profil
    \"\"\"
    
    # Retourne un dictionnaire avec toutes les informations
    return {
        \"nom\": nom,      # Utilise la valeur passée
        \"age\": age,      # Utilise la valeur passée ou 18 par défaut
        \"ville\": ville,  # Utilise la valeur passée ou \"Inconnue\" par défaut
        \"actif\": actif   # Utilise la valeur passée ou True par défaut
    }

# ============================================
# DIFFÉRENTES FAÇONS D'APPELER LA FONCTION
# ============================================

# Appel 1 : Tous les paramètres par défaut sauf 'nom'
# Python fait : nom=\"Alice\", age=18, ville=\"Inconnue\", actif=True
profil1 = creer_profil(\"Alice\")
print(profil1)
# Résultat : {'nom': 'Alice', 'age': 18, 'ville': 'Inconnue', 'actif': True}

# Appel 2 : Spécifier 'nom' et 'age', le reste par défaut
# Python fait : nom=\"Bob\", age=25, ville=\"Inconnue\", actif=True
profil2 = creer_profil(\"Bob\", 25)
print(profil2)
# Résultat : {'nom': 'Bob', 'age': 25, 'ville': 'Inconnue', 'actif': True}

# Appel 3 : Spécifier 'nom' et 'ville' avec arguments nommés
# Python fait : nom=\"Charlie\", age=18 (défaut), ville=\"Paris\", actif=True (défaut)
profil3 = creer_profil(\"Charlie\", ville=\"Paris\")
print(profil3)
# Résultat : {'nom': 'Charlie', 'age': 18, 'ville': 'Paris', 'actif': True}

# Appel 4 : Tous les paramètres spécifiés
# Python fait : nom=\"Diana\", age=30, ville=\"Lyon\", actif=False
profil4 = creer_profil(\"Diana\", 30, \"Lyon\", False)
print(profil4)
# Résultat : {'nom': 'Diana', 'age': 30, 'ville': 'Lyon', 'actif': False}

# ============================================
# ⚠️ RÈGLE IMPORTANTE
# ============================================
# Les paramètres SANS valeur par défaut doivent TOUJOURS
# précéder ceux AVEC valeur par défaut

# ✅ CORRECT : paramètre obligatoire avant paramètre optionnel
def fonction_correcte(a, b=10):
    return a + b

# ❌ ERREUR : SyntaxError - paramètre optionnel avant paramètre obligatoire
# def fonction_erreur(a=10, b):  # Cette ligne causerait une erreur
#     return a + b""")
            ]
        }
    }]
}

module2["items"] = [item2_1, item2_2]

# Ajouter le module 2
cours["modules"].append(module2)
print("✅ Module 2 ajouté")

# Sauvegarder temporairement
with open("course-python-fonctions.json", "w", encoding="utf-8") as f:
    json.dump(cours, f, ensure_ascii=False, indent=2)

print("✅ Fichier sauvegardé avec Module 2")
print("📝 Continuez avec les modules 3-6...")
