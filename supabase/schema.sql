-- =====================================================================
-- Ruokatinder · Supabase schema
-- Aja tämä Supabase SQL Editorissa kerran projektin alustamiseksi.
-- =====================================================================

-- Perheet (käyttäjä = ruokakunta)
create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade unique,
  name text not null,
  email text not null,
  created_at timestamptz default now()
);

-- Ruokakunnan jäsenet (annoslaskentaan)
create table if not exists household_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  name text,
  age int not null check (age >= 0 and age <= 120),
  created_at timestamptz default now()
);

-- Allergiat / rajoitteet
create table if not exists family_allergens (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  allergen text not null,
  created_at timestamptz default now()
);

-- Aterioiden slotit (kiinteät)
create table if not exists meal_slots (
  id text primary key,
  display_name text not null,
  day text not null,         -- 'thu', 'fri', 'sat', 'sun'
  meal_type text not null,   -- 'lunch', 'dinner'
  sort_order int not null
);

-- Ruokakatalogi
create table if not exists dishes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,             -- 'paaruoka', 'salaatti', 'lisuke', 'jalkkari'
  tags text[] default '{}',  -- esim. {'kasvis','gluteeniton','laktoositon'}
  recipe text,               -- linkki tai lyhyt resepti
  suggested_ingredients text[] default '{}',
  -- true = ei sidota slotille, n\u00e4kyy lisuke-poolissa (lisukkeet, salaatit, j\u00e4lkk\u00e4rit)
  is_pool_item boolean default false,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Perheen valinta per ateria
create table if not exists dish_selections (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  meal_slot_id text not null references meal_slots(id),
  dish_id uuid references dishes(id),
  is_flexible boolean default false,   -- "syön mitä tarjolla on"
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(family_id, meal_slot_id)
);

-- Aamiaiskontribuutiot
create table if not exists breakfast_contributions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  day text not null,             -- 'fri','sat','sun'
  category text not null,        -- 'hedelma','leipa','juusto','leikkele','muu'
  item_name text not null,
  note text,
  created_at timestamptz default now()
);

-- Lisukepooli: kuka tuo mit\u00e4kin viikonlopuksi (salaatit, lisukkeet, j\u00e4lkk\u00e4rit)
-- Ei sidota tietylle slotille - p\u00e4iv\u00e4ehdotus vapaaehtoinen
create table if not exists pool_contributions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  dish_id uuid not null references dishes(id) on delete cascade,
  preferred_slot_id text references meal_slots(id), -- vapaaehtoinen vihje
  quantity_note text,
  created_at timestamptz default now(),
  unique(family_id, dish_id)
);

-- Ostoslistan claimit (kuka tuo mitäkin matchin sisällä)
create table if not exists shopping_claims (
  id uuid primary key default gen_random_uuid(),
  meal_slot_id text not null references meal_slots(id),
  dish_id uuid references dishes(id),
  item_name text not null,
  quantity_note text,
  claimed_by uuid references families(id) on delete set null,
  -- false = tuo vain omalle perheelle, true = tuo kaikille (tiimille)
  for_all boolean default false,
  created_at timestamptz default now()
);

-- Globaali asetus: deadline yms.
create table if not exists app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

insert into app_settings (key, value) values
  ('deadline_iso', '2026-06-17T18:00:00+03:00'),
  ('event_title', 'Juhannus 2026')
on conflict (key) do nothing;

-- =====================================================================
-- Row Level Security
-- Pieni kaveriporukka → jokainen autentikoitu näkee kaiken,
-- mutta voi muokata vain omaa perhettään.
-- =====================================================================

alter table families enable row level security;
alter table household_members enable row level security;
alter table family_allergens enable row level security;
alter table dish_selections enable row level security;
alter table breakfast_contributions enable row level security;
alter table pool_contributions enable row level security;
alter table shopping_claims enable row level security;
alter table dishes enable row level security;
alter table meal_slots enable row level security;
alter table app_settings enable row level security;

-- Kaikki autentikoidut voivat lukea katalogin
create policy "auth read meal_slots" on meal_slots for select to authenticated using (true);
create policy "auth read dishes" on dishes for select to authenticated using (true);
create policy "auth read settings" on app_settings for select to authenticated using (true);

-- Perheet: kaikki näkevät, vain oma muokattavissa
create policy "auth read families" on families for select to authenticated using (true);
create policy "insert own family" on families for insert to authenticated with check (auth_user_id = auth.uid());
create policy "update own family" on families for update to authenticated using (auth_user_id = auth.uid());
create policy "delete own family" on families for delete to authenticated using (auth_user_id = auth.uid());

-- Yleinen helpperi: kuuluuko rivin family_id kirjautuneelle käyttäjälle?
create or replace function public.family_belongs_to_user(fid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from families
    where id = fid and auth_user_id = auth.uid()
  );
$$;

-- Household members
create policy "auth read members" on household_members for select to authenticated using (true);
create policy "insert own members" on household_members for insert to authenticated with check (family_belongs_to_user(family_id));
create policy "update own members" on household_members for update to authenticated using (family_belongs_to_user(family_id));
create policy "delete own members" on household_members for delete to authenticated using (family_belongs_to_user(family_id));

-- Allergens
create policy "auth read allergens" on family_allergens for select to authenticated using (true);
create policy "insert own allergens" on family_allergens for insert to authenticated with check (family_belongs_to_user(family_id));
create policy "update own allergens" on family_allergens for update to authenticated using (family_belongs_to_user(family_id));
create policy "delete own allergens" on family_allergens for delete to authenticated using (family_belongs_to_user(family_id));

-- Dish selections
create policy "auth read selections" on dish_selections for select to authenticated using (true);
create policy "insert own selection" on dish_selections for insert to authenticated with check (family_belongs_to_user(family_id));
create policy "update own selection" on dish_selections for update to authenticated using (family_belongs_to_user(family_id));
create policy "delete own selection" on dish_selections for delete to authenticated using (family_belongs_to_user(family_id));

-- Breakfast contributions
create policy "auth read breakfast" on breakfast_contributions for select to authenticated using (true);
create policy "insert own breakfast" on breakfast_contributions for insert to authenticated with check (family_belongs_to_user(family_id));
create policy "update own breakfast" on breakfast_contributions for update to authenticated using (family_belongs_to_user(family_id));
create policy "delete own breakfast" on breakfast_contributions for delete to authenticated using (family_belongs_to_user(family_id));

-- Pool contributions (lisukkeet/salaatit/j\u00e4lkk\u00e4rit)
create policy "auth read pool" on pool_contributions for select to authenticated using (true);
create policy "insert own pool" on pool_contributions for insert to authenticated with check (family_belongs_to_user(family_id));
create policy "update own pool" on pool_contributions for update to authenticated using (family_belongs_to_user(family_id));
create policy "delete own pool" on pool_contributions for delete to authenticated using (family_belongs_to_user(family_id));

-- Shopping claims: kuka tahansa autentikoitu voi luoda/claimata
create policy "auth read claims" on shopping_claims for select to authenticated using (true);
create policy "auth insert claims" on shopping_claims for insert to authenticated with check (true);
create policy "auth update claims" on shopping_claims for update to authenticated using (true);
create policy "auth delete claims" on shopping_claims for delete to authenticated using (true);
