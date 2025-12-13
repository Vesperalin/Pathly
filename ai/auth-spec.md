# Specyfikacja Techniczna Modułu Autentykacji

## 1. Architektura Interfejsu Użytkownika

### 1.1. Struktura Routingów i Layoutów

W celu odseparowania widoków publicznych od prywatnych, wykorzystana zostanie struktura "Route Groups" w Next.js.

- **Grupa Publiczna `(public)`**:
  - `src/app/[locale]/(public)/layout.tsx`: Layout centrujący zawartość (np. karta na środku ekranu), pozbawiony bocznego paska nawigacji i głównego nagłówka aplikacji.
  - `src/app/[locale]/(public)/login/page.tsx`: Strona logowania (US-002).
  - `src/app/[locale]/(public)/register/page.tsx`: Strona rejestracji (US-001).

- **Grupa Prywatna `(private)`** (Istniejąca):
  - `src/app/[locale]/(private)/layout.tsx`: Istniejący layout z Sidebar i Header. Wymaga dodania logiki przekierowania do `/login` w przypadku braku sesji (jeśli middleware przepuści żądanie).
  - `src/app/[locale]/(private)/settings/profile/page.tsx`: Rozszerzenie widoku ustawień o sekcję "Bezpieczeństwo" (Zmiana hasła US-004, Usuwanie konta US-005).

- **Callback**:
  - `src/app/auth/callback/route.ts`: API Route do obsługi wymiany kodu PKCE na sesję (wymagane przez Supabase SSR).

### 1.2. Komponenty Client-Side (Features)

Logika formularzy zostanie wydzielona do `src/features/auth/components`. Komponenty te będą oznaczone jako `"use client"`.

- `LoginForm`: Formularz z polami email/hasło. Obsługa błędów logowania (np. "Nieprawidłowe dane"). Link do rejestracji.
- `RegisterForm`: Formularz z polami email/hasło/potwierdź hasło. Walidacja zgodności haseł.
- `ChangePasswordForm`: Komponent w ustawieniach konta (wymaga podania starego hasła).
- `DeleteAccountDialog`: Modal (Alert Dialog) z potwierdzeniem usunięcia konta (wymaga wpisania hasła lub frazy potwierdzającej).

### 1.3. Walidacja i Obsługa Błędów (UI)

- **Biblioteki**: `react-hook-form` + `zod` + `@hookform/resolvers`.
- **Lokalizacja**: Wszystkie komunikaty błędów (np. "Hasło jest za krótkie", "E-mail jest wymagany") muszą być pobierane z plików tłumaczeń (`messages/pl/auth.json`, `messages/en/auth.json`) za pomocą `next-intl`.
- **Feedback**: Wykorzystanie komponentu `Toaster` do wyświetlania sukcesów (np. "Konto utworzone") oraz błędów API (np. "Użytkownik z tym e-mailem już istnieje").

## 2. Logika Backendowa

### 2.1. Server Actions

Zamiast tradycyjnych API Routes, wykorzystane zostaną **Server Actions** (Next.js 15) do obsługi mutacji. Zapewnia to lepszą integrację z formularzami i progresywne ulepszanie.

Lokalizacja: `src/features/auth/actions.ts`

- `loginAction(formData)`:
  - Walidacja Zod po stronie serwera.
  - Wywołanie `supabase.auth.signInWithPassword`.
  - W przypadku sukcesu: `redirect('/dashboard')`.
  - W przypadku błędu: zwrócenie obiektu błędu do formularza.
- `registerAction(formData)`:
  - Walidacja Zod.
  - Wywołanie `supabase.auth.signUp`.
  - Automatyczne logowanie po rejestracji (wymaga wyłączenia weryfikacji email w Supabase lub odpowiedniej konfiguracji).
  - Tworzenie wpisu w tabeli `profiles` oraz 4 predefiniowanych katalogów (GOT) (realizowane przez trigger w bazie danych `after insert on auth.users`).
  - W przypadku sukcesu: `redirect('/dashboard')`.
  - Obsługa przypadku "Użytkownik już istnieje".
- `logoutAction()`:
  - Wywołanie `supabase.auth.signOut`.
  - `redirect('/login')`.
- `updatePasswordAction(formData)`:
  - Wywołanie `supabase.auth.updateUser` (wymaga aktywnej sesji).
- `deleteAccountAction()`:
  - Wywołanie funkcji Supabase do usunięcia użytkownika.
  - Może wymagać specjalnych uprawnień lub użycia `supabase.rpc` / `supabase.functions` w zależności od konfiguracji RLS. Preferowane użycie `supabase.auth.admin.deleteUser` wewnątrz akcji serwerowej (z użyciem klucza Service Role tylko jeśli to absolutnie konieczne i bezpieczne) lub wywołanie autoryzowanego endpointu. Zgodnie z best practices Supabase, użytkownik może usunąć własne konto, jeśli RLS na to pozwala, lub poprzez dedykowaną funkcję RPC `delete_user()`.

### 2.2. Middleware (`src/middleware.ts`)

Istniejący middleware wymaga rozszerzenia logiki autoryzacji:

1.  **Odświeżanie sesji**: (Już zaimplementowane) - kluczowe dla Supabase SSR.
2.  **Ochrona tras**:
    - Jeśli użytkownik **nie jest zalogowany** i próbuje wejść na trasy chronione (np. `/dashboard`, `/routes` - wszystko poza `(public)`), następuje przekierowanie do `/login`.
    - Jeśli użytkownik **jest zalogowany** i próbuje wejść na `/login` lub `/register`, następuje przekierowanie do `/dashboard`.
3.  **Internacjonalizacja**: (Już zaimplementowane) - współpraca z `next-intl`.

### 2.3. Modele Danych i Walidacja

Plik: `src/features/auth/validation.ts`

- Schematy Zod (np. `LoginSchema`, `RegisterSchema`) współdzielone między klientem a serwerem.
- Reguły:
  - Hasło: min. 8 znaków (zgodnie z US-001).
  - Email: poprawny format.

## 3. System Autentykacji (Supabase)

### 3.1. Konfiguracja Supabase Auth

- Wykorzystanie gotowego klienta w `src/lib/supabase/server.ts` oraz `client.ts`.
- Wymagane włączenie providera Email/Password w dashboardzie Supabase.
- Konfiguracja URL przekierowań (Site URL / Redirect URLs) w Supabase na `[DOMENA]/auth/callback`.
- **Weryfikacja Email**: Powinna być wyłączona dla MVP, aby umożliwić natychmiastowe logowanie po rejestracji (US-001), lub obsłużona w sposób nieblokujący dostępu.

### 3.2. Przepływ danych (Flow)

1.  **Rejestracja**: Formularz -> Server Action -> `supabase.auth.signUp` -> Utworzenie sesji -> Trigger DB (Profiles + Katalogi) -> Przekierowanie.
2.  **Logowanie**: Formularz -> Server Action -> `supabase.auth.signInWithPassword` -> Cookie z tokenem -> Przekierowanie.
3.  **Sesja**: Zarządzana przez ciasteczka `sb-*-auth-token`, odświeżana automatycznie przez middleware.
4.  **Wylogowanie**: Usunięcie ciasteczek sesyjnych przez `signOut`.
5.  **Usuwanie konta**:
    - Krytyczna operacja.
    - Wymaga usunięcia danych z tabel powiązanych (`profiles`, `routes`, `catalogs`) - najlepiej obsłużyć to przez `ON DELETE CASCADE` w bazie danych (PostgreSQL), co zapewni spójność danych bez konieczności ręcznego czyszczenia każdej tabeli w kodzie aplikacji.

### 3.3. Integracja z istniejącym kodem

- **Usunięcie `DEFAULT_USER_ID`**:
  - Obecnie w kodzie (m.in. w API routes i serwisach) używana jest stała `DEFAULT_USER_ID` zdefiniowana w `src/lib/supabase/client.ts` do symulowania zalogowanego użytkownika.
  - Należy ją całkowicie usunąć.
  - W każdym miejscu, gdzie była używana, należy pobrać ID aktualnego użytkownika z sesji Supabase:
    ```typescript
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;
    ```
  - Dotyczy to w szczególności plików:
    - `src/lib/supabase/client.ts` (usunięcie stałej)
    - `src/app/api/catalogs/route.ts`
    - `src/app/api/catalogs/[catalogId]/route.ts`
    - `src/app/api/catalogs/[catalogId]/routes/route.ts`
    - `src/app/api/routes/route.ts`
    - `src/app/api/routes/[routeId]/route.ts`
    - `src/app/api/profiles/me/route.ts`
    - `src/app/[locale]/(private)/settings/page.tsx`
- Wykorzystanie `useBreadcrumbs` nie jest wymagane na stronach auth.
- Integracja z `NextIntlClientProvider` w `layout.tsx` (publicznym) w celu zapewnienia tłumaczeń.
