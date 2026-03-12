-- Fix: handle_new_user() - search_path 및 스키마 명시
-- 원인: SECURITY DEFINER 함수에서 search_path 미설정 + profiles 스키마 생략
-- → 실행 시점에 relation "profiles" does not exist 발생

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;
