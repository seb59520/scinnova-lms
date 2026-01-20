#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour générer le cours complet sur les fonctions Python
avec commentaires détaillés ligne par ligne pour débutants
"""

import json

def create_code_block(code, explanation_before=None, explanation_after=None):
    """Crée un bloc de code avec explications"""
    content = []
    
    if explanation_before:
        content.append({
            "type": "paragraph",
            "content": [{"type": "text", "text": explanation_before}]
        })
    
    content.append({
        "type": "codeBlock",
        "attrs": {"language": "python"},
        "content": [{"type": "text", "text": code}]
    })
    
    if explanation_after:
        content.append({
            "type": "paragraph",
            "content": [{"type": "text", "text": explanation_after}]
        })
    
    return content

# Structure complète du cours
cours = {
    "title": "Les fonctions en Python",
    "description": "Cours complet et détaillé sur les fonctions en Python pour débutants : chaque ligne de code est commentée, avec des explications approfondies de chaque concept, étape par étape.",
    "status": "published",
    "access_type": "free",
    "theme": {
        "primaryColor": "#3776AB",
        "secondaryColor": "#FFD43B",
        "fontFamily": "Inter"
    },
    "modules": []
}

# ============================================
# MODULE 1 : INTRODUCTION
# ============================================
module1_items = []

# Item 1.1
item1_1 = {
    "type": "resource",
    "title": "1.1 Qu'est-ce qu'une fonction ?",
    "position": 0,
    "published": True,
    "content": {
        "description": "Découvrez ce qu'est une fonction avec des explications détaillées pour débutants complets."
    },
    "chapters": [{
        "title": "Définition et utilité",
        "position": 0,
        "content": {
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": 1},
                    "content": [{"type": "text", "text": "🔧 Qu'est-ce qu'une fonction ?"}]
                },
                {
                    "type": "paragraph",
                    "content": [
                        {"type": "text", "text": "Une fonction est un bloc de code réutilisable qui effectue une tâche spécifique. Imaginez une fonction comme une machine à café : vous mettez des ingrédients (paramètres), elle fait le travail, et vous récupérez un café (valeur de retour)."}
                    ]
                },
                {
                    "type": "heading",
                    "attrs": {"level": 2},
                    "content": [{"type": "text", "text": "Exemple détaillé : Code répétitif vs Fonction"}]
                },
                *create_code_block(
                    """# ============================================
# EXEMPLE 1 : SANS FONCTION (code répétitif)
# ============================================
# Problème : On répète exactement le même code 3 fois
# Si on veut changer le message, il faut modifier 3 lignes !

# Ligne 1 : Affiche "Bonjour Alice"
# print() est une fonction built-in de Python qui affiche du texte
print("Bonjour Alice")

# Ligne 2 : Affiche "Bonjour Bob"
# Même code, juste le nom change
print("Bonjour Bob")

# Ligne 3 : Affiche "Bonjour Charlie"
# Encore le même code répété
print("Bonjour Charlie")

# ============================================
# EXEMPLE 2 : AVEC FONCTION (code réutilisable)
# ============================================
# Solution : On définit la fonction UNE SEULE FOIS
# Ensuite, on peut l'utiliser autant de fois qu'on veut

# DÉFINITION DE LA FONCTION
# -------------------------
# 'def' est le mot-clé Python pour définir une fonction
# C'est comme dire "Je vais créer une nouvelle fonction"
def dire_bonjour(nom):
    # Cette ligne est à l'intérieur de la fonction (indentée de 4 espaces)
    # f"..." est une f-string (format string) introduite en Python 3.6+
    # Elle permet d'insérer des variables dans une chaîne avec {variable}
    # Ici, {nom} sera remplacé par la valeur passée lors de l'appel
    # Exemple : si nom = "Alice", alors f"Bonjour {nom}" devient "Bonjour Alice"
    print(f"Bonjour {nom}")

# UTILISATION DE LA FONCTION
# --------------------------
# Maintenant, on peut utiliser la fonction avec différents noms

# Appel 1 : On passe "Alice" comme argument
# Python fait : nom = "Alice", puis exécute print(f"Bonjour {nom}")
# Résultat : "Bonjour Alice" est affiché
dire_bonjour("Alice")

# Appel 2 : On passe "Bob" comme argument
# Python fait : nom = "Bob", puis exécute print(f"Bonjour {nom}")
# Résultat : "Bonjour Bob" est affiché
dire_bonjour("Bob")

# Appel 3 : On passe "Charlie" comme argument
# Python fait : nom = "Charlie", puis exécute print(f"Bonjour {nom}")
# Résultat : "Bonjour Charlie" est affiché
dire_bonjour("Charlie")

# AVANTAGE : Si on veut changer le message, on modifie UNE SEULE ligne !
# Par exemple, changer "Bonjour" en "Salut" dans la fonction
# Tous les appels utiliseront automatiquement le nouveau message""",
                    explanation_before="Voici un exemple concret qui montre la différence entre du code répétitif et l'utilisation d'une fonction :"
                ),
                {
                    "type": "heading",
                    "attrs": {"level": 3},
                    "content": [{"type": "text", "text": "💡 Explication ligne par ligne"}]
                },
                {
                    "type": "orderedList",
                    "content": [
                        {
                            "type": "listItem",
                            "content": [{
                                "type": "paragraph",
                                "content": [{"type": "text", "text": "def dire_bonjour(nom): - On définit une fonction nommée 'dire_bonjour' qui accepte un paramètre 'nom'. Le ':' indique le début du corps de la fonction."}]
                            }]
                        },
                        {
                            "type": "listItem",
                            "content": [{
                                "type": "paragraph",
                                "content": [{"type": "text", "text": "print(f\"Bonjour {nom}\") - À l'intérieur de la fonction, on affiche un message. Le 'f' avant les guillemets permet d'insérer {nom} dans le texte."}]
                            }]
                        },
                        {
                            "type": "listItem",
                            "content": [{
                                "type": "paragraph",
                                "content": [{"type": "text", "text": "dire_bonjour(\"Alice\") - On appelle la fonction en lui passant \"Alice\" comme argument. Python remplace 'nom' par \"Alice\" et exécute le code."}]
                            }]
                        }
                    ]
                }
            ]
        }
    }]
}

# Item 1.2
item1_2 = {
    "type": "resource",
    "title": "1.2 Définir et appeler une fonction - Guide complet",
    "position": 1,
    "published": True,
    "content": {
        "description": "Apprenez la syntaxe complète pour définir et appeler une fonction, avec chaque élément expliqué en détail ligne par ligne."
    },
    "chapters": [{
        "title": "Syntaxe complète expliquée",
        "position": 0,
        "content": {
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": 1},
                    "content": [{"type": "text", "text": "📝 Définir et appeler une fonction - Guide complet"}]
                },
                {
                    "type": "heading",
                    "attrs": {"level": 2},
                    "content": [{"type": "text", "text": "Exemple 1 : Fonction simple sans paramètres"}]
                },
                *create_code_block(
                    """# ============================================
# EXEMPLE 1 : Fonction sans paramètres
# ============================================

# DÉFINITION DE LA FONCTION
# -------------------------
# Ligne 1 : 'def' est le mot-clé Python pour définir une fonction
#           C'est comme dire "Je vais créer une nouvelle fonction"
# Ligne 2 : 'saluer' est le nom que nous donnons à notre fonction
#           Vous pouvez choisir n'importe quel nom (sauf les mots réservés)
#           Convention : utiliser snake_case (mots séparés par _)
# Ligne 3 : '()' indique qu'il n'y a pas de paramètres (les parenthèses sont vides)
# Ligne 4 : ':' est obligatoire et indique le début du corps de la fonction
def saluer():
    # Ligne 5 : Docstring - documentation de la fonction (optionnel mais recommandé)
    #           Les triple guillemets \"\"\" permettent d'écrire sur plusieurs lignes
    #           Cette documentation explique ce que fait la fonction
    \"\"\"
    Affiche un message de salutation.
    Cette fonction ne prend aucun paramètre et affiche simplement "Bonjour !"
    \"\"\"
    
    # Ligne 6 : Le corps de la fonction commence ici (indenté de 4 espaces)
    #           L'indentation est CRUCIALE en Python : elle indique que ce code
    #           fait partie de la fonction 'saluer'
    #           'print()' est une fonction built-in de Python qui affiche du texte
    print("Bonjour !")

# ============================================
# APPEL DE LA FONCTION
# ============================================
# Ligne 7 : On appelle la fonction en écrivant son nom suivi de '()'
#           Les parenthèses sont obligatoires, même s'il n'y a pas de paramètres
#           Sans les parenthèses, Python pense que vous référencez la fonction,
#           mais ne l'exécute pas
saluer()
# Résultat : Affiche "Bonjour !" dans la console

# ERREUR COURANTE :
# saluer  (sans parenthèses) ne fait RIEN, juste référence la fonction
# saluer() (avec parenthèses) EXÉCUTE la fonction""",
                    explanation_before="Commençons par le cas le plus simple : une fonction qui ne prend aucun paramètre."
                ),
                {
                    "type": "heading",
                    "attrs": {"level": 2},
                    "content": [{"type": "text", "text": "Exemple 2 : Fonction avec un paramètre"}]
                },
                *create_code_block(
                    """# ============================================
# EXEMPLE 2 : Fonction avec un paramètre
# ============================================

# DÉFINITION DE LA FONCTION
# -------------------------
# Ligne 1 : 'def' : mot-clé pour définir une fonction
# Ligne 2 : 'saluer_personne' : nom de la fonction (snake_case)
# Ligne 3 : '(nom)' : paramètre unique de type chaîne de caractères
#           'nom' est une variable qui recevra la valeur passée lors de l'appel
#           Vous pouvez l'appeler comme vous voulez (prenom, personne, etc.)
# Ligne 4 : ':' : début du corps de la fonction (obligatoire)
def saluer_personne(nom):
    # Docstring expliquant ce que fait la fonction
    # C'est une bonne pratique de documenter vos fonctions
    \"\"\"
    Salue une personne par son nom.
    
    Args:
        nom (str): Le nom de la personne à saluer
    \"\"\"
    
    # Corps de la fonction
    # f\"...\" est une f-string (format string) introduite en Python 3.6+
    # Elle permet d'insérer des variables dans une chaîne avec {variable}
    # Ici, {nom} sera remplacé par la valeur passée lors de l'appel
    # Exemple : si nom = "Alice", alors f"Bonjour {nom} !" devient "Bonjour Alice !"
    print(f"Bonjour {nom} !")

# ============================================
# APPELS DE LA FONCTION
# ============================================

# Appel 1 : On passe la chaîne "Alice" comme argument
# Python fait les étapes suivantes :
#   1. Prend la valeur "Alice"
#   2. L'assigne à la variable 'nom' dans la fonction
#   3. Exécute le code de la fonction avec nom = "Alice"
#   4. Affiche "Bonjour Alice !"
saluer_personne("Alice")
# Résultat affiché : Bonjour Alice !

# Appel 2 : On passe une autre chaîne
# Même processus : nom = "Bob", puis affiche "Bonjour Bob !"
saluer_personne("Bob")
# Résultat affiché : Bonjour Bob !

# Appel 3 : On peut aussi passer une variable
# Ligne 1 : On crée une variable 'prenom' qui contient "Charlie"
prenom = "Charlie"

# Ligne 2 : On appelle la fonction avec la variable 'prenom'
# Python prend la VALEUR de 'prenom' (qui est "Charlie")
# et l'assigne à 'nom' dans la fonction
saluer_personne(prenom)
# Résultat affiché : Bonjour Charlie !

# IMPORTANT : La variable 'nom' dans la fonction est différente de 'prenom'
# Ce sont deux variables distinctes, même si elles contiennent la même valeur""",
                    explanation_before="Maintenant, voyons comment passer des informations à une fonction via des paramètres :"
                ),
                {
                    "type": "heading",
                    "attrs": {"level": 2},
                    "content": [{"type": "text", "text": "Exemple 3 : Fonction avec valeur de retour"}]
                },
                *create_code_block(
                    """# ============================================
# EXEMPLE 3 : Fonction avec valeur de retour
# ============================================

# DÉFINITION DE LA FONCTION
# -------------------------
# Cette fonction prend deux paramètres et RETOURNE un résultat
# 'return' permet de renvoyer une valeur à celui qui appelle la fonction
def additionner(a, b):
    # Docstring expliquant la fonction
    \"\"\"
    Additionne deux nombres.
    
    Args:
        a (int ou float): Premier nombre à additionner
        b (int ou float): Deuxième nombre à additionner
    
    Returns:
        int ou float: La somme de a et b
    \"\"\"
    
    # 'return' est le mot-clé qui permet de retourner une valeur
    # Ici, on retourne le résultat de l'addition a + b
    # Après 'return', la fonction s'arrête IMMÉDIATEMENT
    # Même s'il y a du code après, il ne sera JAMAIS exécuté
    return a + b
    
    # Cette ligne ne sera JAMAIS exécutée car elle est après 'return'
    # print("Ceci ne s'affichera jamais")

# ============================================
# UTILISATION DE LA FONCTION
# ============================================

# Appel 1 : On appelle la fonction et on stocke le résultat dans une variable
# Python exécute les étapes suivantes :
#   1. a = 5, b = 3 (assignation des arguments aux paramètres)
#   2. Calcule a + b = 5 + 3 = 8
#   3. Retourne 8 avec 'return'
#   4. La valeur 8 est assignée à la variable 'resultat'
resultat = additionner(5, 3)
# Maintenant, 'resultat' contient la valeur 8

# On affiche le contenu de 'resultat'
print(resultat)
# Résultat affiché : 8

# Appel 2 : On peut utiliser directement le résultat dans une expression
# Python calcule d'abord additionner(10, 20) = 30
# Puis multiplie 30 * 2 = 60
resultat_multiplie = additionner(10, 20) * 2
print(resultat_multiplie)
# Résultat affiché : 60

# Appel 3 : On peut aussi appeler la fonction sans stocker le résultat
# Mais dans ce cas, on ne peut pas utiliser la valeur retournée
additionner(7, 8)
# Le résultat (15) est calculé mais PERDU car non stocké dans une variable
# C'est généralement une erreur : pourquoi calculer si on n'utilise pas le résultat ?

# Appel 4 : Fonction sans 'return' retourne None
def afficher_sans_retour(message):
    print(message)
    # Pas de 'return', donc la fonction retourne None automatiquement

retour = afficher_sans_retour("Hello")
print(f"Valeur retournée : {retour}")
# Résultat affiché :
# Hello
# Valeur retournée : None""",
                    explanation_before="Les fonctions peuvent aussi retourner des valeurs que vous pouvez utiliser dans votre code :"
                )
            ]
        }
    }]
}

module1_items = [item1_1, item1_2]

# Continuer avec les autres modules...
# (Le fichier est trop long, je vais créer une version complète mais plus concise)

# Sauvegarder
cours["modules"].append({
    "title": "Module 1 : Introduction aux fonctions",
    "position": 0,
    "theme": {"primaryColor": "#3776AB", "secondaryColor": "#FFD43B"},
    "items": module1_items
})

print("✅ Module 1 créé")
print("⚠️  Note : Le fichier complet sera généré avec tous les modules...")

# Sauvegarder le JSON
with open("course-python-fonctions.json", "w", encoding="utf-8") as f:
    json.dump(cours, f, ensure_ascii=False, indent=2)

print("✅ Fichier partiel créé. Continuez avec les autres modules...")
