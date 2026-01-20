# ===========================================
# ÉTAPE 4 - RÈGLES DE DÉTECTION (MINI IDS)
# ===========================================
# Mission : Créer un moteur de règles de détection

# TODO 1 : Créer une fonction est_suspect(ligne, echecs_par_ip)
#          qui retourne True si la ligne est suspecte
# TODO 2 : Implémenter les règles :
#          - Règle 1 : +5 échecs pour cette IP
#          - Règle 2 : Connexion hors heures (8h-18h)
#          - Règle 3 : Tentative sur USER=admin
# TODO 3 : Appliquer ces règles à chaque ligne

print("🛡️ Moteur de détection d'intrusion")
print("=" * 50)

# Votre code ici

def est_suspect(ligne, echecs_par_ip):
    """
    Vérifie si une ligne de log est suspecte selon les règles.
    Retourne True si suspect, False sinon.
    """
    # TODO : Implémenter les règles
    return False

print("\n✅ Analyse terminée")
