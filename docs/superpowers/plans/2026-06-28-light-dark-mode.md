# Light/Dark Mode Toggle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add light/dark theme toggle with light mode as default, localStorage persistence, and a toggle button in desktop sidebar + mobile navbar.

**Architecture:** React Context-based theme provider manages `"light" | "dark"` state. CSS variables define palettes in `:root` (light) and `.dark {}` (dark). ThemeProvider applies `.dark` class to `<html>`. Inline flash-prevention script in `index.html` reads localStorage before React mounts.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v3 (already configured with `darkMode: ['class']`), vitest + @testing-library/react

---

### Task 1: Flash prevention script

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add inline script before `</head>`**

Insert before `</head>`:

```html
    <script>
      (function () {
        var t = localStorage.getItem('acopio-theme')
        if (t === 'dark') document.documentElement.classList.add('dark')
      })()
    </script>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -S -m "feat: add flash-prevention theme script to index.html"
```

---

### Task 2: Update CSS variables

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Move current dark variables to `.dark {}` and add light variables to `:root`**

Replace the contents of `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 42 55% 96%;
    --foreground: 30 15% 20%;
    --card: 42 40% 94%;
    --card-foreground: 30 15% 20%;
    --primary: 24 95% 48%;
    --primary-foreground: 0 0% 100%;
    --secondary: 30 10% 88%;
    --secondary-foreground: 30 15% 25%;
    --muted: 30 10% 94%;
    --muted-foreground: 30 6% 45%;
    --accent: 24 35% 92%;
    --accent-foreground: 30 15% 25%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 30 8% 82%;
    --input: 30 8% 82%;
    --ring: 24 95% 48%;
    --radius: 0.625rem;
  }

  .dark {
    --background: 0 0% 0%;
    --foreground: 210 7% 91%;
    --card: 0 0% 0%;
    --card-foreground: 210 7% 91%;
    --primary: 24 95% 53%;
    --primary-foreground: 0 0% 100%;
    --secondary: 210 6% 10%;
    --secondary-foreground: 210 7% 91%;
    --muted: 210 6% 10%;
    --muted-foreground: 215 4% 46%;
    --accent: 210 6% 10%;
    --accent-foreground: 210 7% 91%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 210 4% 20%;
    --input: 210 4% 20%;
    --ring: 24 95% 53%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground antialiased;
    font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    overscroll-behavior: contain;
  }
}

@layer utilities {
  .scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--border)) transparent;
  }
  .scrollbar-thin::-webkit-scrollbar {
    width: 4px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: hsl(var(--border));
    border-radius: 9999px;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -S -m "feat: add light/dark CSS variable palettes"
```

---

### Task 3: Create ThemeProvider context and useTheme hook

**Files:**
- Create: `src/lib/theme.tsx`
- Create: `src/lib/theme.test.tsx`

- [ ] **Step 1: Write the file**

```tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('acopio-theme')
    if (stored === 'dark') return 'dark'
    if (stored === 'light') return 'light'
  } catch {
    // localStorage unavailable
  }
  return 'light'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'light' ? 'dark' : 'light'
      try {
        localStorage.setItem('acopio-theme', next)
      } catch {
        // localStorage unavailable
      }
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return ctx
}
```

- [ ] **Step 2: Write tests**

Create `src/lib/theme.test.tsx`:

```tsx
import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, beforeEach } from 'vitest'
import { ThemeProvider, useTheme } from './theme'

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}

function setLocalStorage(value: string | null) {
  if (value === null) {
    localStorage.removeItem('acopio-theme')
  } else {
    localStorage.setItem('acopio-theme', value)
  }
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('defaults to light theme when localStorage is empty', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('reads "dark" from localStorage on init', () => {
    setLocalStorage('dark')
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('reads "light" from localStorage on init', () => {
    setLocalStorage('light')
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('toggleTheme switches from light to dark', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('dark')
    expect(localStorage.getItem('acopio-theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('toggleTheme switches from dark to light', () => {
    setLocalStorage('dark')
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('light')
    expect(localStorage.getItem('acopio-theme')).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('throws when used outside ThemeProvider', () => {
    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme must be used within a ThemeProvider'
    )
  })
})
```

- [ ] **Step 3: Run tests to verify**

```bash
npx vitest run src/lib/theme.test.tsx
```

Expected: 6 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/theme.tsx src/lib/theme.test.tsx
git commit -S -m "feat: add ThemeProvider context with useTheme hook"
```

---

### Task 4: Wrap app in ThemeProvider

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: Import and wrap `<App />` with `<ThemeProvider>`**

Add import and wrap:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/lib/theme'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, gcTime: 5 * 60_000, retry: 1, refetchOnWindowFocus: false },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)
```

- [ ] **Step 2: Commit**

```bash
git add src/main.tsx
git commit -S -m "feat: wrap app with ThemeProvider"
```

---

### Task 5: Create ThemeToggle component

**Files:**
- Create: `src/components/layout/ThemeToggle.tsx`
- Create: `src/components/layout/ThemeToggle.test.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/theme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
```

- [ ] **Step 2: Write tests**

Create `src/components/layout/ThemeToggle.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, beforeEach } from 'vitest'
import { ThemeProvider } from '@/lib/theme'
import { ThemeToggle } from './ThemeToggle'

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  )
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('renders moon icon when in light mode', () => {
    renderToggle()
    expect(screen.getByLabelText('Cambiar a modo oscuro')).toBeInTheDocument()
  })

  it('renders sun icon when in dark mode', () => {
    localStorage.setItem('acopio-theme', 'dark')
    renderToggle()
    expect(screen.getByLabelText('Cambiar a modo claro')).toBeInTheDocument()
  })

  it('toggles theme on click', async () => {
    const user = userEvent.setup()
    renderToggle()
    const button = screen.getByLabelText('Cambiar a modo oscuro')
    await user.click(button)
    expect(localStorage.getItem('acopio-theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(screen.getByLabelText('Cambiar a modo claro')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run tests to verify**

```bash
npx vitest run src/components/layout/ThemeToggle.test.tsx
```

Expected: 3 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/ThemeToggle.tsx src/components/layout/ThemeToggle.test.tsx
git commit -S -m "feat: add ThemeToggle button component"
```

---

### Task 6: Insert ThemeToggle in DesktopSidebar

**Files:**
- Modify: `src/components/layout/DesktopSidebar.tsx`

- [ ] **Step 1: Add ThemeToggle import and placement**

Add import at top:
```tsx
import { ThemeToggle } from './ThemeToggle'
```

Insert `<ThemeToggle />` between `NotificationBell` and the logout button (line ~38):

```tsx
      {user ? (
        <div className="mt-auto space-y-2">
          <NotificationBell userId={user.id} />
          <ThemeToggle />
          <button
            type="button"
            onClick={onLogout}
```

Final DesktopSidebar.tsx:

```tsx
import { NavLink } from 'react-router-dom'
import type { AuthUser } from '@/types/db'
import { Home, Search, PlusCircle, User, Users, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/notificacion/NotificationBell'
import { ThemeToggle } from './ThemeToggle'

interface Props {
  user: AuthUser | null
  onLogout?: () => void
}

export function DesktopSidebar({ user, onLogout }: Props) {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-[275px] flex-col border-r border-border px-3 py-3 lg:flex">
      <NavLink to="/" className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-primary hover:bg-secondary">
        A
      </NavLink>

      <nav className="flex flex-1 flex-col gap-1">
        <SidebarItem to="/" icon={Home} label="Inicio" />
        <SidebarItem to="/comunidad" icon={Users} label="Comunidad" />
        <SidebarItem to="/centros" icon={Search} label="Buscar" />
        <SidebarItem
          to={user ? '/centros/nuevo' : '/login?redirect=/centros/nuevo'}
          icon={PlusCircle}
          label="Nuevo"
        />
        <SidebarItem
          to={user ? '/perfil' : '/login'}
          icon={User}
          label={user ? 'Perfil' : 'Entrar'}
        />
      </nav>

      {user ? (
        <div className="mt-auto space-y-2">
          <NotificationBell userId={user.id} />
          <ThemeToggle />
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-full px-4 py-3 text-[15px] text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <LogOut size={22} />
            <span>{user.email}</span>
          </button>
        </div>
      ) : null}
    </aside>
  )
}

function SidebarItem({ to, icon: Icon, label }: { to: string; icon: typeof Home; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'inline-flex items-center gap-3 rounded-full px-4 py-3 text-[17px] transition-colors',
          isActive ? 'font-bold text-foreground' : 'text-foreground hover:bg-secondary'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={26} strokeWidth={isActive ? 2.5 : 2} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/DesktopSidebar.tsx
git commit -S -m "feat: add ThemeToggle to desktop sidebar"
```

---

### Task 7: Insert ThemeToggle in Navbar + fix hardcoded bg-black

**Files:**
- Modify: `src/components/layout/Navbar.tsx`

- [ ] **Step 1: Replace hardcoded `bg-black` with `bg-background`, add ThemeToggle**

Full replacement:

```tsx
import { Link, useLocation } from 'react-router-dom'
import type { AuthUser } from '@/types/db'
import { ArrowLeft, HeartHandshake } from 'lucide-react'
import { NotificationBell } from '@/components/notificacion/NotificationBell'
import { ThemeToggle } from './ThemeToggle'

interface Props {
  user?: AuthUser | null
}

export function Navbar({ user }: Props) {
  const location = useLocation()
  const isSubPage = location.pathname !== '/' && location.pathname !== '/centros' && location.pathname !== '/comunidad'

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background lg:hidden">
      <nav className="flex h-11 items-center px-4">
        {isSubPage ? (
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground" aria-label="Volver">
              <ArrowLeft size={20} />
            </Link>
            <span className="text-[17px] font-bold">
              {getPageTitle(location.pathname)}
            </span>
          </div>
        ) : (
          <Link to="/" className="flex items-center gap-2 text-primary">
            <HeartHandshake size={22} strokeWidth={2.5} />
            <span className="text-[17px] font-bold tracking-tight">Acopio</span>
          </Link>
        )}
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <NotificationBell userId={user?.id} />
        </div>
      </nav>
    </header>
  )
}

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/centros/nuevo')) return 'Nuevo centro'
  if (pathname.includes('/editar')) return 'Editar centro'
  if (pathname.startsWith('/centro/')) return 'Centro'
  if (pathname === '/login') return 'Iniciar sesion'
  if (pathname === '/registro') return 'Crear cuenta'
  return 'Acopio'
}
```

Changes:
- `bg-black` → `bg-background` on the `<header>`
- Added `<ThemeToggle />` import and placement inside `ml-auto` div
- Changed `ml-auto` from single NotificationBell to a `flex items-center gap-1` wrapper containing both ThemeToggle and NotificationBell

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/Navbar.tsx
git commit -S -m "feat: add ThemeToggle to mobile navbar, fix hardcoded bg-black"
```

---

### Task 8: Fix remaining hardcoded bg-black in components

**Files:**
- Modify: `src/components/layout/MobileBottomBar.tsx`
- Modify: `src/components/common/SearchOverlay.tsx`
- Modify: `src/components/notificacion/NotificationBell.tsx`

- [ ] **Step 1: Fix MobileBottomBar.tsx line 21**

Change:
```
className="fixed bottom-0 ... border-t border-border bg-black pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
```
To:
```
className="fixed bottom-0 ... border-t border-border bg-background pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
```

- [ ] **Step 2: Fix SearchOverlay.tsx line 31**

Change:
```
className="fixed inset-x-0 top-0 z-30 flex flex-col bg-black animate-in slide-in-from-bottom duration-200"
```
To:
```
className="fixed inset-x-0 top-0 z-30 flex flex-col bg-background animate-in slide-in-from-bottom duration-200"
```

- [ ] **Step 3: Fix NotificationBell.tsx line 53**

Change:
```
className="absolute right-0 top-full z-20 mt-1 w-80 overflow-hidden rounded-2xl border border-border bg-black shadow-xl"
```
To:
```
className="absolute right-0 top-full z-20 mt-1 w-80 overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/MobileBottomBar.tsx src/components/common/SearchOverlay.tsx src/components/notificacion/NotificationBell.tsx
git commit -S -m "fix: replace hardcoded bg-black with bg-background"
```

---

### Task 9: Verify — run all tests

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

- [ ] **Step 2: Run linter**

```bash
npx oxlint
```

- [ ] **Step 3: Run build**

```bash
npx tsc -b && npx vite build
```

Expected: all tests pass, no lint errors, build succeeds.
