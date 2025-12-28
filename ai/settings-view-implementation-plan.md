# Plan implementacji widoku Ustawień (`/settings`)

## 1. Przegląd

Widok "Ustawienia" to centrum zarządzania personalizacją aplikacji. **Na obecnym etapie deweloperskim sekcja "Bezpieczeństwo" (zmiana hasła, usunięcie konta) zostanie pominięta w implementacji.** Skupimy się na sekcji "Personalizacja", która będzie publicznie dostępna i będzie zapisywać swoje ustawienia (język, motyw) przy użyciu istniejących endpointów API. Cały interfejs musi być przetłumaczalny.

## 2. Routing widoku

Widok będzie dostępny pod ścieżką:

- **Ścieżka:** `/settings`

**Dostęp nie wymaga uwierzytelnienia.**

## 3. Struktura komponentów

Układ strony pozostaje ten sam, ale wszystkie komponenty będą korzystać z i18n.

```
<SettingsPage (Server Component)>
└── <SettingsView (Client Component)>
    ├── <PageHeader>
    │   ├── <Breadcrumbs /> (Teksty z `useTranslations`)
    │   └── <h1> (Tekst z `useTranslations`)
    ├── <Card> (Sekcja Personalizacji)
    │   ├── <CardHeader> (Tytuł i opis z `useTranslations`)
    │   ├── <CardContent>
    │   │   ├── <LanguageSwitcher /> (Etykiety z `useTranslations`)
    │   │   └── <ThemeSwitcher /> (Etykiety z `useTranslations`)
    ├── <Card> (Sekcja Bezpieczeństwa)
    │   ├── <CardHeader> (Tytuł i opis z `useTranslations`)
    │   ├── <CardContent>
    │   │   ├── <p> (Placeholder informujący, że funkcjonalność będzie dostępna po zalogowaniu)
```

## 4. Szczegóły komponentów

### `SettingsPage` (Komponent serwerowy - RSC)

- **Opis komponentu:** Główny komponent strony. Jego zadaniem jest pobranie po stronie serwera aktualnych ustawień profilu z `GET /api/profiles/me`, zakładając, że API obsłuży żądanie dla użytkownika-gościa.
- **Propsy:** Brak.

### `SettingsView` (Komponent kliencki)

- **Opis komponentu:** Otrzymuje początkowe dane profilu z serwera i zarządza interaktywnymi elementami, w tym wywołaniami `PATCH` do API.
- **Propsy:** `initialProfile: ProfileDto`.

### `LanguageSwitcher` / `ThemeSwitcher`

- **Opis komponentu:** Renderują opcje wyboru i wywołują `PATCH /api/profiles/me` w celu zapisania zmiany. Zastosują optymistyczną aktualizację UI dla natychmiastowej odpowiedzi interfejsu.
- **Propsy:** `currentValue: Language | Theme`.

### `ChangePasswordForm` / `DeleteAccountSection`

- **Opis komponentu:** **Te komponenty nie będą implementowane na obecnym etapie.** Zostaną zastąpione statycznym tekstem.

## 5. Typy

- **`ProfileDto`**: Istniejący typ dla danych profilu.
- **`UpdateProfileCommand`**: Istniejący typ do aktualizacji języka/motywu.
- **Pominięte:** `ChangePasswordViewModel`, `DeleteAccountViewModel`.

## 6. Zarządzanie stanem

- **Dane profilu:** Początkowe dane ładowane na serwerze. Do aktualizacji języka i motywu na kliencie zostanie użyty `useSWR` z opcją `optimisticUpdate`, aby interfejs reagował natychmiastowo, a w tle wysyłał żądanie do API.

## 7. Integracja API

- **Profil:**
  - `GET /api/profiles/me` (na serwerze)
  - `PATCH /api/profiles/me` (na kliencie do aktualizacji języka/motywu)
- **Pominięte endpointy:** `/api/auth/change-password`, `/api/auth/delete-account`.

## 8. Interakcje użytkownika

- **Zmiana języka/motywu:** Kliknięcie opcji natychmiast zmienia wygląd/język aplikacji (optymistycznie), a w tle wysyłane jest żądanie `PATCH` do API.
- **Interakcje związane z bezpieczeństwem:** **Niedostępne.**

## 9. Warunki i walidacja

- **Brak walidacji na tym etapie.**

## 10. Obsługa błędów

- **Błąd aktualizacji profilu:** Optymistyczna aktualizacja UI zostanie cofnięta, a użytkownik zobaczy przetłumaczony `Toast` z informacją o błędzie.

## 11. Kroki implementacji

1.  **Pominięcie API bezpieczeństwa:** Implementacja endpointów `change-password` i `delete-account` jest odroczona.
2.  **Pliki tłumaczeń:** Stworzyć `settings.json` z kluczami dla sekcji "Personalizacja" oraz tekstem zastępczym dla sekcji "Bezpieczeństwo".
3.  **Struktura plików:** Utworzyć plik `page.tsx` wewnątrz `src/app/[locale]/(private)/settings/`.
4.  **Komponent serwerowy:** W `SettingsPage` zaimplementować pobieranie danych z `GET /api/profiles/me`.
5.  **Komponenty personalizacji:** Zbudować `LanguageSwitcher` i `ThemeSwitcher` wraz z logiką optymistycznej aktualizacji przy użyciu `SWR` do wywołania `PATCH /api/profiles/me`.
6.  **Sekcja Bezpieczeństwo:** Zamiast formularzy, wyświetlić prosty tekst informujący, że te opcje będą dostępne po wdrożeniu logowania.
7.  **Testowanie:** Sprawdzić działanie przełączników języka i motywu, optymistyczną aktualizację, zapis danych przez API oraz obsługę błędów (np. przez symulację błędu sieci). Należy również zweryfikować poprawność wszystkich tłumaczeń.
