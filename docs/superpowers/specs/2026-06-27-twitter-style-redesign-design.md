# Acopio Redesign — X/Twitter-style + Mobile-first

## Summary

Redesign the entire Acopio UI to follow an X (Twitter) aesthetic with dark mode, bottom tab navigation, a publication-centric feed as the home page, post interactions ("Útil"), pull-to-refresh, infinite scroll, skeleton loaders, and smooth micro-interactions. The existing orange accent (#F97316) is preserved as the brand identity.

## Architecture

**Stack (unchanged):** React 18, TypeScript, Vite, Tailwind CSS 3, shadcn/ui conventions, Supabase, React Router v6, TanStack React Query v5, lucide-react.

**New dependencies needed:**
- None. All animations use Tailwind + CSS. Pull-to-refresh and infinite scroll are hand-rolled with existing React + browser APIs. `navigator.share` and `navigator.vibrate` are native.

**New Supabase table:**
```sql
CREATE TABLE public.post_util (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(post_id, user_id)
);
```

**Component tree (simplified):**
```
App
├── MobileBottomBar          (new — fixed bottom tab navigation)
├── DesktopSidebar           (new — sidebar for ≥1024px)
├── Routes
│   ├── / → FeedPage          (new — replaces HomePage as default)
│   ├── /centros → CentroGridPage  (renamed from HomePage, accessible via search)
│   ├── /centro/:id → CentroPerfilPage  (redesigned)
│   ├── /centro/:id/editar → EditarCentroPage  (restyled)
│   ├── /centros/nuevo → NuevoCentroPage  (restyled)
│   ├── /login → LoginPage  (restyled)
│   └── /registro → RegistroPage  (restyled)
└── ToastContainer           (new — global toast system)
```

## Section 1 — Color System & Theme

### Dark Mode Tokens (default, no light/dark toggle)
```
--background: 0 0% 0%           (#000000)
--foreground: 210 7% 91%        (#E7E9EA)
--card: 0 0% 0%                (#000000)
--card-foreground: 210 7% 91%  (#E7E9EA)
--primary: 24 95% 53%          (#F97316) — unchanged
--primary-foreground: 0 0% 100% (#FFFFFF)
--secondary: 210 6% 10%        (#16181C)
--secondary-foreground: 210 7% 91%
--muted: 210 6% 10%            (#16181C)
--muted-foreground: 215 4% 46% (#71767B)
--accent: 210 6% 10%           (#16181C)
--accent-foreground: 210 7% 91%
--destructive: 0 84% 60%
--destructive-foreground: 0 0% 100%
--border: 210 4% 20%           (#2F3336)
--input: 210 4% 20%            (#2F3336)
--ring: 24 95% 53%             (#F97316)
--radius: 0.625rem             (10px, slightly larger)
```

### Typography
- Font stack: system fonts (unchanged)
- Post body: `text-[15px] leading-relaxed`
- Post header name: `text-[15px] font-bold tracking-[-0.3px] text-primary`
- Post header meta: `text-[13px] text-muted-foreground`
- Page titles: `text-xl font-bold` (20px)
- Form labels: `text-[13px] font-medium`

### Border Radius
- Cards, buttons: `rounded-2xl` (16px)
- Inputs, textareas: `rounded-xl` (12px)
- Chips/tags: `rounded-full` (unchanged)

## Section 2 — Navigation & Layout

### MobileBottomBar (always visible on mobile)
- Fixed at `bottom-0`, `h-14`, `bg-black`, `border-t border-border`
- 4 tabs using lucide-react icons:

| Tab    | Icon            | Icon (active)     | Route            | Auth required |
|--------|-----------------|-------------------|------------------|---------------|
| Feed   | `Home`          | `Home` (filled)   | `/`              | No            |
| Search | `Search`        | `Search`          | Opens overlay    | No            |
| New    | `PlusCircle`    | `PlusCircle`      | `/centros/nuevo` | Yes           |
| Profile| `User`          | `User` (filled)   | `/login` or menu | No            |

- Active tab: icon + label in primary orange, icon switches to filled variant
- Inactive tab: icon in muted-foreground (#71767B), label 10px
- If user is not logged in, the "New" tab redirects to `/login` with a `?redirect=` param
- Height accounts for `env(safe-area-inset-bottom)` for iOS

### DesktopSidebar (≥1024px)
- Fixed left sidebar, 275px width
- Logo "Acopio" at top (bold, orange)
- Vertical nav items with icon + text (same routes as mobile tabs)
- Primary action: "Publicar" button (full-width, orange solid, 52px)
- User section at bottom: email + logout

### Layout grid (desktop)
```
┌──────────┬───────────────────┬──────────┐
│ Sidebar  │ Main content      │ Aside    │
│ 275px    │ max-w-[600px]     │ 350px    │
│          │ flex-1            │          │
└──────────┴───────────────────┴──────────┘
```
- Aside: search bar + trending needs (desktop only, not in v1)

### Header (mobile)
- Compact, `h-11`, shows current page title
- Back arrow on sub-pages

## Section 3 — Feed (Home Page)

### Data fetching
- Migrate from `useQuery` to `useInfiniteQuery` with cursor-based pagination (20 posts per page)
- Query key: `['posts', 'feed']`
- Order: `created_at DESC`
- Pull-to-refresh triggers `refetch()`

### PostCard (redesigned)
```
┌──────────────────────────────────────┐
│ 🏥 Nombre del centro    · hace 2h    │
│ @ciudad                              │
│                                      │
│ Contenido del post...                │
│ (15px, leading-relaxed,              │
│  whitespace-pre-line)                │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Foto (si existe)                │ │
│ │ rounded-2xl, full-width,        │ │
│ │ border border-border            │ │
│ └──────────────────────────────────┘ │
│                                      │
│ #Agua  #Medicamentos  #Ropa          │
│                                      │
│ ♥ 12 Útil      ↑ Compartir          │
└──────────────────────────────────────┘
```

**Card styling:**
- No visible card wrapper — full-width, separated by `border-b border-border` (1px)
- Padding: `px-4 py-3`
- Hover/active: `hover:bg-secondary/50 active:bg-secondary`
- Tapping the card opens the centro profile

### Actions
- **Útil (heart):** Toggles a row in `post_util`. Counter updates via Supabase Realtime subscription. Icon switches to filled orange when active. Mutation uses React Query `useMutation` with optimistic update.
- **Compartir:** On mobile, calls `navigator.share({ title, url })`. On desktop, copies link to clipboard and shows a toast.

### Pull-to-refresh
- Custom hook `usePullToRefresh(ref, onRefresh)`
- Touch events: `touchstart`, `touchmove`, `touchend`
- Shows a pull indicator (orange spinner + "Soltá para actualizar") when dragging > 60px
- Triggers `refetch()` from React Query

### Infinite scroll
- `IntersectionObserver` on a sentinel `<div>` at the bottom
- `fetchNextPage()` from `useInfiniteQuery`
- Shows "Cargando más..." text or skeleton rows during fetch

### Skeleton Loaders
- 3-5 shimmer rows shaped like posts:
  - Circle (32px) + 2 text lines (60%, 40% width)
  - Full-width image placeholder (200px high)
- Uses `animate-pulse` with `bg-secondary`

### Empty State
- Large `PackageOpen` icon (48px, muted)
- "Aún no hay publicaciones. Cuando los centros publiquen actualizaciones, aparecerán aquí."
- Link: "Explorar centros" → `/centros`

### Error State
- Icon + message
- "Reintentar" button

## Section 4 — Centro Profile (X-style)

### Layout
```
┌──────────────────────────────────────┐
│ ← Volver                             │
├──────────────────────────────────────┤
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Banner (140px)                   │ │
│ │ gradient if no photo             │ │
│ │ #1A0A00 → #000                  │ │
│ │                        [⋮ Editar]│ │ ← only if coordinator
│ └──────────────────────────────────┘ │
│                                      │
│ Nombre del centro    20px bold       │
│ @ciudad             15px muted       │
│                                      │
│ Descripción...      15px, multilinea │
│                                      │
│ 📍 Dirección        13px muted       │
│ 📞 Contacto → WA    link orange      │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │  12              24             │ │
│ │ publicaciones    útiles          │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ─── Publicaciones ───               │
│                                      │
│ [PostForm if coordinator]            │
│                                      │
│ [Post list — same PostCard]          │
│                                      │
└──────────────────────────────────────┘
```

### Banner
- 140px height, full-width, `object-cover`
- Falls back to gradient: `from-[#1A0A00] to-black`
- Edit button (`MoreHorizontal` icon) top-right, only if `user.id === centro.coordinador_id`

### Stats bar
- Horizontal flex row, `border-b border-border`, `py-3`
- Shows: N publicaciones, N útiles (sum of all post_util on this centro's posts)
- Updates in real-time via Supabase Realtime

### PostForm inline
- Same component as feed but rendered above the post list
- Minimal styling: textarea with placeholder "¿Qué necesita este centro?"

## Section 5 — Search, Forms, Auth

### Search (overlay from bottom tab)
- Opens as full-screen overlay with slide-up animation
- Input at top: `h-12`, autofocus, placeholder "Buscar centros..."
- Results: horizontal list items with 48px avatar + name + city
- No query: display trending needs as tappable chips (filter the feed)
- Back button or swipe down to close

### Login / Registro (restyled)
```
┌──────────────────────────────────────┐
│                                      │
│            🏥  Acopio                │ ← large icon/logo area
│                                      │
│      Iniciar sesión                  │ ← text-xl font-bold
│      Continuá para publicar          │ ← text-[15px] text-muted-foreground
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Email                    h-[52px]│ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Contraseña               h-[52px]│ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │      Iniciar sesión      h-[52px]│ │ ← bg-primary, white text
│ └──────────────────────────────────┘ │
│                                      │
│       ¿No tenés cuenta?              │
│       Crear cuenta                   │ ← text-primary
│                                      │
└──────────────────────────────────────┘
```

- No card wrapper — form floats on black background
- Max width: 400px, centered with `mx-auto`, `px-6`
- Inputs: `h-[52px]`, `rounded-xl`, `bg-black`, `border-border`, `focus:ring-primary`
- Error text: `text-destructive` inline below the relevant input
- Email confirmation state: same layout, shows message + resend button

### NuevoCentro / EditarCentro (restyled)
- Same form layout pattern as login
- Photo uploader: 100px circular preview + "Cambiar foto" text button
- Fields: nombre, descripcion (optional), direccion, ciudad, contacto (optional)
- Error messages inline per field

### Toast System
- Global toast container, positioned `fixed bottom-16 left-1/2 -translate-x-1/2` (above tab bar)
- Toast variants: success (green check), error (red x), info (gray)
- Each toast: `bg-secondary border border-border rounded-xl px-4 py-3 text-sm`
- Auto-dismiss after 3 seconds
- Max 2 visible toasts at once

## Section 6 — Micro-interactions & Polish

### Animations
- **Post entry:** `animate-in slide-in-from-top-2 fade-in duration-300` with staggered delay (50ms per post)
- **Page transitions:** fade 150ms (can use CSS `view-transition` or simple opacity)
- **Search overlay:** `animate-in slide-in-from-bottom duration-200`
- **Toast entry:** `animate-in slide-in-from-bottom-2 fade-in`
- **Toast exit:** `animate-out slide-out-to-bottom-2 fade-out`

### Touch feedback
- All interactive elements: `active:scale-[0.97] transition-transform`
- Posts: `active:bg-secondary/50`

### Scroll
- `overscroll-behavior: contain` on body (iOS bounce prevention)
- Custom scrollbar in Webkit: `w-1 bg-transparent`, thumb `bg-border rounded-full`

### Accessibility
- Focus ring: `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black`
- All images keep `alt` text
- Form inputs keep `aria-invalid` on error

### Performance
- `React.memo` on PostCard and CentroCard
- `useDeferredValue` for search filtering
- Images: `loading="lazy"` + `decoding="async"`

## Implementation Order

### Phase 1 — Foundation
1. Update `index.css` with new dark CSS variables
2. Create `MobileBottomBar` component
3. Install it in `App.tsx`, restructure layout for mobile-first
4. Create `DesktopSidebar` for breakpoint ≥1024px
5. Update `tailwind.config.js` with new radius values

### Phase 2 — Feed
6. Create `useInfinitePostsFeed` query hook
7. Rewrite `PostCard` with new X-style design
8. Create `FeedPage` with pull-to-refresh + infinite scroll
9. Add skeleton loader component
10. Add empty/error states

### Phase 3 — Interactions
11. Create `post_util` table in Supabase migration
12. Add `useToggleUtil` mutation with optimistic update
13. Add Realtime subscription for util counters
14. Add Share button with native share API
15. Create toast system

### Phase 4 — Profile & Restyle
16. Redesign `CentroPerfilPage` with banner, stats bar
17. Restyle `LoginPage` and `RegistroPage`
18. Restyle `NuevoCentroPage` and `EditarCentroPage`
19. Restyle `CentroGrid` (now secondary page at `/centros`)
20. Create search overlay component

### Phase 5 — Polish
21. Add micro-interactions (active states, transitions)
22. Add scrollbar styling
23. Final responsive testing
24. Run existing test suite, fix broken tests
25. Add tests for new components (PostCard, FeedPage, MobileBottomBar, toast)

## Risks & Mitigations

- **Real-time counters might be noisy:** Debounce Realtime updates, use optimistic UI as source of truth
- **Pull-to-refresh on iOS PWA:** Test `overscroll-behavior` + `touch-action` CSS. May need a lightweight library if native behavior fights us.
- **Infinite scroll with React Query:** Ensure `getNextPageParam` uses cursor correctly. Test with empty datasets.
- **PostCard feels too dense on desktop:** Set `max-w-[600px] mx-auto` for the main content column.
