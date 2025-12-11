# Plan implementacji widoku Edycji Trasy (`/routes/{routeId}/edit`)

## 1. Przegląd

Widok Edycji Trasy umożliwia modyfikację wcześniej dodanej wędrówki. **Na obecnym etapie deweloperskim widok ten będzie publicznie dostępny.** Wszystkie elementy UI muszą być w pełni przetłumaczalne.

## 2. Routing widoku

Widok będzie dostępny pod dynamiczną, chronioną ścieżką:

- **Ścieżka:** `/routes/[routeId]/edit`

**Dostęp nie wymaga uwierzytelnienia ani weryfikacji własności trasy na tym etapie.**

## 3. Struktura komponentów

Struktura wykorzystuje reużywalny `RouteForm`, przekazując mu przetłumaczone teksty.

```
<EditRoutePage (Server Component)>
└── <EditRouteView (Client Component)>
    ├── <PageHeader>
    │   ├── <Breadcrumbs /> (Teksty z `useTranslations`)
    │   └── <h1> (Tekst z `useTranslations`, np. "Edytuj trasę: {routeName}")
    └── <RouteForm
            // ... inne propsy
            isEditMode={true}
        />
```

## 4. Szczegóły komponentów

### `EditRoutePage` (Komponent serwerowy - RSC)

- **Opis komponentu:** Pobiera wszystkie niezbędne dane (szczegóły trasy, katalogi, grupy górskie) na serwerze i obsługuje błędy 404/403.
- **Propsy:** `params: { routeId: string }`.

### `EditRouteView` (Komponent kliencki)

- **Opis komponentu:** Otrzymuje dane z serwera i przekazuje je do `RouteForm`. Definiuje funkcję `onSubmit`. **Używa `useTranslations` do pobrania tekstów dla nagłówka i przekazania ich do `RouteForm`.**
- **Propsy:**
  ```typescript
  interface EditRouteViewProps {
    route: RouteDetailsDto;
    catalogs: CatalogPreviewDto[];
    mountainGroups: MountainGroupDto[];
  }
  ```

### `RouteForm` (Reużywalny komponent kliencki)

- **Opis komponentu:** Ten sam co w widoku dodawania, ale w trybie edycji.
- **Logika i18n:** Musi być dostosowany do przyjmowania przetłumaczonych tekstów (etykiet, komunikatów walidacyjnych, etc.) jako propsów, aby był w pełni reużywalny i niezależny od konkretnego hooka `useTranslations`. Na przykład, etykieta przycisku "Zapisz zmiany" będzie pochodzić z tłumaczeń.

## 5. Typy

- **`RouteDetailsDto`**: Typ danych trasy pobranych z serwera, używany do inicjalizacji formularza.
- **`UpdateRouteCommand`**: Typ danych (`payload`) wysyłany do API w żądaniu `PATCH`.
- **`CatalogPreviewDto[]` & `MountainGroupDto[]`**: Typy danych dla list wyboru w formularzu.
- **`EditRouteSchema`**: Schemat walidacji Zod, opakowany w funkcję przyjmującą tłumaczenia, spójny z formularzem dodawania trasy.

## 6. Zarządzanie stanem

- **Stan formularza:** Zarządzany przez `React Hook Form`, inicjalizowany danymi z `RouteDetailsDto`.
- **Stan przesyłania:** Komponent `EditRouteView` lub `RouteForm` będzie zarządzał wewnętrznym stanem `isSubmitting`, aby wyłączyć przycisk zapisu i wyświetlić wskaźnik ładowania podczas wysyłania danych do API.

## 7. Integracja API

- **Pobieranie danych (RSC w `EditRoutePage`):**
  - `GET /api/routes/{routeId}`: Pobiera aktualne dane trasy do wypełnienia formularza.
  - `GET /api/catalogs?type=user`: Pobiera listę katalogów użytkownika do wyboru.
  - `GET /api/mountain-groups`: Pobiera listę grup górskich do wyboru.
- **Aktualizacja trasy (Client-side w `EditRouteView`):**
  - `PATCH /api/routes/{routeId}`: Wywoływane po zwalidowaniu i przesłaniu formularza w `RouteForm`. Payload to `UpdateRouteCommand`. Po sukcesie, użytkownik jest przekierowywany do widoku szczegółów zaktualizowanej trasy (`/routes/{routeId}`).

## 8. Interakcje użytkownika

- **Inicjalizacja:** Formularz jest wstępnie wypełniony danymi trasy pobranymi z serwera.
- **Edycja:** Użytkownik modyfikuje pola formularza, takie jak nazwa, data, notatki, czy powiązane katalogi i grupy górskie. Pola pochodzące z GPX (dystans, przewyższenia) są tylko do odczytu.
- **Przesłanie formularza:**
  - Użytkownik klika przycisk "Zapisz zmiany".
  - Przycisk jest wyłączany, a jego etykieta zmienia się na "Zapisywanie...".
  - Po pomyślnej odpowiedzi z `PATCH /api/routes/{routeId}`, użytkownik widzi przetłumaczony `Toast` z komunikatem o sukcesie i jest przekierowywany na stronę szczegółów zaktualizowanej trasy (`/routes/{routeId}`).

## 9. Warunki i walidacja

- **Walidacja Client-Side (Zod):** Formularz jest walidowany przy próbie przesłania. Główne reguły są takie same jak w formularzu dodawania (np. `name` jest wymagane).
- **Logika warunkowa:** Podobnie jak w formularzu dodawania, jeśli trasa jest powiązana z katalogiem predefiniowanym, pole `got_points` staje się wymagane. Ta walidacja jest częścią schematu Zod (`.refine()`).
- **Uprawnienia:** **Na tym etapie weryfikacja własności trasy jest wyłączona.**

## 10. Obsługa błędów

- **Trasa nie znaleziona (404):** `EditRoutePage` obsłuży ten błąd na serwerze, renderując stronę 404.
- **Błąd walidacji na kliencie:** Formularz nie jest przesyłany, a przetłumaczone błędy są wyświetlane pod odpowiednimi polami.
- **Błąd przesyłania do API (`PATCH /api/routes/{routeId}`):**
  - **409 Conflict (istniejąca nazwa):** Używana jest funkcja `setError` z `React Hook Form`, aby wyświetlić przetłumaczony błąd bezpośrednio przy polu `name`.
  - **400 Bad Request (błąd walidacji serwera):** Błędy są mapowane na konkretne pola formularza, jeśli to możliwe.
  - **Inne błędy (np. 500):** Wyświetlany jest ogólny, przetłumaczony `Toast`. Przycisk "Zapisz zmiany" jest ponownie włączany.

## 11. Kroki implementacji

1.  **Pliki tłumaczeń:** Upewnić się, że pliki i18n (np. `routes.json`) zawierają wszystkie klucze potrzebne do widoku edycji, w tym tytuł, etykietę przycisku "Zapisz zmiany" i wszelkie komunikaty walidacyjne. Wiele kluczy będzie współdzielonych z formularzem dodawania.
2.  **Struktura plików:** Utworzyć plik `page.tsx` wewnątrz `src/app/[locale]/(private)/routes/[routeId]/edit/`.
3.  **Rozszerzenie `RouteForm`:** Zmodyfikować `RouteForm`, aby przyjmował przetłumaczone teksty jako propsy (zamiast używać hooka `useTranslations` bezpośrednio wewnątrz), co zwiększy jego reużywalność.
4.  **Komponent serwerowy:** Zmodyfikować logikę pobierania danych, aby **nie weryfikowała właściciela trasy.**
5.  **Komponent `EditRouteView`:** Użyć hooka `useTranslations` do pobrania tekstów i przekazania ich do `RouteForm`.
6.  **Logika aktualizacji:** W `handleUpdate` upewnić się, że wywoływane są `Toast` z przetłumaczonymi komunikatami.
7.  **Testowanie i18n:** Przetestować, czy wszystkie elementy formularza (etykiety, komunikaty walidacyjne, przycisk) oraz komunikaty `Toast` są poprawnie tłumaczone.
