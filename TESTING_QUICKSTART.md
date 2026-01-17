# Quick Start - Testing Environment

## ✅ Instalacja zakończona!

Środowisko testowe zostało pomyślnie skonfigurowane.

## 🚀 Szybki start

### Uruchom testy jednostkowe

```bash
# Tryb watch (rekomendowany podczas developmentu)
npm run test

# Lub z UI
npm run test:ui
```

### Uruchom testy E2E

```bash
# Upewnij się, że aplikacja jest uruchomiona
npm run dev

# W nowym terminalu
npm run test:e2e

# Lub z UI
npm run test:e2e:ui
```

## 📚 Co dalej?

1. **Przeczytaj dokumentację**: Zobacz [TESTING.md](./TESTING.md) dla pełnej dokumentacji
2. **Sprawdź przykłady**:
   - `src/test/example.test.tsx` - testy jednostkowe
   - `e2e/example.spec.ts` - testy E2E
3. **Pisz własne testy**: Wykorzystaj przykłady jako szablon

## 🛠️ Dostępne narzędzia

- ✅ **Vitest** - testy jednostkowe i integracyjne
- ✅ **@testing-library/react** - testowanie komponentów React
- ✅ **MSW** - mockowanie API
- ✅ **Playwright** - testy E2E
- ✅ **@axe-core/playwright** - testy dostępności

## 📝 Przykład testu jednostkowego

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## 📝 Przykład testu E2E

```typescript
import { test, expect } from "@playwright/test";

test("should navigate to login", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /login/i }).click();
  await expect(page).toHaveURL(/.*login/);
});
```

## 🎯 Sprawdź że wszystko działa

```bash
# Uruchom wszystkie testy jednostkowe
npm run test:run

# Testy powinny przejść ✅
```

## 📋 Co dalej?

1. **Pisz testy** dla swoich komponentów i features
2. **Uruchamiaj testy lokalnie** przed commitem
3. **GitHub Actions** skonfigurujesz później, gdy będzie potrzebne

## ❓ Problemy?

- Zobacz [TESTING.md](./TESTING.md) w sekcji Troubleshooting
- Sprawdź czy wszystkie przeglądarki są zainstalowane: `npx playwright install`
