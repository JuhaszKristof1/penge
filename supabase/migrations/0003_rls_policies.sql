-- ---------------------------------------------------------------------------
-- 0003 · Row Level Security (RLS) policy-k
--
-- Alapelv:
--   · A nyilvános katalógus (pályák, változatok, kategóriák, licencek) mindenki
--     számára olvasható.
--   · A köridő-ranglista KIZÁRÓLAG jóváhagyott (approved) eredményeket mutat
--     nyilvánosan. A saját, még nem jóváhagyott eredményeit a tulajdonos látja.
--   · A felhasználói adatok (garázs, mentések, GPS-mérések, kedvencek) csak a
--     tulajdonos számára olvashatók/írhatók.
--   · Az írás szerveroldalon is ellenőrzött (service_role), de az RLS adja a
--     végső védelmet.
--
-- Az alkalmazás a katalógust és a ranglistát az anon kulccsal olvassa, az
-- írás pedig kizárólag szerveroldali API route-okon (service_role) történik.
-- ---------------------------------------------------------------------------

alter table public.tracks               enable row level security;
alter table public.track_layouts        enable row level security;
alter table public.vehicle_categories   enable row level security;
alter table public.lap_times            enable row level security;
alter table public.track_favorites      enable row level security;
alter table public.gps_sessions         enable row level security;
alter table public.gps_laps             enable row level security;
alter table public.gps_samples          enable row level security;
alter table public.follows              enable row level security;
alter table public.posts                enable row level security;
alter table public.licence_levels       enable row level security;
alter table public.user_licences        enable row level security;

-- A meglévő táblák RLS-ét is bekapcsoljuk (a katalógus olvasható marad).
alter table public.vehicle_brands       enable row level security;
alter table public.vehicle_models       enable row level security;
alter table public.vehicle_engines      enable row level security;
alter table public.part_categories      enable row level security;
alter table public.parts                enable row level security;
alter table public.part_oe_numbers      enable row level security;
alter table public.fitments             enable row level security;
alter table public.profiles             enable row level security;
alter table public.user_vehicles        enable row level security;
alter table public.favorites            enable row level security;
alter table public.search_history       enable row level security;
alter table public.compatibility_reports enable row level security;

-- Segédfüggvény: admin-e a hívó?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- --- Katalógus: nyilvános olvasás -----------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'vehicle_brands','vehicle_models','vehicle_engines','part_categories',
    'parts','part_oe_numbers','fitments','tracks','track_layouts',
    'vehicle_categories','licence_levels'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_public_read', t);
    execute format('create policy %I on public.%I for select using (true)', t || '_public_read', t);
  end loop;
end $$;

-- --- Köridők: nyilvános olvasás csak jóváhagyottra -------------------------
drop policy if exists lap_times_public_read on public.lap_times;
create policy lap_times_public_read on public.lap_times
  for select using (status = 'approved' or user_id = auth.uid() or public.is_admin());

-- --- Profilok: mindenki olvashatja (versenyzői profilok nyilvánosak) --------
drop policy if exists profiles_public_read on public.profiles;
create policy profiles_public_read on public.profiles for select using (true);

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- --- Felhasználói adatok: csak a tulajdonos --------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'user_vehicles','favorites','search_history','compatibility_reports',
    'gps_sessions','gps_laps','gps_samples','track_favorites','user_licences'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_owner_all', t);
  end loop;
end $$;

create policy user_vehicles_owner_all on public.user_vehicles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy favorites_owner_all on public.favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy search_history_owner_all on public.search_history
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy compatibility_reports_owner_all on public.compatibility_reports
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy gps_sessions_owner_all on public.gps_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy gps_laps_owner_all on public.gps_laps
  for all using (
    exists (select 1 from public.gps_sessions s where s.id = session_id and s.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.gps_sessions s where s.id = session_id and s.user_id = auth.uid())
  );
create policy gps_samples_owner_all on public.gps_samples
  for all using (
    exists (select 1 from public.gps_sessions s where s.id = session_id and s.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.gps_sessions s where s.id = session_id and s.user_id = auth.uid())
  );
create policy track_favorites_owner_all on public.track_favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy user_licences_owner_read on public.user_licences
  for select using (user_id = auth.uid() or public.is_admin());

-- --- Közösségi: követés és bejegyzések -------------------------------------
drop policy if exists follows_public_read on public.follows;
create policy follows_public_read on public.follows for select using (true);
drop policy if exists follows_owner_write on public.follows;
create policy follows_owner_write on public.follows
  for all using (follower_id = auth.uid()) with check (follower_id = auth.uid());

drop policy if exists posts_public_read on public.posts;
create policy posts_public_read on public.posts for select using (true);
drop policy if exists posts_owner_write on public.posts;
create policy posts_owner_write on public.posts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- --- Írás: az admin (szerveroldali service_role) mindent kezelhet ----------
-- (A service_role megkerüli az RLS-t; ezek a policy-k a bejelentkezett adminnak
--  adnak jogot a közvetlen kliensoldali műveletekhez.)
do $$
declare t text;
begin
  foreach t in array array[
    'tracks','track_layouts','lap_times','vehicle_categories','licence_levels'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_write', t);
    execute format('create policy %I on public.%I for all using (public.is_admin()) with check (public.is_admin())',
                   t || '_admin_write', t);
  end loop;
end $$;
