# Tech Stack Aplikacji

Ten dokument opisuje kluczowe technologie używane w projekcie Pathly, aby zapewnić spójne zrozumienie architektury.

## Frontend

- **Next.js 15**: Framework React do budowy aplikacji full-stack. Zarządza routingiem, renderowaniem po stronie serwera (SSR) i klienta (CSR).
- **React 19**: Biblioteka do budowy interfejsów użytkownika (UI) w oparciu o architekturę komponentową.
- **TypeScript 5**: Superset JavaScriptu dodający statyczne typowanie dla większego bezpieczeństwa i lepszej jakości kodu.
- **Tailwind CSS 4**: Framework CSS typu utility-first do szybkiego stylowania interfejsu bezpośrednio w plikach komponentów.
- **Shadcn/ui**: Biblioteka gotowych komponentów UI zintegrowana z Tailwind CSS, wspierająca motywy (jasny/ciemny) i wysoką dostępność (a11y).

## Backend (BaaS)

- **Supabase**: Platforma Backend-as-a-Service (BaaS) typu open-source, która dostarcza kluczowe usługi backendowe.
- **Baza Danych PostgreSQL**: Główna baza danych do przechowywania danych, z wykorzystaniem Row Level Security (RLS) w celu zapewnienia, że użytkownicy mają dostęp tylko do własnych zasobów.
- **Authentication**: Wbudowany system do zarządzania użytkownikami (rejestracja, logowanie) oparty na emailu i haśle.
- **Auto-generowane API**: Automatycznie dostarcza API do interakcji z bazą danych, co znacznie przyspiesza rozwój operacji CRUD.

## CI/CD i Hosting

- **GitHub Actions**: Narzędzie do ciągłej integracji (CI). Używane do automatycznego uruchamiania zadań (testy, linting, sprawdzanie typów) przy każdym pull requeście, aby zapewnić jakość kodu.
- **Vercel**: Platforma do hostingu i ciągłego wdrażania (CD), zoptymalizowana dla Next.js. Zapewnia automatyczne wdrożenia produkcyjne oraz środowiska podglądowe (preview) dla każdego pull requesta.
