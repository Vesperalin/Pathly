# Vitest Config - Wyjaśnienie dla początkujących

## 🎯 Kluczowe ustawienia

### `environment: "jsdom"`
**Co to robi:** Symuluje środowisko przeglądarki (DOM, window, document)
**Dlaczego:** Twoje komponenty React potrzebują DOM
**Alternatywa:** `happy-dom` (szybszy, ale mniej kompatybilny) - zostań przy jsdom

### `globals: true`
**Co to robi:** Możesz pisać `describe`, `it`, `expect` bez importów
**Przykład:**
```typescript
// Bez globals:
import { describe, it, expect } from 'vitest';

// Z globals (prostsze!):
describe('MyComponent', () => {
  it('should render', () => {
    expect(true).toBe(true);
  });
});
```

### `setupFiles: ["./src/test/setup-tests.ts"]`
**Co to robi:** Uruchamia ten plik przed wszystkimi testami
**Co jest w środku:**
- `@testing-library/jest-dom` (matchery jak `toBeInTheDocument()`)
- Mocki Next.js (`useRouter`, `usePathname`, itp.)
- Mocki next-intl, next-themes
- MSW (Mock Service Worker) setup

### `css: true`
**Co to robi:** Nie failuje gdy importujesz CSS w komponentach
**Przykład:**
```typescript
// Bez css: true → ERROR
import './Button.css';

// Z css: true → OK ✅
import './Button.css';
```

## 📊 Coverage (Pokrycie kodu)

### `reporter: ["text", "html"]`
**Co to robi:**
- `text` - pokazuje wyniki w terminalu
- `html` - generuje stronę HTML w `coverage/index.html`

**Usunięte:** `json` i `lcov` (niepotrzebne bez CI/CD)

### `thresholds: 60`
**Co to robi:** Minimalny % pokrycia kodu
**Zmienione z 70% na 60%** - łatwiej na początek

**4 typy pokrycia:**
- **lines:** % linii kodu które zostały uruchomione
- **functions:** % funkcji które zostały wywołane
- **branches:** % ścieżek (if/else) które zostały przetestowane
- **statements:** % instrukcji które zostały wykonane

**Co się stanie jak spadnie poniżej 60%?**
```bash
npm run test:coverage
# ERROR: Coverage threshold not met!
```

### `exclude` (w coverage)
**Co to robi:** Te pliki nie liczą się do pokrycia
**Co wykluczamy:**
- `src/test/` - same testy
- `**/*.config.*` - pliki konfiguracyjne (vitest.config.ts, itp.)
- `src/db/database.types.ts` - auto-generowane przez Supabase
- `src/middleware.ts` - middleware Next.js (trudne do testowania)

## 🎨 Aliasy ścieżek

### `alias: { "@": "./src" }`
**Co to robi:** Możesz pisać `@/components` zamiast `../../../components`
**Przykład:**
```typescript
// Zamiast:
import { Button } from '../../../components/ui/Button';

// Piszesz:
import { Button } from '@/components/ui/Button';
```

## 🚀 Jak używać

### Podstawowe komendy
```bash
# Watch mode (rekomendowane podczas developmentu)
npm run test

# Uruchom raz (dla CI lub szybkiego checku)
npm run test:run

# Z UI (najlepsze do debugowania!)
npm run test:ui

# Z pokryciem kodu
npm run test:coverage
# Otwórz: coverage/index.html
```

### Pierwszy test
```typescript
// src/components/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### Uruchom:
```bash
npm run test
# Vitest automatycznie znajdzie *.test.tsx
```

## 💡 Tipsy dla początkujących

### 1. Używaj Watch Mode
```bash
npm run test
```
Vitest automatycznie uruchomi testy gdy zapiszesz plik!

### 2. Używaj UI Mode do debugowania
```bash
npm run test:ui
```
Zobaczysz GUI z:
- Listą wszystkich testów
- Wynikami w czasie rzeczywistym
- Stack traces
- Console logi

### 3. Filtruj testy podczas developmentu
```bash
# Tylko testy z "Button" w nazwie
npm run test -- Button

# Tylko konkretny plik
npm run test -- src/components/Button.test.tsx
```

### 4. Nie martw się o coverage na początku
Zacznij od pisania testów, coverage przyjdzie z czasem.

Kiedy sprawdzać coverage:
- Przed mergem do main
- Co jakiś czas, żeby zobaczyć progress

```bash
npm run test:coverage
# Otwórz coverage/index.html
# Zobaczysz które linie NIE są pokryte (czerwone)
```

## 🎓 Dobre praktyki

### 1. Jeden plik testowy na komponent
```
src/
  components/
    Button.tsx
    Button.test.tsx  ✅
```

### 2. Grupuj testy w describe
```typescript
describe('Button', () => {
  describe('when disabled', () => {
    it('should not call onClick', () => {
      // test
    });
  });

  describe('when enabled', () => {
    it('should call onClick', () => {
      // test
    });
  });
});
```

### 3. Używaj opisowych nazw testów
```typescript
// ❌ Źle
it('works', () => {});

// ✅ Dobrze
it('should call onClick when button is clicked', () => {});
```

### 4. Najpierw funkcjonalność, potem coverage
Nie pisz testów tylko po to żeby mieć 100% coverage.
Pisz testy które testują **zachowanie** Twojej aplikacji.

## ⚙️ Kiedy zmienić ustawienia

### Masz już stabilne testy i chcesz wyższych standardów?
```typescript
thresholds: {
  lines: 80,
  functions: 80,
  branches: 75,
  statements: 80,
}
```

### Potrzebujesz LCOV dla CI/CD?
```typescript
reporter: ["text", "html", "lcov"],
```
LCOV używa się do integracji z narzędziami jak Codecov.

### Chcesz testować bez DOM (czyste funkcje)?
```typescript
environment: "node",  // Zamiast "jsdom"
```
Szybsze, ale nie zadziała dla komponentów React!

## ❓ FAQ

**Q: Czym różni się od Jest?**
A: Vitest to "Jest dla Vite". Jest szybszy i lepiej zintegrowany z nowoczesnym JS/TS.

**Q: Czy muszę importować describe/it/expect?**
A: Nie! `globals: true` robi to za Ciebie.

**Q: Co to jest toBeInTheDocument()?**
A: To matcher z `@testing-library/jest-dom`. Jest dodany w `setup-tests.ts`.

**Q: Dlaczego middleware.ts jest wykluczony?**
A: Middleware Next.js jest trudny do testowania jednostkowego. Testujesz go E2E z Playwright.

**Q: Co jeśli mój coverage spadnie poniżej 60%?**
A: `npm run test:coverage` zafailuje. To przypomnienie żeby pisać testy! Możesz obniżyć próg jeśli potrzebujesz.

**Q: Czy powinienem mieć 100% coverage?**
A: Nie! 60-80% to dobry cel. 100% często oznacza testowanie implementacji zamiast zachowania.

## 🎯 Różnice od ustawień początkowych

### ✅ Co poprawiłem:

1. **Coverage reporter: 4 → 2**
   - Usunięto `json` i `lcov` (niepotrzebne bez CI/CD)
   - Zostały `text` (terminal) i `html` (przeglądarka)

2. **Thresholds: 70% → 60%**
   - Łatwiej na początek
   - Zwiększysz jak będziesz mieć więcej testów

3. **Dodano komentarze**
   - Każde ustawienie wyjaśnione
   - Łatwiej zrozumieć co robi

### Wszystko inne jest OK! ✅

Config był już dobry, tylko lekko zoptymalizowany dla początkującego.

