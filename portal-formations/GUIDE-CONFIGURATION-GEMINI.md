# Guide : Configuration des modèles Gemini

## Problème résolu

Le code a été mis à jour pour essayer automatiquement plusieurs modèles Gemini jusqu'à trouver celui qui fonctionne avec votre clé API.

## Configuration dans `.env`

Modifiez votre fichier `.env` pour utiliser un modèle compatible :

```env
# Modèle par défaut (recommandé - le plus stable)
VITE_GEMINI_MODEL=gemini-pro

# Ou si gemini-pro ne fonctionne pas, essayez :
# VITE_GEMINI_MODEL=models/gemini-pro
# VITE_GEMINI_MODEL=gemini-1.5-pro
# VITE_GEMINI_MODEL=gemini-1.5-flash
```

## Modèles disponibles

Le système essaie automatiquement ces modèles dans l'ordre :

1. **`gemini-pro`** (par défaut) - Modèle stable et largement disponible
2. **`models/gemini-pro`** - Variante avec préfixe (certaines versions de l'API)
3. **`gemini-1.5-pro`** - Plus récent et puissant
4. **`gemini-1.5-flash`** - Rapide et économique

## Comment ça fonctionne

Le code essaie chaque modèle automatiquement jusqu'à trouver celui qui fonctionne. Vous verrez dans la console :

- `🔄 Tentative avec le modèle: gemini-pro`
- `⚠️ Modèle gemini-pro non disponible, essai suivant...`
- `✅ Modèle gemini-1.5-pro fonctionne (après 1 tentative(s))`

## Vérification de votre clé API

Si tous les modèles échouent, vérifiez :

1. **Votre clé API est valide** : Vérifiez dans [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **L'API est activée** : Assurez-vous que "Generative Language API" est activée dans Google Cloud Console
3. **La facturation est activée** : Certains modèles nécessitent une facturation activée

## Mise à jour du package

Le package `@google/generative-ai` a été mis à jour vers la version **0.24.1** (dernière version).

## Test

1. Modifiez votre `.env` pour utiliser `gemini-pro`
2. Redémarrez votre serveur de développement
3. Essayez de générer une slide
4. Vérifiez la console pour voir quel modèle fonctionne

## Dépannage : Erreur 404 "models not found"

Si vous voyez l'erreur `404 models/gemini-* is not found for API version v1beta`, cela signifie que votre clé API n'a pas accès aux modèles Gemini. Voici comment résoudre :

### 1. Vérifier que l'API est activée

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet
3. Allez dans **APIs & Services** > **Library**
4. Recherchez "Generative Language API"
5. Cliquez sur **Enable** si ce n'est pas déjà fait

### 2. Vérifier la facturation

Certains modèles Gemini nécessitent que la facturation soit activée :

1. Dans Google Cloud Console, allez dans **Billing**
2. Assurez-vous qu'un compte de facturation est lié à votre projet
3. Note : Google offre un crédit gratuit de $300 pour les nouveaux comptes

### 3. Régénérer une nouvelle clé API

1. Allez sur [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Supprimez l'ancienne clé si nécessaire
3. Créez une nouvelle clé API
4. Mettez à jour `VITE_GEMINI_API_KEY` dans votre `.env`
5. Redémarrez votre serveur de développement

### 4. Vérifier les quotas

1. Dans Google Cloud Console, allez dans **APIs & Services** > **Quotas**
2. Recherchez "Generative Language API"
3. Vérifiez que vous n'avez pas dépassé les limites

### 5. Tester avec l'API REST directement

Vous pouvez tester votre clé API avec cette commande curl :

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=VOTRE_CLE_API"
```

Si cela fonctionne, vous devriez voir une liste de modèles disponibles.

## Support

Si aucun modèle ne fonctionne après ces vérifications :
- Vérifiez les logs dans la console du navigateur
- Le code liste automatiquement les modèles disponibles au démarrage
- Contactez le support Google Cloud si le problème persiste

