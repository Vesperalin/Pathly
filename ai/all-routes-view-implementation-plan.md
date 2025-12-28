# Plan implementacji widoku Wszystkich Tras (`/routes`)

## 1. Przegląd

Widok "Wszystkie Trasy" to centralne miejsce do przeglądania, wyszukiwania i filtrowania wszystkich tras. **Na obecnym etapie deweloperskim widok ten będzie publicznie dostępny, a operacje będą dotyczyć wszystkich tras w systemie.** Wszystkie statyczne elementy UI muszą być przetłumaczalne.

## 2. Routing widoku

Widok będzie dostępny pod ścieżką:

- **Ścieżka:** `/routes`

**Dostęp do widoku nie będzie wymagał uwierzytelnienia na tym etapie.**

## 3. Struktura komponentów

Struktura pozostaje oparta na architekturze Serverless z URL jako źródłem stanu. Komponenty klienckie będą pobierać tłumaczenia.

```
<AllRoutesPage (Server Component)>
└── <AllRoutesView (Client Component)>
    ├── <PageHeader>
    │   ├── <h1> (Tekst z `useTranslations`)
    │   └── <Button href="/routes/new"> (Tekst z `useTranslations`)
    ├── <RoutesToolbar>
    │   ├── <SearchInput /> (Placeholder z `useTranslations`)
    │   └── <SortOptions /> (Etykiety opcji z `useTranslations`)
    ├── <RoutesList>
    │   ├── <DataTable> (Nagłówki kolumn z `useTranslations`)
    │   └── <EmptyState /> (Tekst z `useTranslations`)
    └── <PaginationControls /> (Etykiety z `useTranslations`)
```

## 4. Szczegóły komponentów

### `AllRoutesPage` (Komponent serwerowy - RSC)

- **Opis komponentu:** Pobiera dane tras z API na podstawie `URLSearchParams` i przekazuje je do komponentu klienckiego.
- **Propsy:** `searchParams: { [key: string]: string | string[] | undefined }`.

### `AllRoutesView` (Komponent kliencki)

- **Opis komponentu:** Renderuje interfejs i zarządza interakcjami, które modyfikują URL. **Używa `useTranslations` do pobrania tekstów i przekazania ich do komponentów podrzędnych.**
- **Propsy:**
  ```typescript
  interface AllRoutesViewProps {
    initialData: PaginatedRoutesDto;
    searchParams: { [key: string]: string | undefined };
  }
  ```

### `RoutesToolbar`

- **Opis komponentu:** Pasek narzędzi do filtrowania i sortowania. **Wszystkie widoczne teksty (placeholder w wyszukiwarce, opcje sortowania) są tłumaczone.**
- **Główne elementy:** `SearchInput`, `SortOptions`.
- **Propsy:** `searchParams: { [key: string]: string | undefined }`.

### `RoutesList`

- **Opis komponentu:** Wyświetla listę tras. **Nagłówki kolumn w `DataTable` oraz komunikaty w `EmptyState` są tłumaczone.**
- **Główne elementy:** `DataTable`, `Card`, `Skeleton`, `EmptyState`.
- **Propsy:** `routes: RoutePreviewDto[]`, `isLoading: boolean`.

### `PaginationControls`

- **Opis komponentu:** Komponent do nawigacji między stronami. **Etykiety ("Poprzednia", "Następna", "Strona X z Y") są tłumaczone.**
- **Główne elementy:** `Pagination` z `shadcn/ui`.
- **Propsy:** `pagination: PaginationParams`.

## 5. Typy

- **`PaginatedRoutesDto`**: Główny typ danych odbierany z API, zawierający listę tras i informacje o paginacji. Przekazywany z `AllRoutesPage` do `AllRoutesView`.
  - `data: RoutePreviewDto[]`
  - `pagination: { page: number; page_size: number; total: number; }`
- **`RoutePreviewDto`**: Typ reprezentujący pojedynczą trasę na liście.
- **`searchParams`**: Obiekt (`{ [key: string]: string | undefined }`) reprezentujący stan filtrów odczytany z URL. Jest kluczowy dla sterowania danymi pobieranymi przez komponent serwerowy.

## 6. Zarządzanie stanem

Zarządzanie stanem pozostaje bez zmian (oparte na URL).

## 7. Integracja API

- **Pobieranie Danych (RSC w `AllRoutesPage`):**
  - `GET /api/routes`: Główny endpoint do pobierania listy tras. Komponent serwerowy odczytuje parametry z `searchParams` i przekazuje je do API.
    - `page`: numer strony
    - `page_size`: liczba elementów na stronie
    - `sort_by`: pole sortowania (`name`, `route_date`)
    - `order`: kierunek sortowania (`asc`, `desc`)
    - `search`: fraza wyszukiwania
  - Odpowiedź API (`PaginatedRoutesDto`) jest przekazywana jako `initialData` do komponentu klienckiego.

## 8. Interakcje użytkownika

- **Wyszukiwanie:**
  - Użytkownik wpisuje tekst w polu wyszukiwania (`SearchInput`).
  - Wprowadzanie tekstu jest debounced (np. o 300ms), aby uniknąć nadmiernych zapytań.
  - Po upływie czasu debounce, komponent aktualizuje parametr `search` w URL za pomocą `useRouter` i `useSearchParams`.
  - Zmiana URL powoduje, że Next.js ponownie renderuje `AllRoutesPage` na serwerze z nowymi danymi.
- **Sortowanie:**
  - Użytkownik wybiera opcję z `SortOptions` (np. "Nazwa A-Z").
  - Komponent aktualizuje parametry `sort_by` i `order` w URL.
  - Zmiana URL powoduje ponowne renderowanie strony na serwerze.
- **Paginacja:**
  - Użytkownik klika przycisk "Następna", "Poprzednia" lub numer strony w `PaginationControls`.
  - Komponent aktualizuje parametr `page` w URL.
  - Zmiana URL powoduje ponowne renderowanie strony na serwerze.
- **Nawigacja do szczegółów:**
  - Użytkownik klika na wiersz w tabeli lub kartę trasy na liście.
  - Aplikacja nawiguje do widoku szczegółów danej trasy (`/routes/{routeId}`).
- **Nawigacja do dodawania trasy:**
  - Użytkownik klika przycisk "Dodaj nową trasę" w nagłówku.
  - Aplikacja nawiguje do formularza dodawania nowej trasy (`/routes/new`).

## 9. Warunki i walidacja

- **Parametry URL:** Komponent serwerowy `AllRoutesPage` powinien bezpiecznie parsować parametry URL, stosując wartości domyślne w przypadku ich braku lub niepoprawności (np. `page` musi być liczbą dodatnią).
- **Dostęp:** **Widok jest publicznie dostępny na tym etapie.**

## 10. Obsługa błędów

- **Błąd pobierania danych:** Bez zmian (obsługa przez `error.tsx`).
- **Brak wyników wyszukiwania:** Komunikat w `EmptyState` **musi być przetłumaczony**.
- **Nieprawidłowe parametry URL:** Bez zmian.

## 11. Kroki implementacji

1.  **Pliki tłumaczeń:** Dodać do plików i18n (np. `routes.json`) klucze dla tytułu strony, przycisków, placeholdera wyszukiwania, opcji sortowania, nagłówków tabeli, komunikatów `EmptyState` oraz etykiet paginacji.
2.  **Struktura plików:** Utworzyć plik `page.tsx` wewnątrz `src/app/[locale]/(private)/routes/`.
3.  **Komponent serwerowy `AllRoutesPage`:** Zaimplementować logikę odczytu `searchParams` i wywołania serwerowej funkcji pobierającej dane z API. **Należy upewnić się, że API `GET /api/routes` działa bez uwierzytelniania.**
4.  **Aktualizacja komponentów klienckich:**
    - W `AllRoutesView` i jego komponentach podrzędnych (`RoutesToolbar`, `RoutesList`, `PaginationControls`) zaimplementować użycie hooka `useTranslations` do pobrania odpowiednich tekstów.
5.  **Pasek narzędzi `RoutesToolbar`:** Przekazać przetłumaczone teksty do `SearchInput` (jako placeholder) i `SortOptions` (jako etykiety dla opcji).
6.  **Lista tras `RoutesList`:** Przekazać przetłumaczone nagłówki do `DataTable` i przetłumaczone teksty do `EmptyState`.
