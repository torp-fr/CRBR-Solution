-- Table clients portail
CREATE TABLE IF NOT EXISTS public.clients_portail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dst_client_id TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  organisation TEXT NOT NULL,
  contact_name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  segment TEXT DEFAULT 'institutionnel',
  portail_actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.clients_portail
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique par token actif"
  ON public.clients_portail
  FOR SELECT
  USING (portail_actif = true);

-- Table sessions portail
CREATE TABLE IF NOT EXISTS public.sessions_portail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dst_session_id TEXT NOT NULL,
  dst_client_id TEXT NOT NULL,
  token_client TEXT NOT NULL,
  label TEXT DEFAULT '',
  date DATE,
  heure TEXT DEFAULT '',
  lieu TEXT DEFAULT '',
  statut TEXT DEFAULT 'planifiee',
  est_future BOOLEAN DEFAULT true,
  compte_rendu TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sessions_portail
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture par token client valide"
  ON public.sessions_portail
  FOR SELECT
  USING (
    token_client IN (
      SELECT token FROM public.clients_portail
      WHERE portail_actif = true
    )
  );

-- Table abonnements portail
CREATE TABLE IF NOT EXISTS public.abonnements_portail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dst_client_id TEXT NOT NULL,
  token_client TEXT NOT NULL,
  offre_label TEXT DEFAULT '',
  volume_jours INTEGER DEFAULT 0,
  sessions_realisees INTEGER DEFAULT 0,
  rythme TEXT DEFAULT '',
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.abonnements_portail
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture par token client valide"
  ON public.abonnements_portail
  FOR SELECT
  USING (
    token_client IN (
      SELECT token FROM public.clients_portail
      WHERE portail_actif = true
    )
  );

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_sessions_token
  ON public.sessions_portail (token_client);

CREATE INDEX IF NOT EXISTS idx_sessions_date
  ON public.sessions_portail (date);

CREATE INDEX IF NOT EXISTS idx_abonnements_token
  ON public.abonnements_portail (token_client);

-- Trigger updated_at sur clients_portail
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.clients_portail
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
