# Plan implementacji widoku Szczegółów Trasy (`/routes/{routeId}`)

## 1. Przegląd

Widok Szczegółów Trasy prezentuje kompletne informacje o pojedynczej wędrówce. Umożliwia edycję lub usunięcie trasy. **Na obecnym etapie deweloperskim widok ten będzie publicznie dostępny.** Wszystkie statyczne etykiety i teksty interfejsu muszą być przetłumaczalne.

## 2. Routing widoku

Widok będzie dostępny pod dynamiczną ścieżką:

- **Ścieżka:** `/routes/[routeId]`

**Dostęp nie wymaga uwierzytelnienia na tym etapie.**

## 3. Struktura komponentów

Układ strony pozostaje ten sam, ale komponenty będą korzystać z i18n.

```
<RouteDetailsPage (Server Component)>
└── <RouteDetailsView (Client Component)>
    ├── <PageHeader>
    │   ├── <Breadcrumbs /> (Teksty z `useTranslations`)
    │   ├── <h1> (Nazwa trasy - nie tłumaczona)
    │   └── <ActionButtons>
    │       ├── <Button> (Etykieta "Edytuj" z `useTranslations`)
    │       └── <Button> (Etykieta "Usuń" z `useTranslations`)
    ├── <Card> (Tytuły i etykiety pól z `useTranslations`)
    ├── <Card> (Tytuły i etykiety pól z `useTranslations`)
    └── <Card> (Tytuły sekcji z `useTranslations`)
    └── <DeleteConfirmationDialog /> (Cała treść z `useTranslations`)
```

## 4. Szczegóły komponentów

### `RouteDetailsPage` (Komponent serwerowy - RSC)

- **Opis komponentu:** Pobiera dane trasy po stronie serwera i obsługuje błędy 404/403.
- **Propsy:** `params: { routeId: string }`.

### `RouteDetailsView` (Komponent kliencki)

- **Opis komponentu:** Renderuje interfejs na podstawie danych z serwera. Zarządza stanem modala usuwania. **Używa `useTranslations` do pobierania i przekazywania przetłumaczonych tekstów** do komponentów podrzędnych.
- **Propsy:** `route: RouteDetailsDto`.

### `DeleteConfirmationDialog`

- **Opis komponentu:** Modal `AlertDialog` do potwierdzenia usunięcia. **Cała jego zawartość (tytuł, opis, etykiety przycisków "Anuluj" i "Potwierdź") musi być przetłumaczona.**
- **Propsy:** `isOpen: boolean`, `onOpenChange: (open: boolean) => void`, `onConfirm: () => Promise<void>`, `isPending: boolean`.

## 5. Typy

- **`RouteDetailsDto`**: Główny typ danych dla tego widoku, pobierany z serwera. Zawiera wszystkie informacje o trasie, w tym powiązane encje. Kluczowe pola to:
  - `id`, `name`, `route_date`, `got_points`
  - `distance`, `total_ascent`, `total_descent`, `duration`
  - `notes`
  - `mountain_groups: { id: string, name: string }[]`
  - `catalogs: { id: string, name: string }[]`

## 6. Zarządzanie stanem

- **Stan modala:** Widoczność modala `DeleteConfirmationDialog` jest zarządzana przez `useState` w `RouteDetailsView`.
- **Stan usuwania:** Wewnętrzny stan `isDeleting` (`useState`) do wyświetlania wskaźnika ładowania na przycisku potwierdzenia w modalu.

## 7. Integracja API

- **Pobieranie danych (RSC w `RouteDetailsPage`):**
  - `GET /api/routes/{routeId}`: Pobiera wszystkie szczegóły trasy, w tym powiązane katalogi i grupy górskie, do wyświetlenia na stronie.
- **Usuwanie trasy (Client-side w `RouteDetailsView`):**
  - `DELETE /api/routes/{routeId}`: Wywoływane po potwierdzeniu w `DeleteConfirmationDialog`. Po pomyślnym usunięciu, użytkownik jest przekierowywany na stronę główną tras (`/routes`).

## 8. Interakcje użytkownika

- **Nawigacja do edycji:**
  - Użytkownik klika przycisk "Edytuj".
  - Aplikacja nawiguje do widoku edycji danej trasy (`/routes/{routeId}/edit`).
- **Proces usuwania:**
  - Użytkownik klika przycisk "Usuń".
  - Otwiera się modal `DeleteConfirmationDialog` z prośbą o potwierdzenie.
  - Jeśli użytkownik kliknie "Anuluj", modal się zamyka.
  - Jeśli użytkownik kliknie "Potwierdź", przycisk jest wyłączany (`isDeleting = true`), a do API wysyłane jest żądanie `DELETE`.
  - Po pomyślnym usunięciu, użytkownik widzi przetłumaczony `Toast` i jest przekierowywany na stronę `/routes`.

## 9. Warunki i walidacja

- **Uprawnienia:** **Na tym etapie weryfikacja własności jest wyłączona.** Komponent serwerowy będzie jedynie sprawdzał, czy trasa o danym ID istnieje.
- **Walidacja:** W tym widoku nie ma pól do wprowadzania danych przez użytkownika, więc walidacja po stronie klienta nie jest wymagana.

## 10. Obsługa błędów

- **Trasa nie znaleziona (404):** `RouteDetailsPage` (RSC) obsłuży ten błąd, wywołując funkcję `notFound()` z Next.js. **Weryfikacja uprawnień (403) jest pomijana na tym etapie.**
- **Błąd podczas usuwania:**
  - Jeśli żądanie `DELETE` nie powiodło się, stan `isDeleting` jest resetowany do `false`.
  - Modal `DeleteConfirmationDialog` jest zamykany.
  - Wyświetlany jest przetłumaczony `Toast` z informacją o błędzie (np. "Nie udało się usunąć trasy. Spróbuj ponownie.").

## 11. Kroki implementacji

1.  **Pliki tłumaczeń:** Dodać do plików i18n (np. `routes.json`) klucze dla wszystkich tekstów w widoku: etykiety przycisków, okruszków (`Breadcrumbs`), tytuły i etykiety w kartach (`Card`), a także całą zawartość modala `DeleteConfirmationDialog`.
2.  **Struktura plików:** Utworzyć plik `page.tsx` wewnątrz `src/app/[locale]/(private)/routes/[routeId]/`.
3.  **Pobieranie danych na serwerze:** W `RouteDetailsPage` zaimplementować pobieranie danych trasy z API. **Pominąć logikę weryfikacji właściciela trasy,** a jedynie obsługiwać błąd 404 (brak trasy).
4.  **Komponent `RouteDetailsView`:** Zaimplementować użycie hooka `useTranslations` i przekazać tłumaczenia do komponentów-dzieci.
5.  **Modal potwierdzający:** Upewnić się, że `DeleteConfirmationDialog` jest w pełni przetłumaczalny.
6.  **Logika usuwania:** Zmodyfikować funkcję `handleDelete`, aby wyświetlała przetłumaczony `Toast` po sukcesie lub błędzie.
7.  **Testowanie i18n:** Sprawdzić, czy przełączanie języków poprawnie aktualizuje wszystkie statyczne teksty w widoku, pozostawiając dynamiczne dane (nazwy tras, katalogów) bez zmian.
