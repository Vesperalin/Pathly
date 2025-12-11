# Plan implementacji widoku Szczegółów Katalogu (`/catalogs/{catalogId}`)

## 1. Przegląd

Widok Szczegółów Katalogu jest stroną, która prezentuje informacje o wybranym katalogu tras. **Na obecnym etapie deweloperskim widok ten będzie publicznie dostępny.** Cały statyczny tekst interfejsu musi być dostępny w języku polskim i angielskim.

## 2. Routing widoku

Widok będzie dostępny pod dynamiczną ścieżką:

- **Ścieżka:** `/catalogs/[catalogId]`

**Dostęp do tego widoku nie będzie wymagał uwierzytelnienia na tym etapie.**

## 3. Struktura komponentów

Komponenty zostaną podzielone na serwerowe i klienckie, a teksty UI będą pobierane z `next-intl`.

```
<CatalogDetailsPage (Server Component)>
└── <CatalogDetailsView (Client Component)>
    ├── <CatalogDetailsHeader>
    │   ├── <Breadcrumbs /> (Teksty z `useTranslations`)
    │   ├── <h1> (Nazwa katalogu - nie tłumaczona)
    │   ├── <p> (Etykieta "Suma punktów" z `useTranslations`)
    │   └── <ActionButtons> (Etykiety przycisków z `useTranslations`)
    ├── <Separator />
    └── <RouteList>
        ├── <RouteListItem /> (Nagłówki kolumn w tabeli z `useTranslations`)
        ├── <div ref={loadMoreRef} />
        └── <Skeleton /> | <EmptyState /> (Tekst z `useTranslations`)
```

## 4. Szczegóły komponentów

### `CatalogDetailsPage` (Komponent serwerowy - RSC)

- **Opis komponentu:** Główny komponent strony. Pobiera **szczegółowe dane katalogu (`GET /api/catalogs/{catalogId}`)** oraz **pierwszą stronę tras (`GET /api/catalogs/{catalogId}/routes?page=1`)**. Obsługuje błędy 404, jeśli katalog nie zostanie znaleziony.
- **Główne elementy:** `CatalogDetailsView`.
- **Propsy:** `params: { catalogId: string }`.

### `CatalogDetailsView` (Komponent kliencki)

- **Opis komponentu:** Zarządza logiką klienta: używa **`useSWRInfinite`** do paginacji tras, zarządza stanami modali do edycji i usuwania katalogu. **Przekazuje funkcję tłumaczącą `t` do komponentów podrzędnych.**
- **Główne elementy:** `CatalogDetailsHeader`, `RouteList`.
- **Propsy:**
  ```typescript
  interface CatalogDetailsViewProps {
    initialData: CatalogDetailsDto;
  }
  ```

### `CatalogDetailsHeader`

- **Opis komponentu:** Prezentuje nagłówek strony. **Etykiety przycisków ("Edytuj", "Usuń") oraz etykiety danych (np. "Total points:") są tłumaczone.** Nazwa katalogu nie jest tłumaczona.
- **Główne elementy:** `Breadcrumbs`, `h1`, `Button`.
- **Obsługiwane interakcje:** Kliknięcie "Edytuj", kliknięcie "Usuń".
- **Propsy:** `catalog: CatalogDetailsDto`, `onEdit: () => void`, `onDelete: () => void`.

### `RouteList`

- **Opis komponentu:** Odpowiada za wyświetlenie listy tras z "infinite scroll". **Nagłówki kolumn tabeli (np. "Nazwa", "Data", "Punkty") są tłumaczone.** Komponent `EmptyState` również używa przetłumaczonych tekstów.
- **Główne elementy:** `RouteListItem`, `IntersectionObserver`.
- **Propsy:** `routes: RouteInCatalogDto[]`, `isLoading: boolean`, `isReachingEnd: boolean`, `loadMore: () => void`.

## 5. Typy

Wykorzystane zostaną istniejące typy DTO.

## 6. Zarządzanie stanem

- **Paginacja tras:** Stan tras będzie zarządzany po stronie klienta za pomocą hooka **`useSWRInfinite`**. Umożliwi to płynne doładowywanie kolejnych stron podczas przewijania.
- **Modale:** Stan widoczności modali (`CatalogFormModal`, `AlertDialog`) będzie zarządzany za pomocą `useState`.
- **Komunikaty:** **Wszystkie komunikaty `Toast` muszą być tłumaczone.**

## 7. Integracja API

- **Pobieranie danych początkowych (RSC):**
  - `GET /api/catalogs/{catalogId}`: Pobiera szczegóły katalogu (nazwa, `is_predefined`, suma punktów).
  - `GET /api/catalogs/{catalogId}/routes?page=1`: Pobiera pierwszą stronę tras do wyświetlenia.
- **Paginacja tras (Client-side):**
  - `GET /api/catalogs/{catalogId}/routes?page={pageNumber}`: Klucz dla `useSWRInfinite` do pobierania kolejnych stron listy tras.
- **Edycja katalogu:**
  - `PATCH /api/catalogs/{catalogId}`: Wywoływane z `CatalogFormModal` do aktualizacji nazwy katalogu.
- **Usuwanie katalogu:**
  - `DELETE /api/catalogs/{catalogId}`: Wywoływane po potwierdzeniu w `AlertDialog`. Po pomyślnym usunięciu, użytkownik jest przekierowywany na stronę pulpitu (`/dashboard`).

## 8. Interakcje użytkownika

Interakcje pozostają takie same. **Wszystkie elementy tekstowe w UI, w tym w `AlertDialog` do potwierdzenia usunięcia, muszą być przetłumaczone.**

## 9. Warunki i walidacja

- **Dostęp do widoku:** **Na tym etapie weryfikacja uprawnień jest wyłączona.** Komponent serwerowy będzie jedynie sprawdzał, czy katalog o danym ID istnieje.
- **Widoczność akcji:** Przyciski "Edytuj" i "Usuń" są renderowane tylko wtedy, gdy `catalog.is_predefined` ma wartość `false`.
- **Formularz edycji:** Walidacja w `CatalogFormModal` musi używać przetłumaczonych komunikatów (co zostało już uwzględnione w planie dla tego komponentu).

## 10. Obsługa błędów

- **Brak katalogu (404):** Bez zmian.
- **Błąd ładowania kolejnych tras:** Komunikat o błędzie i przycisk "Spróbuj ponownie" **muszą być przetłumaczone**.
- **Błąd podczas edycji/usuwania:** Komunikaty `Toast` **muszą być tłumaczone**.
- **Pusty katalog:** Komponent `EmptyState` musi wyświetlać **przetłumaczony** tekst.

## 11. Kroki implementacji

1.  **Pliki tłumaczeń:** Dodać do plików i18n (np. `catalog.json`) klucze dla wszystkich tekstów w tym widoku: etykiety przycisków, okruszków, nagłówków tabel, komunikatów o błędach, tekstów w `EmptyState` i `AlertDialog`.
2.  **Struktura plików:** Utworzyć plik `page.tsx` wewnątrz `src/app/[locale]/(private)/catalogs/[catalogId]/`.
3.  **Pobieranie danych na serwerze:** W `page.tsx` zaimplementować pobieranie danych początkowych (dane katalogu i pierwsza strona tras), **nie wymagając sesji użytkownika** i obsługując błąd 404 (brak katalogu) za pomocą `notFound()` z Next.js.
4.  **Aktualizacja komponentów klienckich:**
    - W `CatalogDetailsView` zaimplementować logikę `useSWRInfinite` do doładowywania tras.
    - W `CatalogDetailsView` i jego komponentach podrzędnych (`CatalogDetailsHeader`, `RouteList`) użyć hooka `useTranslations` do pobrania tekstów.
5.  **Integracja modali:** Zintegrować `CatalogFormModal` i `AlertDialog` z `CatalogDetailsView`, przekazując przetłumaczone teksty i implementując logikę `PATCH` oraz `DELETE`.
6.  **Obsługa błędów:** Zmodyfikować obsługę błędów, aby wyświetlała przetłumaczone komunikaty `Toast` oraz komunikaty o błędach ładowania kolejnych stron.
