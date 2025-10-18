# Dokument wymagań produktu (PRD) - Pathly

## 1. Przegląd produktu

Pathly to progresywna aplikacja webowa (PWA) zaprojektowana z myślą o entuzjastach turystyki górskiej. Jej głównym celem jest pomoc w procesie zdobywania Górskiej Odznaki Turystycznej (GOT) PTTK na poziomie Małym (Popularna, Brązowa, Srebrna, Złota) poprzez ułatwienie zliczania punktów oraz śledzenia unikalnych tras przebytych w ramach jednej odznaki. Aplikacja nie zastępuje oficjalnej, papierowej książeczki GOT PTTK, która jest jedynym dokumentem uprawniającym do weryfikacji odznaki, lecz stanowi dla niej cyfrowe wsparcie. Aplikacja umożliwia również tworzenie i zarządzanie spersonalizowanymi katalogami tras, dostosowanymi do indywidualnych potrzeb użytkownika (np. "Ulubione trasy", "Wycieczki z dziećmi").

Kluczową funkcjonalnością aplikacji jest importowanie danych z plików GPX, co pozwala na automatyczne obliczenie podstawowych parametrów trasy, takich jak data, dystans, suma podejść i zejść oraz czas przejścia. Użytkownik uzupełnia te dane o informacje wymagane przez regulamin GOT, takie jak liczba punktów, oraz może dodać własne notatki.

Aplikacja jest skierowana zarówno do nowoczesnych turystów, obeznanych z technologią i aplikacjami do śledzenia aktywności, jak i do doświadczonych zdobywców odznak PTTK, którzy cenią sobie szybkość i wygodę cyfrowego zarządzania swoimi osiągnięciami.

## 2. Problem użytkownika

Obecnie turyści górscy, a w szczególności osoby ubiegające się o odznaki GOT PTTK, napotykają na szereg wyzwań związanych z dokumentowaniem swoich wędrówek. Prowadzenie oficjalnej, papierowej książeczki GOT jest obowiązkowe, ale bywa kłopotliwe w terenie i podatne na błędy przy ręcznym sumowaniu punktów czy sprawdzaniu, czy dana trasa nie została już przebyta w ramach tej samej odznaki.

Główne problemy, które Pathly ma rozwiązać, to:

- Brak zautomatyzowanego sposobu na przenoszenie danych o przebytej trasie (dystans, przewyższenia, czas) do cyfrowej ewidencji pomocniczej.
- Konieczność ręcznego sumowania punktów i pilnowania limitów wymaganych przez regulamin odznaki.
- Trudność w elastycznym kategoryzowaniu i wyszukiwaniu przebytych tras według własnych kryteriów (np. trasy odpowiednie dla rodzin, ulubione szlaki).
- Ryzyko utraty pomocniczych notatek i obliczeń w przypadku zgubienia lub zniszczenia papierowej dokumentacji.

Pathly ma na celu zaoferowanie prostej, intuicyjnej i zintegrowanej platformy, która stanowi cyfrowe uzupełnienie dla oficjalnej książeczki GOT, czyniąc proces dokumentowania górskich wędrówek przyjemniejszym i bardziej efektywnym.

## 3. Wymagania funkcjonalne

### 3.1. System kont użytkowników

- Uwierzytelnianie oparte na adresie e-mail i haśle.
- Możliwość bezpiecznej rejestracji nowego użytkownika.
- Możliwość zalogowania i wylogowania się.
- Możliwość zmiany hasła przez zalogowanego użytkownika.
- Możliwość usunięcia swojego konta i wszystkich powiązanych z nim danych.

### 3.2. Internacjonalizacja i personalizacja

- Interfejs użytkownika dostępny w języku polskim i angielskim.
- Możliwość wyboru motywu graficznego: jasny, ciemny lub zsynchronizowany z ustawieniami systemu operacyjnego.

### 3.3. Katalogi

- Każdy użytkownik posiada własny, niezależny zestaw katalogów.
- Każdemu użytkownikowi po rejestracji tworzone są cztery predefiniowane, nieusuwalne katalogi odpowiadające odznakom GOT PTTK: Popularna, Mała Brązowa, Mała Srebrna i Mała Złota.
- W predefiniowanych katalogach wyświetlane jest podsumowanie zdobytych punktów oraz skrócone zasady dotyczące zdobywania danej odznaki.
- Użytkownik ma pełną funkcjonalność CRUD (Create, Read, Update, Delete) dla swoich własnych, nie predefiniowanych katalogów.

### 3.4. Trasy

- Pełna funkcjonalność CRUD dla tras.
- Dodawanie nowej trasy poprzez wgranie jednego lub wielu plików w formacie GPX.
- Automatyczne parsowanie plików GPX w celu uzyskania danych:
  - Data przebycia trasy (z tagu `<time>`).
  - Długość trasy.
  - Suma podejść i zejść.
  - Czas przejścia.
- W przypadku braku daty w pliku GPX, użytkownik ma możliwość wprowadzenia jej ręcznie.
- Ręczne wprowadzanie danych przez użytkownika:
  - Nazwa trasy.
  - Liczba punktów GOT.
  - Opcjonalne przypisanie jednej lub wielu grup górskich do trasy.
  - Opcjonalne notatki.
- Możliwość przypisania jednej trasy do wielu katalogów (zarówno predefiniowanych, jak i własnych) w momencie jej tworzenia oraz późniejszej edycji.
- Możliwość edycji danych wprowadzonych ręcznie po zapisaniu trasy. Plik GPX i dane z niego wyliczone nie podlegają edycji.

### 3.5. Analityka i metryki

- System będzie zbierał anonimowe dane dotyczące kluczowych akcji użytkowników (utworzenie konta, dodanie trasy, utworzenie katalogu, przypisanie trasy do katalogu).
- Dane będą przechowywane w dedykowanej tabeli w bazie danych w celu umożliwienia analizy i weryfikacji metryk sukcesu zdefiniowanych w produkcie.

### 3.6. Pozostałe

- Aplikacja musi działać jako Progresywna Aplikacja Webowa (PWA), umożliwiając instalację na urządzeniach mobilnych i desktopowych.
- Walidacja plików GPX po stronie klienta i serwera w celu zapewnienia poprawności danych.
- W aplikacji zostanie umieszczony link do oficjalnego regulaminu GOT PTTK, aby ułatwić użytkownikom prawidłowe przyznawanie punktów.

## 4. Granice produktu

Następujące funkcjonalności nie wchodzą w zakres wersji MVP (Minimum Viable Product) i mogą zostać rozważone w przyszłych iteracjach produktu:

- `Uwierzytelnianie:` Logowanie za pośrednictwem zewnętrznych dostawców (np. Google, Facebook).
- `Odzyskiwanie hasła:` Funkcjonalność "zapomniałem hasła".
- `Współpraca:` Współdzielenie katalogów lub tras z innymi użytkownikami.
- `Wizualizacja:` Wyświetlanie przebytej trasy na interaktywnej mapie.
- `Alternatywne wprowadzanie tras:` Możliwość ręcznego rysowania przebytej trasy na mapie jako alternatywa dla importu pliku GPX.
- `Multimedia:` Zaawansowana obsługa i analiza multimediów (np. dodawanie zdjęć do tras).
- `Eksport:` Eksport danych o trasach i katalogach do formatów zewnętrznych (np. PDF).
- `Zakres odznak:` Obsługa odznak GOT PTTK Dużych, Za Wytrwałość oraz odznaki Korony Gór Polski.
- `Walidacja regulaminu:` Automatyczna weryfikacja zgodności z warunkami czasowymi regulaminu GOT (np. zdobywanie odznaki w ciągu maksymalnie dwóch lat).
- `Tryb offline:` Możliwość korzystania z aplikacji bez aktywnego połączenia z internetem.
- `Analityka:` Integracja z zewnętrznymi narzędziami analitycznymi do śledzenia zachowań użytkowników.
- `Obsługa duplikatów:` Mechanizmy wykrywania i obsługi potencjalnych duplikatów tras.
- `Trasy:` Edycja plików GPX w trasach.

## 5. Historyjki użytkowników

### Uwierzytelnianie i zarządzanie kontem

- ID: US-001
- Tytuł: Rejestracja nowego konta
- Opis: Jako nowy użytkownik, chcę móc założyć konto za pomocą mojego adresu e-mail i hasła, abym mógł bezpiecznie przechowywać swoje trasy i katalogi.
- Kryteria akceptacji:
  - Formularz rejestracji zawiera pola na adres e-mail, hasło i potwierdzenie hasła.
  - Hasło musi mieć co najmniej 8 znaków.
  - System waliduje, czy podany e-mail nie jest już zarejestrowany.
  - Po pomyślnej rejestracji użytkownik jest automatycznie logowany i przekierowywany do głównego panelu aplikacji.
  - Po przekierowaniu, użytkownik widzi pustą listę swoich katalogów oraz listę predefiniowanych katalogów GOT.

- ID: US-002
- Tytuł: Logowanie do aplikacji
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się do aplikacji przy użyciu mojego e-maila i hasła, aby uzyskać dostęp do moich danych.
- Kryteria akceptacji:
  - Formularz logowania zawiera pola na adres e-mail i hasło.
  - Po poprawnym wprowadzeniu danych użytkownik zostaje przekierowany do głównego panelu.
  - W przypadku błędnych danych wyświetlany jest stosowny komunikat.

- ID: US-003
- Tytuł: Wylogowanie z aplikacji
- Opis: Jako zalogowany użytkownik, chcę móc się wylogować, aby zapewnić bezpieczeństwo moich danych na współdzielonym urządzeniu.
- Kryteria akceptacji:
  - W interfejsie aplikacji znajduje się wyraźnie oznaczony przycisk/link do wylogowania.
  - Po kliknięciu użytkownik zostaje wylogowany i przekierowany na stronę logowania.

- ID: US-004
- Tytuł: Zmiana hasła
- Opis: Jako zalogowany użytkownik, chcę mieć możliwość zmiany mojego hasła, aby móc regularnie dbać o bezpieczeństwo konta.
- Kryteria akceptacji:
  - W ustawieniach konta dostępny jest formularz zmiany hasła.
  - Formularz wymaga podania starego hasła, nowego hasła i jego potwierdzenia.
  - Po pomyślnej zmianie użytkownik otrzymuje potwierdzenie.

- ID: US-005
- Tytuł: Usunięcie konta
- Opis: Jako użytkownik, chcę mieć możliwość trwałego usunięcia mojego konta i wszystkich powiązanych z nim danych, zgodnie z prawem do bycia zapomnianym.
- Kryteria akceptacji:
  - W ustawieniach konta znajduje się opcja usunięcia konta.
  - Przed usunięciem system wymaga potwierdzenia operacji (np. poprzez wpisanie hasła).
  - Po potwierdzeniu, konto i wszystkie dane (katalogi, trasy) są trwale usuwane z bazy danych.

### Personalizacja

- ID: US-006
- Tytuł: Zmiana języka interfejsu
- Opis: Jako użytkownik, chcę mieć możliwość zmiany języka aplikacji (polski/angielski), aby korzystać z niej w preferowanym przez siebie języku.
- Kryteria akceptacji:
  - W ustawieniach aplikacji znajduje się przełącznik języka.
  - Zmiana języka jest natychmiast odzwierciedlana we wszystkich elementach stałych interfejsu. Zmiana nie dotyczy treści wprowadzonych przez użytkownika (takich jak nazwy katalogów, nazwy tras czy notatki itp.).
  - Wybór języka jest zapamiętywany dla przyszłych sesji.

- ID: US-007
- Tytuł: Zmiana motywu kolorystycznego
- Opis: Jako użytkownik, chcę móc wybrać motyw kolorystyczny (jasny, ciemny, systemowy), aby dostosować wygląd aplikacji do moich preferencji i warunków oświetleniowych.
- Kryteria akceptacji:
  - W ustawieniach aplikacji dostępne są opcje wyboru motywu.
  - Zmiana motywu jest stosowana natychmiast w całej aplikacji.
  - Wybór motywu jest zapamiętywany dla przyszłych sesji.

### Zarządzanie katalogami

- ID: US-008
- Tytuł: Tworzenie nowego katalogu
- Opis: Jako zalogowany użytkownik, chcę móc stworzyć nowy, własny katalog, aby grupować trasy według moich indywidualnych kryteriów.
- Kryteria akceptacji:
  - Dostępny jest przycisk "Dodaj nowy katalog".
  - Po kliknięciu pojawia się formularz wymagający podania nazwy katalogu.
  - Nowo utworzony katalog pojawia się na liście moich katalogów.

- ID: US-009
- Tytuł: Przeglądanie listy katalogów
- Opis: Jako zalogowany użytkownik, chcę widzieć listę wszystkich moich katalogów (własnych i predefiniowanych), aby mieć szybki dostęp do moich tras.
- Kryteria akceptacji:
  - Główny widok aplikacji prezentuje listę katalogów.
  - Lista jest podzielona na katalogi predefiniowane (GOT) i stworzone przez użytkownika.
  - Przy każdym predefiniowanym katalogu widoczna jest suma zdobytych punktów.

- ID: US-010
- Tytuł: Edycja nazwy katalogu
- Opis: Jako zalogowany użytkownik, chcę móc edytować nazwę moich własnych katalogów, aby poprawić ewentualne błędy lub zmienić jego przeznaczenie.
- Kryteria akceptacji:
  - Na liście katalogów użytkownika, przy każdym z nich, znajduje się opcja edycji.
  - Edycja nazwy katalogów predefiniowanych nie jest możliwa.
  - Po zapisaniu zmian, nowa nazwa jest widoczna na liście.

- ID: US-011
- Tytuł: Usuwanie katalogu
- Opis: Jako zalogowany użytkownik, chcę móc usunąć mój własny katalog, gdy nie jest mi już potrzebny.
- Kryteria akceptacji:
  - Przy każdym własnym katalogu dostępna jest opcja usunięcia.
  - System prosi o potwierdzenie przed trwałym usunięciem katalogu.
  - Usunięcie katalogu nie powoduje usunięcia zawartych w nim tras (trasy zostają odpięte od tego katalogu).
  - Katalogi predefiniowane nie mogą być usunięte.

- ID: US-012
- Tytuł: Przeglądanie katalogu predefiniowanego
- Opis: Jako użytkownik zdobywający odznakę, chcę wejść w predefiniowany katalog (np. "Mała Brązowa"), aby zobaczyć sumę zdobytych punktów, listę przypisanych tras oraz przypomnieć sobie zasady.
- Kryteria akceptacji:
  - Po kliknięciu w predefiniowany katalog, widzę jego nazwę, sumę punktów, skrócone zasady oraz listę tras.
  - Elementy wizualne tego katalogu (np. nazwa) nie są edytowalne.

- ID: US-013
- Tytuł: Przeglądanie katalogu własnego
- Opis: Jako użytkownik, chcę wejść w stworzony przez siebie katalog (np. "Ulubione"), aby zobaczyć listę przypisanych do niego tras.
- Kryteria akceptacji:
  - Po kliknięciu w katalog stworzony przez użytkownika, widzę jego nazwę oraz listę przypisanych do niego tras.
  - Z poziomu tego widoku mam możliwość edycji i usunięcia katalogu.

### Zarządzanie trasami

- ID: US-014
- Tytuł: Dodawanie nowej trasy
- Opis: Jako zalogowany użytkownik, chcę dodać nową trasę poprzez wgranie pliku GPX i uzupełnienie danych, aby zapisać moją wędrówkę w systemie.
- Kryteria akceptacji:
  - Formularz dodawania trasy pozwala na wgranie jednego lub wielu plików GPX.
  - Po wgraniu pliku(ów) pola (data, dystans, przewyższenia, czas) są automatycznie uzupełniane, jeśli dane są dostępne w GPX.
  - Użytkownik musi ręcznie wypełnić pola: nazwa trasy, punkty GOT.
  - Użytkownik może opcjonalnie wybrać jedną lub więcej grup górskich z listy.
  - Pole na notatki jest opcjonalne i wypełniane ręcznie przez użytkownika.
  - W formularzu znajduje się lista wszystkich moich katalogów (w formie checkboxów), pozwalająca na przypisanie trasy do wielu z nich jednocześnie.
  - Po zapisaniu, trasa pojawia się na listach tras w wybranych katalogach.

- ID: US-015
- Tytuł: Przeglądanie listy tras w katalogu
- Opis: Jako użytkownik, chcę zobaczyć listę wszystkich tras przypisanych do danego katalogu, aby móc przeglądać moje osiągnięcia.
- Kryteria akceptacji:
  - Po wejściu do katalogu wyświetlana jest lista tras.
  - Każdy element listy zawiera podstawowe informacje o trasie (nazwa, data, punkty).

- ID: US-016
- Tytuł: Przeglądanie szczegółów trasy
- Opis: Jako użytkownik, chcę móc zobaczyć wszystkie szczegóły zapisanej trasy, aby przeanalizować jej parametry.
- Kryteria akceptacji:
  - Po kliknięciu na trasę z listy, przechodzę do widoku szczegółowego.
  - Widok szczegółowy prezentuje wszystkie dane: nazwę, datę, punkty, grupy górskie, notatki oraz statystyki z GPX (dystans, przewyższenia, czas).

- ID: US-017
- Tytuł: Edycja danych trasy
- Opis: Jako zalogowany użytkownik, chcę mieć możliwość edycji ręcznie wprowadzonych danych trasy (nazwa, punkty, notatki, grupy górskie), aby poprawić ewentualne błędy.
- Kryteria akceptacji:
  - W widoku szczegółów trasy znajduje się przycisk "Edytuj".
  - Pola, które można edytować to: nazwa, punkty GOT, grupy górskie, notatki.
  - Dane wyliczone z GPX oraz sam plik GPX nie podlegają edycji.
  - Zmienione dane są zapisywane i widoczne w szczegółach trasy i na listach.

- ID: US-018
- Tytuł: Zmiana przypisania trasy do katalogów
- Opis: Jako użytkownik, chcę móc zmienić, do których katalogów jest przypisana istniejąca trasa, abym mógł elastycznie zarządzać moimi danymi.
- Kryteria akceptacji:
  - W widoku edycji trasy dostępna jest lista moich katalogów (w formie checkboxów).
  - Lista odzwierciedla aktualne przypisanie trasy.
  - Użytkownik może zaznaczyć/odznaczyć dowolny katalog.
  - Po zapisaniu zmian, trasa pojawia się lub znika z odpowiednich list tras w katalogach.

- ID: US-019
- Tytuł: Usuwanie trasy
- Opis: Jako zalogowany użytkownik, chcę móc usunąć trasę, jeśli została dodana przez pomyłkę lub nie chcę jej dłużej przechowywać.
- Kryteria akceptacji:
  - W widoku szczegółów trasy (lub na liście) znajduje się opcja "Usuń".
  - System prosi o potwierdzenie przed trwałym usunięciem trasy.
  - Po usunięciu trasa znika ze wszystkich katalogów i jest trwale usuwana z bazy danych.

### Scenariusze brzegowe i błędy

- ID: US-020
- Tytuł: Obsługa nieprawidłowego pliku GPX
- Opis: Jako użytkownik próbujący dodać trasę, w przypadku wgrania uszkodzonego lub niepoprawnego pliku GPX, chcę otrzymać czytelny komunikat o błędzie.
- Kryteria akceptacji:
  - System waliduje wgrywany plik GPX.
  - Jeśli plik jest nieprawidłowy, formularz dodawania trasy nie zostaje przetworzony.
  - Użytkownik widzi komunikat informujący o problemie z plikiem.

- ID: US-021
- Tytuł: Widok pustej listy katalogów
- Opis: Jako nowy użytkownik, który nie stworzył jeszcze żadnego własnego katalogu, chcę zobaczyć czytelny komunikat i zachętę do działania.
- Kryteria akceptacji:
  - Na liście katalogów, w sekcji "moje katalogi", jeśli lista jest pusta, wyświetlany jest komunikat (np. "Nie masz jeszcze żadnych własnych katalogów. Stwórz pierwszy!") oraz przycisk do tworzenia katalogu.

- ID: US-022
- Tytuł: Widok pustej listy tras
- Opis: Jako użytkownik, który wszedł do pustego katalogu, chcę zobaczyć informację o braku tras i zachętę do ich dodania.
- Kryteria akceptacji:
  - Po wejściu do katalogu, który nie zawiera żadnych tras, wyświetlany jest komunikat (np. "Ten katalog jest pusty. Dodaj swoją pierwszą trasę!") oraz przycisk do dodawania trasy.

### Pozostałe

- ID: US-023
- Tytuł: Instalacja aplikacji jako PWA
- Opis: Jako użytkownik, chcę mieć możliwość zainstalowania aplikacji na moim urządzeniu (telefonie lub komputerze), aby mieć do niej szybki dostęp z ekranu głównego.
- Kryteria akceptacji:
  - Aplikacja spełnia techniczne wymogi PWA (Service Worker, Manifest).
  - Przeglądarka internetowa na wspieranych urządzeniach wyświetla monit z propozycją instalacji aplikacji.
  - Po instalacji, aplikacja posiada własną ikonę i uruchamia się w dedykowanym oknie.

## 6. Metryki sukcesu

Kryteria sukcesu dla wersji MVP będą mierzone za pomocą analizy danych gromadzonych w dedykowanej tabeli w bazie danych, która będzie rejestrować kluczowe akcje użytkowników. Pozwoli to na ocenę zaangażowania bez implementacji zewnętrznych narzędzi analitycznych.

- Cel 1: Adopcja katalogów
  - Metryka: 90% zarejestrowanych użytkowników posiada co najmniej 1 katalog tras (własny lub domyślny z przypisaną trasą).
  - Uzasadnienie: Wskazuje, że użytkownicy rozumieją i korzystają z kluczowej funkcji personalizacji lub domyślnych katalogów GOT.

- Cel 2: Aktywne użytkowanie
  - Metryka: 80% zarejestrowanych użytkowników dodało co najmniej dwie trasy do przynajmniej jednego katalogu.
  - Uzasadnienie: Potwierdza, że główna funkcja aplikacji – dodawanie i katalogowanie tras – jest aktywnie wykorzystywana, a aplikacja dostarcza realną wartość.
