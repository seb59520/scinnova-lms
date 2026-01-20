# ===========================================
# SOLUTION ÉTAPE 2 - IDENTIFIER LES IP SUSPECTES
# ===========================================

print("🔍 Détection des IP suspectes")
print("=" * 50)

# Dictionnaire pour compter les échecs par IP
echecs_par_ip = {}

# Ouvrir le fichier
with open("data/auth.log", "r") as fichier:
    lignes = fichier.readlines()

# Parcourir chaque ligne
for ligne in lignes:
    ligne = ligne.strip()
    
    # Si c'est un échec, extraire l'IP
    if "STATUS=FAIL" in ligne:
        # Extraire l'IP : chercher "IP=" et prendre ce qui suit jusqu'à l'espace
        debut_ip = ligne.find("IP=")
        if debut_ip != -1:
            # Extraire à partir de "IP=" (3 caractères)
            partie_ip = ligne[debut_ip + 3:]
            # Prendre jusqu'au prochain espace
            ip = partie_ip.split()[0]
            
            # Incrémenter le compteur
            echecs_par_ip[ip] = echecs_par_ip.get(ip, 0) + 1

# Afficher les IP suspectes (5 échecs ou plus)
print("\n🚨 IP suspectes (5+ échecs) :")
for ip, nombre in echecs_par_ip.items():
    if nombre >= 5:
        print(f"  {ip} : {nombre} échecs")

print("\n✅ Analyse terminée")
