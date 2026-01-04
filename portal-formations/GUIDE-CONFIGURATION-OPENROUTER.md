# Guide : Configuration OpenRouter pour la génération de slides

## Qu'est-ce qu'OpenRouter ?

OpenRouter est une plateforme qui offre un accès unifié à une vaste gamme de modèles d'IA (Gemini, GPT-4, Claude, etc.) via une seule API. C'est une excellente alternative à l'API Gemini directe car :

- ✅ Accès à plusieurs modèles (Gemini, GPT-4, Claude, etc.)
- ✅ Pas besoin d'activer plusieurs APIs
- ✅ Facturation unifiée
- ✅ Haute disponibilité avec basculement automatique
- ✅ Tarification transparente

## Configuration rapide

### 1. Créer un compte OpenRouter

1. Allez sur [OpenRouter.ai](https://openrouter.ai/)
2. Créez un compte ou connectez-vous
3. Allez dans **Keys** pour créer une clé API
4. Copiez votre clé API

### 2. Configurer les variables d'environnement

Ajoutez dans votre fichier `.env` :

```env
# Clé API OpenRouter (obligatoire)
VITE_OPENROUTER_API_KEY=votre_cle_api_ici

# Modèle à utiliser (optionnel, défaut: google/gemini-pro)
VITE_OPENROUTER_MODEL=google/gemini-pro
```

### 3. Choisir un modèle

OpenRouter supporte de nombreux modèles. Voici quelques recommandations :

#### Modèles Gemini (recommandés pour le design)
- `google/gemini-3-flash-preview` - **Recommandé** - Modèle Gemini 3 rapide et performant ✅
- `google/gemini-3-pro-preview` - Gemini 3 Pro, plus puissant
- `google/gemini-1.5-pro` - Gemini 1.5 Pro, stable
- `google/gemini-1.5-flash` - Rapide et économique
- `google/gemini-pro` - Ancien modèle (peut ne plus être disponible)

#### Modèles GPT (alternatives)
- `openai/gpt-4o-mini` - Rapide et économique
- `openai/gpt-4o` - Plus puissant

#### Modèles Claude (alternatives)
- `anthropic/claude-3-haiku` - Rapide et économique
- `anthropic/claude-3-sonnet` - Équilibré

### 4. Voir tous les modèles disponibles

Vous pouvez voir tous les modèles disponibles sur [OpenRouter Models](https://openrouter.ai/models)

## Configuration dans `.env`

Exemple complet :

```env
# OpenRouter Configuration
VITE_OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_OPENROUTER_MODEL=google/gemini-3-flash-preview
```

## Comment ça fonctionne

Le système essaie automatiquement plusieurs modèles dans l'ordre :

1. Le modèle configuré dans `VITE_OPENROUTER_MODEL`
2. `google/gemini-pro`
3. `google/gemini-1.5-pro`
4. `google/gemini-1.5-flash`
5. `openai/gpt-4o-mini` (fallback)
6. `anthropic/claude-3-haiku` (fallback)

Si un modèle échoue, le système bascule automatiquement vers le suivant.

## Tarification

OpenRouter propose :

- **Modèles gratuits** : Certains modèles sont disponibles gratuitement (avec limitations)
- **Pay-as-you-go** : Payez uniquement ce que vous utilisez
- **Crédits gratuits** : Nouveaux comptes reçoivent des crédits gratuits

Consultez [OpenRouter Pricing](https://openrouter.ai/docs/pricing) pour plus de détails.

## Dépannage

### Erreur 401 (Unauthorized)
- Vérifiez que `VITE_OPENROUTER_API_KEY` est correct dans votre `.env`
- Vérifiez que votre clé API est active sur OpenRouter

### Erreur 404 (Model not found)
- Vérifiez que le modèle spécifié dans `VITE_OPENROUTER_MODEL` existe
- Consultez [OpenRouter Models](https://openrouter.ai/models) pour la liste complète

### Erreur 429 (Rate limit)
- Vous avez atteint la limite de requêtes
- Attendez quelques minutes ou vérifiez votre plan

### Tous les modèles échouent
- Vérifiez votre connexion internet
- Vérifiez que votre compte OpenRouter a des crédits disponibles
- Consultez les logs dans la console du navigateur pour plus de détails

## Avantages par rapport à l'API Gemini directe

1. **Pas de configuration Google Cloud** : Pas besoin d'activer l'API dans Google Cloud Console
2. **Pas de facturation Google** : Utilisez votre compte OpenRouter
3. **Plus de modèles** : Accès à GPT-4, Claude, etc. en plus de Gemini
4. **Plus simple** : Une seule clé API pour tout

## Migration depuis Gemini direct

Si vous aviez configuré Gemini directement :

1. Remplacez `VITE_GEMINI_API_KEY` par `VITE_OPENROUTER_API_KEY`
2. Ajoutez `VITE_OPENROUTER_MODEL=google/gemini-pro`
3. Redémarrez votre serveur de développement

C'est tout ! Le code gère automatiquement le reste.

