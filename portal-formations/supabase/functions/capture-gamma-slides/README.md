# Edge Function : Capture Gamma Slides

Cette Edge Function capture automatiquement les présentations Gamma en images pour les afficher dans l'application.

## Configuration

### Option 1 : ScreenshotOne (Recommandé)

1. Créer un compte sur [ScreenshotOne](https://screenshotone.com/)
2. Obtenir votre clé API
3. Ajouter le secret dans Supabase :
   ```bash
   supabase secrets set SCREENSHOT_API_KEY=votre_cle_api
   ```

### Option 2 : HTML/CSS to Image

1. Créer un compte sur [htmlcsstoimage.com](https://htmlcsstoimage.com/)
2. Obtenir votre clé API
3. Ajouter le secret dans Supabase :
   ```bash
   supabase secrets set HTMLCSSTOIMAGE_API_KEY=votre_cle_api
   ```

### Configuration Supabase Storage

1. Créer un bucket `gamma-slides` dans Supabase Storage
2. Configurer les politiques RLS pour permettre l'upload et la lecture publique :
   ```sql
   -- Politique pour permettre l'upload (service role uniquement)
   CREATE POLICY "Service role can upload"
   ON storage.objects FOR INSERT
   TO service_role
   WITH CHECK (bucket_id = 'gamma-slides');

   -- Politique pour permettre la lecture publique
   CREATE POLICY "Public can read"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'gamma-slides');
   ```

## Déploiement

```bash
supabase functions deploy capture-gamma-slides
```

## Utilisation

L'Edge Function est appelée automatiquement depuis le composant `GammaPresentation` quand l'utilisateur clique sur le bouton de capture.

## Limitations

- Les services de screenshot peuvent avoir des limitations de taux (rate limits)
- Le coût peut varier selon le service utilisé
- La capture peut prendre quelques secondes
