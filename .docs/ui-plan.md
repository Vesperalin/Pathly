# Architektura UI dla Pathly

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) aplikacji Pathly została zaprojektowana w oparciu o nowoczesny stos technologiczny, obejmujący Next.js 15 (App Router), React 19 i TypeScript 5. Głównym celem jest stworzenie responsywnej, intuicyjnej i wydajnej Progresywnej Aplikacji Webowej (PWA), która wspiera turystów górskich w zarządzaniu ich trasami i postępami w zdobywaniu odznak GOT PTTK.

Struktura opiera się na modularnym podejściu, z wyraźnym podziałem na widoki (strony), komponenty reużywalne. Nawigacja jest scentralizowana w stałym panelu bocznym na urządzeniach desktopowych i ukrytym menu na urządzeniach mobilnych, zapewniając spójne doświadczenie użytkownika. Do zarządzania danymi serwerowymi wykorzystana zostanie biblioteka SWR, co zapewni optymalizację zapytań i aktualność danych, podczas gdy prosty stan kliencki będzie obsługiwany przez React Context API. Duży nacisk kładziony jest na User Experience (UX) poprzez zastosowanie szkieletów ładowania, stanów pustych oraz optymistycznych aktualizacji interfejsu.

## 2. Lista widoków

### Widoki publiczne (przed zalogowaniem)

- **Nazwa widoku:** Strona logowania
- **Ścieżka widoku:** `/login`
- **Główny cel:** Uwierzytelnienie istniejącego użytkownika.
- **Kluczowe informacje do wyświetlenia:** Formularz z polami na e-mail i hasło.
- **Kluczowe komponenty widoku:** `LoginForm`, `Input`, `Button`, Link do rejestracji.
- **UX, dostępność i względy bezpieczeństwa:** Komunikaty o błędach walidacji wyświetlane przy polach. Pełna obsługa nawigacji klawiaturą. Przełącznik widoczności hasła.

- **Nazwa widoku:** Strona rejestracji
- **Ścieżka widoku:** `/register`
- **Główny cel:** Umożliwienie nowym użytkownikom założenia konta.
- **Kluczowe informacje do wyświetlenia:** Formularz z polami na e-mail, hasło i potwierdzenie hasła.
- **Kluczowe komponenty widoku:** `RegisterForm`, `Input`, `Button`, Link do logowania.
- **UX, dostępność i względy bezpieczeństwa:** Walidacja siły hasła po stronie klienta. Jasne wskazówki dotyczące wymagań dla hasła.

### Widoki prywatne (po zalogowaniu)

- **Nazwa widoku:** Pulpit (Dashboard)
- **Ścieżka widoku:** `/dashboard`
- **Główny cel:** Główny ekran po zalogowaniu, prezentujący przegląd katalogów użytkownika i zapewniający szybki dostęp do głównych akcji.
- **Kluczowe informacje do wyświetlenia:** Lista katalogów predefiniowanych (GOT) z sumą punktów. Lista katalogów stworzonych przez użytkownika. Główne przyciski akcji: "Dodaj nową trasę" i "Dodaj nowy katalog".
- **Kluczowe komponenty widoku:** `CatalogList`, `CatalogListItem` (z opcjami edycji/usunięcia dla katalogów własnych), `Button`, `EmptyState` (gdy brak katalogów użytkownika), `Skeleton` (ładowanie), `Dialog` (do dodawania/edycji katalogu).
- **UX, dostępność i względy bezpieczeństwa:** Wyraźne rozróżnienie wizualne między typami katalogów. Interaktywne elementy są łatwo dostępne.

- **Nazwa widoku:** Szczegóły katalogu
- **Ścieżka widoku:** `/catalogs/{catalogId}`
- **Główny cel:** Wyświetlenie szczegółowych informacji o katalogu oraz listy tras do niego przypisanych.
- **Kluczowe informacje do wyświetlenia:** Nazwa katalogu, suma punktów (dla predefiniowanych), skrócone zasady (dla predefiniowanych). Lista tras z paginacją "infinite scroll".
- **Kluczowe komponenty widoku:** `RouteList`, `RouteListItem`, `InfiniteScroll`, `EmptyState` (gdy brak tras), `Skeleton`, `Button` (opcja edycji dla katalogów własnych).
- **UX, dostępność i względy bezpieczeństwa:** Płynne doładowywanie tras podczas przewijania. Możliwość edycji/usunięcia katalogu (dla własnych) z tego widoku.

- **Nazwa widoku:** Wszystkie trasy
- **Ścieżka widoku:** `/routes`
- **Główny cel:** Zapewnienie centralnego miejsca do przeglądania, wyszukiwania i filtrowania wszystkich tras użytkownika.
- **Kluczowe informacje do wyświetlenia:** Lista wszystkich tras z możliwością wyszukiwania po nazwie i filtrowania.
- **Kluczowe komponenty widoku:** `SearchBar`, `FilterControls`, `PaginatedRouteList`.
- **UX, dostępność i względy bezpieczeństwa:** Responsywna tabela z trasami, która na urządzeniach mobilnych zmienia się w listę kart.

- **Nazwa widoku:** Szczegóły trasy
- **Ścieżka widoku:** `/routes/{routeId}`
- **Główny cel:** Prezentacja wszystkich zgromadzonych danych o pojedynczej trasie.
- **Kluczowe informacje do wyświetlenia:** Pełne dane trasy (nazwa, data, punkty, notatki), dane z GPX (dystans, przewyższenia, czas), przypisane grupy górskie i katalogi.
- **Kluczowe komponenty widoku:** `RouteDetails`, `ActionButtons` (Edytuj, Usuń), `Badge` (dla grup górskich).
- **UX, dostępność i względy bezpieczeństwa:** Czytelna prezentacja danych. Przycisk usunięcia otwiera modal z prośbą o potwierdzenie.

- **Nazwa widoku:** Dodawanie nowej trasy
- **Ścieżka widoku:** `/routes/new`
- **Główny cel:** Przeprowadzenie użytkownika przez proces dodawania nowej trasy na podstawie pliku GPX.
- **Kluczowe informacje do wyświetlenia:** Formularz jednoetapowy: 1. Przesłanie pliku(ów) GPX. 2. Uzupełnienie danych manualnych (nazwa, punkty) i przypisanie do katalogów.
- **Kluczowe komponenty widoku:** `FileUploader`, `RouteForm`, `MultiSelect` (dla katalogów/grup górskich).
- **UX, dostępność i względy bezpieczeństwa:** Natychmiastowa informacja zwrotna po przetworzeniu pliku GPX. Pola formularza są automatycznie wypełniane danymi z GPX (tylko do odczytu). Walidacja w czasie rzeczywistym.

- **Nazwa widoku:** Edycja trasy
- **Ścieżka widoku:** `/routes/{routeId}/edit`
- **Główny cel:** Umożliwienie modyfikacji danych trasy, które zostały wprowadzone ręcznie.
- **Kluczowe informacje do wyświetlenia:** Formularz wypełniony istniejącymi danymi trasy.
- **Kluczowe komponenty widoku:** `RouteForm` (w trybie edycji).
- **UX, dostępność i względy bezpieczeństwa:** Dane pochodzące z pliku GPX są wyraźnie oznaczone jako niemodyfikowalne.

- **Nazwa widoku:** Ustawienia
- **Ścieżka widoku:** `/settings`
- **Główny cel:** Centralne miejsce do zarządzania preferencjami aplikacji i bezpieczeństwem konta.
- **Kluczowe informacje do wyświetlenia:** Opcje zmiany języka, motywu graficznego, formularz zmiany hasła, opcja usunięcia konta.
- **Kluczowe komponenty widoku:** `LanguageSwitcher`, `ThemeSwitcher`, `ChangePasswordForm`, `AlertDialog` (do potwierdzenia usunięcia konta).
- **UX, dostępność i względy bezpieczeństwa:** Zmiany preferencji są stosowane natychmiast. Akcje destrukcyjne (usunięcie konta) wymagają dodatkowego potwierdzenia hasłem w celu zabezpieczenia przed przypadkowym działaniem.

- **Nazwa widoku:** Modal dodawania/edycji katalogu
- **Ścieżka widoku:** (brak - komponent modalny uruchamiany z Pulpitu i widoku szczegółów katalogu)
- **Główny cel:** Stworzenie nowego lub edycja nazwy istniejącego katalogu użytkownika.
- **Kluczowe informacje do wyświetlenia:** Formularz z polem tekstowym na nazwę katalogu.
- **Kluczowe komponenty widoku:** `Dialog`, `Form`, `Input`, `Button`.
- **UX, dostępność i względy bezpieczeństwa:** Walidacja nazwy katalogu (wymagane, unikalne dla użytkownika). W trybie edycji pole jest wstępnie wypełnione obecną nazwą. Pełne wsparcie dla nawigacji klawiaturą, prawidłowe zarządzanie focusem po otwarciu i zamknięciu modala.

## 3. Mapa podróży użytkownika

### Główny scenariusz: Dodawanie nowej trasy

Główny scenariusz użytkowania obejmuje dodanie nowej trasy i przypisanie jej do katalogu GOT.

1.  **Logowanie:** Użytkownik ląduje na `/login`, wprowadza dane i zostaje przekierowany na `/dashboard`.
2.  **Inicjacja dodawania trasy:** Na pulpicie użytkownik klika przycisk "Dodaj nową trasę", co przenosi go na stronę `/routes/new`.
3.  **Przesłanie i analiza GPX:** Użytkownik przesyła plik GPX. Aplikacja wysyła go do API (`/api/routes/gpx-parse`), a po otrzymaniu przetworzonych danych (dystans, przewyższenia, data) automatycznie wypełnia odpowiednie pola w formularzu, blokując je przed edycją.
4.  **Uzupełnienie danych:** Użytkownik wprowadza ręcznie wymagane informacje, takie jak nazwa trasy i liczba punktów GOT, oraz opcjonalnie notatki. Z listy checkboxów wybiera katalogi (np. "Mała Brązowa"), do których trasa ma być przypisana.
5.  **Zapisanie trasy:** Użytkownik klika "Zapisz". Aplikacja wysyła pełne dane do API (`/api/routes`).
6.  **Potwierdzenie i nawigacja:** Po pomyślnym zapisaniu, użytkownik widzi komunikat "toast" z potwierdzeniem i zostaje przekierowany na stronę szczegółów nowo dodanej trasy (`/routes/{newRouteId}`) lub do katalogu (`/catalogs/{catalogId}`), aby natychmiast zobaczyć efekt swojej pracy.

### Scenariusz dodatkowy: Tworzenie nowego katalogu

1.  **Inicjacja:** Będąc na pulpicie (`/dashboard`), użytkownik klika przycisk "Dodaj nowy katalog".
2.  **Wprowadzanie danych:** Na ekranie pojawia się okno modalne z jednym polem do wpisania nazwy nowego katalogu.
3.  **Zapis:** Użytkownik wpisuje nazwę i klika "Zapisz". Aplikacja wysyła dane do API (`POST /api/catalogs`).
4.  **Potwierdzenie:** Modal zamyka się, a lista katalogów na pulpicie odświeża się, pokazując nowo dodany element (zostanie zastosowana optymistyczna aktualizacja UI). Użytkownik widzi komunikat "toast" z potwierdzeniem.

### Scenariusz dodatkowy: Edycja nazwy katalogu

1.  **Inicjacja:** Na liście katalogów (na pulpicie lub w widoku szczegółów) użytkownik klika ikonę "Edytuj" przy katalogu, który chce zmodyfikować.
2.  **Modyfikacja danych:** Otwiera się to samo okno modalne, co przy tworzeniu, ale pole tekstowe jest już wypełnione aktualną nazwą katalogu. Użytkownik wprowadza nową nazwę.
3.  **Zapis:** Użytkownik klika "Zapisz". Aplikacja wysyła zaktualizowane dane do API (`PATCH /api/catalogs/{catalogId}`).
4.  **Potwierdzenie:** Modal zamyka się, nazwa katalogu na liście zostaje zaktualizowana (optymistyczna aktualizacja UI), a użytkownik widzi komunikat "toast" informujący o powodzeniu operacji.

## 4. Układ i struktura nawigacji

Aplikacja będzie korzystać z głównego komponentu układu (`Layout`), który otacza wszystkie widoki prywatne.

- **Komponent `Layout`:** Zawiera stały panel boczny (sidebar) na desktopie oraz nagłówek z przyciskiem "hamburger" na mobile, który przełącza widoczność tego samego panelu.
- **Panel boczny (nawigacja główna):**
  - Link do **Pulpitu** (`/dashboard`)
  - Link do **Wszystkich tras** (`/routes`)
  - Link do **Ustawień** (`/settings`)
- **Menu użytkownika:** Zintegrowane z panelem bocznym, zawiera opcję "Wyloguj".
- **Nawigacja kontekstowa:** W widokach zagnieżdżonych (np. szczegóły trasy) zostanie zastosowany komponent `Breadcrumbs` (okruszki), aby ułatwić orientację i powrót do poprzednich poziomów.

## 5. Kluczowe komponenty

Poniżej znajduje się lista kluczowych, reużywalnych komponentów, które będą stanowić podstawę interfejsu użytkownika, w większości bazując na bibliotece `shadcn/ui`.

- **`PageLayout`:** Komponent otaczający każdą stronę, nadający standardowy nagłówek i marginesy.
- **`DataTable` / `CardList`:** Responsywny komponent do wyświetlania list (np. tras), renderujący się jako tabela na desktopie i lista kart na mobile.
- **`RouteForm`:** Reużywalny formularz do tworzenia i edycji trasy, wykorzystujący `React Hook Form` i `Zod` do walidacji.
- **`FileUploader`:** Komponent do przesyłania plików z obsługą "przeciągnij i upuść" oraz walidacją typu pliku.
- **`EmptyState`:** Komponent wyświetlany w miejscach, gdzie brakuje danych (np. pusta lista tras), zawierający grafikę, komunikat i przycisk z wezwaniem do działania (CTA).
- **`Skeleton`:** Komponent do wyświetlania szkieletu interfejsu podczas ładowania danych, poprawiający postrzeganą wydajność.
- **`AlertDialog`:** Modal potwierdzający wykonanie akcji destrukcyjnej (np. usunięcie katalogu, trasy, konta), wymagający interakcji od użytkownika.
- **`Toast`:** Komponent do wyświetlania globalnych, nieblokujących powiadomień (np. "Trasa została zapisana pomyślnie").
