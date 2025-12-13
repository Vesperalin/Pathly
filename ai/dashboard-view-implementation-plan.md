# Plan implementacji widoku Pulpitu (`/dashboard`)

## 1. Przegląd

Widok Pulpitu jest głównym ekranem aplikacji. Jego celem jest zapewnienie szybkiego dostępu do kluczowych funkcji: przeglądania katalogów tras, zarządzania własnymi katalogami oraz inicjowania procesu dodawania nowej trasy. **Na obecnym etapie deweloperskim widok ten będzie publicznie dostępny.** Cały interfejs użytkownika musi być przetłumaczalny na język polski i angielski.

## 2. Routing widoku

Widok będzie dostępny pod główną ścieżką aplikacji:

- **Ścieżka:** `/dashboard`

**Dostęp do widoku nie będzie wymagał uwierzytelnienia na tym etapie.**

## 3. Struktura komponentów

Komponenty będą zorganizowane w sposób modułowy, z wyraźnym podziałem na logikę i prezentację. Teksty statyczne będą pobierane za pomocą `useTranslations`.

```
<DashboardPage>
├── <DashboardHeader />
│   └── <Button href="/routes/new">Dodaj nową trasę</Button>
├── <DashboardContent>
│   ├── <CatalogList
│   │     title="Katalogi predefiniowane"
│   │     catalogs={predefinedCatalogs}
│   │     isUserList={false}
│   │   />
│   ├── <CatalogList
│   │     title={t('myCatalogsTitle')}
│   │     catalogs={userCatalogs}
│   │     isUserList={true}
│   │     // onAdd, onEdit, onDelete handlers
│   │   />
│   └── <EmptyState />
├── <CatalogFormModal />
└── <DeleteConfirmationDialog />
```

## 4. Szczegóły komponentów

### `DashboardPage` (Komponent serwerowy - RSC)

- **Opis komponentu:** Główny komponent strony `/dashboard`. Odpowiada za pobranie danych o katalogach predefiniowanych i użytkownika po stronie serwera i przekazanie ich do komponentu klienckiego `DashboardContent`.
- **Główne elementy:** `DashboardHeader`, `DashboardContent`.

### `DashboardHeader`

- **Opis komponentu:** Komponent nagłówkowy. Zawiera tytuł strony oraz przycisk CTA (Call to Action), który nawiguje użytkownika do strony dodawania nowej trasy.
- **Główne elementy:** `h1`, `Button` (jako Link z `next/link`).
- **Obsługiwane interakcje:** Kliknięcie przycisku "Dodaj nową trasę" nawiguje użytkownika do `/routes/new`.

### `DashboardContent` (Komponent kliencki)

- **Opis komponentu:** Zarządza stanem po stronie klienta: widocznością modali (tworzenie/edycja katalogu, potwierdzenie usunięcia) oraz obsługą operacji CRUD na katalogach użytkownika.
- **Główne elementy:** Dwie instancje `CatalogList`, `CatalogFormModal`, `DeleteConfirmationDialog`.
- **Propsy:**
  ```typescript
  interface DashboardContentProps {
    initialPredefinedCatalogs: CatalogPreviewDto[];
    initialUserCatalogs: CatalogPreviewDto[];
  }
  ```

### `CatalogList`

- **Opis komponentu:** Reużywalny komponent do wyświetlania listy katalogów w formie tabeli. Posiada nagłówek z tytułem. Jeśli `isUserList={true}`, w nagłówku renderowany jest przycisk "Dodaj katalog", a każdemu elementowi listy towarzyszą akcje "Edytuj" i "Usuń".
- **Główne elementy:** `Card` (jako kontener), `CardHeader` (z tytułem i przyciskiem "Dodaj"), `Table`, `DropdownMenu` (dla akcji), `Skeleton`, `EmptyState`.
- **Propsy:**
  ```typescript
  interface CatalogListProps {
    title: string;
    catalogs: CatalogPreviewDto[];
    isUserList: boolean;
    onAdd?: () => void;
    onEdit?: (catalog: CatalogPreviewDto) => void;
    onDelete?: (catalogId: string) => void;
  }
  ```

### `CatalogFormModal`

- **Opis komponentu:** Modal do tworzenia i edycji katalogu. Jego stan (otwarty/zamknięty, tryb 'create'/'edit') jest zarządzany przez `DashboardContent`.

### `DeleteConfirmationDialog` (Nowy)

- **Opis komponentu:** Standardowy dialog (`AlertDialog` z shadcn/ui) proszący użytkownika o potwierdzenie operacji usunięcia katalogu.

## 5. Typy

Wykorzystane zostaną istniejące typy DTO: `CatalogPreviewDto`, `CreateCatalogCommand`, `UpdateCatalogCommand`.

## 6. Zarządzanie stanem

- **Dane serwerowe:** `SWR` będzie używany w `DashboardContent` do zarządzania danymi katalogów użytkownika. Pozwoli to na automatyczne odświeżenie listy po operacjach CUD (Create, Update, Delete).
- **Stan UI:** `useState` w `DashboardContent` będzie używany do zarządzania stanem modali:
  - `isFormModalOpen: boolean`
  - `isDeleteDialogVisible: boolean`
  - `editingCatalog: CatalogPreviewDto | null`
  - `deletingCatalogId: string | null`

## 7. Integracja API

- **Pobieranie danych (RSC w `DashboardPage`):**
  - `GET /api/catalogs?type=predefined` - do pobrania listy katalogów predefiniowanych.
  - `GET /api/catalogs?type=user` - do pobrania początkowej listy katalogów użytkownika.
- **Tworzenie (`CatalogFormModal`):**
  - `POST /api/catalogs` z payloadem `CreateCatalogCommand`. Po sukcesie, SWR odświeży listę.
- **Aktualizacja (`CatalogFormModal`):**
  - `PATCH /api/catalogs/{catalogId}` z payloadem `UpdateCatalogCommand`. Po sukcesie, SWR odświeży listę.
- **Usuwanie (`DeleteConfirmationDialog`):**
  - `DELETE /api/catalogs/{catalogId}`. Po sukcesie, SWR odświeży listę.

## 8. Interakcje użytkownika

- **Nawigacja:** Kliknięcie nazwy katalogu przenosi do widoku szczegółów `/catalogs/{catalogId}`.
- **Dodanie katalogu:** Kliknięcie przycisku "Dodaj katalog" (w sekcji "Moje katalogi") otwiera `CatalogFormModal` w trybie tworzenia.
- **Edycja katalogu:** Kliknięcie "Edytuj" przy katalogu użytkownika otwiera `CatalogFormModal` z wypełnionymi danymi.
- **Usunięcie katalogu:** Kliknięcie "Usuń" otwiera `DeleteConfirmationDialog`. Potwierdzenie wywołuje żądanie DELETE.

## 9. Warunki i walidacja

- **Formularz katalogu:** Walidacja Zod z przetłumaczonymi komunikatami (bez zmian).
- **Uprawnienia:** **Na tym etapie nie ma weryfikacji uprawnień.** Przyciski Edytuj/Usuń będą widoczne dla wszystkich katalogów oznaczonych jako `is_predefined: false`.

## 10. Obsługa błędów

- **Błędy API (CRUD):** Komunikaty `Toast` muszą być tłumaczone. W przypadku błędu, modal nie powinien być zamykany, a błąd (np. konflikt nazwy) powinien być wyświetlony w formularzu.

## 11. Kroki implementacji

1.  **Pliki tłumaczeń:** Uzupełnić `dashboard.json` o klucze dla `DeleteConfirmationDialog` (tytuł, opis, przyciski) oraz przycisku "Dodaj katalog".
2.  **Struktura plików:** Utworzyć plik `page.tsx` wewnątrz `src/app/[locale]/(private)/dashboard/`.
3.  **Pobieranie danych (RSC):** W `DashboardPage` zaimplementować dwa wywołania `fetch` do `/api/catalogs`.
4.  **Komponent `DashboardContent`:** Zaimplementować logikę zarządzania stanem (SWR для danych, `useState` dla modali) oraz funkcje `handleAdd`, `handleEdit`, `handleDelete`. Przekazać te funkcje jako propsy do `CatalogList`.
5.  **Aktualizacja `CatalogList`:** Dodać logikę warunkowego renderowania przycisku "Dodaj katalog" w nagłówku oraz przycisków akcji (`DropdownMenu`) dla katalogów użytkownika.
6.  **Implementacja `DeleteConfirmationDialog`:** Stworzyć nowy komponent `AlertDialog` i podłączyć go do stanu w `DashboardContent`.
7.  **Testowanie CRUD:** Przetestować pełny cykl życia katalogu użytkownika: tworzenie (sprawdzić, czy przycisk otwiera modal), edycja, usuwanie z potwierdzeniem.
