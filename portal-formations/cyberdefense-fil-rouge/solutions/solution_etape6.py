# ===========================================
# SOLUTION ÉTAPE 6 - AUTOMATISATION DE LA SURVEILLANCE
# ===========================================

import time

HEURE_DEBUT = 8
HEURE_FIN = 18

def extraire_ip(ligne):
    debut_ip = ligne.find("IP=")
    if debut_ip != -1:
        partie_ip = ligne[debut_ip + 3:]
        ip = partie_ip.split()[0]
        return ip
    return None

def est_suspect(ligne, echecs_par_ip):
    ip = extraire_ip(ligne)
    if ip and echecs_par_ip.get(ip, 0) >= 5:
        return True
    return False

print("🔄 Surveillance en continu activée")
print("Appuyez sur Ctrl+C pour arrêter")
print("=" * 50)

# Compter les échecs par IP (état initial)
echecs_par_ip = {}
position_precedente = 0

try:
    while True:
        # Ouvrir le fichier et se positionner à la dernière position lue
        with open("data/auth.log", "r") as fichier:
            fichier.seek(position_precedente)
            nouvelles_lignes = fichier.readlines()
            
            # Mettre à jour la position
            position_precedente = fichier.tell()
        
        # Analyser les nouvelles lignes
        for ligne in nouvelles_lignes:
            ligne = ligne.strip()
            
            if "STATUS=FAIL" in ligne:
                ip = extraire_ip(ligne)
                if ip:
                    echecs_par_ip[ip] = echecs_par_ip.get(ip, 0) + 1
                    
                    # Vérifier si suspect
                    if est_suspect(ligne, echecs_par_ip):
                        print(f"🚨 NOUVELLE ALERTE : {ligne}")
        
        print(f"⏱️  Vérification terminée. Prochaine dans 30 secondes...")
        time.sleep(30)
        
except KeyboardInterrupt:
    print("\n\n✅ Surveillance arrêtée par l'utilisateur")
