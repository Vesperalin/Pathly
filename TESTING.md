# Środowisko testowe Pathly

## Przegląd

Projekt Pathly wykorzystuje dwa główne frameworki testowe:

- **Vitest** - do testów jednostkowych i integracyjnych
- **Playwright** - do testów end-to-end (E2E)

## 🧪 Testy jednostkowe (Vitest)

### Uruchamianie testów

```bash
# Uruchom testy w trybie watch
npm run test

# Uruchom testy z interfejsem UI
npm run test:ui

# Uruchom testy jednokrotnie
npm run test:run

# Uruchom testy z pokryciem kodu
npm run test:coverage
```

### Struktura testów jednostkowych

```
src/test/
├── setup-tests.ts          # Konfiguracja środowiska testowego
├── mocks/                  # Mock Service Worker handlers
│   ├── handlers.ts         # Definicje handlerów API
│   ├── server.ts           # Server dla Node.js (Vitest)
│   └── browser.ts          # Worker dla przeglądarki
├── utils/                  # Funkcje pomocnicze
│   ├── test-helpers.tsx    # Renderowanie z providerami
│   └── mock-data.ts        # Mockowane dane testowe
└── example.test.tsx        # Przykładowy test
```

### Konwencje nazewnictwa

- Pliki testowe: `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`
- Umieszczaj testy obok testowanych plików lub w katalogu `src/test/`
- Używaj opisowych nazw: `Button.test.tsx`, `useProfile.test.ts`

### Przykład testu

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Mockowanie

#### Mock Service Worker (MSW)

MSW jest skonfigurowany globalnie w `setup-tests.ts`. Dodaj handlery w `src/test/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/routes", () => {
    return HttpResponse.json([{ id: "1", name: "Test Route" }]);
  }),
];
```

#### Mockowanie modułów

```typescript
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));
```

### Pokrycie kodu

Konfiguracja w `vitest.config.ts`:

- Minimalne progi: 70% dla wszystkich metryk
- Raporty: text, json, html, lcov
- Wyłączenia: node_modules, pliki konfiguracyjne, typy

## 🎭 Testy E2E (Playwright)

### Uruchamianie testów E2E

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Uruchom testy z interfejsem UI
npm run test:e2e:ui

# Uruchom testy w trybie debugowania
npm run test:e2e:debug

# Wygeneruj kod testu z przeglądarki (codegen)
npm run test:e2e:codegen

# Pokaż raport z ostatnich testów
npm run test:e2e:report
```

### Struktura testów E2E

```
e2e/
├── pages/                  # Page Object Model
│   ├── base.page.ts        # Klasa bazowa
│   └── login.page.ts       # Strona logowania
├── fixtures/               # Fixtures i helpers
│   ├── helpers.ts          # Funkcje pomocnicze
│   └── test-data.ts        # Dane testowe
└── example.spec.ts         # Przykładowy test
```

### Konwencje nazewnictwa

- Pliki testowe: `*.spec.ts`
- Page Objects: `*.page.ts`
- Umieszczaj wszystkie testy E2E w katalogu `e2e/`

### Przykład testu E2E

```typescript
import { test, expect } from "@playwright/test";

test("should login successfully", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel(/email/i).fill("test@example.com");
  await page.getByLabel(/password/i).fill("password123");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/.*dashboard/);
});
```

### Page Object Model

Przykład implementacji POM:

```typescript
import { Page } from "@playwright/test";
import { BasePage } from "./base.page";

export class LoginPage extends BasePage {
  private readonly emailInput = this.page.getByLabel(/email/i);
  private readonly passwordInput = this.page.getByLabel(/password/i);
  private readonly submitButton = this.page.getByRole("button", { name: /sign in/i });

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

### Konfiguracja

Plik `playwright.config.ts` zawiera:

- Testowanie tylko na Chromium (zgodnie z zasadami)
- Automatyczne uruchamianie dev servera
- Trace viewer dla niepowodzeń
- Screenshots i wideo przy błędach

## 🔧 Dodatkowe narzędzia

### Axe-core (Accessibility)

Testy dostępności są zintegrowane z Playwright. Przykład:

```typescript
import { test } from "@playwright/test";
import { injectAxe, checkA11y } from "@axe-core/playwright";

test("should not have a11y violations", async ({ page }) => {
  await page.goto("/");
  await injectAxe(page);
  await checkA11y(page);
});
```

## 📝 Najlepsze praktyki

### Testy jednostkowe

1. **Testuj zachowanie, nie implementację**
   - Unikaj testowania detali implementacyjnych
   - Skup się na zachowaniu widocznym dla użytkownika

2. **Używaj AAA pattern** (Arrange-Act-Assert)

   ```typescript
   // Arrange
   const user = userEvent.setup();
   render(<Component />);

   // Act
   await user.click(screen.getByRole('button'));

   // Assert
   expect(screen.getByText('Success')).toBeInTheDocument();
   ```

3. **Mockuj tylko co potrzebne**
   - Nie mockuj wszystkiego
   - Używaj MSW dla API requests
   - Mockuj external dependencies

4. **Pisz testy czytelne i zrozumiałe**
   - Opisowe nazwy testów
   - Jeden assertion per test (gdy to możliwe)
   - Unikaj skomplikowanej logiki w testach

### Testy E2E

1. **Używaj Page Object Model**
   - Enkapsuluj logikę stron w klasach
   - Unikaj duplikacji selektorów

2. **Testuj krytyczne ścieżki użytkownika**
   - Logowanie/wylogowanie
   - Główne funkcjonalności biznesowe
   - Happy paths i podstawowe error cases

3. **Używaj meaningful selectors**

   ```typescript
   // Dobre ✅
   page.getByRole("button", { name: /submit/i });
   page.getByLabel(/email/i);

   // Złe ❌
   page.locator(".btn-primary");
   page.locator("#submit-btn");
   ```

4. **Izoluj testy**
   - Każdy test powinien być niezależny
   - Cleanup po testach
   - Nie polegaj na kolejności wykonania

## 🚀 CI/CD

### GitHub Actions (do skonfigurowania później)

Gdy będziesz gotowy, możesz dodać workflow `.github/workflows/tests.yml`:

**Zalecane joby:**

- `unit-tests` - Linting, type checking, testy jednostkowe, coverage
- `e2e-tests` - Testy Playwright z uploadem raportów

**Wymagane secrets:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `CODECOV_TOKEN` (opcjonalnie)

## 📚 Zasoby

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Axe-core Playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)

## 🐛 Troubleshooting

### Problem: Testy jednostkowe nie działają z Next.js

Upewnij się, że wszystkie moduły Next.js są poprawnie zmockowane w `setup-tests.ts`.

### Problem: Playwright nie uruchamia się

```bash
# Zainstaluj przeglądarki
npx playwright install

# Zainstaluj zależności systemowe
npx playwright install-deps
```

### Problem: MSW nie przechwytuje requestów

Sprawdź czy:

1. Server jest uruchomiony w `setup-tests.ts`
2. Handlery są poprawnie zdefiniowane
3. URL w handlerach pasuje do requestów

## 📧 Wsparcie

W razie problemów:

1. Sprawdź przykładowe testy w `src/test/example.test.tsx` i `e2e/example.spec.ts`
2. Przeczytaj dokumentację frameworków
3. Uruchom testy z flagą `--reporter=verbose` dla szczegółowych logów
