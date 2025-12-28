# Plan implementacji widoku Dodawania Nowej Trasy (`/routes/new`)

## 1. Przegląd

Widok "Dodaj Nową Trasę" to interaktywny formularz do dodawania nowej wędrówki. **Na obecnym etapie deweloperskim widok ten będzie publicznie dostępny, a każda dodana trasa nie będzie powiązana z żadnym użytkownikiem.** Cały interfejs musi być w pełni przetłumaczalny.

## 2. Routing widoku

Widok będzie dostępny pod ścieżką:

- **Ścieżka:** `/routes/new`

**Dostęp nie wymaga uwierzytelnienia na tym etapie.**

## 3. Struktura komponentów

Struktura opiera się na komponencie formularza, a wszystkie teksty są pobierane z `next-intl`.

```
<AddRoutePage (Server Component)>
└── <AddRouteView (Client Component)>
    ├── <PageHeader>
    │   ├── <Breadcrumbs /> (Teksty z `useTranslations`)
    │   └── <h1> (Tekst z `useTranslations`)
    ├── <Form (React Hook Form)>
    │   ├── <FileUploadStep>
    │   │   └── <FileUploader /> (Teksty wewnątrz z `useTranslations`)
    │   ├── <GpxDataSection> (Etykiety pól z `useTranslations`)
    │   ├── <ManualDataSection> (Etykiety pól z `useTranslations`)
    │   ├── <AssociationsSection> (Etykiety pól z `useTranslations`)
    │   └── <Button type="submit"> (Tekst z `useTranslations`)
```

## 4. Szczegóły komponentów

### `AddRoutePage` (Komponent serwerowy - RSC)

- **Opis komponentu:** Pobiera dane potrzebne do formularza (listę katalogów i grup górskich) po stronie serwera.
- **Propsy:** Brak.

### `AddRouteView` (Komponent kliencki)

- **Opis komponentu:** Zawiera całą logikę formularza. **Używa hooka `useTranslations` do pobrania wszystkich tekstów UI** i przekazuje je do komponentów podrzędnych.
- **Propsy:**
  ```typescript
  interface AddRouteViewProps {
    catalogs: CatalogPreviewDto[];
    mountainGroups: MountainGroupDto[];
  }
  ```

### `FileUploader`

- **Opis komponentu:** Komponent do przesyłania plików. **Wszystkie teksty (np. "Przeciągnij plik tutaj") są tłumaczone.**
- **Propsy:** `onFilesSelected: (files: File[]) => void`, `isParsing: boolean`.

## 5. Typy

- **`AddRouteSchema`**: Schemat walidacji Zod zostanie opakowany w funkcję, która przyjmuje funkcję tłumaczącą `t`, aby dostarczyć **przetłumaczone komunikaty walidacyjne**.

```typescript
// Schemat walidacji
const getAddRouteSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(3, t("validation.name.minLength")).max(255),
    route_date: z.date({ required_error: t("validation.date.required") }),
    // ... reszta pól i komunikatów
  });
```

## 6. Zarządzanie stanem

- **Stan formularza:** Zarządzany przez `React Hook Form`.
- **Stan parsowania GPX:** Wewnętrzny stan `isParsing` (`useState`) do wyświetlania wskaźnika ładowania na komponencie `FileUploader`.

## 7. Integracja API

- **Pobieranie danych (RSC w `AddRoutePage`):**
  - `GET /api/catalogs?type=user`: Pobiera listę katalogów użytkownika do wyboru.
  - `GET /api/mountain-groups`: Pobiera listę grup górskich do wyboru.
- **Parsowanie GPX (Client-side w `AddRouteView`):**
  - `POST /api/routes/gpx-parse`: Wysyłane, gdy użytkownik upuści plik GPX. Request to `multipart/form-data`. Odpowiedź (`GpxParseResultDto`) jest używana do automatycznego wypełnienia pól formularza (dystans, przewyższenia, etc.).
- **Tworzenie trasy (Client-side w `AddRouteView`):**
  - `POST /api/routes`: Wywoływane po zwalidowaniu i przesłaniu formularza. Payload to `CreateRouteCommand`. Po sukcesie, użytkownik jest przekierowywany do widoku szczegółów nowej trasy (`/routes/{newRouteId}`).

## 8. Interakcje użytkownika

- **Przesłanie pliku GPX:**
  - Użytkownik przeciąga plik na `FileUploader` lub klika, aby go wybrać.
  - Rozpoczyna się proces parsowania (`isParsing = true`), a interfejs `FileUploader` jest blokowany.
  - Po pomyślnej odpowiedzi z `POST /api/routes/gpx-parse`, pola formularza (`distance`, `total_ascent`, `total_descent`, `duration`, `route_date`) są automatycznie wypełniane.
- **Wprowadzanie ręczne:**
  - Użytkownik może pominąć krok GPX i ręcznie wypełnić wszystkie wymagane pola.
  - Użytkownik wpisuje nazwę, wybiera datę z kalendarza, wpisuje punkty GOT, notatki, itp.
  - Użytkownik wybiera katalogi i grupy górskie z rozwijanych list (np. `MultiSelect` z `shadcn/ui`).
- **Przesłanie formularza:**
  - Użytkownik klika przycisk "Zapisz".
  - Przycisk jest wyłączany, a jego etykieta zmienia się na "Zapisywanie...".
  - Po pomyślnej odpowiedzi z `POST /api/routes`, użytkownik widzi przetłumaczony `Toast` z komunikatem o sukcesie i jest przekierowywany na stronę szczegółów nowo utworzonej trasy (`/routes/{newRouteId}`).

## 9. Warunki i walidacja

- **Walidacja Client-Side (Zod):** Formularz jest walidowany przy próbie przesłania za pomocą schematu `getAddRouteSchema(t)`. Główne reguły:
  - `name`: Wymagane, min. 3 znaki.
  - `route_date`: Wymagana, poprawna data.
  - `distance`, `total_ascent`, `total_descent`, `duration`: Wymagane, liczby nieujemne.
- **Logika warunkowa:**
  - Jeśli użytkownik w polu `catalog_ids` wybierze katalog, który jest predefiniowany (`is_predefined: true`), pole `got_points` staje się **wymagane**. Ta logika powinna być zaimplementowana w schemacie Zod przy użyciu metody `.refine()`.
- **Wszystkie komunikaty walidacyjne wyświetlane użytkownikowi muszą być tłumaczone** za pomocą schematu Zod, który pobiera tłumaczenia.

## 10. Obsługa błędów

- **Błąd parsowania GPX (400 Bad Request):**
  - Proces parsowania zostaje zatrzymany (`isParsing = false`).
  - Użytkownik widzi przetłumaczony `Toast` z informacją o błędzie (np. "Nie udało się przetworzyć pliku GPX. Sprawdź format i spróbuj ponownie.").
- **Błąd walidacji na kliencie:**
  - Formularz nie jest przesyłany.
  - Przetłumaczone błędy są wyświetlane pod odpowiednimi polami formularza.
- **Błąd przesyłania do API (`POST /api/routes`):**
  - **409 Conflict (istniejąca nazwa):** Używana jest funkcja `setError` z `React Hook Form`, aby wyświetlić przetłumaczony błąd bezpośrednio przy polu `name` (np. "Trasa o tej nazwie już istnieje.").
  - **400 Bad Request (błąd walidacji serwera):** Podobnie jak przy 409, błędy są mapowane na konkretne pola formularza.
  - **Inne błędy (np. 500):** Wyświetlany jest ogólny, przetłumaczony `Toast` (np. "Wystąpił nieoczekiwany błąd. Spróbuj ponownie."). Przycisk "Zapisz" jest ponownie włączany.

## 11. Kroki implementacji

1.  **Pliki tłumaczeń:** Dodać do plików i18n (np. `routes.json`) klucze dla wszystkich tekstów w widoku: tytuł, etykiety pól, przyciski, teksty w `FileUploader`, komunikaty `Toast` oraz wszystkie komunikaty walidacyjne.
2.  **Struktura plików:** Utworzyć plik `page.tsx` wewnątrz `src/app/[locale]/(private)/routes/new/`.
3.  **Komponent serwerowy:** **Upewnić się, że endpointy API do pobierania katalogów i grup górskich działają bez uwierzytelniania.**
4.  **Komponent `AddRouteView`:**
    - Zaimplementować użycie hooka `useTranslations`.
    - Zmodyfikować implementację `React Hook Form`, aby używała dynamicznego schematu `getAddRouteSchema(t)`.
5.  **Komponent `FileUploader`:** Upewnić się, że komponent przyjmuje przetłumaczone teksty jako propsy.
6.  **Logika API:** Zmodyfikować funkje obsługujące API, aby wyświetlały przetłumaczone komunikaty `Toast` w przypadku sukcesu lub błędu.
7.  **Testowanie i18n:** Przetestować cały scenariusz, zwracając szczególną uwagę na tłumaczenie komunikatów walidacyjnych (zarówno z klienta, jak i z serwera) oraz komunikatów o błędach.
