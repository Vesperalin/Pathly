<conversation_summary>
<decisions>
Dedykowany schemat bazy danych: Wszystkie tabele aplikacji zostaną umieszczone w dedykowanym schemacie pathly, aby oddzielić je od schematów systemowych Supabase (np. auth).
Automatyzacja tworzenia katalogów: Użycie funkcji i triggera PostgreSQL na tabeli auth.users do automatycznego tworzenia czterech predefiniowanych, nieusuwalnych katalogów dla każdego nowego użytkownika.
Relacje wiele-do-wielu: Zaimplementowanie relacji wiele-do-wielu za pomocą tabel łączących dla:
routes i catalogs (tabela route_catalogs).
routes i mountain_groups (tabela route_mountain_groups).
Przechowywanie danych GPX: Przechowywane będą tylko sparsowane dane (data, dystans, przewyższenia, czas trwania) w dedykowanych kolumnach, a nie surowe pliki GPX. Logika agregacji danych z wielu plików GPX leży po stronie aplikacji.
Lista grup górskich: Tabela mountain_groups będzie zawierać predefiniowaną, "seedowaną" listę pasm górskich z kolumnami id, name (unikalne) i symbol (VARCHAR(40), unikalne).
Bezpieczeństwo na poziomie wiersza (RLS): Polityki RLS zostaną wdrożone na wszystkich tabelach zawierających dane użytkownika, aby zapewnić dostęp (SELECT, INSERT, UPDATE, DELETE) tylko do własnych zasobów. Dostęp do mountain_groups będzie ograniczony do odczytu (SELECT) dla wszystkich uwierzytelnionych użytkowników.
Typy danych:
got_points: SMALLINT z CHECK (got_points >= 0).
distance: NUMERIC(7, 2).
total_ascent, total_descent: NUMERIC(6, 2).
duration: INTEGER (przechowujący liczbę sekund).
notes: TEXT (dopuszczający NULL).
route_date: DATE z ograniczeniem NOT NULL.
Usuwanie danych użytkownika: Ustawienie ON DELETE CASCADE na wszystkich kluczach obcych user_id, aby zapewnić trwałe usunięcie wszystkich danych użytkownika (w tym profili, katalogów i tras) po usunięciu jego konta.
Unikalność nazw:
Nazwy katalogów tworzonych przez użytkownika będą unikalne w obrębie jego konta, zaimplementowane za pomocą częściowego indeksu unikalnego (partial unique index).
Nazwy tras będą unikalne w obrębie konta użytkownika, zaimplementowane za pomocą ograniczenia UNIQUE na (user_id, name).
Tabela profiles: Utworzenie tabeli profiles z relacją 1-do-1 z auth.users do przechowywania preferencji: language (ENUM 'pl'/'en', domyślnie 'pl') i theme (ENUM 'light'/'dark'/'system', domyślnie 'system'). Trigger utworzy profil dla nowego użytkownika.
Internacjonalizacja (i18n): Tłumaczenia (np. opisów predefiniowanych katalogów) będą zarządzane w całości po stronie aplikacji frontendowej, w oparciu o preferencje językowe użytkownika zapisane w jego profilu.
</decisions>
<matched_recommendations>
Zalecenie użycia triggera PostgreSQL do automatyzacji tworzenia zasobów (predefiniowane katalogi, profil użytkownika) dla nowych użytkowników zostało w pełni zaakceptowane.
Zalecenie użycia tabel łączących do implementacji relacji wiele-do-wielu zostało zaakceptowane.
Zalecenie wdrożenia kompleksowych polityk RLS w celu zapewnienia izolacji danych użytkowników zostało zaakceptowane.
Zalecenie użycia specyficznych typów danych (NUMERIC, SMALLINT, INTEGER dla sekund) w celu zapewnienia integralności i precyzji danych zostało zaakceptowane.
Zalecenie użycia ON DELETE CASCADE w celu zapewnienia zgodności z "prawem do bycia zapomnianym" i automatyzacji czyszczenia danych zostało zaakceptowane.
Zalecenie dotyczące użycia częściowego indeksu unikalnego (partial unique index) do egzekwowania unikalności nazw katalogów tylko dla tych stworzonych przez użytkownika zostało zaakceptowane.
Zalecenie utworzenia dedykowanej tabeli profiles do przechowywania preferencji użytkownika, zgodnie ze standardową praktyką w Supabase, zostało zaakceptowane.
Zalecenie utworzenia dedykowanego schematu pathly w celu lepszej organizacji i zarządzania bazą danych zostało zaakceptowane.
</matched_recommendations>
<database_planning_summary>
Główne wymagania dotyczące schematu bazy danych
Schemat bazy danych został zaprojektowany w celu wsparcia kluczowych funkcji aplikacji Pathly MVP. Główne założenia to: system uwierzytelniania oparty na Supabase, pełna izolacja danych pomiędzy użytkownikami, obsługa predefiniowanych i tworzonych przez użytkownika katalogów, oraz elastyczne przypisywanie tras do katalogów i grup górskich. Wszystkie tabele aplikacji będą znajdować się w dedykowanym schemacie pathly.
Kluczowe encje i ich relacje
profiles: Przechowuje dane profilowe użytkownika. Relacja 1-do-1 z auth.users. Zawiera preferencje language i theme.
catalogs: Przechowuje katalogi tras. Każdy katalog należy do jednego użytkownika. Zawiera flagę is_predefined do rozróżniania katalogów domyślnych od tych stworzonych przez użytkownika.
routes: Główna encja przechowująca szczegóły przebytych tras, w tym sparsowane dane z plików GPX. Każda trasa należy do jednego użytkownika.
mountain_groups: Tabela słownikowa z predefiniowaną listą pasm górskich i ich symboli. Jest to tabela publiczna do odczytu.
analytics_events: Tabela do zbierania anonimowych metryk dotyczących kluczowych akcji użytkowników.
Tabele łączące:
route_catalogs: Implementuje relację wiele-do-wielu pomiędzy routes i catalogs.
route_mountain_groups: Implementuje relację wiele-do-wielu pomiędzy routes i mountain_groups.
Ważne kwestie dotyczące bezpieczeństwa i skalowalności
Bezpieczeństwo: Podstawą bezpieczeństwa są polityki RLS (Row-Level Security) na wszystkich tabelach z danymi użytkowników, co gwarantuje, że użytkownicy mają dostęp wyłącznie do swoich danych. Dostęp do tabeli mountain_groups jest publiczny, ale ograniczony tylko do odczytu. Operacje UPDATE i DELETE na predefiniowanych katalogach są zablokowane na poziomie RLS.
Skalowalność i wydajność: W celu zapewnienia wydajności zapytań, zostaną utworzone indeksy na wszystkich kolumnach kluczy obcych (user_id, route_id, catalog_id itp.) oraz złożone indeksy unikalne dla nazw tras i katalogów w obrębie konta użytkownika. Przechowywanie sparsowanych, gotowych do użycia danych w tabeli routes upraszcza zapytania i unika kosztownego przetwarzania plików GPX w locie.
</database_planning_summary>
<unresolved_issues>
Wszystkie kluczowe kwestie związane z projektem schematu bazy danych dla MVP zostały omówione i rozstrzygnięte. Na tym etapie nie ma nierozwiązanych problemów.
</unresolved_issues>
</conversation_summary>
