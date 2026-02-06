drop function if exists public.handle_new_user() cascade;

CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.raw_app_meta_data IS NOT NULL THEN
    IF (NEW.raw_app_meta_data ? 'provider') AND (NEW.raw_app_meta_data ->> 'provider' = 'email') THEN
      IF NEW.raw_user_meta_data ? 'name' AND NEW.raw_user_meta_data ? 'username' THEN
        INSERT INTO public.profiles (profile_id, name, username, bio)
        VALUES (
          NEW.id,
          NEW.raw_user_meta_data ->> 'name',
          NEW.raw_user_meta_data ->> 'username',
          'Developers'
        );
      ELSE
        INSERT INTO public.profiles (profile_id, name, username, bio)
        VALUES (
          NEW.id,
          'Anonymous',
          '@mr.' || substr(md5(random()::text), 1, 8),
          'Developers'
        );
      END IF;          -- closes IF NEW.raw_user_meta_data ? ...
    END IF;            -- closes IF provider = 'email'
  END IF;              -- closes IF NEW.raw_app_meta_data IS NOT NULL
  RETURN NEW;
END;
$$;

create trigger user_to_profile_trigger
after insert on auth.users
for each row execute function public.handle_new_user();