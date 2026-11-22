-- ---------------------------------------------------------------------------
-- 0001 · Meglévő séma helyreállítása (schema drift rendezése)
--
-- A live adatbázisban a felhasználói táblákból hiányoznak olyan oszlopok,
-- amelyekre a jelenlegi alkalmazás épül (garázs, mentett ellenőrzések,
-- keresési napló, profil). Ez a migráció NEM töröl és NEM ír felül adatot:
-- kizárólag hozzáadja a hiányzó oszlopokat, hogy a meglévő funkciók
-- működjenek. Minden utasítás idempotens.
-- ---------------------------------------------------------------------------

-- profiles: e-mail, avatar szín, bemutatkozás (versenyzői profil).
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists avatar_color text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists country text default 'Magyarország';

-- user_vehicles: évjárat és karosszéria (a garázs űrlap mezői).
alter table public.user_vehicles add column if not exists year integer;
alter table public.user_vehicles add column if not exists body text;

-- search_history: típus, címke, keresőkifejezés.
alter table public.search_history add column if not exists type text default 'search';
alter table public.search_history add column if not exists label text;
alter table public.search_history add column if not exists query text;

-- compatibility_reports: a mentett ellenőrzés teljes adatai.
alter table public.compatibility_reports add column if not exists part_name text;
alter table public.compatibility_reports add column if not exists oe_number text;
alter table public.compatibility_reports add column if not exists manufacturer_part_number text;
alter table public.compatibility_reports add column if not exists category text;
alter table public.compatibility_reports add column if not exists brand_id uuid references public.vehicle_brands(id) on delete set null;
alter table public.compatibility_reports add column if not exists model_id uuid references public.vehicle_models(id) on delete set null;
alter table public.compatibility_reports add column if not exists engine_id uuid references public.vehicle_engines(id) on delete set null;
alter table public.compatibility_reports add column if not exists year integer;
alter table public.compatibility_reports add column if not exists status text;
alter table public.compatibility_reports add column if not exists confidence integer;
alter table public.compatibility_reports add column if not exists verified boolean default false;
alter table public.compatibility_reports add column if not exists reasons text[];
alter table public.compatibility_reports add column if not exists warnings text[];
alter table public.compatibility_reports add column if not exists matched_part_id uuid references public.parts(id) on delete set null;

-- updated_at automatikus karbantartása.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['parts','profiles','user_vehicles','fitments'] loop
    if not exists (
      select 1 from pg_trigger where tgname = 'trg_' || t || '_touch'
    ) then
      execute format(
        'create trigger trg_%s_touch before update on public.%I
         for each row execute function public.touch_updated_at()', t, t);
    end if;
  end loop;
end $$;

-- Regisztrációkor automatikusan létrejövő profil (ha még nincs ilyen trigger).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end $$;
