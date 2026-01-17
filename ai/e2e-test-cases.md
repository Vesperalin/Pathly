# Scenariusze testów e2e (Pathly)

Dokument syntetyzuje kluczowe scenariusze e2e wynikające z `ai/test-plan.md` i `ai/prd.md`. Każdy opis ma służyć jako gotowa specyfikacja do implementacji w Playwright (Chromium/Desktop, z wykorzystaniem POM).

## 1. Rejestracja i onboarding katalogów GOT

- **Podstawa:** test-plan §4.1, PRD §3.1/§3.3.
- **Cel:** potwierdzić pełny happy path rejestracji, automatyczne logowanie oraz utworzenie/wyświetlenie czterech predefiniowanych katalogów GOT.
- **Dane wejściowe:** unikalny e-mail, hasło ≥ 8 znaków.
- **Kroki skrócone:**
  1. Wejdź na `/register`, wypełnij formularz danymi spełniającymi walidację.
  2. Wyślij formularz, poczekaj na redirect do panelu.
  3. Zweryfikuj CTA/komunikat pustej listy katalogów użytkownika.
  4. Potwierdź obecność katalogów: Popularna, Mała Brązowa, Mała Srebrna, Mała Złota z podsumowaniami punktów.
- **Asercje kluczowe:** brak błędów walidacji, automatyczne zalogowanie, poprawne nazwy katalogów i nieedytowalny status.

## 2. Logowanie i egzekwowanie RLS

- **Podstawa:** test-plan §4.4 i §4.13, PRD §3.1/§3.3/§3.4.
- **Cel:** upewnić się, że użytkownik widzi wyłącznie swoje zasoby oraz ma blokadę na trasę/katalog innego użytkownika.
- **Dane wejściowe:** dwóch istniejących użytkowników A i B z różnymi trasami/katalogami.
- **Kroki skrócone:**
  1. Zaloguj się jako użytkownik A, zapisz identyfikator katalogu/trasy.
  2. Wyloguj, zaloguj użytkownika B i spróbuj wejść na URL zasobu A (np. `/catalogs/{idA}`).
  3. Powtórz dla trasy (`/routes/{idA}`).
- **Asercje kluczowe:** komunikat 404/brak uprawnień, brak przecieków danych w UI, lista katalogów/tras użytkownika B jest niezmieniona.

## 3. Dodawanie trasy z importem GPX

- **Podstawa:** test-plan §4.2/§4.12, PRD §3.4.
- **Cel:** zweryfikować poprawne parsowanie GPX, uzupełnianie pól i zapis trasy przypisanej do wielu katalogów.
- **Dane wejściowe:** poprawny plik GPX z czasem, dystansem, przewyższeniami; nazwa trasy, punkty GOT, wybrane katalogi.
- **Kroki skrócone:**
  1. Na zalogowanym koncie otwórz widok dodawania trasy.
  2. Załaduj plik GPX, poczekaj na automatyczne wypełnienie pól (data, dystans itd.).
  3. Uzupełnij wymagane dane ręczne i wybierz co najmniej dwa katalogi.
  4. Zapisz, a następnie otwórz jeden z katalogów oraz szczegóły trasy.
- **Asercje kluczowe:** poprawne wartości z GPX, trasa widoczna w wybranych katalogach, brak możliwości edycji danych GPX po zapisie.

## 4. CRUD katalogu własnego

- **Podstawa:** test-plan §4.3/§4.5, PRD §3.3 (US-008…US-013).
- **Cel:** pokryć cykl życia katalogu użytkownika i wpływ na przypisane trasy.
- **Dane wejściowe:** zalogowany użytkownik z co najmniej jedną trasą.
- **Kroki skrócone:**
  1. Utwórz nowy katalog z poprawną nazwą; sprawdź walidację na niedozwolone znaki.
  2. Edytuj nazwę katalogu, potwierdź aktualizację na liście.
  3. Przypisz istniejącą trasę do katalogu (np. z widoku edycji trasy).
  4. Usuń katalog, potwierdź w modalnym oknie.
- **Asercje kluczowe:** komunikaty walidacyjne, aktualizacja listy katalogów/tras, po usunięciu trasa pozostaje dostępna globalnie (tylko odpięta).

## 5. Ustawienia: język i motyw z persystencją

- **Podstawa:** test-plan §4.6/§4.9, PRD §3.2.
- **Cel:** przetestować personalizację UI – zmiana języka bez utraty ścieżki oraz wybór motywu (jasny/ciemny/systemowy) utrzymany między sesjami.
- **Dane wejściowe:** użytkownik z dostępem do ustawień, preferowany język ≠ domyślny.
- **Kroki skrócone:**
  1. Przejdź do widoku ustawień i zmień język (np. PL → EN) będąc na podstronie `/catalogs`.
  2. Zweryfikuj, że lokalizacja pozostaje `/en/catalogs`, a teksty statyczne są przetłumaczone.
  3. Ustaw motyw ciemny, wyloguj się lub odśwież stronę.
  4. Zaloguj się ponownie / otwórz aplikację – motyw i język muszą być zachowane.
- **Asercje kluczowe:** natychmiastowa zmiana treści statycznych, brak wpływu na dane użytkownika, ustawienia trwają po odświeżeniu i reloadzie sesji.
