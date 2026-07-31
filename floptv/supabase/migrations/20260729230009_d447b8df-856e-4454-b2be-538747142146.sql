ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$fn$;

CREATE TABLE public.lower_thirds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  image_url text,
  accent_color text NOT NULL DEFAULT '#ff2d6f',
  text_color text NOT NULL DEFAULT '#ffffff',
  bg_color text NOT NULL DEFAULT '#0b0b12',
  position text NOT NULL DEFAULT 'bottom-left',
  style text NOT NULL DEFAULT 'bar',
  animation text NOT NULL DEFAULT 'slide',
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.lower_thirds TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lower_thirds TO authenticated;
GRANT ALL ON public.lower_thirds TO service_role;

ALTER TABLE public.lower_thirds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lower thirds" ON public.lower_thirds FOR SELECT USING (true);
CREATE POLICY "Admins insert lower thirds" ON public.lower_thirds FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update lower thirds" ON public.lower_thirds FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete lower thirds" ON public.lower_thirds FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_lower_thirds_updated_at BEFORE UPDATE ON public.lower_thirds
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.like_totals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL UNIQUE,
  user_id uuid,
  display_name text NOT NULL DEFAULT 'Anônimo',
  avatar_url text,
  total integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.like_totals TO anon;
GRANT SELECT ON public.like_totals TO authenticated;
GRANT ALL ON public.like_totals TO service_role;

ALTER TABLE public.like_totals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view like totals" ON public.like_totals FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.add_likes(_client_id text, _display_name text, _avatar_url text, _amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  amt integer := least(greatest(coalesce(_amount, 0), 0), 50);
BEGIN
  IF amt = 0 OR _client_id IS NULL OR length(_client_id) > 64 THEN RETURN; END IF;
  INSERT INTO public.like_totals (client_id, user_id, display_name, avatar_url, total)
  VALUES (_client_id, auth.uid(), coalesce(nullif(left(_display_name, 40), ''), 'Anônimo'), left(_avatar_url, 500), amt)
  ON CONFLICT (client_id) DO UPDATE
    SET total = public.like_totals.total + amt,
        display_name = coalesce(nullif(left(_display_name, 40), ''), public.like_totals.display_name),
        avatar_url = coalesce(left(_avatar_url, 500), public.like_totals.avatar_url),
        user_id = coalesce(auth.uid(), public.like_totals.user_id),
        updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_likes(text, text, text, integer) TO anon, authenticated;

CREATE TRIGGER update_like_totals_updated_at BEFORE UPDATE ON public.like_totals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.lower_thirds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.like_totals;