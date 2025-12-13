<architecture_analysis>

1.  **Komponenty wymienione w specyfikacji:**
    - **Layouts**: `PublicLayout` (nowy), `PrivateLayout` (istniejący z Sidebar/Header).
    - **Strony (Next.js Pages)**:
      - `LoginPage` (US-002)
      - `RegisterPage` (US-001)
      - `ForgotPasswordPage` (US-004)
      - `ResetPasswordPage`
      - `ProfileSettingsPage` (US-004, US-005)
    - **Komponenty (Client Features)**:
      - `LoginForm`
      - `RegisterForm`
      - `ForgotPasswordForm`
      - `ResetPasswordForm`
      - `ChangePasswordForm` (w Ustawieniach)
      - `DeleteAccountDialog` (w Ustawieniach)
    - **Logika**:
      - `auth.actions.ts` (Server Actions)
      - `middleware.ts` (Ochrona i przekierowania)
      - `SupabaseClient` (SSR/Client)

2.  **Strony i ich główne komponenty:**
    - `/login` -> `LoginForm`
    - `/register` -> `RegisterForm`
    - `/forgot-password` -> `ForgotPasswordForm`
    - `/settings/profile` -> `ChangePasswordForm`, `DeleteAccountDialog`

3.  **Przepływ danych:**
    - Formularze (Client) -> Server Actions (Server) -> Supabase Auth (External).
    - Supabase Auth -> Callback/Cookie -> Middleware -> Strona/Layout.

4.  **Funkcjonalność komponentów:**
    _ `LoginForm`: Pobiera dane, waliduje (Zod), wywołuje `loginAction`.
    _ `RegisterForm`: Waliduje hasła, wywołuje `registerAction`.
    _ `DeleteAccountDialog`: Wymaga potwierdzenia, wywołuje krytyczną akcję usunięcia.
    _ `PublicLayout`: Zapewnia kontener dla stron auth (centrowanie).
    </architecture_analysis>

<mermaid_diagram>

```mermaid
flowchart TD
    %% Definicja stylów
    classDef page fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef component fill:#fff9c4,stroke:#fbc02d,stroke-width:2px;
    classDef logic fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef external fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;

    %% Aktorzy i wejście
    User((Użytkownik))
    Browser[Przeglądarka]

    subgraph "Next.js App Router"
        Middleware[Middleware]:::logic

        subgraph "Layout Publiczny (Auth)"
            PublicLayout[Public Layout]:::page
            LoginPage[Strona Logowania]:::page
            RegisterPage[Strona Rejestracji]:::page
            ForgotPage[Strona Odzyskiwania]:::page
        end

        subgraph "Layout Prywatny (App)"
            PrivateLayout[Private Layout]:::page
            DashboardPage[Dashboard]:::page
            SettingsPage[Ustawienia]:::page
        end

        subgraph "Auth Feature (Client Components)"
            LoginForm[LoginForm]:::component
            RegisterForm[RegisterForm]:::component
            ForgotForm[ForgotPasswordForm]:::component
            ChangePassForm[ChangePasswordForm]:::component
            DeleteDialog[DeleteAccountDialog]:::component
        end

        subgraph "Backend Logic (Server)"
            AuthActions[[Server Actions]]:::logic
            Validation[Walidacja Zod]:::logic
        end
    end

    subgraph "External Services"
        SupabaseAuth[Supabase Auth]:::external
        Database[(Baza Danych)]:::external
    end

    %% Połączenia
    User --> Browser
    Browser --> Middleware

    %% Routing Middleware
    Middleware -- "Brak Sesji" --> PublicLayout
    Middleware -- "Sesja Aktywna" --> PrivateLayout

    %% Struktura Stron
    PublicLayout --> LoginPage & RegisterPage & ForgotPage
    PrivateLayout --> DashboardPage & SettingsPage

    %% Osadzanie Komponentów
    LoginPage --> LoginForm
    RegisterPage --> RegisterForm
    ForgotPage --> ForgotForm
    SettingsPage --> ChangePassForm & DeleteDialog

    %% Logika Formularzy
    LoginForm & RegisterForm & ForgotForm & ChangePassForm & DeleteDialog --> AuthActions

    %% Przetwarzanie Backendowe
    AuthActions --> Validation
    Validation --> SupabaseAuth

    %% Interakcje z Bazą
    SupabaseAuth <--> Database
    AuthActions -.->|"Zarządzanie Ciasteczkami"| Browser

    %% Linkowanie między formularzami
    LoginForm -.->|"Link do"| RegisterPage
    LoginForm -.->|"Link do"| ForgotPage
    RegisterPage -.->|"Link do"| LoginPage
```

</mermaid_diagram>
