# ===========================================
# SOLUTION ÉTAPE 5 - GÉNÉRATION D'ALERTES
# ===========================================

HEURE_DEBUT = 8
HEURE_FIN = 18

def extraire_ip(ligne):
    debut_ip = ligne.find("IP=")
    if debut_ip != -1:
        partie_ip = ligne[debut_ip + 3:]
        ip = partie_ip.split()[0]
        return ip
    return None

def extraire_heure(ligne):
    parties = ligne.split()
    if len(parties) >= 2:
        date_heure = parties[1]
        heure_str = date_heure.split(":")[0]
        try:
            return int(heure_str)
        except ValueError:
            return None
    return None

def extraire_user(ligne):
    debut_user = ligne.find("USER=")
    if debut_user != -1:
        partie_user = ligne[debut_user + 5:]
        user = partie_user.split()[0] if partie_user.split() else ""
        return user
    return None

def extraire_date(ligne):
    parties = ligne.split()
    if len(parties) >= 2:
        return f"{parties[0]} {parties[1]}"
    return "DATE_INCONNUE"

def est_suspect(ligne, echecs_par_ip):
    ip = extraire_ip(ligne)
    heure = extraire_heure(ligne)
    user = extraire_user(ligne)
    date = extraire_date(ligne)
    
    raisons = []
    niveau = "INFO"
    
    if ip and echecs_par_ip.get(ip, 0) >= 5:
        raisons.append("IP avec 5+ échecs")
        niveau = "CRITIQUE"
    
    if heure is not None and (heure < HEURE_DEBUT or heure >= HEURE_FIN):
        raisons.append("Connexion hors heures")
        niveau = "WARNING"
    
    if user == "admin":
        raisons.append("Tentative sur compte admin")
        niveau = "CRITIQUE"
    
    if raisons:
        return True, date, niveau, " | ".join(raisons), ligne
    return False, None, None, None, None

def generer_alerte(date, niveau, raison, details):
    """Formate une alerte selon le format demandé."""
    return f"[{date}] [{niveau}] {raison} - {details}"

print("🚨 Génération du rapport d'alertes")
print("=" * 50)

# Compter les échecs par IP
echecs_par_ip = {}
with open("data/auth.log", "r") as fichier:
    lignes = fichier.readlines()

for ligne in lignes:
    ligne = ligne.strip()
    if "STATUS=FAIL" in ligne:
        ip = extraire_ip(ligne)
        if ip:
            echecs_par_ip[ip] = echecs_par_ip.get(ip, 0) + 1

# Collecter les alertes
alertes = []
with open("data/auth.log", "r") as fichier:
    lignes = fichier.readlines()

for ligne in lignes:
    ligne = ligne.strip()
    suspect, date, niveau, raison, details = est_suspect(ligne, echecs_par_ip)
    if suspect:
        alerte = generer_alerte(date, niveau, raison, details)
        alertes.append(alerte)

# Écrire dans le fichier
with open("alertes.txt", "w", encoding="utf-8") as fichier_alertes:
    fichier_alertes.write("=" * 60 + "\n")
    fichier_alertes.write("RAPPORT D'ALERTES DE SÉCURITÉ\n")
    fichier_alertes.write("=" * 60 + "\n\n")
    fichier_alertes.write(f"Nombre total d'alertes : {len(alertes)}\n\n")
    
    for alerte in alertes:
        fichier_alertes.write(alerte + "\n")

print(f"✅ {len(alertes)} alertes générées")
print("✅ Rapport généré : alertes.txt")
