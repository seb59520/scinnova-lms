# ✅ Corrigé — Exercice listes Python

# PARTIE 1
notes = [12, 8, 15, 10, 18]
print("Liste complète :", notes)
print("Première note :", notes[0])
print("Dernière note :", notes[-1])

# PARTIE 2
print("Nombre total de notes :", len(notes))
moyenne = sum(notes) / len(notes)
print("Moyenne :", moyenne)

# PARTIE 3
index_8 = notes.index(8)
notes[index_8] = 11
notes.append(14)
notes.insert(1, 9)
print("Liste mise à jour :", notes)

# PARTIE 4
notes.remove(10)
derniere = notes.pop()
print("Dernière note supprimée :", derniere)
print("Liste après suppression :", notes)

# PARTIE 5
if 18 in notes:
    print("✅ La note 18 est présente dans la liste.")
else:
    print("❌ La note 18 n'est pas présente dans la liste.")

print("Nombre de fois que 12 apparaît :", notes.count(12))

# PARTIE 6
notes.sort()
print("Tri croissant :", notes)
notes.sort(reverse=True)
print("Tri décroissant :", notes)

# PARTIE 7
print("Affichage simple :")
for note in notes:
    print(note)

print("\nAffichage avec numéros :")
for i, note in enumerate(notes, start=1):
    print(f"Note {i} : {note}")

# PARTIE 8 (BONUS)
notes_sup_10 = []
for note in notes:
    if note >= 10:
        notes_sup_10.append(note)

print("Notes >= 10 :", notes_sup_10)