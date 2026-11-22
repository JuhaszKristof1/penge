-- ---------------------------------------------------------------------------
-- 0002 · Motorsport domain (versenypályák, köridők, GPS, közösség, licencek)
--
-- Új táblák a meglévő Supabase projekthez. Semmit nem töröl és nem ír felül.
-- Minden utasítás idempotens, ezért biztonságosan futtatható többször is.
--
-- A köridő-ranglista KIZÁRÓLAG a `status = 'approved'` sorokat használja.
-- A GPS-es eredmények nem hitelesek automatikusan: mindig 'pending' állapotban
-- kerülnek be, és emberi ellenőrzés után kerülhetnek a ranglistára.
-- ---------------------------------------------------------------------------

-- --- Autókategóriák (ranglista-dimenzió) -----------------------------------
create table if not exists public.vehicle_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 100,
  created_at timestamptz default now()
);

insert into public.vehicle_categories (code, name, description, sort_order) values
  ('utcai',    'Utcai',        'Utcai használatra gyártott, nagyrészt sorozatgyártású autók.', 10),
  ('sport',    'Sport',        'Gyári sportmodellek és teljesítmény-orientált utcai autók.',   20),
  ('tuning',   'Tuning',       'Módosított, tuningolt utcai autók.',                           30),
  ('verseny',  'Verseny',      'Versenycélra épített, bukócsöves autók.',                      40),
  ('gokart',   'Gokart',       'Gokart és más kisméretű pályajármű.',                          50),
  ('motor',    'Motor',        'Motorkerékpárok és egyéb kétkerekűek.',                        60),
  ('egyeb',    'Egyéb',        'Egyéb vagy nem besorolt járművek.',                            90)
on conflict (code) do nothing;

-- --- Versenypályák ---------------------------------------------------------
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  locality text,                       -- település
  county text,                         -- vármegye / régió
  country text not null default 'Magyarország',
  latitude double precision,
  longitude double precision,
  description text,
  image_url text,                      -- nagy, bemutató fotó
  layout_image_url text,               -- alapértelmezett pályarajz
  length_m integer,                    -- fő nyomvonal hossza méterben
  width text,                          -- pl. "10–12 m"
  corners integer,
  opened_year integer,
  status text not null default 'active',  -- active | inactive | planned
  website text,
  source_url text,                     -- ellenőrzött forrás (hivatkozás)
  source_note text,                    -- forrás megjegyzés
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint tracks_status_check check (status in ('active','inactive','planned'))
);

-- --- Pályaváltozatok -------------------------------------------------------
create table if not exists public.track_layouts (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks(id) on delete cascade,
  slug text not null,
  name text not null,
  length_m integer,
  corners integer,
  direction text,                      -- clockwise | counterclockwise | both
  description text,
  map_image_url text,
  is_default boolean not null default false,
  source_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (track_id, slug)
);

create index if not exists idx_track_layouts_track on public.track_layouts(track_id);

-- --- GPS-mérési munkamenetek ----------------------------------------------
create table if not exists public.gps_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  layout_id uuid references public.track_layouts(id) on delete set null,
  status text not null default 'recording',   -- recording | completed | aborted
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  sample_count integer not null default 0,
  accuracy_min_m double precision,
  accuracy_max_m double precision,
  quality text,                               -- good | fair | poor | unknown
  start_lat double precision,
  start_lng double precision,
  finish_lat double precision,
  finish_lng double precision,
  notes text,
  created_at timestamptz default now(),
  constraint gps_sessions_status_check check (status in ('recording','completed','aborted'))
);

create index if not exists idx_gps_sessions_user on public.gps_sessions(user_id);

-- --- GPS-detektált körök ---------------------------------------------------
create table if not exists public.gps_laps (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.gps_sessions(id) on delete cascade,
  lap_number integer not null,
  lap_time_ms integer,
  confidence double precision,        -- 0..1
  flagged boolean not null default false,   -- bizonytalan / hibás kör
  flag_reason text,
  created_at timestamptz default now()
);

create index if not exists idx_gps_laps_session on public.gps_laps(session_id);

-- --- GPS-nyerspontok (opcionális, nagy volumen) ----------------------------
create table if not exists public.gps_samples (
  id bigserial primary key,
  session_id uuid not null references public.gps_sessions(id) on delete cascade,
  recorded_at timestamptz not null,
  latitude double precision not null,
  longitude double precision not null,
  speed_mps double precision,
  accuracy_m double precision
);

create index if not exists idx_gps_samples_session on public.gps_samples(session_id);

-- --- Köridők (kézi és GPS) -------------------------------------------------
create table if not exists public.lap_times (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  layout_id uuid references public.track_layouts(id) on delete set null,
  vehicle_id uuid references public.user_vehicles(id) on delete set null,
  vehicle_label text,                  -- ha nincs garázs-autó (kézi megadás)
  vehicle_category text not null default 'egyeb',
  lap_time_ms integer not null,
  measured_at date not null default current_date,
  measurement_type text not null default 'manual',  -- manual | gps
  status text not null default 'pending',           -- pending | approved | rejected
  evidence_url text,
  evidence_type text default 'none',                -- image | video | none
  note text,
  gps_session_id uuid references public.gps_sessions(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint lap_times_status_check check (status in ('pending','approved','rejected')),
  constraint lap_times_type_check check (measurement_type in ('manual','gps')),
  constraint lap_times_ms_check check (lap_time_ms > 0)
);

create index if not exists idx_lap_times_track on public.lap_times(track_id);
create index if not exists idx_lap_times_layout on public.lap_times(layout_id);
create index if not exists idx_lap_times_user on public.lap_times(user_id);
create index if not exists idx_lap_times_status on public.lap_times(status);
create index if not exists idx_lap_times_leaderboard
  on public.lap_times(track_id, layout_id, vehicle_category, measurement_type, lap_time_ms)
  where status = 'approved';

-- --- Kedvenc pályák --------------------------------------------------------
create table if not exists public.track_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, track_id)
);

-- --- Követés (közösségi funkciók előkészítése) -----------------------------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

-- --- Bejegyzések (közösségi funkciók előkészítése) -------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid references public.tracks(id) on delete set null,
  lap_time_id uuid references public.lap_times(id) on delete set null,
  body text not null,
  created_at timestamptz default now()
);

create index if not exists idx_posts_created on public.posts(created_at desc);

-- --- Licenc-szintek (iRacing-szerű fejlődési rendszer előkészítése) --------
create table if not exists public.licence_levels (
  code text primary key,               -- rookie | d | c | b | a
  name text not null,
  sort_order integer not null,
  description text
);

insert into public.licence_levels (code, name, sort_order, description) values
  ('rookie', 'Rookie', 10, 'Belépő szint. A licencek megszerzése feladatok teljesítésével történik majd.'),
  ('d',      'D',      20, 'Első haladó szint.'),
  ('c',      'C',      30, 'Középhaladó szint.'),
  ('b',      'B',      40, 'Haladó szint.'),
  ('a',      'A',      50, 'Legmagasabb szint.')
on conflict (code) do nothing;

create table if not exists public.user_licences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  level_code text not null default 'rookie' references public.licence_levels(code),
  points integer not null default 0,
  achieved_at timestamptz,
  updated_at timestamptz default now()
);

-- --- updated_at triggerek --------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['tracks','track_layouts','lap_times','user_licences'] loop
    if not exists (select 1 from pg_trigger where tgname = 'trg_' || t || '_touch') then
      execute format(
        'create trigger trg_%s_touch before update on public.%I
         for each row execute function public.touch_updated_at()', t, t);
    end if;
  end loop;
end $$;
