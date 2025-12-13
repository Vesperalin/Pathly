# Aplikacja - Szlakownik (MVP)

## Główny problem

- Śledzenie przebytych tras górskich w ramach odznak GOT PTTK Małych oraz liczby zdobytych punktów w ramach tychże odznak.
- Własne katalogowanie przebytych tras dostosowanych pod swoje potrzeby (np. "Ulubione", "Łatwe - z dziećmi" itp.).

## Najmniejszy zestaw funkcjonalności

- Możliwość używania aplikacji w języku polskim i angielskim
- Możliwość ustawienia light mode, dark mode lub systemowy mode
- Prosty system kont użytkowników do powiązania użytkownika z katalogami i trasami
- Odczytywanie i przeglądanie predefiniowanych katalogów na przebyte trasy górskie w ramach odznak GOT PTTK Małych
- Zapisywanie, odczytywanie, przeglądanie i usuwanie katalogów na przebyte trasy
- Zapisywanie, odczytywanie, przeglądanie i usuwanie tras górskich do jednego lub wielu katalogów
  - Pojedyncza trasa będzie posiadać co najmniej:
    - Nazwę (np. "Palenica Białczańska - Morskie Oko") - przez użytkownika ręcznie
    - Wgrany plik przebytej trasy w formacie GPX - przez użytkownika ręcznie
    - Datę przebycia - wyliczane na podstawie GPX
    - Liczbę punktów (dla GOT PTTK Małej) - przez użytkownika ręcznie
    - Opcjonalne notatki - przez użytkownika ręcznie
    - Wyliczoną długość trasy, podejścia, zejścia i czas na podstawie pliku GPX - wyliczane na podstawie GPX
- Możliwość korzystania z aplikacji jako aplikacji webowej PWA

## Co NIE wchodzi w zakres MVP

- Współdzielenie katalogów
- Współdzielenie tras
- Zaznaczanie na mapie przebytej trasy
- Edycja plików GPX przypisanych do trasy
- Bogata obsługa i analiza multimediów (np. zdjęć z trasy)
- Eksport informacji do PDF
- Katalogi do odznak GOT PTTK Dużych
- Katalogi do odznak GOT PTTK Za wytrwałość
- Katalog do odznaki Korony Gór Polski

## Grupa docelowa

- Główna grupa docelowa: Nowocześni turyści i rodziny, które rekreacyjnie wędrują po górach. Są obeznani z technologią, często używają aplikacji do śledzenia swoich aktywności (np. Strava, AllTrails) i cenią sobie automatyzację oraz bogate dane (mapy, statystyki). Funkcja importu GPX jest dla nich kluczowa.
- Druga grupa docelowa: Doświadczeni zdobywcy odznak GOT PTTK. Są to osoby dobrze znające zasady punktacji, które mogą preferować szybkie, ręczne wprowadzanie danych. Aplikacja w wersji MVP będzie dla nich użyteczna, ale przyszłe funkcje będą bardziej skierowane na ich potrzeby (np. zaawansowane raportowanie, śledzenie odznak wyższego stopnia).

## Kryteria sukcesu

- 90% użytkowników posiada przynajmniej 1 katalog tras
- 80% użytkowników ma przynajmniej 2 trasy w przynajmniej jednym katalogu
