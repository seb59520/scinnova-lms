# Guide : Génération de slides avancées avec Graphime/APIs

## Vue d'ensemble

Le système de génération de slides propose deux modes :

1. **Mode standard** : Génération avec Canvas HTML5 côté client (rapide, gratuit)
2. **Mode avancé** : Génération avec HTML/CSS via API externe (designs plus professionnels)

## Option 1 : Utiliser htmlcsstoimage.com (Recommandé)

### Configuration

1. Créez un compte sur [htmlcsstoimage.com](https://htmlcsstoimage.com)
2. Obtenez votre API Key depuis le dashboard
3. Ajoutez-la dans votre fichier `.env` :

```env
VITE_HTML_CSS_TO_IMAGE_API_KEY=votre_cle_api_ici
```

### Avantages

- ✅ Designs HTML/CSS complets (gradients, ombres, animations CSS)
- ✅ Support de Google Fonts
- ✅ Qualité d'image élevée (1920x1080)
- ✅ Pas besoin de serveur

### Utilisation

1. Cochez la case "Design avancé" dans l'interface
2. Cliquez sur "Générer slide avancée"
3. La slide sera générée avec un design HTML/CSS professionnel

## Option 2 : Utiliser une Edge Function Supabase

### Déploiement de l'Edge Function

1. **Installer Supabase CLI** :
```bash
npm install -g supabase
```

2. **Initialiser Supabase** (si pas déjà fait) :
```bash
supabase init
```

3. **Déployer la fonction** :
```bash
supabase functions deploy generate-slide-with-html
```

4. **Configurer les variables d'environnement** :
```bash
supabase secrets set HTML_CSS_TO_IMAGE_API_KEY=votre_cle_api
```

### Avantages

- ✅ Traitement côté serveur (pas de limite de taille)
- ✅ Utilisation de Puppeteer possible
- ✅ Plus de contrôle sur le processus

## Option 3 : Utiliser Puppeteer (Côté serveur)

Pour des designs encore plus avancés, vous pouvez utiliser Puppeteer dans une Edge Function :

1. Créer une Edge Function avec Puppeteer
2. Générer le HTML de la slide
3. Utiliser Puppeteer pour prendre un screenshot
4. Uploader l'image vers Supabase Storage

### Exemple de code Edge Function avec Puppeteer

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts'

serve(async (req) => {
  const { html } = await req.json()
  
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })
  const screenshot = await page.screenshot({ type: 'jpeg', quality: 90 })
  await browser.close()
  
  // Upload vers Supabase Storage...
})
```

## Comparaison des options

| Option | Qualité | Coût | Complexité | Recommandation |
|--------|---------|------|------------|----------------|
| Canvas HTML5 | ⭐⭐⭐ | Gratuit | Faible | Pour débuter |
| htmlcsstoimage.com | ⭐⭐⭐⭐ | Payant | Faible | **Recommandé** |
| Edge Function + API | ⭐⭐⭐⭐ | Payant | Moyenne | Pour production |
| Puppeteer | ⭐⭐⭐⭐⭐ | Gratuit | Élevée | Pour contrôle total |

## Améliorations possibles

### Design avancé avec Graphime

Si vous souhaitez utiliser Graphime (bibliothèque de génération graphique), vous pouvez :

1. **Créer une API Node.js** qui utilise Graphime
2. **Appeler cette API** depuis votre frontend
3. **Stocker les images** dans Supabase Storage

### Exemple d'intégration Graphime

```typescript
// Dans une API Node.js séparée
import { Graphime } from 'graphime'

const graphime = new Graphime({
  apiKey: process.env.GRAPHIME_API_KEY
})

async function generateSlide(slideData) {
  const image = await graphime.create({
    template: 'slide-template',
    data: slideData
  })
  return image
}
```

## Configuration recommandée

Pour la meilleure qualité avec le moins de complexité :

1. ✅ Utilisez **htmlcsstoimage.com** pour les designs avancés
2. ✅ Gardez Canvas HTML5 comme fallback
3. ✅ Configurez `VITE_HTML_CSS_TO_IMAGE_API_KEY` dans `.env`

## Test

1. Cochez "Design avancé"
2. Cliquez sur "Générer slide avancée"
3. Vérifiez que l'image est bien générée et uploadée
4. Si erreur, vérifiez la console pour les détails


