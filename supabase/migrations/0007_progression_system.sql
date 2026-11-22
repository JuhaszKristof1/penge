-- 0007 · Fejlődési rendszer (licencek, feladatok, pontok)
--
-- A GRIDLINE fejlődési rendszerének adatmodellje:
--   · challenge_definitions – a feladatok (badge-ek) definíciói
--   · user_challenges       – melyik felhasználó melyik feladatot teljesítette
--   · points_ledger         – írásvédett pontnapló (minden pontmozgás nyoma)
--   · licence_levels.min_points – rangküszöbök (ideiglenes értékek!)
--
-- Alapelvek:
--   · A pontokat KIZÁRÓLAG szerveroldali, SECURITY DEFINER függvény ítélheti oda
--     (`claim_challenge`), amely a feladat feltételét a valós DB-adatokon
--     ellenőrzi. A kliens csak kérni tud, adni nem.
--   · Egy feladat jutalma felhasználónként csak egyszer szerezhető meg
--     (unique (user_id, challenge_code) + a napló `source_ref` egyedisége).
--   · A rangot a pontnapló összege határozza meg; kézzel nem állítható.
--   · A pontküszöbök ideiglenesek és egy helyen (licence_levels.min_points)
--     módosíthatók, amikor a végleges szabályok kialakulnak.
--
-- A migráció idempotens: többször is futtatható.
-- ---------------------------------------------------------------------------

-- --- Rangküszöbök -----------------------------------------------------------
alter table public.licence_levels
  add column if not exists min_points integer not null default 0;

-- IDEIGLENES küszöbök – a végleges értékeket később határozzuk meg.
update public.licence_levels set min_points = v.pts
from (values ('rookie', 0), ('d', 300), ('c', 700), ('b', 1200), ('a', 2000)) as v(code, pts)
where public.licence_levels.code = v.code
  and public.licence_levels.min_points is distinct from v.pts;

-- --- Feladatok (badge-ek) ---------------------------------------------------
create table if not exists public.challenge_definitions (
  code text primary key,
  name text not null,
  description text not null,           -- magyar nyelvű feladatleírás (tooltip)
  icon text not null default 'flag',   -- a kliens oldali ikonkulcs
  points integer not null default 100 check (points >= 0),
  category text not null default 'altalanos',
  criteria jsonb not null default '{}'::jsonb,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- --- Teljesített feladatok (felhasználónként egyszer) -----------------------
create table if not exists public.user_challenges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge_code text not null references public.challenge_definitions(code) on delete cascade,
  points_awarded integer not null default 0,
  completed_at timestamptz not null default now(),
  primary key (user_id, challenge_code)
);

-- --- Pontnapló (csak hozzáfűzés) -------------------------------------------
create table if not exists public.points_ledger (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  delta integer not null,
  reason text not null,
  source text not null default 'challenge',   -- challenge | lap | admin
  source_ref text,                            -- pl. a feladat kódja
  created_at timestamptz not null default now()
);

-- Egy feladat jutalma a naplóban is csak egyszer szerepelhet.
create unique index if not exists uq_points_ledger_challenge
  on public.points_ledger (user_id, source_ref)
  where source = 'challenge';

create index if not exists idx_points_ledger_user on public.points_ledger (user_id);
create index if not exists idx_user_challenges_user on public.user_challenges (user_id);

-- --- updated_at trigger -----------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_challenge_definitions_touch') then
    create trigger trg_challenge_definitions_touch
      before update on public.challenge_definitions
      for each row execute function public.touch_updated_at();
  end if;
end $$;

-- --- Kiértékelő: aktuális érték egy feladat feltételéhez --------------------
-- A feltétel a `criteria` jsonb: { "kind": ..., ...paraméterek }.
-- Visszaadja a felhasználó jelenlegi értékét; a jutalomhoz ezt a
-- `target` értékkel hasonlítjuk össze.
create or replace function public.challenge_metric(p_user uuid, p_criteria jsonb)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_kind text := p_criteria->>'kind';
  v_value numeric;
begin
  case v_kind
    when 'approved_laps' then
      select count(*) into v_value
      from public.lap_times
      where user_id = p_user and status = 'approved';

    when 'gps_laps' then
      select count(*) into v_value
      from public.lap_times
      where user_id = p_user and status = 'approved' and measurement_type = 'gps';

    when 'distinct_tracks' then
      select count(distinct track_id) into v_value
      from public.lap_times
      where user_id = p_user and status = 'approved';

    when 'lap_under_ms' then
      select coalesce(max(case when lt.lap_time_ms <= (p_criteria->>'target_ms')::int then 1 else 0 end), 0)
      into v_value
      from public.lap_times lt
      join public.tracks t on t.id = lt.track_id
      where lt.user_id = p_user
        and lt.status = 'approved'
        and t.slug = p_criteria->>'track_slug';

    when 'max_speed_kmh' then
      select coalesce(max(s.speed_mps) * 3.6, 0)
      into v_value
      from public.gps_samples s
      join public.gps_sessions gs on gs.id = s.session_id
      where gs.user_id = p_user and s.speed_mps is not null;

    else
      v_value := 0;
  end case;

  return coalesce(v_value, 0);
end;
$$;

-- --- Rang újraszámítása a pontnapló alapján ---------------------------------
create or replace function public.recompute_licence(p_user uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_code text;
begin
  select coalesce(sum(delta), 0) into v_total
  from public.points_ledger where user_id = p_user;

  select code into v_code
  from public.licence_levels
  where min_points <= v_total
  order by min_points desc, sort_order desc
  limit 1;

  v_code := coalesce(v_code, 'rookie');

  insert into public.user_licences (user_id, level_code, points, achieved_at, updated_at)
  values (p_user, v_code, v_total, now(), now())
  on conflict (user_id) do update
    set level_code = excluded.level_code,
        points = excluded.points,
        achieved_at = case
          when public.user_licences.level_code is distinct from excluded.level_code then now()
          else public.user_licences.achieved_at
        end,
        updated_at = now();

  return v_code;
end;
$$;

-- --- Feladat igénylése (a pontokat a szerver ítéli oda) ---------------------
-- A p_user-t a szerveroldali API route adja át a HITELESÍTETT munkamenet
-- alapján; a függvény csak service_role számára futtatható, ezért a kliens
-- nem tud magának pontot adni.
drop function if exists public.claim_challenge(text);
create or replace function public.claim_challenge(p_user uuid, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ch public.challenge_definitions;
  v_current numeric;
  v_target numeric;
  v_total integer;
  v_level text;
begin
  if p_user is null then
    return jsonb_build_object('ok', false, 'error', 'not-authenticated');
  end if;

  select * into v_ch from public.challenge_definitions
  where code = p_code and is_active = true;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'unknown-challenge');
  end if;

  if exists (select 1 from public.user_challenges where user_id = p_user and challenge_code = p_code) then
    return jsonb_build_object('ok', false, 'error', 'already-claimed');
  end if;

  v_current := public.challenge_metric(p_user, v_ch.criteria);
  v_target := coalesce((v_ch.criteria->>'target')::numeric, 1);

  if v_current < v_target then
    return jsonb_build_object(
      'ok', false,
      'error', 'criteria-not-met',
      'current', v_current,
      'target', v_target
    );
  end if;

  insert into public.user_challenges (user_id, challenge_code, points_awarded)
  values (p_user, p_code, v_ch.points);

  insert into public.points_ledger (user_id, delta, reason, source, source_ref)
  values (p_user, v_ch.points, v_ch.name, 'challenge', p_code);

  v_level := public.recompute_licence(p_user);

  select coalesce(sum(delta), 0) into v_total
  from public.points_ledger where user_id = p_user;

  return jsonb_build_object(
    'ok', true,
    'points_awarded', v_ch.points,
    'total_points', v_total,
    'licence', v_level
  );
end;
$$;

-- --- Teljes fejlődési állapot egy kérésben ----------------------------------
-- p_user = null → csak a nyilvános feladatlistát adja vissza (haladás nélkül).
create or replace function public.get_progression(p_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_total integer := 0;
  v_level public.licence_levels;
  v_next public.licence_levels;
  v_items jsonb;
  v_completed integer := 0;
  v_percent integer := 0;
  v_span integer;
begin
  if p_user is not null then
    select coalesce(sum(delta), 0) into v_total
    from public.points_ledger where user_id = p_user;
  end if;

  select * into v_level from public.licence_levels
  where min_points <= v_total order by min_points desc, sort_order desc limit 1;
  if not found then
    select * into v_level from public.licence_levels order by min_points asc limit 1;
  end if;

  select * into v_next from public.licence_levels
  where min_points > v_total order by min_points asc limit 1;

  select coalesce(jsonb_agg(item order by ord), '[]'::jsonb) into v_items
  from (
    select cd.sort_order as ord,
      jsonb_build_object(
        'code', cd.code,
        'name', cd.name,
        'description', cd.description,
        'icon', cd.icon,
        'points', cd.points,
        'category', cd.category,
        'sortOrder', cd.sort_order,
        'target', coalesce((cd.criteria->>'target')::numeric, 1),
        'current', case when p_user is null then 0
                        else public.challenge_metric(p_user, cd.criteria) end,
        'completed', uc.challenge_code is not null,
        'completedAt', uc.completed_at
      ) as item
    from public.challenge_definitions cd
    left join public.user_challenges uc
      on p_user is not null and uc.user_id = p_user and uc.challenge_code = cd.code
    where cd.is_active = true
  ) s;

  if p_user is not null then
    select count(*) into v_completed
    from public.user_challenges where user_id = p_user;
  end if;

  if v_next.code is not null then
    v_span := greatest(v_next.min_points - coalesce(v_level.min_points, 0), 1);
    v_percent := least(100, greatest(0,
      round((v_total - coalesce(v_level.min_points, 0))::numeric * 100 / v_span)::int));
  else
    v_percent := 100;
  end if;

  return jsonb_build_object(
    'challenges', v_items,
    'summary', jsonb_build_object(
      'licenceCode', coalesce(v_level.code, 'rookie'),
      'licenceName', coalesce(v_level.name, 'Rookie'),
      'totalPoints', v_total,
      'nextLicenceCode', v_next.code,
      'nextLicenceName', v_next.name,
      'nextThreshold', v_next.min_points,
      'pointsToNext', case when v_next.code is null then null
                           else greatest(v_next.min_points - v_total, 0) end,
      'progressPercent', v_percent,
      'completedChallenges', v_completed
    )
  );
end;
$$;

-- --- RLS --------------------------------------------------------------------
alter table public.challenge_definitions enable row level security;
alter table public.user_challenges      enable row level security;
alter table public.points_ledger        enable row level security;

-- A feladatok definíciói nyilvánosak (a badge-ek bejelentkezés nélkül is látszanak).
drop policy if exists challenge_definitions_public_read on public.challenge_definitions;
create policy challenge_definitions_public_read on public.challenge_definitions
  for select using (true);

drop policy if exists challenge_definitions_admin_write on public.challenge_definitions;
create policy challenge_definitions_admin_write on public.challenge_definitions
  for all using (public.is_admin()) with check (public.is_admin());

-- A teljesítéseket és a pontnaplót a tulajdonos (és az admin) olvashatja.
drop policy if exists user_challenges_owner_read on public.user_challenges;
create policy user_challenges_owner_read on public.user_challenges
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists points_ledger_owner_read on public.points_ledger;
create policy points_ledger_owner_read on public.points_ledger
  for select using (user_id = auth.uid() or public.is_admin());

-- Írás kizárólag a SECURITY DEFINER függvényeken keresztül történik.
revoke insert, update, delete on public.user_challenges from anon, authenticated;
revoke insert, update, delete on public.points_ledger   from anon, authenticated;

-- A pontokat adó/kiértékelő függvények KIZÁRÓLAG szerveroldalról hívhatók.
revoke all on function public.claim_challenge(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_challenge(uuid, text) to service_role;

revoke all on function public.get_progression(uuid) from public, anon, authenticated;
grant execute on function public.get_progression(uuid) to service_role;

revoke all on function public.challenge_metric(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.recompute_licence(uuid) from public, anon, authenticated;

grant usage, select on sequence public.points_ledger_id_seq to service_role, authenticated, anon;

-- --- Minden profilhoz legyen licence-sor ------------------------------------
create or replace function public.ensure_user_licence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_licences (user_id, level_code, points)
  values (new.id, 'rookie', 0)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_profiles_licence') then
    create trigger trg_profiles_licence
      after insert on public.profiles
      for each row execute function public.ensure_user_licence();
  end if;
end $$;

-- A meglévő felhasználók licence-sorának pótlása (a pontokat nem bántja).
insert into public.user_licences (user_id, level_code, points)
select p.id, 'rookie', 0
from public.profiles p
on conflict (user_id) do nothing;

-- --- Mintafeladatok (3–5 db) ------------------------------------------------
-- A feltételek a valós adatokon ellenőrizhetők. A pontértékek ideiglenesek.
insert into public.challenge_definitions (code, name, description, icon, points, category, criteria, sort_order) values
  (
    'elso-vonal',
    'Első vonal',
    'Teljesíts egy jóváhagyott kört bármelyik magyar versenypályán. Ez az első lépés a ranglétrán: bizonyítsd, hogy tudsz mért kört futni.',
    'flag',
    100,
    'alap',
    '{"kind": "approved_laps", "target": 1}'::jsonb,
    10
  ),
  (
    'sebessegmero-kapu',
    'Sebességmérő kapu',
    'Haladj át a sebességmérő kapun: egy GPS-mérés során rögzíts legalább 150 km/h-s sebességet. A rendszer a mérésed valós sebességadatait ellenőrzi.',
    'gauge',
    150,
    'sebesseg',
    '{"kind": "max_speed_kmh", "target": 150}'::jsonb,
    20
  ),
  (
    'palya-vadasz',
    'Pályavadász',
    'Teljesíts jóváhagyott kört legalább két különböző magyar versenypályán. A pályaváltozatok nem számítanak külön pályának.',
    'map',
    200,
    'palya',
    '{"kind": "distinct_tracks", "target": 2}'::jsonb,
    30
  ),
  (
    'gps-uttoro',
    'GPS úttörő',
    'Rögzíts egy jóváhagyott kört GPS-alapú méréssel. A GPS-es eredmények ellenőrzés után kerülnek a ranglistára.',
    'satellite',
    150,
    'gps',
    '{"kind": "gps_laps", "target": 1}'::jsonb,
    40
  ),
  (
    'idomero',
    'Időmérő',
    'Teljesíts három jóváhagyott kört. A kitartás számít: minden hitelesített kör közelebb visz a következő licence-szinthez.',
    'timer',
    250,
    'alap',
    '{"kind": "approved_laps", "target": 3}'::jsonb,
    50
  )
on conflict (code) do nothing;
