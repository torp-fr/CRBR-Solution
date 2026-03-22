-- Table opérateurs portail
CREATE TABLE IF NOT EXISTS public.operateurs_portail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dst_operateur_id TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  nom TEXT DEFAULT '',
  prenom TEXT DEFAULT '',
  email TEXT DEFAULT '',
  telephone TEXT DEFAULT '',
  specialite TEXT DEFAULT '',
  statut TEXT DEFAULT 'freelance',
  portail_actif BOOLEAN DEFAULT true,
  profil_complete BOOLEAN DEFAULT false,
  bio TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.operateurs_portail
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture par token opérateur actif"
  ON public.operateurs_portail
  FOR SELECT
  USING (portail_actif = true);

CREATE POLICY "Mise à jour par token opérateur actif"
  ON public.operateurs_portail
  FOR UPDATE
  USING (portail_actif = true);

-- Table sessions opérateur portail
CREATE TABLE IF NOT EXISTS public.sessions_operateur_portail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dst_session_id TEXT NOT NULL,
  dst_operateur_id TEXT NOT NULL,
  token_operateur TEXT NOT NULL,
  label TEXT DEFAULT '',
  date DATE,
  heure TEXT DEFAULT '',
  lieu TEXT DEFAULT '',
  statut TEXT DEFAULT 'planifiee',
  nb_jours INTEGER DEFAULT 1,
  est_future BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sessions_operateur_portail
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture sessions par token opérateur valide"
  ON public.sessions_operateur_portail
  FOR SELECT
  USING (
    token_operateur IN (
      SELECT token FROM public.operateurs_portail
      WHERE portail_actif = true
    )
  );

-- Table disponibilités opérateur
CREATE TABLE IF NOT EXISTS public.disponibilites_operateur (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_operateur TEXT NOT NULL,
  type TEXT DEFAULT 'disponible',
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  motif TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.disponibilites_operateur
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture dispos par token valide"
  ON public.disponibilites_operateur
  FOR SELECT
  USING (
    token_operateur IN (
      SELECT token FROM public.operateurs_portail
      WHERE portail_actif = true
    )
  );

CREATE POLICY "Ajout dispos par token valide"
  ON public.disponibilites_operateur
  FOR INSERT
  WITH CHECK (
    token_operateur IN (
      SELECT token FROM public.operateurs_portail
      WHERE portail_actif = true
    )
  );

CREATE POLICY "Suppression dispos par token valide"
  ON public.disponibilites_operateur
  FOR DELETE
  USING (
    token_operateur IN (
      SELECT token FROM public.operateurs_portail
      WHERE portail_actif = true
    )
  );

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_sessions_op_token
  ON public.sessions_operateur_portail (token_operateur);

CREATE INDEX IF NOT EXISTS idx_dispo_token
  ON public.disponibilites_operateur (token_operateur);

-- Trigger updated_at sur operateurs_portail
CREATE OR REPLACE FUNCTION update_updated_at_operateurs()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_operateurs
  BEFORE UPDATE ON public.operateurs_portail
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_operateurs();
