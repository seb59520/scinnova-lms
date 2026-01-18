-- Créer le bucket pour stocker les captures d'écran des slides Gamma
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gamma-slides',
  'gamma-slides',
  true, -- Public pour permettre l'affichage des images
  52428800, -- 50MB max par fichier
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre l'upload par le service role (Edge Functions)
CREATE POLICY IF NOT EXISTS "Service role can upload gamma slides"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'gamma-slides');

-- Politique pour permettre la lecture publique des images
CREATE POLICY IF NOT EXISTS "Public can read gamma slides"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gamma-slides');

-- Politique pour permettre la suppression par le service role
CREATE POLICY IF NOT EXISTS "Service role can delete gamma slides"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'gamma-slides');
