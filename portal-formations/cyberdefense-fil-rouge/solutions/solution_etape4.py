# ===========================================
# SOLUTION ÉTAPE 4 - RÈGLES DE DÉTECTION (MINI IDS)
# ===========================================

HEURE_DEBUT = 8
HEURE_FIN = 18

def extraire_ip(ligne):
    """Extrait l'IP d'une ligne de log."""
    debut_ip = ligne.find("IP=")
    if debut_ip != -1:
        partie_ip = ligne[debut_ip + 3:]
        ip = partie_ip.split()[0]
        return ip
    return None

def extraire_heure(ligne):
    """Extrait l'heure d'une ligne de log."""
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
    """Extrait le nom d'utilisateur d'une ligne de log."""
    debut_user = ligne.find("USER=")
    if debut_user != -1:
        partie_user = ligne[debut_user + 5:]
        user = partie_user.split()[0] if partie_user.split() else ""
        return user
    return None

def est_suspect(ligne, echecs_par_ip):
    """
    Vérifie si une ligne de log est suspecte selon les règles.
    Retourne (True/False, raison)
    """
    # Règle 1 : +5 échecs pour cette IP
    ip = extraire_ip(ligne)
    if ip and echecs_par_ip.get(ip, 0) >= 5:
        return True, "IP avec 5+ échecs"
    
    # Règle 2 : Connexion hors heures (8h-18h)
    heure = extraire_heure(ligne)
    if heure is not None and (heure < HEURE_DEBUT or heure >= HEURE_FIN):
        return True, "Connexion hors heures normales"
    
    # Règle 3 : Tentative sur USER=admin
    user = extraire_user(ligne)
    if user == "admin":
        return True, "Tentative sur compte admin"
    
    return False, None

print("🛡️ Moteur de détection d'intrusion")
print("=" * 50)

# D'abord, compter les échecs par IP
echecs_par_ip = {}
with open("data/auth.log", "r") as fichier:
    lignes = fichier.readlines()

for ligne in lignes:
    ligne = ligne.strip()
    if "STATUS=FAIL" in ligne:
        ip = extraire_ip(ligne)
        if ip:
            echecs_par_ip[ip] = echecs_par_ip.get(ip, 0) + 1

# Ensuite, appliquer les règles
print("\n🚨 Événements suspects détectés :")
with open("data/auth.log", "r") as fichier:
    lignes = fichier.readlines()

for ligne in lignes:
    ligne = ligne.strip()
    suspect, raison = est_suspect(ligne, echecs_par_ip)
    if suspect:
        print(f"  [{raison}] {ligne}")

print("\n✅ Analyse terminée")
