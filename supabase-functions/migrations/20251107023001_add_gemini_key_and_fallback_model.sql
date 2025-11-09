ALTER TABLE public.user_settings
ADD COLUMN gemini_api_key TEXT;

ALTER TABLE public.optimizations
ADD COLUMN fallback_model TEXT;

ALTER TABLE public.cover_letter_generations
ADD COLUMN fallback_model TEXT;
