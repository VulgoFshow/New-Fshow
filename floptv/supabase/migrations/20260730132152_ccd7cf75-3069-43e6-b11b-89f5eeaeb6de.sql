
ALTER TABLE public.lower_thirds
  ADD COLUMN IF NOT EXISTS font_scale numeric NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS corner_radius integer NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS accent_width integer NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS opacity numeric NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS uppercase boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS shadow boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS subtitle_color text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS badge_text text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS image_shape text NOT NULL DEFAULT 'square',
  ADD COLUMN IF NOT EXISTS ticker boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_hide_seconds integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS air_since timestamptz;

ALTER TABLE public.lower_thirds REPLICA IDENTITY FULL;

GRANT DELETE ON public.like_totals TO authenticated;

DROP POLICY IF EXISTS "Admins can reset like totals" ON public.like_totals;
CREATE POLICY "Admins can reset like totals" ON public.like_totals
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.add_likes(_client_id text, _display_name text, _avatar_url text, _amount integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  amt integer := least(greatest(coalesce(_amount, 0), 0), 50);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'login required';
  END IF;
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
$function$;
