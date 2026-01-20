# identite.py

from datetime import datetime

# Demande des informations à l'utilisateur
prenom = input("Entrez votre prénom : ")
nom = input("Entrez votre nom : ")
annee_naissance = int(input("Entrez votre année de naissance : "))

# Récupération automatique de l'année actuelle
annee_actuelle = datetime.now().year

# Calcul de l'âge approximatif
age = annee_actuelle - annee_naissance

# Affichage de la fiche récapitulative
print("\n----- FICHE IDENTITÉ -----")
print(f"Prénom : {prenom}")
print(f"Nom : {nom}")
print(f"Année de naissance : {annee_naissance}")
print(f"Âge approximatif : {age} ans")
print("--------------------------")