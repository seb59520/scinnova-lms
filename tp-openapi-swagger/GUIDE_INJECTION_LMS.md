# Guide : Injecter le pas à pas détaillé dans le LMS

Ce guide explique comment injecter le document **PAS_A_PAS_DETAILLE_LMS.json** dans votre LMS.

## 📋 Fichier fourni

**`PAS_A_PAS_DETAILLE_LMS.json`** : Document complet au format TipTap JSON contenant le pas à pas détaillé du TP, prêt à être injecté dans le LMS.

## 🚀 Méthode 1 : Via l'interface admin (recommandé)

### Option A : Ajouter comme ressource dans un module existant

1. **Accéder à l'interface admin**
   - Connectez-vous en tant qu'admin
   - Allez dans la gestion du cours "TP OpenAPI/Swagger"

2. **Créer un nouvel item de type "resource"**
   - Dans le Module 2 (TP pratique), ajoutez un nouvel item
   - Type : `resource`
   - Titre : "Pas à pas détaillé - Instructions complètes"

3. **Copier le contenu JSON**
   - Ouvrez le fichier `PAS_A_PAS_DETAILLE_LMS.json`
   - Copiez tout le contenu (c'est un objet JSON avec `type: "doc"` et `content: [...]`)

4. **Coller dans le champ `content.body`**
   - Dans l'éditeur JSON de l'item, trouvez le champ `content.body`
   - Remplacez son contenu par le JSON copié
   - Sauvegardez

### Option B : Remplacer les instructions du TP existant

1. **Ouvrir l'item TP existant**
   - Dans le Module 2, ouvrez l'item "TP : Création d'une API OpenAPI 3 avec Swagger UI"

2. **Remplacer le champ `content.instructions`**
   - Ouvrez le fichier `PAS_A_PAS_DETAILLE_LMS.json`
   - Copiez tout le contenu
   - Dans l'éditeur JSON, remplacez `content.instructions` par le JSON copié
   - Sauvegardez

## 🗄️ Méthode 2 : Via SQL (insertion directe)

Si vous préférez insérer directement en base de données :

```sql
-- 1. Trouver l'ID de l'item TP
SELECT id, title, module_id 
FROM items 
WHERE title LIKE '%TP%OpenAPI%';

-- 2. Mettre à jour le champ content.instructions
-- (Remplacez ITEM_ID par l'ID trouvé)
UPDATE items
SET content = jsonb_set(
  content,
  '{instructions}',
  'CONTENU_DU_FICHIER_PAS_A_PAS_DETAILLE_LMS_JSON_ICI'::jsonb
)
WHERE id = 'ITEM_ID';
```

**Note :** Vous devrez charger le contenu du fichier JSON et l'insérer comme JSONB.

## 📝 Structure du JSON

Le fichier `PAS_A_PAS_DETAILLE_LMS.json` contient :

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [{ "type": "text", "text": "Titre" }]
    },
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Texte..." }]
    },
    {
      "type": "codeBlock",
      "attrs": { "language": "typescript" },
      "content": [{ "type": "text", "text": "code..." }]
    }
  ]
}
```

C'est un document TipTap complet avec :
- Titres (heading level 1-3)
- Paragraphes
- Listes à puces et numérotées
- Blocs de code avec coloration syntaxique
- Liens

## ✅ Vérification

Après l'injection :

1. **Vérifiez l'affichage**
   - Ouvrez le cours en tant qu'étudiant
   - Vérifiez que le pas à pas s'affiche correctement
   - Vérifiez que les blocs de code sont bien formatés
   - Vérifiez que les titres sont hiérarchisés

2. **Testez la navigation**
   - Vérifiez que les étudiants peuvent suivre les étapes
   - Vérifiez que les liens fonctionnent (Swagger Editor)

## 🔧 Personnalisation

Si vous souhaitez modifier le contenu :

1. **Éditez le fichier JSON**
   - Ouvrez `PAS_A_PAS_DETAILLE_LMS.json`
   - Modifiez le contenu selon vos besoins
   - Respectez la structure TipTap

2. **Réinjectez dans le LMS**
   - Suivez les mêmes étapes que ci-dessus

## 📚 Format TipTap

Le document utilise le format TipTap avec ces types de nœuds :

- `heading` : Titres (level 1-6)
- `paragraph` : Paragraphes de texte
- `bulletList` / `orderedList` : Listes
- `listItem` : Élément de liste
- `codeBlock` : Bloc de code (avec `attrs.language`)
- `text` : Texte simple (peut avoir des `marks` : bold, code, link)

Pour plus d'informations sur le format TipTap, consultez la documentation de votre LMS.

---

**Le pas à pas est maintenant prêt à être utilisé par vos étudiants ! 🎓**



