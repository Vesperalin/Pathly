# Playwright Config - Wyjaśnienie dla początkujących

## 🎯 Kluczowe ustawienia

### `fullyParallel: false`

**Co to robi:** Testy uruchamiają się jeden po drugim
**Dlaczego:** Łatwiej debugować na początku. Zmień na `true` gdy będziesz mieć dużo stabilnych testów.

### `workers: 1`

**Co to robi:** Tylko jedna przeglądarka w tym samym czasie
**Dlaczego:** Stabilniejsze, łatwiej śledzić co się dzieje

### `trace: "on"`

**Co to robi:** Zapisuje każdy krok testu (kliknięcia, nawigacja, itp.)
**Jak zobaczyć:** `npx playwright show-trace playwright-report/trace.zip`
**Kiedy:** Zawsze - zobaczysz dokładnie co poszło nie tak

### `screenshot: "only-on-failure"`

**Co to robi:** Robi zdjęcie ekranu gdy test failuje
**Gdzie:** `playwright-report/` folder

### `video: "off"`

**Co to robi:** Nie nagrywa wideo
**Dlaczego:** Trace + screenshoty wystarczą, wideo zajmuje dużo miejsca
**Kiedy włączyć:** Jak będziesz mieć bardzo trudny do zreprodukowania bug

### `baseURL: "http://localhost:3000"`

**Co to robi:** Możesz pisać `page.goto('/')` zamiast `page.goto('http://localhost:3000/')`
**Przykład:**

```typescript
// Zamiast tego:
await page.goto("http://localhost:3000/dashboard");

// Piszesz:
await page.goto("/dashboard");
```

### `webServer`

**Co to robi:** Automatycznie uruchamia `npm run dev` przed testami
**Bonus:** `reuseExistingServer: true` - jeśli masz już uruchomiony dev server, użyje go (szybciej)

## 🚀 Jak używać

### Pierwszy test

```bash
# Uruchom testy E2E
npm run test:e2e

# Zobaczysz w terminalu:
# ✓ should load the homepage (3s)
# ✓ should navigate to login page (2s)
```

### Gdy test failuje

```bash
# Playwright automatycznie:
# 1. Zrobi screenshot → playwright-report/
# 2. Zapisze trace → playwright-report/
# 3. Pokaże w terminalu co poszło nie tak

# Otwórz raport HTML:
npm run test:e2e:report

# Zobaczysz:
# - Screenshoty
# - Trace viewer (krok po kroku co się działo)
# - Logi błędów
```

### Debugowanie

```bash
# Tryb debug - zatrzymuje test i pokazuje przeglądarkę
npm run test:e2e:debug

# UI mode - najbardziej wygodny!
npm run test:e2e:ui
# Zobaczysz GUI gdzie możesz:
# - Uruchamiać pojedyncze testy
# - Oglądać testy w zwolnionym tempie
# - Inspekcjonować każdy krok
```

## 💡 Tipsy

### 1. Zacznij od prostych testów

```typescript
test("should load homepage", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Pathly/);
});
```

### 2. Używaj UI mode podczas pisania testów

```bash
npm run test:e2e:ui
```

Zobaczysz na żywo co robi Twój test!

### 3. Trace to Twój najlepszy przyjaciel

Gdy test failuje:

1. Otwórz `npm run test:e2e:report`
2. Kliknij na failed test
3. Zobacz trace - zobaczysz DOKŁADNIE co się stało, krok po kroku

### 4. Nie martw się o wydajność na początku

- `workers: 1` jest OK
- `fullyParallel: false` jest OK
- `trace: "on"` jest OK

Optymalizujesz później, gdy będziesz mieć dużo testów.

## 🎨 Kiedy zmienić ustawienia

### Masz już 10+ stabilnych testów?

```typescript
fullyParallel: true,  // Szybsze testy
workers: 4,           // 4 przeglądarki naraz
trace: "retain-on-failure",  // Trace tylko przy failach
```

### Potrzebujesz wideo?

```typescript
video: "retain-on-failure",  // Tylko przy failach
```

### Testujesz mobile?

```typescript
projects: [
  { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  { name: "mobile", use: { ...devices["iPhone 12"] } },
],
```

## ❓ FAQ

**Q: Dlaczego testy są wolne?**
A: E2E są wolne z natury (uruchamiają prawdziwą przeglądarkę). To normalne.

**Q: Czy muszę mieć uruchomiony dev server?**
A: Nie! Playwright uruchomi go automatycznie (`webServer` config).

**Q: Gdzie są raporty?**
A: W folderze `playwright-report/`. Otwórz je: `npm run test:e2e:report`

**Q: Co to jest trace?**
A: To "nagranie" testu - każdy klik, nawigacja, assertion. Bezcenne przy debugowaniu!

**Q: Muszę testować na Firefox/Safari?**
A: Na początku nie. Chromium wystarczy. Dodasz później jeśli będzie potrzeba.
