-- ---------------------------------------------------------------------------
-- 0004 · Magyar versenypályák és pályaváltozatok (ellenőrzött forrásokból)
--
-- Csak ellenőrzött, nyilvános forrásból származó adat kerül ide. Ahol egy adat
-- nem igazolható (pl. a RabócsiRing moduláris rallycross-pályájának nincs
-- közzétett fix hossza), ott a mező NULL marad – nem találunk ki értéket.
--
-- Források (megadva a source_url mezőben):
--   · hu.wikipedia.org – Magyarország versenypályáinak listája / pályaszócikkek
--   · euroring.hu, kakucs-ring.hu, rabocsiring.hu, hungaroring.hu
--
-- Az utasítások idempotensek: on conflict do nothing – a meglévő, esetleg
-- adminfelületen módosított rekordokat NEM írja felül.
-- ---------------------------------------------------------------------------

insert into public.tracks
  (slug, name, locality, county, country, latitude, longitude, description,
   image_url, layout_image_url, length_m, width, corners, opened_year, status,
   website, source_url, source_note)
values
  (
    'hungaroring',
    'Hungaroring',
    'Mogyoród', 'Pest vármegye', 'Magyarország',
    47.5826490, 19.2500236,
    'Magyarország legjelentősebb autóverseny-pályája, a Formula–1 magyar nagydíj otthona 1986 óta. Budapest és Gödöllő között, Mogyoród külterületén fekszik. Az aszfaltcsík jelenlegi, 2003-tól használt vonalvezetése 4,381 km hosszú, 14 kanyarral.',
    '/tracks/hungaroring.jpg', '/tracks/hungaroring-layout.svg',
    4381, '10–15 m', 14, 1986, 'active',
    'https://www.hungaroring.hu',
    'https://hu.wikipedia.org/wiki/Hungaroring',
    'Hossz és kanyarszám: magyar Wikipédia pályaszócikk (4,381 km, 14 kanyar).'
  ),
  (
    'pannonia-ring',
    'Pannónia-Ring',
    'Ostffyasszonyfa', 'Vas vármegye', 'Magyarország',
    47.3063950, 17.0382771,
    'Motor- és autóverseny-pálya Ostffyasszonyfán, a település belterületétől délre. 1996. augusztus 1-jén nyílt meg. 4,74 km hosszú, 18 kanyarral (11 jobb, 7 bal); hivatalos körrekordja 1:53,667 (Andreas Meklau, 2011). A pálya fordított irányban is homologizált.',
    null, '/tracks/pannonia-ring-layout.png',
    4740, '11–13 m', 18, 1996, 'active',
    'https://www.pannonia-ring.com',
    'https://hu.wikipedia.org/wiki/Pann%C3%B3nia-Ring',
    'Hossz, kanyarszám és rekord: magyar Wikipédia pályaszócikk.'
  ),
  (
    'euroring',
    'Euroring (Euro-Ring)',
    'Örkény', 'Pest vármegye', 'Magyarország',
    47.1499697, 19.4581199,
    'Versenypálya és rendezvényközpont az M5-ös autópálya örkényi lehajtójánál, az 52-es kilométerszelvénynél. 2004-ben nyitott meg. Az aszfaltpálya 2,75 km hosszú; mellette külön 600 méteres, 8 méter átlagszélességű gokartpálya működik.',
    null, '/tracks/euroring-layout.png',
    2750, '8–12 m', null, 2004, 'active',
    'https://euroring.hu',
    'https://hu.wikipedia.org/wiki/Magyarorsz%C3%A1g_versenyp%C3%A1ly%C3%A1inak_list%C3%A1ja',
    'Aszfaltpálya hossza (2,75 km): magyar Wikipédia listaszócikk; gokartpálya (600 m): euroring.hu.'
  ),
  (
    'balaton-park-circuit',
    'Balaton Park Circuit',
    'Balatonfőkajár', 'Veszprém vármegye', 'Magyarország',
    47.0067484, 18.1998406,
    'Magánfinanszírozásban megépült versenypálya a Balatontól északra, Budapesttől kb. 85 km-re délnyugatra. Tervezője Gulácsi Ferenc. Tíz év előkészítés után 2023. május 16-án nyitották meg. 4,115 km hosszú, 16 kanyarral (6 jobb, 10 bal).',
    '/tracks/balaton-park.jpg', '/tracks/balaton-park-layout.svg',
    4115, '12–15 m', 16, 2023, 'active',
    'https://balatonparkcircuit.com',
    'https://hu.wikipedia.org/wiki/Balaton_Park_Circuit',
    'Hossz, kanyarszám, nyitás: magyar Wikipédia pályaszócikk.'
  ),
  (
    'kakucs-ring',
    'Kakucs Ring',
    'Kakucs', 'Pest vármegye', 'Magyarország',
    47.2462043, 19.3798300,
    'Extrém versenypálya Kakucson, az M5-ös autópálya mellett. 2007-ben nyitott meg, eredetileg gokartpályaként. Az 1050 méter hosszú pálya legkeskenyebb része 8, legszélesebb 16 méter. Különlegessége, hogy mindkét irányba használható, így négyféle nyomvonal alakítható ki. A 96 dB-nél hangosabb autók nem hajthatnak fel.',
    '/tracks/kakucs-ring.jpg', null,
    1050, '8–16 m', null, 2007, 'active',
    'https://www.kakucs-ring.hu',
    'https://www.kakucs-ring.hu',
    'Hossz és szélesség: kakucs-ring.hu hivatalos oldal ("A pályáról").'
  ),
  (
    'rabocsiring',
    'RabócsiRing',
    'Máriapócs', 'Szabolcs-Szatmár-Bereg vármegye', 'Magyarország',
    47.8626577, 22.0287798,
    'Közép-Európa egyetlen olyan sportkomplexuma, ahol négy szakág – autó, motor, gokart, drift – működik egymás mellett. 1996. november 23-án nyílt meg. A pálya moduláris felépítésű, bármikor átalakítható, ezért a rallycross-nyomvonalnak nincs közzétett fix hossza. 2007 óta éjszakai villanyfényes futamokat is rendeznek itt.',
    null, null,
    null, null, null, 1996, 'active',
    'https://www.rabocsiring.hu',
    'https://www.rabocsiring.hu/oldal/10/a-versenypalyarol',
    'A rallycross-pálya moduláris (átalakítható), ezért nincs közzétett fix hossz – a mező szándékosan üres.'
  )
on conflict (slug) do nothing;

-- --- Pályaváltozatok -------------------------------------------------------
-- Minden pályához legalább egy változat; a jelölt alapértelmezett (is_default).
insert into public.track_layouts
  (track_id, slug, name, length_m, corners, direction, description, map_image_url, is_default, source_url)
select t.id, v.slug, v.name, v.length_m, v.corners, v.direction, v.description, v.map_image_url, v.is_default, t.source_url
from (values
  ('hungaroring', 'nagykor', 'Nagykör (4,381 km)', 4381, 14, 'clockwise',
   'A 2003 óta használt, Formula–1-es vonalvezetés.', '/tracks/hungaroring-layout.svg', true),

  ('pannonia-ring', 'fopalya', 'Főpálya (4,740 km)', 4740, 18, 'both',
   'A teljes aszfaltcsík; a pálya fordított irányban is homologizált.', '/tracks/pannonia-ring-layout.png', true),

  ('euroring', 'aszfalt', 'Aszfaltpálya (2,750 km)', 2750, null, 'clockwise',
   'A versenypálya fő aszfaltcsíkja.', '/tracks/euroring-layout.png', true),
  ('euroring', 'gokart', 'Gokartpálya (600 m)', 600, null, 'clockwise',
   'Külön, 8 méter átlagszélességű gokartpálya.', null, false),

  ('balaton-park-circuit', 'fia-auto', 'Autós (FIA) nagykör (4,115 km)', 4115, 16, 'clockwise',
   'Az autóversenyzéshez használt FIA-vonalvezetés.', '/tracks/balaton-park-layout.svg', true),
  ('balaton-park-circuit', 'fim-moto', 'Motoros (FIM) vonalvezetés', null, null, 'clockwise',
   'A motorkerékpáros versenyzéshez használt FIM-vonalvezetés; hossza nem közzétett.', null, false),

  ('kakucs-ring', 'alap', 'Alapnyomvonal (1,050 km)', 1050, null, 'both',
   'Az alap nyomvonal, amely mindkét irányba használható.', null, true),
  ('kakucs-ring', 'autos-extra', 'Autós extra nyomvonal', null, null, 'both',
   'Az autósok által használt, extra szakaszokkal bővített nyomvonal.', null, false),

  ('rabocsiring', 'rallycross', 'Rallycross pálya', null, null, 'clockwise',
   'A komplexum rallycross-nyomvonala; moduláris, ezért hossza nem fix.', null, true),
  ('rabocsiring', 'gokart', 'Gokart pálya', null, null, 'clockwise',
   'A komplexum gokartpályája.', null, false),
  ('rabocsiring', 'drift', 'Drift pálya', null, null, 'both',
   'A komplexum drift-nyomvonala.', null, false)
) as v(track_slug, slug, name, length_m, corners, direction, description, map_image_url, is_default)
join public.tracks t on t.slug = v.track_slug
on conflict (track_id, slug) do nothing;
