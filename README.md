# AutoFit AI

Modern, prémium autóalkatrész-kompatibilitási webalkalmazás.
Next.js (App Router) + TypeScript + Tailwind CSS.

Az alkalmazás **valós adatbázisra épül**: a jármű-katalógus, az alkatrészek, a
kompatibilitási (fitment) rekordok és a felhasználói mentések egy **Supabase
(PostgreSQL)** adatbázisból származnak. Nincs beépített demó adat és nincs
kitalált tartalom: ha az adatbázis nem érhető el, a felület egyértelmű hibát
jelez, nem generál helyettesítő adatot. Külső AI szolgáltatást nem használ.

## Futtatás

```bash
npm install
cp .env.example .env.local   # töltsd ki a Supabase értékekkel (lásd lent)
npm run dev                  # fejlesztői szerver: http://localhost:3000
```

Éles build:

```bash
npm run build
npm run start
```

## Adatbázis (Supabase) – kötelező

1. Másold a `.env.example` fájlt `.env.local` néven, és töltsd ki:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-PUBLISHABLE-KEY
   SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY
   ```

   - `NEXT_PUBLIC_*` – nyilvános (anon / publishable) kulcs, a kliensbe kerül.
   - `SUPABASE_SERVICE_ROLE_KEY` – **csak szerveroldali** API route-okhoz (admin
     írás, import, felhasználói adatok). Soha nem kerülhet kliens-oldali változóba.

2. Ellenőrizd a kapcsolatot (csak olvas, sorokat számol):

   ```bash
   node scripts/verify-supabase.mjs
   ```

3. Ha a változók be vannak állítva és a táblák elérhetők, az app az adatbázisból
   dolgozik. Konfiguráció nélkül vagy hiba esetén a felület egyértelmű
   hibát/figyelmeztetést jelez – **nem esik vissza kitalált demó adatra**.

### Adatbázis-séma (táblák)

`profiles`, `vehicle_brands`, `vehicle_models`, `vehicle_engines`,
`user_vehicles`, `part_categories`, `parts`, `part_oe_numbers`, `fitments`,
`search_history`, `favorites`, `compatibility_reports`.

A kompatibilitást **kizárólag** a `fitments` tábla rekordjai döntik el
(`compatible` / `incompatible` / `uncertain`). Ha nincs rekord, az eredmény
„nem biztos” – ez nem jelent jóváhagyást.

## Fiók és hitelesítés

A regisztráció és a bejelentkezés a **Supabase Auth**-ot használja (e-mail +
jelszó). A fiókhoz kötött mentések (garázs, kedvencek, ellenőrzések, keresési
előzmények) az adatbázisban tárolódnak, felhasználónként elkülönítve. Az admin
szerepkört a `profiles.role = 'admin'` jelöli.

## Oldalak

- `/` – főoldal
- `/kompatibilitas` – alkatrész kompatibilitás ellenőrző
- `/alkatreszek` – alkatrészkereső
- `/garazs` – autógarázs (CRUD, adatbázisban tárolva)
- `/fiok` – felhasználói fiók (mentett autók, ellenőrzések, kedvencek)
- `/bejelentkezes`, `/regisztracio` – hitelesítés (Supabase Auth)
- `/admin` – admin dashboard (külön belépés, admin szerepkör szükséges)
- `/utitervek`, `/rolunk`, `/kapcsolat` – információs oldalak

## API route-ok (szerveroldal)

- `GET/POST/PATCH/DELETE /api/garage` – felhasználó mentett autói
- `GET/POST/DELETE /api/checks` – kompatibilitási jegyzőkönyvek
- `GET/POST /api/favorites` – kedvenc alkatrészek
- `POST/DELETE /api/search-history` – keresési/ellenőrzési napló
- `GET/PATCH /api/me` – profil
- `GET /api/admin/stats`, `GET /api/admin/users` – admin statisztikák és felhasználók
- `GET/POST/PATCH/DELETE /api/admin/parts` – alkatrész-kezelés (admin)
- `POST /api/admin/import` – tömeges import CSV/JSON-ból (admin)

## Későbbi bővítés

- AI alkatrész-felismerés képből, VIN-alapú kompatibilitás, 3D autó
  konfigurátor, tuning kompatibilitás (lásd `/utitervek`).
- Külső alkatrész-adatforrások integrációja a meglévő `parts` / `fitments`
  sémára.

A részletes fejlesztői jegyzeteket lásd: `AGENTS.md`.
