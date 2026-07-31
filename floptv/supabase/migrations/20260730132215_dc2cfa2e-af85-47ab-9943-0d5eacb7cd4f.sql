
REVOKE ALL ON FUNCTION public.add_likes(text, text, text, integer) FROM public;
REVOKE ALL ON FUNCTION public.add_likes(text, text, text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.add_likes(text, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_likes(text, text, text, integer) TO service_role;
