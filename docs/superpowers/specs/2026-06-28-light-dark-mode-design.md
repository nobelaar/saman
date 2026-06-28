# Light/Dark Mode Toggle — Design Spec

**Date:** 2026-06-28
**Status:** Approved

---

## Summary

Add a light/dark theme toggle to Acopio. Light mode becomes the default, with a toggle button to switch to dark mode. Theme preference persists in `localStorage`.

## Requirements

- **Default theme:** Light mode (warm/cozy palette)
- **Dark mode:** Available via toggle; keeps current dark palette
- **Toggle placement:** Desktop sidebar (bottom, near logout) + mobile navbar (next to notification bell)
- **Persistence:** `localStorage` under key `acopio-theme`
- **Flash prevention:** Inline `<script>` in `index.html` reads localStorage synchronously before React mounts

## Color Palette — Light Mode

| Variable           | Light value          | Description              |
|--------------------|----------------------|--------------------------|
| `--background`     | `42 55% 96%`         | Cream background          |
| `--foreground`     | `30 15% 20%`         | Dark brown text           |
| `--card`           | `42 40% 94%`         | Slightly lighter cream    |
| `--card-foreground`| `30 15% 20%`         | Dark brown text           |
| `--primary`        | `24 95% 48%`         | Warm orange               |
| `--primary-foreground` | `0 0% 100%`     | White on primary          |
| `--secondary`      | `30 10% 88%`         | Beige                     |
| `--secondary-foreground` | `30 15% 25%`   | Dark brown on secondary   |
| `--muted`          | `30 10% 94%`         | Very light beige          |
| `--muted-foreground` | `30 6% 45%`        | Muted brown text          |
| `--accent`         | `24 35% 92%`         | Soft orange               |
| `--accent-foreground` | `30 15% 25%`      | Dark brown on accent      |
| `--destructive`    | `0 84% 60%`          | Red (unchanged)           |
| `--destructive-foreground` | `0 0% 100%`   | White on destructive      |
| `--border`         | `30 8% 82%`          | Warm border               |
| `--input`          | `30 8% 82%`          | Warm input border         |
| `--ring`           | `24 95% 48%`         | Orange focus ring         |

## Color Palette — Dark Mode

Current dark values preserved, wrapped in `.dark { }` selector.

| Variable           | Dark value           |
|--------------------|----------------------|
| `--background`     | `0 0% 0%`            |
| `--foreground`     | `210 7% 91%`         |
| `--card`           | `0 0% 0%`            |
| `--card-foreground`| `210 7% 91%`         |
| `--primary`        | `24 95% 53%`         |
| `--secondary`      | `210 6% 10%`         |
| `--secondary-foreground` | `210 7% 91%`   |
| `--muted`          | `210 6% 10%`         |
| `--muted-foreground` | `215 4% 46%`       |
| `--accent`         | `210 6% 10%`         |
| `--accent-foreground` | `210 7% 91%`      |
| `--border`         | `210 4% 20%`         |
| `--input`          | `210 4% 20%`         |
| `--ring`           | `24 95% 53%`         |

## Architecture

### New files

1. **`src/lib/theme.tsx`** — ThemeProvider context + useTheme hook
   - `ThemeProvider`: wraps children, reads theme from localStorage, applies `.dark` class to `<html>`
   - `useTheme()`: returns `{ theme: "light" | "dark", toggleTheme: () => void }`
   - LocalStorage key: `"acopio-theme"`
   - No flash on load: provider applies class synchronously in a layout effect

2. **`src/components/layout/ThemeToggle.tsx`** — Toggle button
   - Sun icon (`Sun` from lucide-react) when in light mode
   - Moon icon (`Moon` from lucide-react) when in dark mode
   - Calls `toggleTheme()` from `useTheme()`
   - Styled to match existing navbar/sidebar icon buttons

### Modified files

3. **`src/index.css`** — Move current variables to `.dark`, add light variables to `:root`
4. **`src/main.tsx`** — Wrap `<App />` with `<ThemeProvider>`
5. **`src/components/layout/DesktopSidebar.tsx`** — Insert `<ThemeToggle />` below `NotificationBell`
6. **`src/components/layout/Navbar.tsx`** — Insert `<ThemeToggle />` next to `NotificationBell`; replace hardcoded `bg-black` with `bg-background`
7. **`index.html`** — Add inline `<script>` before `</head>` to read `localStorage` and apply `.dark` class synchronously (flash prevention)

### Files NOT changed

- `tailwind.config.js` — Already has `darkMode: ['class']`
- MobileBottomBar — Not modified (toggle only in sidebar + top navbar)

## Data Flow

```
localStorage("acopio-theme") ──read──► ThemeProvider (context)
                                            │
                          ┌─────────────────┤
                          ▼                 ▼
                    <html class="dark?">   useTheme() hook
                          │                 │
                          ▼                 ▼
                    CSS applies          ThemeToggle button
                    .dark variables      (Sun/Moon icon)
```

## User Flow

1. First visit: light mode (default). `localStorage` has no value → light.
2. User clicks Sun/Moon icon → theme toggles → localStorage updated → `.dark` class toggled on `<html>`.
3. User revisits: inline script reads `localStorage` → applies `.dark` before React renders → no flash.

## Error Handling

- `localStorage` unavailable (private browsing, etc.): falls back to light mode in memory, toggle works for session only.
- Invalid value in localStorage: treat as light mode default.

## Testing

- **Unit tests** for `theme.tsx` (provider + hook)
- **Component tests** for `ThemeToggle` rendering correct icon
- **Integration** verify `.dark` class is applied/removed on toggle button click
- Verify Navbar no longer uses hardcoded `bg-black` — uses theme-aware class
