# ===========================================
# SOLUTION ÉTAPE 7 - ANALYSE GLOBALE & RAPPORT FINAL
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

def est_suspect(ligne, echecs_par_ip):
    ip = extraire_ip(ligne)
    heure = extraire_heure(ligne)
    user = extraire_user(ligne)
    
    if ip and echecs_par_ip.get(ip, 0) >= 5:
        return True, "IP_SUSPECTE"
    if heure is not None and (heure < HEURE_DEBUT or heure >= HEURE_FIN):
        return True, "HORS_HEURES"
    if user == "admin":
        return True, "ADMIN_CIBLE"
    return False, None

print("📊 Génération du rapport de sécurité")
print("=" * 50)

# Lire tous les logs
with open("data/auth.log", "r") as fichier:
    lignes = fichier.readlines()

# Compter les échecs par IP
echecs_par_ip = {}
for ligne in lignes:
    ligne = ligne.strip()
    if "STATUS=FAIL" in ligne:
        ip = extraire_ip(ligne)
        if ip:
            echecs_par_ip[ip] = echecs_par_ip.get(ip, 0) + 1

# Collecter les statistiques
alertes = []
heures_suspectes = {}
users_cibles = {}

for ligne in lignes:
    ligne = ligne.strip()
    suspect, type_alerte = est_suspect(ligne, echecs_par_ip)
    
    if suspect:
        alertes.append(ligne)
        
        # Compter par heure
        heure = extraire_heure(ligne)
        if heure is not None:
            heures_suspectes[heure] = heures_suspectes.get(heure, 0) + 1
        
        # Compter par utilisateur
        user = extraire_user(ligne)
        if user:
            users_cibles[user] = users_cibles.get(user, 0) + 1

# Trier les IP par nombre d'échecs (top 5)
ip_triees = sorted(echecs_par_ip.items(), key=lambda x: x[1], reverse=True)[:5]

# Trier les heures par activité (top 5)
heures_triees = sorted(heures_suspectes.items(), key=lambda x: x[1], reverse=True)[:5]

# Générer le rapport
rapport = f"""
{'='*60}
RAPPORT DE SÉCURITÉ - ANALYSE GLOBALE
{'='*60}

📊 STATISTIQUES GÉNÉRALES
{'─'*60}
Nombre total d'alertes détectées : {len(alertes)}
Nombre total d'échecs d'authentification : {sum(echecs_par_ip.values())}
Nombre d'IP distinctes : {len(echecs_par_ip)}

🚨 TOP 5 DES IP LES PLUS SUSPECTES
{'─'*60}
"""
for i, (ip, nombre) in enumerate(ip_triees, 1):
    rapport += f"{i}. {ip} : {nombre} échecs\n"

rapport += f"""
⏰ TOP 5 DES HEURES AVEC ACTIVITÉ SUSPECTE
{'─'*60}
"""
for i, (heure, nombre) in enumerate(heures_triees, 1):
    rapport += f"{i}. {heure}h00 : {nombre} événements suspects\n"

rapport += f"""
👤 UTILISATEURS CIBLÉS
{'─'*60}
"""
for user, nombre in sorted(users_cibles.items(), key=lambda x: x[1], reverse=True):
    rapport += f"  {user} : {nombre} tentatives suspectes\n"

rapport += f"""
💡 RECOMMANDATIONS
{'─'*60}
1. Bloquer les IP avec 5+ échecs ({len([ip for ip, n in echecs_par_ip.items() if n >= 5])} IP concernées)
2. Renforcer la sécurité du compte admin
3. Surveiller particulièrement les heures {', '.join([str(h) for h, _ in heures_triees[:3]])}h
4. Mettre en place une alerte automatique pour les connexions hors heures

{'='*60}
Rapport généré le : {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
{'='*60}
"""

# Sauvegarder le rapport
with open("rapport_securite.txt", "w", encoding="utf-8") as fichier:
    fichier.write(rapport)

print(rapport)
print("\n✅ Rapport généré : rapport_securite.txt")
