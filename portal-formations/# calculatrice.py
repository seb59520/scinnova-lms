# calculatrice.py

# Demande du premier nombre
nombre1 = float(input("Entrez le premier nombre : "))

# Demande du deuxième nombre
nombre2 = float(input("Entrez le deuxième nombre : "))

# Calculs
somme = nombre1 + nombre2
difference = nombre1 - nombre2
produit = nombre1 * nombre2

# Vérification pour éviter la division par zéro
if nombre2 != 0:
    quotient = nombre1 / nombre2
else:
    quotient = "Impossible (division par zéro)"

# Affichage des résultats
print("\nRésultats :")
print("Somme :", somme)
print("Différence :", difference)
print("Produit :", produit)
print("Quotient :", quotient)