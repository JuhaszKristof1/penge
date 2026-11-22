-- 0006 · Sorozat- (sequence-) jogosultságok a szerveroldali íráshoz
--
-- A gps_samples tábla `id bigserial` elsődleges kulcsot használ, ezért a
-- beszúráshoz a hozzá tartozó sorozaton is szükség van USAGE jogra. A Supabase
-- a beépített szerepköröknél ezt alapból megadja, önálló (self-hosted)
-- telepítésnél viszont nem – ilyenkor a GPS-mérés mentése
-- „permission denied for sequence gps_samples_id_seq” hibával elszáll.
--
-- Ez a migráció idempotens: biztonságosan újrafuttatható, és a jövőben
-- hozzáadott táblák sorozataira is beállítja az alapértelmezett jogosultságot.

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant usage, select on all sequences in schema public to service_role;
    alter default privileges in schema public grant usage, select on sequences to service_role;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant usage, select on all sequences in schema public to authenticated;
    alter default privileges in schema public grant usage, select on sequences to authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant usage, select on all sequences in schema public to anon;
    alter default privileges in schema public grant usage, select on sequences to anon;
  end if;
end $$;
