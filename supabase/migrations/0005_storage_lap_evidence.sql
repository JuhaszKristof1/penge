-- ---------------------------------------------------------------------------
-- 0005 · Köridő-bizonyítékok Storage bucketje (előkészítés)
--
-- A kézi köridő-feltöltésnél a felhasználó képet vagy videót csatolhat
-- bizonyítékként. Ehhez egy "lap-evidence" nevű Storage bucketet hozunk létre.
--
-- FONTOS: a bucket létrehozása és a hozzáférési szabályok a Supabase Storage
-- séma (storage.buckets, storage.objects) meglétét igénylik. Ha a Storage
-- nincs telepítve (pl. minimális helyi teszt-környezet), ez a migráció
-- biztonságosan, hiba nélkül lefut, és csak kihagyja a bucket létrehozását.
-- Semmit nem töröl és nem ír felül.
--
-- A bizonyíték-URL-t a köridő beküldésekor a lap_times.evidence_url mező
-- tárolja; a feltöltés kliensoldalról, a bejelentkezett felhasználó saját
-- mappájába történik.
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage')
     and exists (select 1 from information_schema.tables
                 where table_schema = 'storage' and table_name = 'buckets') then

    -- Nyilvános olvasású bucket (a bizonyíték linkje megosztható az adminnak).
    insert into storage.buckets (id, name, public)
    values ('lap-evidence', 'lap-evidence', true)
    on conflict (id) do nothing;

    -- Feltöltés: bejelentkezett felhasználó a saját mappájába (auth.uid()).
    if not exists (select 1 from pg_policies
                   where schemaname = 'storage' and tablename = 'objects'
                     and policyname = 'lap_evidence_insert_own') then
      create policy lap_evidence_insert_own on storage.objects
        for insert to authenticated
        with check (bucket_id = 'lap-evidence' and (storage.foldername(name))[1] = auth.uid()::text);
    end if;

    -- Olvasás: mindenki (a bizonyíték megtekinthető az ellenőrzéshez).
    if not exists (select 1 from pg_policies
                   where schemaname = 'storage' and tablename = 'objects'
                     and policyname = 'lap_evidence_read_all') then
      create policy lap_evidence_read_all on storage.objects
        for select using (bucket_id = 'lap-evidence');
    end if;

    -- Törlés: a tulajdonos a saját mappájában.
    if not exists (select 1 from pg_policies
                   where schemaname = 'storage' and tablename = 'objects'
                     and policyname = 'lap_evidence_delete_own') then
      create policy lap_evidence_delete_own on storage.objects
        for delete to authenticated
        using (bucket_id = 'lap-evidence' and (storage.foldername(name))[1] = auth.uid()::text);
    end if;
  end if;
end $$;
