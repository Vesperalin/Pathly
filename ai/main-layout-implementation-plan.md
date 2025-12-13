# Plan implementacji: Główny Układ i Nawigacja

## 1. Przegląd

Ten dokument opisuje implementację głównego układu aplikacji (`Layout`), który będzie otaczał wszystkie główne widoki aplikacji. Celem jest zapewnienie spójnej i responsywnej nawigacji. **Na obecnym etapie deweloperskim wszystkie widoki będą publicznie dostępne, a komponenty związane z uwierzytelnianiem (np. menu użytkownika) zostaną tymczasowo usunięte lub zastąpione placeholderami.** Układ jest jednak zaprojektowany tak, aby w przyszłości można było łatwo dodać warstwę uwierzytelniania.

## 2. Routing i Struktura Plików

Komponenty te nie będą tworzyć osobnej strony, lecz stanowić plik `layout.tsx`, który otacza inne trasy. Zostanie on umieszczony w grupie tras `(private)`, aby w przyszłości łatwo objąć te widoki ochroną `middleware`. **Na razie `middleware.ts` nie będzie chronić tych tras.**

- **Ścieżka pliku:** `src/app/[locale]/(private)/layout.tsx`

## 3. Struktura komponentów

```
<Layout>
├── <Sidebar />
│   ├── <Logo />
│   └── <MainNav />
│       ├── <NavLink href="/dashboard">Pulpit</NavLink>
│       ├── <NavLink href="/routes">Wszystkie trasy</NavLink>
│       └── <NavLink href="/settings">Ustawienia</NavLink>
├── <div className="main-content">
│   ├── <MobileHeader />
│   │   ├── <Sheet> (kontener na mobilny sidebar)
│   │   │   └── <Sidebar />
│   │   └── <Breadcrumbs /> (renderowane kontekstowo)
│   └── <main>{children}</main>
└── <Toaster />
```

## 4. Szczegóły komponentów

### `Layout` (Komponent serwerowy - `layout.tsx`)

- **Opis komponentu:** Główny komponent serwerowy, który definiuje dwukolumnowy układ (sidebar + treść) dla widoków desktopowych. Renderuje komponenty `Sidebar` i `MobileHeader` oraz `{children}`, czyli widok aktualnej strony.
- **Główne elementy:** `Sidebar`, `MobileHeader`, `{children}`.
- **Propsy:** `children: React.ReactNode`.

### `Sidebar` (Komponent kliencki)

- **Opis komponentu:** Panel boczny zawierający logo i główną nawigację. **Tymczasowo nie zawiera `UserMenu`.** Jest zaprojektowany do użycia zarówno w stałej pozycji na desktopie, jak i wewnątrz wysuwanego panelu (`Sheet`) na mobile. Używa hooka `usePathname` do podświetlania aktywnego linku.
- **Główne elementy:** `Logo`, `MainNav`.
- **Propsy:** Brak.

### `MainNav` (Komponent kliencki)

- **Opis komponentu:** Renderuje listę głównych linków nawigacyjnych. **Etykiety linków ("Pulpit", "Wszystkie trasy", "Ustawienia") są pobierane za pomocą hooka `useTranslations`.** Aktywny link jest wizualnie wyróżniony.
- **Główne elementy:** Komponenty `Link` z `next/link` stylizowane jako przyciski.
- **Propsy:** Brak.

### `MobileHeader` (Komponent kliencki)

- **Opis komponentu:** Nagłówek widoczny tylko na urządzeniach mobilnych. Zawiera przycisk "hamburger" opakowany w komponent `Sheet` z `shadcn/ui`, który otwiera i zamyka mobilną wersję `Sidebar`.
- **Główne elementy:** `Sheet`, `Button` (jako trigger), `Sidebar` (wewnątrz `SheetContent`).
- **Propsy:** Brak.

### `UserMenu` (Komponent kliencki)

- **Opis komponentu:** **Ten komponent nie będzie implementowany na obecnym etapie.** W przyszłości będzie wyświetlał informacje o zalogowanym użytkowniku oraz przycisk "Wyloguj". Zostanie dodany do `Sidebar` po wdrożeniu systemu uwierzytelniania.

## 5. Typy

Nie ma potrzeby tworzenia nowych typów.

## 6. Zarządzanie stanem

- **Stan mobilnego sidebara:** Stan otwarcia/zamknięcia komponentu `Sheet` jest zarządzany wewnętrznie przez ten komponent w `shadcn/ui`.
- **Stan aktywnego linku:** Zarządzany jest za pomocą hooka `usePathname` z `next/navigation`. Komponent `NavLink` będzie porównywał swoją ścieżkę `href` z aktualną ścieżką i na tej podstawie dodawał odpowiednie style.

## 7. Integracja API

- **Wylogowanie:** **Funkcjonalność nie dotyczy obecnego etapu.** W przyszłości `UserMenu` będzie wywoływał metodę `supabase.auth.signOut()`.
- **Dane użytkownika:** **Funkcjonalność nie dotyczy obecnego etapu.**

## 8. Interakcje użytkownika

- **Nawigacja:** Kliknięcie linku w `Sidebar` przenosi do odpowiedniej strony. Aktywny link jest podświetlony.
- **Nawigacja mobilna:** Kliknięcie ikony "hamburgera" wysuwa `Sidebar` z boku ekranu. Kliknięcie linku lub poza obszarem sidebara zamyka go.
- **Wylogowanie:** **Funkcjonalność nie dotyczy obecnego etapu.**

## 9. Obsługa błędów

Nie przewiduje się specyficznych błędów dla komponentu layoutu na tym etapie.

## 10. Kroki implementacji

1.  **Struktura folderów:** Stworzyć grupę tras `(private)` w `src/app/[locale]/`. Wszystkie główne widoki aplikacji (`dashboard`, `routes`, `settings`, etc.) będą następnie tworzone wewnątrz tej grupy.
2.  **Plik Layout:** Stworzyć plik `src/app/[locale]/(private)/layout.tsx`.
3.  **Komponenty:** Stworzyć pliki dla komponentów w `src/components/layout/`: `Sidebar.tsx`, `MobileHeader.tsx`, `MainNav.tsx`. **Pominąć tworzenie `UserMenu.tsx` na tym etapie.**
4.  **Pliki tłumaczeń:** Stworzyć plik `layout.json` (lub dodać do `common.json`) z kluczami dla linków nawigacyjnych.
5.  **Implementacja `Sidebar`:** Zbudować komponent z logo i nawigacją, używając hooka `useTranslations` dla etykiet i `usePathname` do stylizacji aktywnego linku.
6.  **Implementacja `MobileHeader`:** Zintegrować `Sidebar` z komponentem `Sheet` z `shadcn/ui` w celu stworzenia wysuwanej nawigacji mobilnej.
7.  **Modyfikacja `middleware.ts`:** Należy upewnić się, że `middleware.ts` **nie chroni** tras w grupie `(private)` na obecnym etapie deweloperskim.
8.  **Kompozycja w `layout.tsx`:** Złożyć wszystkie komponenty w głównym pliku layoutu.
9.  **Responsywność:** Użyć klas `Tailwind CSS` (np. `md:block`, `hidden`), aby pokazywać/ukrywać `Sidebar` i `MobileHeader` na odpowiednich szerokościach ekranu.
10. **Testowanie:** Przetestować działanie nawigacji na różnych urządzeniach, podświetlanie aktywnego linku oraz otwieranie/zamykanie mobilnego menu.
