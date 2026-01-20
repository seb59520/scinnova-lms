# ===========================================
# SOLUTION ÉTAPE 3 - DÉTECTION TEMPORELLE
# ===========================================

HEURE_DEBUT = 8
HEURE_FIN = 18

print("⏰ Détection des connexions hors heures normales")
print("=" * 50)

with open("data/auth.log", "r") as fichier:
    lignes = fichier.readlines()

for ligne in lignes:
    ligne = ligne.strip()
    
    # Extraire la date et l'heure (format : 2026-01-10 09:12:45)
    # Séparer par espace
    parties = ligne.split()
    if len(parties) >= 2:
        date_heure = parties[1]  # "09:12:45"
        
        # Extraire l'heure (les 2 premiers caractères avant :)
        heure_str = date_heure.split(":")[0]
        heure = int(heure_str)
        
        # Vérifier si hors heures normales
        if heure < HEURE_DEBUT or heure >= HEURE_FIN:
            print(f"🚨 Connexion suspecte (hors heures) : {ligne}")

print("\n✅ Analyse terminée")
