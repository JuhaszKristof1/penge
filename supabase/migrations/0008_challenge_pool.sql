-- ---------------------------------------------------------------------------
-- 0008 – Bővített feladatkészlet (badge-ek)
--
-- A 0007-ben bevezetett öt feladat összesen 850 pontot ad, miközben az "A"
-- licenc küszöbe 2000 pont. A ranglétra így elérhetetlen lenne, ezért ez a
-- migráció további feladatokat vesz fel.
--
-- A feltételek kizárólag a már létező, valós adatokon mérhető metrikákra
-- épülnek (jóváhagyott körök száma, GPS-körök, különböző pályák, mért
-- csúcssebesség). Pályára vonatkozó, kitalált referencia-időket NEM
-- használunk.
--
-- Idempotens: a már létező kódokat nem írja felül.
-- ---------------------------------------------------------------------------

insert into public.challenge_definitions (code, name, description, icon, points, category, criteria, sort_order) values
  (
    'vonalkereso',
    'Vonalon innen',
    'Teljesíts öt jóváhagyott kört. Az első mért körök után jön az igazi munka: a következetesség.',
    'flag',
    200,
    'alap',
    '{"kind": "approved_laps", "target": 5}'::jsonb,
    60
  ),
  (
    'ritmus-erzek',
    'Ritmusérzék',
    'Teljesíts tíz jóváhagyott kört. A stabil körök sorozata többet ér, mint egyetlen szerencsés mért idő.',
    'timer',
    300,
    'alap',
    '{"kind": "approved_laps", "target": 10}'::jsonb,
    70
  ),
  (
    'nagy-kor',
    'Nagy kör',
    'Teljesíts húsz jóváhagyott kört. Ez már versenytempó: a ranglétra felső fokai felé vezető út.',
    'trophy',
    400,
    'alap',
    '{"kind": "approved_laps", "target": 20}'::jsonb,
    80
  ),
  (
    'gps-kutato',
    'GPS-kutató',
    'Rögzíts három jóváhagyott GPS-mérésű kört. A GPS-es eredmények ellenőrzés után kerülnek a ranglistára.',
    'satellite',
    250,
    'gps',
    '{"kind": "gps_laps", "target": 3}'::jsonb,
    90
  ),
  (
    'gps-veteran',
    'GPS-veterán',
    'Rögzíts tíz jóváhagyott GPS-mérésű kört. A mérési rutin a pályán és a felszerelés kezelésében is számít.',
    'satellite',
    400,
    'gps',
    '{"kind": "gps_laps", "target": 10}'::jsonb,
    100
  ),
  (
    'orszagjaro',
    'Országjáró',
    'Teljesíts jóváhagyott kört négy különböző magyar versenypályán. A pályaváltozatok nem számítanak külön pályának.',
    'map',
    300,
    'palya',
    '{"kind": "distinct_tracks", "target": 4}'::jsonb,
    110
  ),
  (
    'sebesseg-felett',
    'Sebesség felett',
    'Érj el legalább 200 km/h-t egy GPS-mérés során. A rendszer a mérésed valós sebességadatait ellenőrzi.',
    'gauge',
    250,
    'sebesseg',
    '{"kind": "max_speed_kmh", "target": 200}'::jsonb,
    120
  ),
  (
    'versenyzoi-szemlelet',
    'Versenyzői szemlélet',
    'Teljesíts harminc jóváhagyott kört. A hosszú távú fejlődés alapja a rendszeres pályaidő.',
    'trophy',
    500,
    'alap',
    '{"kind": "approved_laps", "target": 30}'::jsonb,
    130
  )
on conflict (code) do nothing;

notify pgrst, 'reload schema';
