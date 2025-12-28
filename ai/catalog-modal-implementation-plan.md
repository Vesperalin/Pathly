# Plan implementacji komponentu: Modal Dodawania/Edycji Katalogu

## 1. Przegląd

`CatalogFormModal` to reużywalny komponent modalny do tworzenia i edycji katalogów. Zawiera prosty formularz z jednym polem. **Jako komponent reużywalny, musi być zaprojektowany tak, aby wszystkie wewnętrzne teksty UI (tytuły, etykiety, przyciski, komunikaty) były w pełni przetłumaczalne.**

## 2. Routing widoku

Jako komponent modalny, nie posiada własnej ścieżki. Jest renderowany w kontekście innych widoków (np. `/dashboard`).

## 3. Struktura komponentów

Struktura opiera się na `Dialog` z `shadcn/ui`, a teksty są dostarczane z zewnątrz.

```
<CatalogFormModal>
└── <Dialog>
    ├── <DialogContent>
    │   ├── <DialogHeader>
    │   │   ├── <DialogTitle> (Dynamiczny, przetłumaczony tytuł)
    │   ├── <Form>
    │   │   ├── <FormField name="name"> (Przetłumaczona etykieta)
    │   │   └── <Button type="submit"> (Przetłumaczona etykieta)
```

## 4. Szczegóły komponentu

### `CatalogFormModal` (Komponent kliencki)

- **Opis komponentu:** Reużywalny, w pełni kontrolowany komponent. Zarządza logiką formularza, w tym stanem przesyłania i obsługą błędów z API. **Nie używa hooka `useTranslations` bezpośrednio. Zamiast tego, przyjmuje przetłumaczone teksty i schemat walidacji jako propsy, aby zachować niezależność.**
- **Propsy:**
  ```typescript
  interface CatalogFormModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSubmit: (data: CreateCatalogCommand | UpdateCatalogCommand) => Promise<void>;
    initialData?: CatalogPreviewDto;
    // Propsy i18n
    texts: {
      titleCreate: string;
      titleEdit: string;
      labelName: string;
      buttonSave: string;
      buttonSaving: string;
    };
    validationSchema: z.Schema<CatalogFormViewModel>;
  }
  ```

## 5. Typy

- **`CatalogSchema`**: Schemat walidacji Zod **nie będzie tworzony wewnątrz komponentu**. Zamiast tego, będzie tworzony w komponencie nadrzędnym (który ma dostęp do hooka `useTranslations`) i przekazywany jako prop `validationSchema`.

  ```typescript
  // W komponencie nadrzędnym (np. DashboardContent.tsx)
  const t = useTranslations("CatalogModal");
  const catalogSchema = z.object({
    name: z.string().min(3, t("validation.name.minLength")).max(255, t("validation.name.maxLength")),
  });
  ```

## 6. Zarządzanie stanem

- **Stan formularza:** Zarządzany przez `React Hook Form`.
- **Stan przesyłania:** Komponent będzie miał wewnętrzny stan `isSubmitting` (`useState`), aby wyłączyć przycisk zapisu i pokazać wskaźnik ładowania podczas operacji asynchronicznej `onSubmit`.

## 7. Integracja API

Komponent nie wywołuje API bezpośrednio, ale jest kluczowym elementem tego procesu. Jego rola jest następująca:

1.  **Delegowanie:** Po pomyślnej walidacji formularza, komponent wywołuje asynchroniczną funkcję `onSubmit` przekazaną w propsach, przekazując jej dane z formularza.
2.  **Oczekiwanie:** Komponent `await` na zakończenie `onSubmit`, utrzymując stan `isSubmitting`.
3.  **Obsługa w komponencie nadrzędnym:** Komponent nadrzędny (np. `DashboardContent`) implementuje logikę `onSubmit`. Wewnątrz tej funkcji:
    - Sprawdza, czy przekazano `initialData`.
    - Jeśli nie, wysyła żądanie `POST /api/catalogs` z danymi.
    - Jeśli tak, wysyła żądanie `PATCH /api/catalogs/{catalogId}`.
    - Po udanej operacji odświeża dane (np. przez rewalidację SWR) i może zamknąć modal.
    - W razie błędu API, rzuca wyjątek, który jest łapany w modalu.

## 8. Interakcje użytkownika

- **Zapis:** Kliknięcie przycisku "Zapisz" uruchamia walidację. Jeśli jest poprawna, przycisk jest wyłączany, a jego etykieta zmienia się na "Zapisywanie...".
- **Zamknięcie:** Modal zamyka się po udanym zapisie lub przez interakcję użytkownika (kliknięcie poza obszarem, klawisz Esc).

## 9. Warunki i walidacja

- **Walidacja pola `name`:** Odbywa się na podstawie schematu Zod przekazanego w propsach, który zawiera już przetłumaczone komunikaty.

## 10. Obsługa błędów

- **Błędy walidacji:** Obsługiwane i wyświetlane przez `React Hook Form`.
- **Błędy API:**
  - Funkcja `onSubmit` w modalu jest owinięta w `try...catch`.
  - Jeśli `Promise` z `props.onSubmit` zostanie odrzucony (np. błąd 409 Conflict), blok `catch` w modalu użyje funkcji `setError` z `React Hook Form`, aby wyświetlić błąd API bezpośrednio przy polu `name`.
  - Generyczne błędy sieciowe mogą być nadal obsługiwane w komponencie nadrzędnym za pomocą `Toast`.

## 11. Kroki implementacji

1.  **Struktura pliku:** Utworzyć plik `CatalogFormModal.tsx` w `src/features/catalogs/components`.
2.  **Modyfikacja propsów:** Zaktualizować interfejs `CatalogFormModalProps`, aby `onSubmit` zwracał `Promise<void>`.
3.  **Implementacja komponentu:**
    - Dodać wewnętrzny stan `isSubmitting`.
    - W funkcji obsługującej formularz, ustawić `isSubmitting` na `true`, owinąć wywołanie `props.onSubmit` w `try...catch`, a w bloku `finally` ustawić `isSubmitting` na `false`.
    - W bloku `catch` użyć `setError('name', { message: ... })` do wyświetlenia błędu z API.
    - Po udanym `try` zamknąć modal (`onOpenChange(false)`).
4.  **Integracja z komponentem nadrzędnym (`DashboardContent`):**
    - Stworzyć asynchroniczną funkcję `handleSubmit`, która implementuje logikę `POST`/`PATCH`.
    - Wewnątrz `handleSubmit`, w bloku `catch` przechwycić błąd z `fetch` i rzucić go dalej, aby modal mógł go obsłużyć.
