# Ruokatinder 🌅

Pieni juhannuksen ruokasuunnittelusovellus kaveriperheille. Jokainen ruokakunta valitsee mitä tekee millekin aterialle — jos joku toinen valitsee saman, niin kokkaatte yhdessä ja ostoslista lasketaan tiimin kokoiseksi.

## Mitä sisältää

- **Sähköpostikirjautuminen** (magic link, ei salasanoja)
- **Ruokakunnan tiedot**: jäsenet ikineen, allergiat ja rajoitteet
- **6 ateriaa**: To illallinen, Pe lounas & päivällinen, La lounas & päivällinen, Su lounas
- **Pääruoat slotille**: jos useampi perhe valitsee saman → tiimi
- **Lisukepooli**: salaatit, lisukkeet, jälkkärit ilman kiinteää slottia
- **Aamiaiset**: jokainen ilmoittaa mitä tuo (hedelmiä, leipää, juustoa, leikkeleitä)
- **Yhteenveto**: tiimit, annoslaskenta, ehdotettu ostoslista jonka voi klikkaillen jakaa
- **Lähtölaskuri** keskiviikkoon klo 18:00 Suomen aikaa

## Pikastartti

### 1. Pura projekti

Pura `Ruokatinder.zip` haluamaasi paikkaan, esim. `C:\Users\algep\OneDrive\Työpöytä\Ruokatinder`.

### 2. Asenna riippuvuudet

PowerShellissä:

```powershell
cd C:\Users\algep\OneDrive\Työpöytä\Ruokatinder
npm install
```

### 3. Luo Supabase-projekti

1. Mene osoitteeseen <https://supabase.com> ja kirjaudu sisään
2. Klikkaa **New project**, anna nimeksi esim. `ruokatinder`, valitse sopiva alue (Frankfurt EU-länsi on lähin Suomesta)
3. Odota muutama minuutti kunnes projekti valmistuu
4. Kopioi **Project URL** ja **anon public key** kohdasta Settings → API

### 4. Aja schema ja seed

1. Avaa Supabase-projektissasi **SQL Editor**
2. Kopioi `supabase/schema.sql` sisältö ja klikkaa **Run**
3. Kopioi `supabase/seed.sql` sisältö ja klikkaa **Run**

### 5. Konfiguroi kirjautuminen

Authentication → URL Configuration:
- **Site URL**: paikalliseen kehitykseen `http://localhost:5173`, tuotantoon Netlify-osoite
- **Redirect URLs**: lisää sekä `http://localhost:5173/**` että lopullinen Netlify-osoite (esim. `https://ruokatinder.netlify.app/**`)

Authentication → Providers → Email: varmista että käytössä, ja että **Confirm email** on käytössä → magic linkit toimivat.

### 6. Aseta ympäristömuuttujat

Tee `.env`-tiedosto projektin juureen (kopioi `.env.example`):

```
VITE_SUPABASE_URL=https://xxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
```

### 7. Käynnistä paikallisesti

```powershell
npm run dev
```

Selaimessa: <http://localhost:5173>

## Tuotantoon Netlifyyn

1. Pushaa repo GitHubiin
2. Netlifyssä **New site → Import from Git** → valitse repo
3. Build-komennot lukevat automaattisesti `netlify.toml`-tiedostosta (npm run build → `dist`)
4. **Site settings → Environment variables**: lisää `VITE_SUPABASE_URL` ja `VITE_SUPABASE_ANON_KEY` samat kuin paikallisesti
5. Lisää Netlify-osoite Supabasen Redirect URL -listaan (kohta 5 yllä)
6. **Trigger deploy**

## Ruokalistan päivittäminen

Kaikki ruoat ovat Supabasen `dishes`-taulussa. Voit:

- **Lisätä ruokia**: Supabase Table Editorissa tai SQL-komennolla:
  ```sql
  insert into dishes (name, description, category, tags, recipe, suggested_ingredients, is_pool_item)
  values ('Uusi ruoka', 'kuvaus', 'paaruoka', '{"kasvis"}', 'resepti', '{"aines1","aines2"}', false);
  ```
- **Poistaa käytöstä** (tieto säilyy mutta ei näy valikossa):
  ```sql
  update dishes set is_active = false where name = 'Joku ruoka';
  ```

### `category` & `is_pool_item`
- `paaruoka` + `is_pool_item = false` → näkyy ateriapickerissä, sidotaan slotille
- `lisuke`, `salaatti`, `jalkkari` + `is_pool_item = true` → näkyy Lisukepoolissa
- Käytännössä: pääruoat = false, kaikki muut = true

### Deadlinen muuttaminen
```sql
update app_settings set value = '2026-06-17T18:00:00+03:00' where key = 'deadline_iso';
```

## Tiedostorakenne

```
Ruokatinder/
├── src/
│   ├── App.jsx              # Reititys + auth-gating
│   ├── main.jsx             # Vite-entry
│   ├── supabase.js          # Supabase-client
│   ├── styles.css           # Tailwind + custom
│   ├── components/
│   │   ├── Layout.jsx       # Header + navi
│   │   ├── Countdown.jsx    # Lähtölaskuri
│   │   ├── DishCard.jsx     # Ruokakortti
│   │   └── SummerBackground.jsx  # Koristeet (aurinko + lehdet)
│   ├── lib/
│   │   ├── deadline.js      # Aikalaskenta
│   │   └── portions.js      # Annoslaskenta iän mukaan
│   └── pages/
│       ├── Login.jsx        # Sähköpostikirjautuminen
│       ├── Onboarding.jsx   # Perheen rekisteröinti
│       ├── Dashboard.jsx    # Ateriaslotit yleisnäkymä
│       ├── MealPicker.jsx   # Pääruoan valinta slotille
│       ├── Pool.jsx         # Lisukepooli
│       ├── Breakfast.jsx    # Aamiaiset
│       ├── Summary.jsx      # Yhteenveto + ostoslistat
│       └── FamilyEdit.jsx   # Oman perheen muokkaus
├── supabase/
│   ├── schema.sql           # Tietokantarakenteet + RLS
│   └── seed.sql             # Ateriaslotit + 30+ ruokaa
├── public/favicon.svg
├── index.html
├── tailwind.config.js       # Suomen kesä -värit
├── postcss.config.js
├── vite.config.js
├── netlify.toml
├── package.json
└── .env.example
```

## Tärkeät designvalinnat

- **Pääruoka per slot**: sama pääruoka voi olla vain yhdessä slotissa. Jos joku jo valitsi, muut joko liittyvät tiimiin tai valitsevat muun.
- **Lisukkeet/salaatit/jälkkärit poolissa**: ei sidota slotille, valitset että "tuomme tämän", päivä on vain ehdotus.
- **Annoslaskenta**: aikuinen = 1, alle 13v = 0.75, alle 7v = 0.5, alle 3v = 0.2. Yhteenvedossa myös +15 % varmuusvara.
- **"Syömme mitä tarjolla on"** -valinta laskee ruokakunnan mukaan tiimien annosmäärään mutta ei sido ruokaan.

## Hyödylliset komennot

```powershell
npm run dev      # paikallinen kehityspalvelin
npm run build    # tuotantobuildi /dist-kansioon
npm run preview  # esikatsele tuotantobuildi paikallisesti
```

## Vianetsintä

**"Supabase-asetukset puuttuvat"** → tarkista `.env`-tiedosto

**Magic link ei tule** → tarkista Supabasen Authentication → Email Templates ja että Site URL + Redirect URLs ovat oikein

**RLS-virheet (`new row violates row-level security policy`)** → tarkista että käyttäjä on kirjautunut ja että `families`-rivillä on oikea `auth_user_id`

**"Cannot read properties of undefined"** → todennäköisesti seed ei ajettu loppuun. Aja `seed.sql` uudelleen.

Hyviä juhannusjuhlia! 🌅
