# ===========================================
# SOLUTION ÉTAPE 1 - COMPRENDRE LES LOGS
# ===========================================

print("🔐 Analyse des logs d'authentification")
print("=" * 50)

# Ouvrir le fichier en lecture
with open("data/auth.log", "r") as fichier:
    lignes = fichier.readlines()

# Compter les échecs
compteur_echecs = 0

# Parcourir chaque ligne
for ligne in lignes:
    ligne = ligne.strip()  # Enlever les espaces et retours à la ligne
    
    # Vérifier si c'est un échec
    if "STATUS=FAIL" in ligne:
        print(f"⚠️  {ligne}")
        compteur_echecs += 1

print(f"\n📊 Total d'échecs : {compteur_echecs}")
print("\n✅ Analyse terminée")
