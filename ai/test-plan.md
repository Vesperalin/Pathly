# **Plan Testów dla projektu Pathly**

## 1. Wprowadzenie i cele testowania

Celem planu testów jest zapewnienie wysokiej jakości aplikacji Pathly – progresywnej aplikacji webowej (PWA) wspierającej zdobywanie odznaki GOT PTTK. Testy mają potwierdzić, że system:

- spełnia wymagania funkcjonalne i niefunkcjonalne,
- jest odporny na błędy i ataki,
- zachowuje się spójnie na różnych środowiskach (desktop, mobile, offline),
- zapewnia bezpieczeństwo i ochronę danych użytkowników.

## 2. Zakres testów

Objęte testami będą:

1. **Frontend (Next 15, React 19, TypeScript 5)**
   - Widoki publiczne i prywatne (`src/app/[locale]/(public|private)`).
   - Komponenty UI (`src/components`), hooki (`src/hooks`), logika features (`src/features`).
2. **Backend (Supabase)**
   - Wywołania RPC oraz RLS (PostgreSQL) z poziomu API (`src/app/api`) i client-side.
3. **Integracja Frontend ↔ Backend**
   - Akcje auth, zarządzanie katalogami, trasami i profilami.
4. **Pliki statyczne i PWA (manifest, service worker).**
5. **Wydajność i dostępność (a11y).**

Poza zakresem: infrastruktura CI/CD (tylko smoke-test po wdrożeniu) oraz testy migracji DB (pokryte przez Supabase).

## 3. Typy testów

| Typ testu                     | Cel                                                             | Narzędzia                           |
| ----------------------------- | --------------------------------------------------------------- | ----------------------------------- |
| Testy jednostkowe             | Szybka weryfikacja logiki funkcji, hooków i komponentów         | Vitest + React Testing Library      |
| Testy integracyjne (frontend) | Sprawdzenie interakcji między komponentami i store              | Vitest + Testing Library            |
| Testy API                     | Weryfikacja endpointów Next.js / Supabase RPC, schematów danych | Vitest / @supabase/postgrest-js     |
| Testy end-to-end              | Scenariusze użytkownika w przeglądarce (PWA, mobile)            | Playwright                          |
| Testy wydajnościowe           | Pomiar TTFB, LCP, Lighthouse PWA Score, Supabase query perf     | Lighthouse CI, k6                   |
| Testy bezpieczeństwa          | RLS, XSS, CSRF, przejęcie tokena                                | Zaproxy, Vitest + supabase-js mocks |
| Testy dostępności             | WCAG 2.1 AA, kontrast, focus, ARIA                              | @axe-core/playwright                |

## 4. Scenariusze testowe (wybrane kluczowe)

1. **Rejestracja i logowanie**  
   a) Poprawne dane – redirect do dashboardu.  
   b) Niepoprawne hasło – komunikat o błędzie, brak tokenu.  
   c) Użytkownik bez weryfikacji e-mail – blokada dostępu.

2. **Import pliku GPX**  
   a) Plik poprawny → wyliczenie dystansu, przewyższeń, czasu.  
   b) Plik uszkodzony → komunikat o błędzie, brak zapisu.  
   c) Maksymalny rozmiar pliku (edge) → obsługa limitu.

3. **Tworzenie nowego katalogu tras**  
   a) Nazwa poprawna → zapis w DB i aktualizacja listy.  
   b) Nazwa zawiera niedozwolone znaki → komunikat walidacyjny.

4. **Dodawanie trasy do katalogu**  
   a) Użytkownik A dodaje trasę → widoczna tylko dla A (RLS).  
   b) Użytkownik B próbuje użyć ID trasy A → 404/Brak uprawnień.

5. **Usuwanie katalogu**  
   a) Potwierdzenie w modal'u → usunięcie katalogu i odpięcie tras (trasy pozostają w systemie).  
   b) Anulowanie → brak zmian.

6. **Zmiana języka (i18n)**  
   a) Przełącznik języka zachowuje ścieżkę (`/pl`, `/en`).  
   b) Treści z `messages/*` renderują się poprawnie.  
   c) Formatowanie dat uwzględnia locale.

7. **Zmiana hasła**  
   a) Poprawne hasła (stare + nowe) → zmiana hasła i potwierdzenie.  
   b) Niepoprawne stare hasło → komunikat o błędzie.

8. **Usunięcie konta**  
   a) Potwierdzenie operacji → trwałe usunięcie konta i wszystkich danych użytkownika.  
   b) Anulowanie → brak zmian.

9. **Zmiana motywu kolorystycznego**  
   a) Wybór motywu (jasny/ciemny/systemowy) → natychmiastowa zmiana w całej aplikacji.  
   b) Wybór jest zapamiętywany dla przyszłych sesji.

10. **Przeglądanie i edycja szczegółów trasy**  
    a) Kliknięcie w trasę → wyświetlenie wszystkich szczegółów (nazwa, data, punkty, GPX stats).  
    b) Edycja danych ręcznych (nazwa, punkty, notatki, grupy górskie) → zapis zmian.  
    c) Dane z GPX nie podlegają edycji.

11. **Zmiana przypisania trasy do katalogów**  
    a) Zaznaczenie/odznaczenie katalogów w edycji trasy → trasa pojawia się/znika w odpowiednich katalogach.  
    b) Usunięcie wszystkich przypisań → trasa pozostaje w systemie bez katalogów.

12. **Parsowanie pliku GPX**  
    a) GPX z pełnymi danymi (data, elevation, czas) → automatyczne wypełnienie pól.  
    b) GPX bez daty → możliwość ręcznego wprowadzenia daty.  
    c) Wielokrotne pliki GPX → poprawne łączenie danych.  
    d) Duży plik GPX (>10MB) → obsługa limitu rozmiaru.  
    e) GPX z niepełnymi danymi (brak elevation) → graceful degradation.

13. **Bezpieczeństwo RLS (Row Level Security)**  
    a) Użytkownik A nie może odczytać tras użytkownika B.  
    b) Użytkownik A nie może modyfikować katalogów użytkownika B.  
    c) Użytkownik A nie może usunąć profilu użytkownika B.  
    d) Próba bezpośredniego zapytania SQL omijającego RLS → brak dostępu.

## 5. Środowisko testowe

- **Środowisko Lokalne**: Uruchomienie aplikacji w trybie developerskim (Next.js + React) na maszynach deweloperskich przy użyciu `npm run dev`. Supabase uruchomione lokalnie przez Supabase CLI dla łatwego resetu danych i automatycznego aplikowania migracji (`supabase db reset`).
- **Środowisko Testowe**: Dedykowany serwer testowy z osobną instancją Supabase, oddzielną bazą danych oraz kontenerem Docker zapewniającym powtarzalność środowiska.
- **Integracja CI/CD**: Automatyczne uruchamianie testów w pipeline (GitHub Actions) – testy jednostkowe, integracyjne i e2e odpalane przy każdym pull requeście.

Dane testowe: Seed w Supabase (`_test_seed.sql`) z kontami demo i przykładowymi trasami.

## 6. Narzędzia do testowania

- **Vitest** – framework testów TS/JS, zamiennik Jest zoptymalizowany dla Vite.
- **@testing-library/react** – testowanie komponentów React.
- **@testing-library/jest-dom** – custom matchers dla asercji DOM.
- **@vitejs/plugin-react** – plugin Vitest dla React.
- **vitest-canvas-mock** – mock dla canvas (GPX parsing).
- **Playwright** – testy e2e z device emulation.
- **Lighthouse CI** – audyt PWA, performance, a11y.
- **k6** – testy obciążeniowe Supabase.
- **Zaproxy / OWASP ZAP** – skan bezpieczeństwa.
- **Mock Service Worker (MSW)** – stuby zewnętrznych zapytań HTTP.
- **Codecov** – raport pokrycia kodu.
- **Supabase CLI** – lokalne uruchamianie Supabase do testów integracyjnych.

## 7. Harmonogram testów

| Sprint    | Zadania QA                                                           | Kamienie milowe   | Cel pokrycia |
| --------- | -------------------------------------------------------------------- | ----------------- | ------------ |
| 1 (setup) | Konfiguracja narzędzi (Vitest, Playwright), skeleton testów, seed DB | pipeline CI green | -            |
| 2–4       | Testy jednostkowe auth, katalogi, parsowanie GPX                     | Release Alpha     | 40-50%       |
| 5–6       | E2E trasy + GPX, RLS tests, testy integracyjne                       | Beta freeze       | 60-70%       |
| 7         | Wydajność, bezpieczeństwo, accessibility, i18n                       | RC build          | 75-80%       |
| 8         | Regresja, smoke-test na produkcji                                    | Go-live           | 80%          |

## 8. Kryteria akceptacji testów

- Pokrycie kodu: 80 % logicznych gałęzi w `src/features` i `src/hooks`.
- Wszystkie testy na CI = green.
- Lighthouse PWA Score ≥ 90.
- Brak krytycznych lub wysokich błędów bezpieczeństwa (ZAP).
- Wydajność API:
  - Proste zapytania (GET): P95 < 200 ms
  - Złożone operacje (POST/PATCH z RPC): P95 < 500 ms
- A11y: brak naruszeń krytycznych (axe).
- Wszystkie testy RLS zakończone sukcesem (users izolowani).

## 9. Role i odpowiedzialności

| Rola        | Odpowiedzialność                                |
| ----------- | ----------------------------------------------- |
| QA Lead     | Plan testów, harmonogram, raporty jakości       |
| QA Engineer | Pisanie testów, review PR, obsługa Playwright   |
| Dev         | TDD, naprawa błędów, wsparcie mocków            |
| DevOps      | Utrzymanie CI/CD, monitoring wydajności         |
| PO          | Akceptacja kryteriów jakości, priorytety błędów |

## 10. Procedury raportowania błędów

1. **Zgłoszenie** – w GitHub Issues z tagiem `bug`, szablon: opis, kroki, oczekiwany/otrzymany rezultat, zrzuty ekranu/logi.
2. **Priorytetyzacja** – QA Lead przypisuje `severity` (blocker, major, minor) i `priority`.
3. **Reprodukcja** – Dev potwierdza, dodaje test jednostkowy/integracyjny.
4. **Naprawa** – PR z linkiem do issue, zielone pipeline’y.
5. **Weryfikacja** – QA zamyka issue po przejściu testu regresji.

## 11. Przyszłe fazy testowania (poza MVP)

Następujące obszary testowe zostaną uwzględnione w kolejnych iteracjach produktu, po wydaniu MVP:

### PWA Offline Mode

- Testy cache'owania zasobów przez Service Worker.
- Synchronizacja danych po przywróceniu połączenia.
- Możliwość przeglądania tras w trybie offline.
- Obsługa konfliktu danych (offline edit vs server state).

### Zaawansowane testy wydajnościowe

- Testy obciążeniowe z dużą liczbą użytkowników równoczesnych.
- Optymalizacja renderowania dużych list tras (virtualizacja).
- Testy wydajności parsowania bardzo dużych plików GPX (>50MB).

### Multimedia i zaawansowane funkcje

- Import i optymalizacja zdjęć z tras.
- Eksport danych do PDF.
- Wyświetlanie tras na interaktywnej mapie.

### Współdzielenie i współpraca

- Testy współdzielenia katalogów między użytkownikami.
- Testy współdzielenia tras.
- Obsługa konfliktów przy edycji współdzielonych danych.

---

Plan ten zapewnia pełne pokrycie kluczowych obszarów funkcjonalnych i niefunkcjonalnych projektu Pathly w ramach MVP, minimalizując ryzyko i gwarantując wysoką jakość produktu końcowego.
