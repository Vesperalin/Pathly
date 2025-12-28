<user_journey_analysis>

1.  **Ścieżki użytkownika:**
    - **Niezalogowany (Gość)**: Próba dostępu do aplikacji -> Przekierowanie na Login -> Rejestracja lub Logowanie.
    - **Logowanie**: Formularz logowania -> Walidacja -> Przejście do Dashboardu.
    - **Rejestracja**: Formularz rejestracji -> Walidacja -> Utworzenie konta -> Automatyczne logowanie -> Dashboard.
    - **Odzyskiwanie hasła**: Zapomniane hasło -> Wpisanie emaila -> Link w emailu -> Ustawienie nowego hasła -> Logowanie.
    - **Zalogowany (Użytkownik)**: Korzystanie z Dashboardu/Tras -> Ustawienia -> Wylogowanie.
    - **Zarządzanie kontem**: Ustawienia -> Zmiana hasła lub Usunięcie konta.

2.  **Główne podróże i stany:**
    - **Strefa Publiczna**: Logowanie, Rejestracja, Reset hasła.
    - **Strefa Prywatna**: Dashboard (Katalogi/Trasy), Ustawienia.
    - **Decyzje**: Czy dane są poprawne? Czy użytkownik potwierdza usunięcie? Czy sesja jest aktywna?

3.  **Punkty decyzyjne:**
    - Start aplikacji: Czy jest sesja? (Middleware).
    - Logowanie/Rejestracja: Walidacja danych (Sukces/Błąd).
    - Usuwanie konta: Potwierdzenie (Tak/Nie).

4.  **Cel stanów:** \* _Sprawdzenie Sesji_: Routing początkowy. \* _Logowanie/Rejestracja_: Uzyskanie dostępu. \* _Dashboard_: Główna wartość biznesowa (trasy). \* _Ustawienia_: Zarządzanie bezpieczeństwem.
    </user_journey_analysis>

<mermaid_diagram>

```mermaid
stateDiagram-v2
    [*] --> SprawdzenieSesji: Wejście do aplikacji

    state if_sesja <<choice>>
    SprawdzenieSesji --> if_sesja
    if_sesja --> StrefaPubliczna: Brak sesji / Token wygasł
    if_sesja --> StrefaPrywatna: Sesja aktywna

    state "Strefa Publiczna (Auth)" as StrefaPubliczna {
        [*] --> Logowanie

        state "Logowanie" as Logowanie {
            InputLogowania: Wprowadzenie Email/Hasło
            WalidacjaLogowania: Weryfikacja po stronie serwera

            [*] --> InputLogowania
            InputLogowania --> WalidacjaLogowania: Kliknięcie "Zaloguj"
        }

        state "Rejestracja" as Rejestracja {
            InputRejestracji: Formularz rejestracji
            WalidacjaRejestracji: Sprawdzenie dostępności Email

            [*] --> InputRejestracji
            InputRejestracji --> WalidacjaRejestracji: Kliknięcie "Zarejestruj"
        }

        state "Odzyskiwanie Hasła" as Odzyskiwanie {
            InputEmail: Podanie adresu Email
            WyslanieLinku: Wysłanie maila resetującego
            ResetHasla: Formularz nowego hasła (z linku)

            [*] --> InputEmail
            InputEmail --> WyslanieLinku: Wyślij link
            WyslanieLinku --> ResetHasla: Kliknięcie w link z maila
            ResetHasla --> [*]: Zapisanie nowego hasła
        }

        Logowanie --> Rejestracja: Brak konta?
        Logowanie --> Odzyskiwanie: Zapomniałeś hasła?
        Rejestracja --> Logowanie: Masz już konto?

        state if_login_ok <<choice>>
        WalidacjaLogowania --> if_login_ok
        if_login_ok --> InputLogowania: Błąd danych

        state if_reg_ok <<choice>>
        WalidacjaRejestracji --> if_reg_ok
        if_reg_ok --> InputRejestracji: Błąd walidacji / Email zajęty
    }

    state "Strefa Prywatna (Aplikacja)" as StrefaPrywatna {
        [*] --> Dashboard

        state "Dashboard / Trasy" as Dashboard {
            ListaKatalogow: Przeglądanie katalogów
            SzczegolyTrasy: Widok szczegółów trasy

            [*] --> ListaKatalogow
            ListaKatalogow --> SzczegolyTrasy: Wybór trasy
            SzczegolyTrasy --> ListaKatalogow: Powrót
        }

        state "Ustawienia Konta" as Ustawienia {
            MenuUstawien: Profil i Bezpieczeństwo
            ZmianaHasla: Formularz zmiany hasła
            UsuwanieKonta: Dialog potwierdzenia

            [*] --> MenuUstawien
            MenuUstawien --> ZmianaHasla: Edytuj hasło
            MenuUstawien --> UsuwanieKonta: Usuń konto
        }

        Dashboard --> Ustawienia: Kliknięcie w awatar/menu
        Ustawienia --> Dashboard: Powrót
    }

    %% Przejścia między strefami
    if_login_ok --> StrefaPrywatna: Sukces logowania
    if_reg_ok --> StrefaPrywatna: Sukces rejestracji (Auto-login)
    Odzyskiwanie --> Logowanie: Powrót po zmianie hasła

    state "Wylogowanie" as Logout
    StrefaPrywatna --> Logout: Kliknięcie "Wyloguj"
    Logout --> StrefaPubliczna: Wyczyszczenie sesji

    state "Usunięcie Konta" as DeleteSuccess
    UsuwanieKonta --> DeleteSuccess: Potwierdzenie hasłem
    DeleteSuccess --> StrefaPubliczna: Trwałe usunięcie danych
```

</mermaid_diagram>
