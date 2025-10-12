<conversation_summary>
<decisions>
Uwierzytelnianie: W ramach MVP system kont użytkowników będzie oparty o e-mail i hasło. Logowanie przez dostawców zewnętrznych (np. Google) nie będzie implementowane. Użytkownik będzie miał możliwość zmiany hasła i usunięcia konta.
Odzyskiwanie Hasła: Funkcjonalność odzyskiwania zapomnianego hasła zostanie zaimplementowana w wersji post-MVP.
Walidacja GPX: Aplikacja będzie walidować pliki GPX zarówno po stronie klienta, jak i serwera przy użyciu gotowych bibliotek. W przypadku nieprawidłowego pliku użytkownik otrzyma stosowny komunikat o błędzie.
Katalogi Domyślne: Aplikacja będzie zawierać 4 predefiniowane, nieusuwalne katalogi dla odznak: Popularna, Mała Brązowa, Mała Srebrna i Mała Złota. Będą one zawierać podsumowanie punktów oraz skrócone zasady z regulaminu PTTK. Katalog "Korona Gór Polski" nie wchodzi w zakres MVP.
Weryfikacja Regulaminu GOT: Aplikacja nie będzie automatycznie weryfikować zgodności z warunkami czasowymi regulaminu GOT (np. zdobywanie odznaki w ciągu dwóch lat). Zamiast tego, w katalogu odznaki małej brązowej zostanie umieszczona stosowna informacja dla użytkownika.
Tryb Offline: Aplikacja jest przeznaczona do użytku online i w ramach MVP nie będzie posiadać funkcjonalności offline.
Prywatność i Onboarding: Jako projekt typu "pet project", w ramach MVP nie będą tworzone rozbudowane polityki prywatności ani proces onboardingu użytkownika.
Mierzenie Sukcesu: Kryteria sukcesu będą mierzone poprzez analizę danych z dedykowanej tabeli w bazie danych przechowującej logi zdarzeń. W MVP nie będą implementowane zewnętrzne narzędzia analityczne.
Edycja Tras: Użytkownik będzie mógł edytować wszystkie ręcznie wprowadzone dane trasy (nazwa, punkty, notatki) po jej zapisaniu. Plik GPX i dane z niego wyliczone nie będą podlegały edycji.
Obsługa Wielu Plików GPX: W ramach jednej "trasy" będzie możliwe wczytanie wielu plików GPX. Statystyki takie jak dystans, przewyższenia i czas będą sumowane ze wszystkich wgranych plików. Data trasy będzie odczytywana z tagu <time> w pliku GPX; w przypadku jego braku, użytkownik będzie mógł wprowadzić datę ręcznie.
Duplikaty Tras: Obsługa potencjalnych duplikatów tras (wgrywanie trasy z tą samą datą) zostanie zaimplementowana w wersji post-MVP.
</decisions>
<matched_recommendations>
Przypisywanie Trasy do Katalogów: Zaimplementowany zostanie proces, w którym po wgraniu GPX i wprowadzeniu danych, użytkownik widzi listę swoich katalogów (w formie checkboxów) i może przypisać trasę do wielu z nich jednocześnie.
Właściwości Katalogów Domyślnych: Potwierdzono, że domyślne katalogi odznak będą stałe, nieusuwalne i będą stanowić rdzeń systemu odznak, podczas gdy katalogi użytkownika zapewnią pełną swobodę personalizacji.
Priorytetyzacja MVP: Potwierdzono kluczową ścieżkę użytkownika ("walking skeleton") jako: Rejestracja/logowanie -> stworzenie katalogu -> dodanie trasy z GPX -> przypisanie do katalogów. Inne funkcje MVP mają niższy priorytet.
Możliwość Edycji Danych: Zapewniona zostanie kluczowa dla użyteczności funkcja edycji ręcznie wprowadzonych danych trasy (nazwa, punkty, notatki).
Link do Regulaminu: W aplikacji zostanie dodany link do oficjalnego regulaminu punktacji PTTK oraz map turystycznych, aby wspomóc użytkowników w poprawnym wprowadzaniu punktów.
</matched_recommendations>
<prd_planning_summary>
Celem MVP aplikacji Pathly jest umożliwienie użytkownikom śledzenia tras górskich w kontekście odznak GOT PTTK (Popularna i Małe) oraz tworzenia własnych, spersonalizowanych katalogów.
Główne wymagania funkcjonalne produktu:
System uwierzytelniania oparty na e-mailu i haśle (z możliwością zmiany hasła i usunięcia konta).
Cztery predefiniowane, stałe katalogi dla odznak: Popularna, Mała Brązowa, Mała Srebrna i Mała Złota, zawierające sumę punktów i podstawowe informacje z regulaminu.
Pełna funkcjonalność CRUD (Create, Read, Update, Delete) dla tras oraz katalogów tworzonych przez użytkownika.
Możliwość dodania trasy poprzez wgranie jednego lub wielu plików GPX, z sumowaniem statystyk (dystans, czas, przewyższenia).
Automatyczne obliczanie na podstawie GPX: daty (z tagu <time> lub wprowadzanej ręcznie), długości trasy, sumy podejść/zejść i czasu.
Ręczne wprowadzanie przez użytkownika: nazwy trasy, liczby punktów GOT i opcjonalnych notatek.
Możliwość edycji danych wprowadzonych ręcznie.
Interfejs użytkownika w języku polskim i angielskim z opcją motywu jasnego, ciemnego i systemowego.
Aplikacja działająca jako PWA (Progressive Web App).
Kluczowe historie użytkownika i ścieżki korzystania:
Rejestracja i logowanie: Jako nowy użytkownik, chcę założyć konto używając e-maila i hasła, aby móc zapisywać swoje trasy i katalogi.
Dodawanie trasy: Jako zalogowany użytkownik, chcę wgrać plik(i) GPX, dodać nazwę i punkty, a następnie przypisać nową trasę do jednego lub wielu moich katalogów (zarówno domyślnych, jak i własnych) za jednym razem.
Zarządzanie katalogami: Jako zalogowany użytkownik, chcę tworzyć własne katalogi (np. "Ulubione"), przeglądać je, edytować ich nazwy oraz usuwać je.
Przeglądanie postępów: Jako użytkownik zdobywający odznaki, chcę wejść w predefiniowany katalog odznaki (np. "Mała Brązowa"), aby zobaczyć sumę zdobytych punktów i przypomnieć sobie zasady jej zdobywania.
Ważne kryteria sukcesu i sposoby ich mierzenia:
Cel 1: 90% zarejestrowanych użytkowników posiada co najmniej 1 katalog tras (własny lub domyślny z przypisaną trasą).
Cel 2: 80% zarejestrowanych użytkowników posiada co najmniej 2 trasy w przynajmniej jednym katalogu.
Sposób pomiaru: Analiza danych zbieranych w dedykowanej tabeli bazy danych, która będzie logować kluczowe akcje użytkowników (utworzenie konta, dodanie trasy, utworzenie katalogu, przypisanie trasy do katalogu).
</prd_planning_summary>
<unresolved_issues>
Wszystkie kwestie poruszone w poprzednich iteracjach zostały wyjaśnione i uwzględnione w powyższym podsumowaniu.
</unresolved_issues>
</conversation_summary>
