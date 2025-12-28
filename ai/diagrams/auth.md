<authentication_analysis>

1.  **Przepływy autentykacji:**
    - Dostęp do trasy chronionej (z/bez sesji).
    - Logowanie (Login).
    - Rejestracja (Register).
    - Wylogowanie (Logout).
    - Odświeżanie sesji (Middleware).

2.  **Główni aktorzy:**
    - **User/Browser**: Interfejs użytkownika, inicjator akcji.
    - **Middleware**: Warstwa pośrednia Next.js (ochrona tras, odświeżanie sesji).
    - **Server Actions**: Backendowa logika Next.js (obsługa formularzy, komunikacja z Supabase).
    - **Supabase Auth**: Dostawca tożsamości (baza użytkowników, tokeny).
    - **Database**: Baza danych PostgreSQL (profile, dane biznesowe).

3.  **Procesy weryfikacji i odświeżania:**
    - Middleware sprawdza token przy każdym żądaniu (poza statycznymi).
    - `supabase.auth.getUser()` weryfikuje token i odświeża go w razie potrzeby (wspierane przez `@supabase/ssr`).
    - Ciasteczka `sb-*-auth-token` przechowują sesję.

4.  **Opis kroków:**
    _ Użytkownik wchodzi na stronę -> Middleware sprawdza sesję.
    _ Brak sesji na chronionej trasie -> Przekierowanie do logowania.
    _ Logowanie -> Server Action waliduje dane -> Supabase weryfikuje -> Ustawienie ciasteczka -> Przekierowanie.
    _ Rejestracja -> Server Action waliduje -> Supabase tworzy konto -> Opcjonalnie profil w DB -> Sesja/Przekierowanie.
    </authentication_analysis>

<mermaid_diagram>

```mermaid
sequenceDiagram
    autonumber
    participant U as User/Browser
    participant M as Middleware
    participant SA as Server Actions (Next.js)
    participant SB as Supabase Auth
    participant DB as Database

    Note over U, DB: Scenariusz 1: Dostęp do trasy chronionej (Brak sesji)
    U->>M: GET /dashboard
    activate M
    M->>SB: getUser() (Check Session)
    activate SB
    SB-->>M: null / error (No active session)
    deactivate SB
    M-->>U: Redirect /login
    deactivate M

    Note over U, DB: Scenariusz 2: Logowanie (Login Flow)
    U->>U: Wypełnienie formularza logowania
    U->>SA: POST loginAction(email, password)
    activate SA
    SA->>SA: Zod Validation
    alt Validation Failed
        SA-->>U: Return Error (Invalid Data)
    else Validation Passed
        SA->>SB: signInWithPassword(email, password)
        activate SB
        alt Credentials Invalid
            SB-->>SA: Error (Invalid login credentials)
            deactivate SB
            SA-->>U: Return Error (Błędne dane logowania)
        else Success
            activate SB
            SB-->>SA: Session { access_token, refresh_token }
            deactivate SB
            SA-->>U: Set-Cookie (sb-access-token), Redirect /dashboard
        end
    end
    deactivate SA

    Note over U, DB: Scenariusz 3: Dostęp do trasy chronionej (Z sesją)
    U->>M: GET /dashboard
    activate M
    M->>SB: getUser() (Verify/Refresh Token)
    activate SB
    SB-->>M: User Session Valid
    deactivate SB
    M-->>U: NextResponse.next() (Allow Access)
    deactivate M

    activate U
    U->>SA: Fetch Dashboard Data (Server Component)
    activate SA
    SA->>SB: getUser() (Double Check Context)
    activate SB
    SB-->>SA: User Context
    deactivate SB
    SA->>DB: Select Data (RLS applies user_id)
    activate DB
    DB-->>SA: Data
    deactivate DB
    SA-->>U: Render Page
    deactivate SA
    deactivate U

    Note over U, DB: Scenariusz 4: Rejestracja (Register Flow)
    U->>U: Wypełnienie formularza rejestracji
    U->>SA: POST registerAction(email, password)
    activate SA
    SA->>SA: Zod Validation
    SA->>SB: signUp(email, password)
    activate SB
    alt Email Taken
        SB-->>SA: Error (User already exists)
        SA-->>U: Return Error
    else Success
        SB->>DB: Create Auth User
        activate DB
        DB-->>SB: User Created
        deactivate DB
        SB-->>SA: Session / User

        par Create Profile
            SA->>DB: INSERT public.profiles (user_id)
        and Session Handling
            SA-->>U: Set-Cookie, Redirect /dashboard
        end
    end
    deactivate SB
    deactivate SA

    Note over U, DB: Scenariusz 5: Wylogowanie (Logout Flow)
    U->>SA: POST logoutAction()
    activate SA
    SA->>SB: signOut()
    activate SB
    SB-->>SA: Success
    deactivate SB
    SA-->>U: Clear Cookies, Redirect /login
    deactivate SA
```

</mermaid_diagram>
