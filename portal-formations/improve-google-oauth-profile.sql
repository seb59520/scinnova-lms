-- Amélioration de la fonction handle_new_user pour mieux gérer Google OAuth
-- Google OAuth peut fournir le nom dans 'name' ou 'full_name' dans raw_user_meta_data

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
BEGIN
  -- Essayer de récupérer le nom depuis les métadonnées OAuth
  -- Google OAuth peut fournir: name, full_name, ou email
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    SPLIT_PART(NEW.email, '@', 1) -- Fallback sur la partie avant @ de l'email
  );

  -- Créer le profil avec le nom récupéré
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (NEW.id, 'student', user_full_name)
  ON CONFLICT (id) DO NOTHING; -- Éviter les erreurs si le profil existe déjà
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy RLS pour permettre l'insertion automatique du profil via le trigger
-- Cette policy permet à un utilisateur de créer son propre profil (ce que fait le trigger)
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Note: Le trigger utilise SECURITY DEFINER, mais cette policy garantit que
-- l'insertion fonctionne même si RLS est strict. Le trigger insère avec NEW.id
-- qui correspond à auth.uid() au moment de la création de l'utilisateur.

