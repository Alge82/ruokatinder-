-- =====================================================================
-- Ruokatinder · Seed-data
-- Aja schema.sql ensin, sitten tämä.
-- Ruokalistaa voi täydentää ja muokata vapaasti.
-- =====================================================================

-- Ateriaslotit
insert into meal_slots (id, display_name, day, meal_type, sort_order) values
  ('thu_dinner', 'Torstai · Illallinen', 'thu', 'dinner', 1),
  ('fri_lunch',  'Perjantai · Lounas',  'fri', 'lunch',  2),
  ('fri_dinner', 'Perjantai · Päivällinen', 'fri', 'dinner', 3),
  ('sat_lunch',  'Lauantai · Lounas',   'sat', 'lunch',  4),
  ('sat_dinner', 'Lauantai · Päivällinen', 'sat', 'dinner', 5),
  ('sun_lunch',  'Sunnuntai · Lounas',  'sun', 'lunch',  6)
on conflict (id) do nothing;

-- =====================================================================
-- PÄÄRUOAT (slot-bound) - is_pool_item = false
-- =====================================================================

insert into dishes (name, description, category, tags, recipe, suggested_ingredients, is_pool_item) values

  ('Grillattu lohi sitruuna-tilliöljyllä',
   'Kokonainen lohifilee folion sisällä, sitruunaa ja tuoretta tilliä.',
   'paaruoka', '{"kala","gluteeniton","laktoositon"}',
   'Voitele lohi sitruunaöljyllä, mausta merisuolalla ja tillillä. Grilliin 180 °C n. 20 min.',
   '{"lohifilee","sitruuna","tilli","oliiviöljy","merisuola","mustapippuri"}', false),

  ('Klassinen grillimakkara ja sinappi',
   'HK Sininen tai Atria Wilhelm, vahva sinappi ja näkkileipä.',
   'paaruoka', '{}',
   'Grilliin keskilämmölle 8–10 min kunnes nahka rapeutuu.',
   '{"grillimakkara","sinappi","näkkileipä","suolakurkku"}', false),

  ('Sinappi-tillisilli ja keitetyt perunat',
   'Klassinen juhannuspöydän silli, kerma-sinappikastikkeessa.',
   'paaruoka', '{"kala","gluteeniton"}',
   'Sekoita sillit kerma-sinappikastikkeeseen, anna maustua tunti. Tarjoile keitettyjen perunoiden ja smetanan kera.',
   '{"sillifileet","kerma","sinappi","tilli","punasipuli","perunat"}', false),

  ('Klassiset lihapullat ja perunamuusi',
   'Kotitekoiset lihapullat, ruskea kastike, perunamuusi ja puolukkahillo.',
   'paaruoka', '{}',
   'Sekoita jauheliha, korppujauho, kananmuna, sipuli ja mausteet. Paista pannulla, tee kastike kermasta ja paistinliemestä.',
   '{"naudan jauheliha","sipuli","korppujauho","kananmuna","kerma","perunat","voi","puolukkahillo"}', false),

  ('Kanavartaat marinoituna',
   'Mehevät kanavartaat valkosipuli-jogurttimarinadissa.',
   'paaruoka', '{"gluteeniton"}',
   'Marinoi kanapaloja jogurtti-valkosipuli-sitruuna-mausteseoksessa min. 2 h. Pujota tikkuun paprikan kanssa, grillaa 12–15 min.',
   '{"broilerin paistileike","jogurtti","valkosipuli","sitruuna","paprika","oliiviöljy","savupaprika","grillitikut"}', false),

  ('Halloumi-vihannesvartaat',
   'Grillattu halloumi, kesäkurpitsa, paprika, sipuli — sitruunaöljyllä.',
   'paaruoka', '{"kasvis","gluteeniton"}',
   'Paloittele halloumi ja vihannekset, pujota vartaisiin. Voitele öljyllä, grillaa 8–10 min.',
   '{"halloumi","kesäkurpitsa","paprika","punasipuli","oliiviöljy","sitruuna","oregano","grillitikut"}', false),

  ('Pastaruoka kesäisesti',
   'Tagliatellea, kirsikkatomaattia, basilikaa, parmesaania.',
   'paaruoka', '{"kasvis"}',
   'Paista kirsikkatomaatit, valkosipuli ja chili oliiviöljyssä. Sekoita keitetyn pastan kanssa, viimeistele basilikalla ja parmesaanilla.',
   '{"tagliatelle","kirsikkatomaatti","valkosipuli","basilika","parmesaani","oliiviöljy","chili"}', false),

  ('Hampurilaiset (Beyond / 17 % nauta)',
   'Briossisämpylä, rucola, kypsä tomaatti, cheddar, savumajoneesi.',
   'paaruoka', '{}',
   'Muotoile pihvit, mausta vain suolalla ja pippurilla. Grillaa 3–4 min/puoli. Lämmitä sämpylät grillillä. Kokoa rucolan ja kastikkeen kanssa.',
   '{"naudan jauheliha 17 %","Beyond-pihvi","briossisämpylä","cheddar","rucola","tomaatti","punasipuli","savumajoneesi","suolakurkku"}', false),

  ('Chimichurri-paahtopaisti',
   'Hitaasti grillattu naudan paahtopaisti, tuore chimichurri-kastike.',
   'paaruoka', '{"gluteeniton","laktoositon"}',
   'Mausta liha suolalla ja pippurilla, grillaa epäsuoralla lämmöllä 55 °C sisälämpötilaan. Anna levätä 15 min. Tarjoile chimichurrin kera.',
   '{"naudan paahtopaisti","persilja","oregano","valkosipuli","punaviinietikka","oliiviöljy","chili","merisuola"}', false),

  ('Pulled pork briossi-leivissä',
   'Hitaasti haudutettu kassler, BBQ-kastike, etikkacoleslaw.',
   'paaruoka', '{}',
   'Mausta kassler kuivamarinadilla, hauduta 130 °C uunissa 6–8 h. Revi haarukoilla, sekoita kastikkeeseen. Tarjoile sämpylöissä coleslawin kera.',
   '{"possun kassler","BBQ-kastike","briossisämpylä","valkokaali","porkkana","majoneesi","valkoviinietikka"}', false),

  ('Sienipasta (kantarelli / herkkutatti)',
   'Tagliatellea kerma-sieni-kastikkeessa, ripaus timjamia.',
   'paaruoka', '{"kasvis"}',
   'Paista sienet voissa, lisää sipuli, valkoviini ja kerma. Sekoita pastan kanssa, viimeistele timjamilla ja parmesaanilla.',
   '{"kantarelli","tagliatelle","voi","kerma","valkoviini","timjami","parmesaani","salottisipuli"}', false),

  ('Risotto ai funghi',
   'Klassinen sienirisotto, parmesaani ja persilja.',
   'paaruoka', '{"kasvis","gluteeniton"}',
   'Paista sipuli ja sienet voissa, lisää risottoriisi, valkoviini ja vähitellen kuumaa lientä. Viimeistele voilla ja parmesaanilla.',
   '{"risottoriisi","kantarelli","valkoviini","kasvisliemi","voi","parmesaani","salottisipuli","persilja"}', false),

  ('Lohitartar ja paahtoleipä',
   'Raaka lohi, kapris, salottisipuli, dijon, sitruuna — paahdetun leivän päällä.',
   'paaruoka', '{"kala"}',
   'Pilko lohi terävällä veitsellä, sekoita kapriksen, sipulin, dijonin ja sitruunamehun kanssa. Tarjoile heti paahtoleivän päällä.',
   '{"raakalaatuinen lohi","kapris","salottisipuli","dijon-sinappi","sitruuna","oliiviöljy","ruisleipä"}', false),

  ('Lammasta yrttipanssarissa',
   'Karitsan kare yrtti-leipäkuorrutuksessa, ratatouille.',
   'paaruoka', '{}',
   'Ruskista kare pannulla. Levitä yrttitahna ja leipämurupäällyste. Uuniin 200 °C 15 min keskimedium-kypsyyteen.',
   '{"karitsan kare","persilja","timjami","valkosipuli","dijon","leipämuru","oliiviöljy"}', false),

  ('Lohikeitto',
   'Pohjoismainen klassikko: lohi, peruna, porkkana, tilli, kerma.',
   'paaruoka', '{"kala","gluteeniton"}',
   'Kuullota sipuli ja porkkana, lisää liemi ja peruna. Kun peruna on kypsää, lisää lohikuutiot ja kerma. Mausta tillillä.',
   '{"lohifilee","peruna","porkkana","sipuli","kalaliemi","kerma","tilli","valkopippuri"}', false),

  ('Vegaaniburgeri (sieni-papu-pihvi)',
   'Itse tehty sieni-musta papu -pihvi, briossisämpylä, rucola.',
   'paaruoka', '{"kasvis","vegaani"}',
   'Soseuta mustat pavut, paahdetut sienet, valkosipuli ja mausteet. Muotoile pihveiksi, paista pannulla 3 min/puoli.',
   '{"mustat pavut","herkkusieni","valkosipuli","kaurahiutale","savupaprika","briossi","rucola","vegaanimajoneesi"}', false),

  ('Tofu-bowl miso-glaseerauksella',
   'Paahdetut tofukuutiot, riisi, edamame, avokado, miso-vinegretti.',
   'paaruoka', '{"kasvis","vegaani"}',
   'Paista marinoitu tofu uunissa rapeaksi. Tarjoile riisin, vihannesten ja miso-vinegretin kera.',
   '{"kiinteä tofu","jasmiiniriisi","edamame","avokado","miso","seesamiöljy","soija","lime"}', false),

-- =====================================================================
-- LISUKE-POOLI (is_pool_item = true)
-- Salaatit, lisukkeet, jälkkärit — eivät sidottu slotille,
-- vaan tuodaan viikonlopuksi ja syödään kun sopii.
-- =====================================================================

  -- Lisukkeet / grillattavat vihannekset
  ('Uudet perunat tillivoilla',
   'Pienet uudet perunat, voi, tilli, ripaus merisuolaa.',
   'lisuke', '{"kasvis","gluteeniton"}',
   'Keitä perunat kuorineen 15–20 min, valuta, lisää voi ja silputtu tilli.',
   '{"uudet perunat","voi","tilli","merisuola"}', true),

  ('Karjalanpiirakat ja munavoi',
   'Lämmitetyt karjalanpiirakat ja tuore munavoi.',
   'lisuke', '{"kasvis"}',
   'Lämmitä piirakat 200 °C uunissa 5 min. Murskaa keitetyt kananmunat, sekoita pehmeään voihin.',
   '{"karjalanpiirakat","kananmuna","voi","merisuola"}', true),

  ('Grillattu maissi',
   'Maissintähkät grillattuna, voi-yrttisivelyllä.',
   'lisuke', '{"kasvis","gluteeniton"}',
   'Keitä maissintähkät 5 min, voitele yrttivoilla. Grilliin 8–10 min kunnes saavat väriä.',
   '{"maissintähkä","voi","persilja","valkosipuli","merisuola"}', true),

  ('Grillatut herkkusienet',
   'Kokonaisia herkkusieniä valkosipulivoilla.',
   'lisuke', '{"kasvis","gluteeniton"}',
   'Pyyhi sienet, pujota vartaisiin tai grilliritilälle. Voitele valkosipulivoilla, grillaa 6–8 min.',
   '{"herkkusieni","voi","valkosipuli","persilja","merisuola"}', true),

  ('Grillitomaatit',
   'Puolitettuja tomaatteja grillistä, balsamicolla.',
   'lisuke', '{"kasvis","vegaani","gluteeniton"}',
   'Halkaise tomaatit, voitele oliiviöljyllä. Grilliin leikkauspinta alaspäin 3–4 min. Pisaroi balsamicoa.',
   '{"isot tomaatit","oliiviöljy","balsamico","merisuola","basilika"}', true),

  ('Grillattu varhaiskaali',
   'Varhaiskaalilohkot grillattuna, sitruunaa ja parmesaania.',
   'lisuke', '{"kasvis","gluteeniton"}',
   'Lohko varhaiskaali, voitele öljyllä ja mausta. Grilliin 5–7 min/puoli. Päälle raastettu parmesaani ja sitruunamehua.',
   '{"varhaiskaali","oliiviöljy","sitruuna","parmesaani","merisuola","mustapippuri"}', true),

  ('Grillatut kirsikkatomaatit vartaassa',
   'Kirsikkatomaatteja vartaassa, oliiviöljyä ja oreganoa.',
   'lisuke', '{"kasvis","vegaani","gluteeniton"}',
   'Pujota kirsikkatomaatit vartaaseen, voitele öljyllä. Grilliin 3–4 min kunnes alkavat halkeilla.',
   '{"kirsikkatomaatti","oliiviöljy","oregano","merisuola","grillitikut"}', true),

  ('Grillatut kesävihannekset (sekoitus)',
   'Kesäkurpitsa, munakoiso, paprika, punasipuli.',
   'lisuke', '{"kasvis","vegaani","gluteeniton"}',
   'Viipaloi vihannekset, voitele öljyllä ja mausta. Grillaa kunnes pehmenneet ja saavat väriä.',
   '{"kesäkurpitsa","munakoiso","paprika","punasipuli","oliiviöljy","balsamico"}', true),

  -- Salaatit
  ('Minttu-vesimeloni-feta-salaatti',
   'Raikas kesäklassikko: kylmä vesimeloni, feta, tuore minttu, lime.',
   'salaatti', '{"kasvis","gluteeniton"}',
   'Kuutioi vesimeloni, lisää murustettu feta, tuore minttu, hieman oliiviöljyä ja limen mehua.',
   '{"vesimeloni","feta","minttu","lime","oliiviöljy"}', true),

  ('Perunasalaatti (sitruuna-yrtti)',
   'Modernisoitu versio: uudet perunat, sitruunavinegretti, tuoreet yrtit.',
   'salaatti', '{"kasvis","vegaani","gluteeniton"}',
   'Keitä perunat, lohko vielä lämpiminä. Sekoita sitruunamehun, oliiviöljyn, dijon-sinapin, tuoreyrttien ja salottisipulin kanssa.',
   '{"uudet perunat","sitruuna","dijon","oliiviöljy","salottisipuli","persilja","ruohosipuli"}', true),

  ('Smashed cucumber -salaatti',
   'Kurkku murskattuna, soija-seesami-kastike, chili ja seesaminsiemenet.',
   'salaatti', '{"kasvis","vegaani"}',
   'Murskaa kurkut veitsen lappeella, paloittele. Sekoita soijan, riisiviinietikan, seesamiöljyn, valkosipulin ja chilin kanssa.',
   '{"kurkku","soijakastike","riisiviinietikka","seesamiöljy","valkosipuli","chili","seesaminsiemen"}', true),

  ('Coleslaw (etikka-pohja)',
   'Raikas kaalisalaatti — ei mössöä, vaan rapsakka.',
   'salaatti', '{"kasvis","gluteeniton"}',
   'Suikaloi valkokaali ja porkkana hienoksi. Sekoita majoneesin, valkoviinietikan, sokerin ja sinapin kanssa. Anna levätä 30 min.',
   '{"valkokaali","porkkana","majoneesi","valkoviinietikka","dijon","sokeri"}', true),

  ('Rucola-parmesaani-salaatti',
   'Yksinkertainen, mutta elegantti: rucola, parmesaani, sitruuna, oliiviöljy.',
   'salaatti', '{"kasvis","gluteeniton"}',
   'Yhdistä rucola, lastutettu parmesaani, sitruunamehu, oliiviöljy ja merisuola.',
   '{"rucola","parmesaani","sitruuna","oliiviöljy","merisuola"}', true),

  ('Caprese (tomaatti-mozzarella-basilika)',
   'Italialainen klassikko, kypsät tomaatit ja buffalo-mozzarella.',
   'salaatti', '{"kasvis","gluteeniton"}',
   'Viipaloi tomaatit ja mozzarella, kerro vuorotellen. Lisää basilika, oliiviöljy, merisuola ja pippuri.',
   '{"tomaatti","buffalo-mozzarella","basilika","oliiviöljy","merisuola"}', true),

  -- Jälkkärit
  ('Mansikat ja kerma',
   'Klassinen juhannusjälkkäri. Ei mitään muuta tarvita.',
   'jalkkari', '{"kasvis","gluteeniton"}',
   'Pese ja paloittele mansikat. Vatkaa kerma kuohkeaksi. Tarjoile.',
   '{"mansikat","kuohukerma","tomusokeri"}', true),

  ('Mansikkakakku',
   'Kerroskakku: tuore mansikka, vaahdotettu kerma, vaalea pohja.',
   'jalkkari', '{"kasvis"}',
   'Leikkaa pohja, kostuta sokerivedellä. Levitä kermaa ja mansikoita kerroksittain. Päälle koristelu.',
   '{"sokerikakkupohja","mansikat","kuohukerma","tomusokeri","vaniljasokeri"}', true),

  ('Pannukakku ja mansikkahillo',
   'Pellillinen uunipannukakkua, mansikkahilloa ja kermavaahtoa.',
   'jalkkari', '{"kasvis"}',
   'Sekoita taikina (maito, jauho, kananmuna, sokeri). Paista 225 °C n. 25 min. Tarjoile hillon ja kerman kera.',
   '{"maito","vehnäjauho","kananmuna","sokeri","voi","mansikkahillo","kuohukerma"}', true),

  ('Vanilja-jäätelö ja paistetut kesämarjat',
   'Lämmin marjasekoitus jäätelön päällä.',
   'jalkkari', '{"kasvis","gluteeniton"}',
   'Kuumenna marjoja pannulla sokerin kanssa kunnes mehustuvat. Kaada vanilja-jäätelön päälle.',
   '{"vanilja-jäätelö","mansikka","mustikka","vadelma","sokeri","sitruuna"}', true)

on conflict do nothing;
