# Acopio X-style Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use `- [ ]` checkbox syntax for tracking.

**Goal:** Transform Acopio into a dark-mode, X/Twitter-style mobile-first app with bottom tab navigation, infinite-scroll feed, post interactions, and smooth micro-interactions.

**Architecture:** Preserve existing stack (React 18, TypeScript, Vite, Tailwind 3, shadcn/ui conventions, Supabase, React Router v6, TanStack React Query v5, lucide-react). Add one new Supabase table (`post_util`) for like interactions. Replace `HomePage` with `FeedPage` as default route. Add `MobileBottomBar` and `DesktopSidebar` for navigation. Add toast system and skeleton loaders. Redesign all pages and components following X aesthetic.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 3, shadcn/ui, Supabase, React Router v6, TanStack React Query v5, lucide-react, Vitest + Testing Library + MSW.

**Design Spec:** `docs/superpowers/specs/2026-06-27-twitter-style-redesign-design.md`

---

## File Structure

```
src/
├── index.css                          (MODIFY — dark CSS variables)
├── App.tsx                            (MODIFY — new layout, routes)
├── lib/
│   ├── utils.ts                       (MODIFY — add cn utility if needed, already exists)
│   └── hooks/
│       ├── useIntersectionObserver.ts  (CREATE)
│       └── useToast.ts                 (CREATE)
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx                  (MODIFY — simplified, contextual header)
│   │   ├── MobileBottomBar.tsx         (CREATE)
│   │   └── DesktopSidebar.tsx          (CREATE)
│   ├── post/
│   │   ├── PostCard.tsx               (MODIFY — X-style redesign)
│   │   ├── PostCard.test.tsx          (MODIFY — update for new design)
│   │   ├── PostFeed.tsx               (MODIFY — supports FeedPage too)
│   │   ├── PostForm.tsx               (MODIFY — inline X-style)
│   │   ├── PostSkeleton.tsx           (CREATE)
│   │   └── PostActionBar.tsx          (CREATE — Útil + Share buttons)
│   ├── centro/
│   │   ├── CentroCard.tsx             (MODIFY — dark cards)
│   │   └── CentroGrid.tsx             (MINOR — class tweaks)
│   ├── common/
│   │   ├── SearchOverlay.tsx          (CREATE — full-screen search)
│   │   ├── SearchBar.tsx              (MINOR — style only)
│   │   ├── NecesidadesSelector.tsx    (MINOR — dark tokens)
│   │   └── FotoUploader.tsx           (MINOR — dark tokens)
│   ├── toast/
│   │   ├── ToastContainer.tsx         (CREATE)
│   │   └── Toast.tsx                  (CREATE)
│   └── ui/
│       └── button.tsx                 (MINOR — radius tweak)
├── features/
│   ├── posts/
│   │   ├── queries.ts                 (MODIFY — add useFeedPosts, useInfinitePostsFeed)
│   │   ├── mutations.ts              (MODIFY — add useToggleUtil)
│   │   └── realtime.ts               (MODIFY — add util counter channel)
│   └── centros/
│       └── queries.ts                 (MINOR — no change needed)
├── pages/
│   ├── FeedPage.tsx                   (CREATE — new home page)
│   ├── HomePage.tsx                   (MODIFY — becomes /centros grid page)
│   ├── CentroPerfilPage.tsx           (MODIFY — X-style profile)
│   ├── LoginPage.tsx                  (MODIFY — dark restyle)
│   ├── RegistroPage.tsx               (MODIFY — dark restyle)
│   ├── NuevoCentroPage.tsx            (MODIFY — dark restyle)
│   └── EditarCentroPage.tsx           (MODIFY — dark restyle)
├── types/
│   └── db.ts                          (MODIFY — add PostUtil, PostWithUtil types)
└── test/
    └── mocks/
        ├── fixtures.ts                (MODIFY — add post_util fixtures)
        └── handlers.ts                (MODIFY — add post_util endpoints)

supabase/
└── migrations/
    └── 00003_post_util.sql            (CREATE — new table + RLS + realtime)
```

---

### Task 1: Dark Mode CSS Variables

**Files:**
- Modify: `src/index.css`
- Modify: `tailwind.config.js`

- [ ] **Step 1: Replace CSS variables in index.css**

Replace the entire content of `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
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
    --radius: 0.625rem;
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
```

- [ ] **Step 2: Update tailwind.config.js radius**

Replace `borderRadius` in `tailwind.config.js`:

```js
borderRadius: {
  lg: 'var(--radius)',
  md: 'calc(var(--radius) - 2px)',
  sm: 'calc(var(--radius) - 4px)',
},
```

(Replace existing borderRadius block — the values stay the same since `--radius` changed from `0.5rem` to `0.625rem`.)

- [ ] **Step 3: Verify build works**

Run: `npm run build`
Expected: builds without errors.

---

### Task 2: MobileBottomBar Component

**Files:**
- Create: `src/components/layout/MobileBottomBar.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write the MobileBottomBar component**

Create `src/components/layout/MobileBottomBar.tsx`:

```tsx
import { NavLink, useLocation } from 'react-router-dom'
import type { AuthUser } from '@/types/db'
import { Home, Search, PlusCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  user: AuthUser | null
}

export function MobileBottomBar({ user }: Props) {
  const location = useLocation()
  const hideOn = ['/login', '/registro']
  if (hideOn.includes(location.pathname)) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-14 items-center justify-around border-t border-border bg-black pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
      <Tab to="/" icon={Home} label="Inicio" />
      <Tab to="/centros" icon={Search} label="Buscar" />
      <Tab
        to={user ? '/centros/nuevo' : '/login?redirect=/centros/nuevo'}
        icon={PlusCircle}
        label="Nuevo"
      />
      <Tab
        to={user ? '#' : '/login'}
        icon={User}
        label={user ? 'Perfil' : 'Entrar'}
      />
    </nav>
  )
}

function Tab({ to, icon: Icon, label }: { to: string; icon: typeof Home; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-[10px] transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={22}
            strokeWidth={isActive ? 2.5 : 2}
            className={cn(isActive && 'text-primary')}
          />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}
```

- [ ] **Step 2: Integrate MobileBottomBar into App.tsx**

Modify `src/App.tsx`:

Add import:
```tsx
import { MobileBottomBar } from '@/components/layout/MobileBottomBar'
```

Replace the `<footer>` section at the end:
```tsx
      <footer className="hidden border-t py-4 text-center text-xs text-muted-foreground lg:block">
        Acopio — ayuda humanitaria en Venezuela
      </footer>
      <MobileBottomBar user={user} />
```

Add bottom padding to `<main>`:
Change `<main className="container flex-1">` to:
```tsx
      <main className="container flex-1 pb-14 lg:pb-0">
```

Update the Routes — replace the `/` route:
```tsx
          <Route path="/" element={<FeedPage />} />
```

Add the import for FeedPage (will be created later, add now as a stub):
```tsx
import { FeedPage } from '@/pages/FeedPage'
```

And add a `/centros` route:
```tsx
          <Route path="/centros" element={<HomePage />} />
```

Full `App.tsx` after changes:

```tsx
import { Link, Route, Routes } from 'react-router-dom'
import { useSession } from '@/features/auth/session'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/layout/Navbar'
import { MobileBottomBar } from '@/components/layout/MobileBottomBar'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { FeedPage } from '@/pages/FeedPage'
import { HomePage } from '@/pages/HomePage'
import { CentroPerfilPage } from '@/pages/CentroPerfilPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegistroPage } from '@/pages/RegistroPage'
import { NuevoCentroPage } from '@/pages/NuevoCentroPage'
import { EditarCentroPage } from '@/pages/EditarCentroPage'

export default function App() {
  const { user, loading } = useSession()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={user} onLogout={() => supabase.auth.signOut()} />
      <main className="container flex-1 pb-14 lg:pb-0">
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/centros" element={<HomePage />} />
          <Route path="/centro/:id" element={<CentroPerfilPage user={user} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegistroPage />} />
          <Route
            path="/centros/nuevo"
            element={
              <ProtectedRoute user={user} loading={loading}>
                <NuevoCentroPage user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/centro/:id/editar"
            element={
              <ProtectedRoute user={user} loading={loading}>
                <EditarCentroPage user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <div className="py-16 text-center">
                <p className="text-lg font-semibold">404</p>
                <p className="text-muted-foreground">La pagina no existe.</p>
                <Link to="/" className="mt-3 inline-block text-primary underline">
                  Volver al inicio
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
      <MobileBottomBar user={user} />
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: fails because `FeedPage` doesn't exist yet — that's expected, will fix in Task 6.

---

### Task 3: DesktopSidebar Component

**Files:**
- Create: `src/components/layout/DesktopSidebar.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create DesktopSidebar**

Create `src/components/layout/DesktopSidebar.tsx`:

```tsx
import { NavLink } from 'react-router-dom'
import type { AuthUser } from '@/types/db'
import { Home, Search, PlusCircle, User, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

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
        <SidebarItem to="/centros" icon={Search} label="Buscar" />
        <SidebarItem
          to={user ? '/centros/nuevo' : '/login?redirect=/centros/nuevo'}
          icon={PlusCircle}
          label="Nuevo"
        />
        <SidebarItem
          to={user ? '#' : '/login'}
          icon={User}
          label={user ? 'Perfil' : 'Entrar'}
        />
      </nav>

      {user ? (
        <button
          onClick={onLogout}
          className="mt-auto flex items-center gap-3 rounded-full px-4 py-3 text-[15px] text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <LogOut size={22} />
          <span>{user.email}</span>
        </button>
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

- [ ] **Step 2: Integrate DesktopSidebar into App.tsx**

Add import:
```tsx
import { DesktopSidebar } from '@/components/layout/DesktopSidebar'
```

Add `<DesktopSidebar>` right after the opening `<div>`:
```tsx
    <div className="flex min-h-screen flex-col">
      <DesktopSidebar user={user} onLogout={() => supabase.auth.signOut()} />
      <Navbar user={user} onLogout={() => supabase.auth.signOut()} />
```

Wrap routes in a div for desktop offset:
```tsx
      <main className="container flex-1 pb-14 lg:ml-[275px] lg:max-w-[600px] lg:pb-0 lg:pl-0 lg:pr-0">
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: fails on missing FeedPage — expected.

---

### Task 4: Simplify Navbar for Mobile (Contextual Header)

**Files:**
- Modify: `src/components/layout/Navbar.tsx`

- [ ] **Step 1: Redesign Navbar as contextual header**

Replace content of `src/components/layout/Navbar.tsx`:

```tsx
import { Link, useLocation } from 'react-router-dom'
import type { AuthUser } from '@/types/db'
import { ArrowLeft } from 'lucide-react'

interface Props {
  user?: AuthUser | null
  onLogout?: () => void
}

export function Navbar({ user, onLogout }: Props) {
  const location = useLocation()
  const isSubPage = location.pathname !== '/' && location.pathname !== '/centros'

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-black/95 backdrop-blur lg:hidden">
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
          <Link to="/" className="text-[17px] font-bold tracking-tight text-primary">
            Acopio
          </Link>
        )}
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

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: fails on FeedPage — expected.

---

### Task 5: Create FeedPage Stub (to fix the build)

**Files:**
- Create: `src/pages/FeedPage.tsx`

- [ ] **Step 1: Create temporary FeedPage stub**

Create `src/pages/FeedPage.tsx`:

```tsx
export function FeedPage() {
  return (
    <div className="py-8 text-center text-muted-foreground">
      Feed — coming soon
    </div>
  )
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: builds successfully. Also run: `npm test`
Expected: existing tests pass (some may need route updates — see Task 20).

---

### Task 6: post_util Database Migration

**Files:**
- Create: `supabase/migrations/00003_post_util.sql`

- [ ] **Step 1: Write migration**

Create `supabase/migrations/00003_post_util.sql`:

```sql
create table if not exists public.post_util (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists idx_post_util_post on public.post_util (post_id);

alter table public.post_util enable row level security;

drop policy if exists "post_util_select_publico" on public.post_util;
create policy "post_util_select_publico"
  on public.post_util for select
  using ( true );

drop policy if exists "post_util_insert_auth" on public.post_util;
create policy "post_util_insert_auth"
  on public.post_util for insert
  to authenticated
  with check ( auth.uid() = user_id );

drop policy if exists "post_util_delete_owner" on public.post_util;
create policy "post_util_delete_owner"
  on public.post_util for delete
  to authenticated
  using ( auth.uid() = user_id );

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'post_util'
  ) then
    alter publication supabase_realtime add table public.post_util;
  end if;
end$$;
```

- [ ] **Step 2: Add types for PostUtil**

Modify `src/types/db.ts`, add at the end:

```ts
export interface PostUtil {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface PostWithUtil extends Post {
  util_count: number
  user_has_util: boolean
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: builds.

---

### Task 7: Infinite Feed Query Hook

**Files:**
- Modify: `src/features/posts/queries.ts`

- [ ] **Step 1: Add useInfinitePostsFeed and useFeedPosts**

Replace content of `src/features/posts/queries.ts`:

```ts
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Post, PostWithUtil } from '@/types/db'

const PAGE_SIZE = 20

function toPostWithUtil(post: Post): PostWithUtil {
  return { ...post, util_count: 0, user_has_util: false }
}

export function usePostsCentro(centroId: string) {
  return useQuery<PostWithUtil[]>({
    queryKey: ['posts', centroId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('centro_id', centroId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map(toPostWithUtil) as PostWithUtil[]
    },
    enabled: !!centroId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

export function useInfinitePostsFeed() {
  return useInfiniteQuery<PostWithUtil[]>({
    queryKey: ['posts', 'feed'],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as string | undefined
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)

      if (cursor) {
        query = query.lt('created_at', cursor)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []).map(toPostWithUtil) as PostWithUtil[]
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PAGE_SIZE) return undefined
      return lastPage[lastPage.length - 1]?.created_at
    },
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: builds.

---

### Task 8: PostCard X-style Redesign

**Files:**
- Modify: `src/components/post/PostCard.tsx`

- [ ] **Step 1: Rewrite PostCard**

Replace content of `src/components/post/PostCard.tsx`:

```tsx
import { Link } from 'react-router-dom'
import type { PostWithUtil } from '@/types/db'
import { formatDate } from '@/lib/utils'
import { Heart, Share } from 'lucide-react'
import { useToggleUtil } from '@/features/posts/mutations'

interface Props {
  post: PostWithUtil
  centroNombre?: string
  centroCiudad?: string
  showCentro?: boolean
}

export function PostCard({ post, centroNombre, centroCiudad, showCentro = false }: Props) {
  const toggleUtil = useToggleUtil()

  function handleUtil() {
    toggleUtil.mutate({ postId: post.id, active: post.user_has_util })
  }

  function handleShare() {
    const url = `${window.location.origin}/centro/${post.centro_id}`
    if (navigator.share) {
      navigator.share({ title: 'Publicacion de Acopio', url })
    } else {
      navigator.clipboard.writeText(url)
    }
  }

  return (
    <article className="border-b border-border px-4 py-3 transition-colors hover:bg-secondary/30 active:bg-secondary/50">
      {showCentro && centroNombre && (
        <Link
          to={`/centro/${post.centro_id}`}
          className="mb-1 flex items-center gap-2"
        >
          <span className="text-[15px] font-bold leading-tight tracking-[-0.3px] text-primary hover:underline">
            {centroNombre}
          </span>
          {centroCiudad && (
            <span className="text-[13px] text-muted-foreground">@{centroCiudad}</span>
          )}
        </Link>
      )}

      <div className="flex items-center justify-between text-[13px] text-muted-foreground">
        {!showCentro && (
          <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
        )}
        {showCentro && (
          <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
        )}
      </div>

      {post.foto_url && (
        <img
          src={post.foto_url}
          alt="Foto del post"
          loading="lazy"
          decoding="async"
          className="mt-2 w-full rounded-2xl border border-border object-cover"
        />
      )}

      {post.contenido && (
        <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed">{post.contenido}</p>
      )}

      {post.necesidades.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {post.necesidades.map((n) => (
            <span
              key={n}
              className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary"
            >
              {n}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center gap-6">
        <button
          type="button"
          onClick={handleUtil}
          disabled={toggleUtil.isPending}
          className="group flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
        >
          <Heart
            size={18}
            className={post.user_has_util ? 'fill-primary text-primary' : ''}
          />
          <span>{post.util_count}</span>
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-primary"
        >
          <Share size={18} />
        </button>
      </div>
    </article>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: fails — `useToggleUtil` doesn't exist yet. Expected, will fix in Task 9.

---

### Task 9: useToggleUtil Mutation

**Files:**
- Modify: `src/features/posts/mutations.ts`

- [ ] **Step 1: Add useToggleUtil**

Add to the bottom of `src/features/posts/mutations.ts`:

```ts
export interface ToggleUtilInput {
  postId: string
  active: boolean
}

export function useToggleUtil() {
  const qc = useQueryClient()
  return useMutation<void, Error, ToggleUtilInput>({
    mutationFn: async ({ postId, active }) => {
      if (active) {
        const { error } = await supabase
          .from('post_util')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('post_util')
          .insert({ post_id: postId })
        if (error) throw error
      }
    },
    onMutate: async ({ postId, active }) => {
      await qc.cancelQueries({ queryKey: ['posts', 'feed'] })
      const prev = qc.getQueryData(['posts', 'feed'])
      // Optimistic update cascades through all pages
      qc.setQueriesData<{ pages: PostWithUtil[][] }>(
        { queryKey: ['posts', 'feed'] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((p) =>
                p.id === postId
                  ? {
                      ...p,
                      user_has_util: !active,
                      util_count: active ? Math.max(0, p.util_count - 1) : p.util_count + 1,
                    }
                  : p
              )
            ),
          }
        }
      )
      return { prev }
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        qc.setQueryData(['posts', 'feed'], context.prev)
      }
    },
  })
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: builds.

---

### Task 10: PostSkeleton Component

**Files:**
- Create: `src/components/post/PostSkeleton.tsx`

- [ ] **Step 1: Create PostSkeleton**

Create `src/components/post/PostSkeleton.tsx`:

```tsx
export function PostSkeleton() {
  return (
    <div className="animate-pulse border-b border-border px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-secondary" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-28 rounded bg-secondary" />
          <div className="h-3 w-16 rounded bg-secondary" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3.5 w-full rounded bg-secondary" />
        <div className="h-3.5 w-3/4 rounded bg-secondary" />
      </div>
      <div className="mt-3 h-48 w-full rounded-2xl bg-secondary" />
    </div>
  )
}

export function PostSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <PostSkeleton key={i} />
      ))}
    </>
  )
}
```

---

### Task 11: FeedPage (Full Implementation)

**Files:**
- Modify: `src/pages/FeedPage.tsx`
- Create: `src/lib/hooks/useIntersectionObserver.ts`
- Create: `src/lib/hooks/useToast.ts`

- [ ] **Step 1: Create useIntersectionObserver hook**

Create `src/lib/hooks/useIntersectionObserver.ts`:

```ts
import { useEffect, useRef } from 'react'

export function useIntersectionObserver(
  onIntersect: () => void,
  enabled: boolean
) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onIntersect()
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [onIntersect, enabled])

  return sentinelRef
}
```

- [ ] **Step 2: Create useToast hook**

Create `src/lib/hooks/useToast.ts`:

```ts
import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

let toastId = 0

const listeners = new Set<(toasts: Toast[]) => void>()
let currentToasts: Toast[] = []

function notify() {
  listeners.forEach((fn) => fn(currentToasts))
}

export function addToast(message: string, type: Toast['type'] = 'info') {
  const id = String(++toastId)
  currentToasts = [...currentToasts, { id, message, type }]
  notify()
  setTimeout(() => {
    currentToasts = currentToasts.filter((t) => t.id !== id)
    notify()
  }, 3000)
}

export function useToasts(): Toast[] {
  const [toasts, setToasts] = useState<Toast[]>(currentToasts)
  const subscribe = useCallback((fn: (t: Toast[]) => void) => {
    listeners.add(fn)
    return () => listeners.delete(fn)
  }, [])

  useEffect(() => {
    const unsub = subscribe(setToasts)
    return unsub
  }, [subscribe])

  return toasts
}
```

Fix the import — add `useEffect` and `useState`:

```ts
import { useState, useCallback, useEffect } from 'react'
```

- [ ] **Step 3: Write FeedPage**

Replace content of `src/pages/FeedPage.tsx`:

```tsx
import { useCallback } from 'react'
import { useInfinitePostsFeed } from '@/features/posts/queries'
import { PostCard } from '@/components/post/PostCard'
import { PostSkeletonList } from '@/components/post/PostSkeleton'
import { useIntersectionObserver } from '@/lib/hooks/useIntersectionObserver'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PostWithUtil } from '@/types/db'

export function FeedPage() {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = useInfinitePostsFeed()

  const posts: PostWithUtil[] = data?.pages.flat() ?? []

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const sentinelRef = useIntersectionObserver(loadMore, hasNextPage ?? false)

  if (isLoading) {
    return (
      <div className="py-4">
        <PostSkeletonList count={5} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <p className="text-sm text-muted-foreground">
          No se pudieron cargar las publicaciones.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <Heart size={48} className="text-muted-foreground" />
        <p className="text-center text-sm text-muted-foreground">
          Aun no hay publicaciones.
          <br />
          Cuando los centros publiquen actualizaciones, apareceran aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="py-2">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          showCentro
          centroNombre={post.centro_id}
          centroCiudad=""
        />
      ))}
      <div ref={sentinelRef} className="py-4 text-center">
        {isFetchingNextPage ? (
          <span className="text-sm text-muted-foreground">Cargando mas...</span>
        ) : hasNextPage ? (
          <span className="text-sm text-muted-foreground">Desliza para ver mas</span>
        ) : null}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: builds.

---

### Task 12: Toast System Components

**Files:**
- Create: `src/components/toast/Toast.tsx`
- Create: `src/components/toast/ToastContainer.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create Toast component**

Create `src/components/toast/Toast.tsx`:

```tsx
import { Check, X, Info } from 'lucide-react'
import type { Toast as ToastType } from '@/lib/hooks/useToast'

const icons = {
  success: Check,
  error: X,
  info: Info,
}

export function ToastItem({ toast }: { toast: ToastType }) {
  const Icon = icons[toast.type]
  return (
    <div className="animate-in slide-in-from-bottom-2 fade-in flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-3 text-sm shadow-lg">
      <Icon size={16} className="shrink-0 text-primary" />
      <span>{toast.message}</span>
    </div>
  )
}
```

- [ ] **Step 2: Create ToastContainer**

Create `src/components/toast/ToastContainer.tsx`:

```tsx
import { useToasts } from '@/lib/hooks/useToast'
import { ToastItem } from './Toast'

export function ToastContainer() {
  const toasts = useToasts()
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-16 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2 lg:bottom-4">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Add ToastContainer to App**

Add to `src/App.tsx`:
```tsx
import { ToastContainer } from '@/components/toast/ToastContainer'
```

Add just before the closing `</div>` of the root div:
```tsx
      <ToastContainer />
    </div>
```

---

### Task 13: PostFeed Update (Support Feed Centros Info)

**Files:**
- Modify: `src/components/post/PostFeed.tsx`

- [ ] **Step 1: Update PostFeed to pass centro info**

Replace content of `src/components/post/PostFeed.tsx`:

```tsx
import type { PostWithUtil } from '@/types/db'
import { PostCard } from './PostCard'
import { PostSkeletonList } from './PostSkeleton'
import { Button } from '@/components/ui/button'

interface Props {
  posts: PostWithUtil[]
  isLoading: boolean
  isLive?: boolean
  error?: Error | null
  onRetry?: () => void
  centroNombre?: string
  centroCiudad?: string
}

export function PostFeed({
  posts,
  isLoading,
  isLive,
  error,
  onRetry,
  centroNombre,
  centroCiudad,
}: Props) {
  if (error) {
    return (
      <div data-testid="post-feed" className="space-y-2 rounded-md border border-destructive/20 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">No se pudieron cargar las publicaciones.</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </div>
    )
  }

  if (isLoading && posts.length === 0) {
    return (
      <div data-testid="post-feed">
        <PostSkeletonList count={3} />
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div data-testid="post-feed" className="py-8 text-center text-sm text-muted-foreground">
        Aun no hay publicaciones en este centro.
      </div>
    )
  }

  return (
    <div data-testid="post-feed">
      {isLive && (
        <p className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-primary">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          En vivo
        </p>
      )}
      {posts.map((p) => (
        <PostCard
          key={p.id}
          post={p}
          showCentro={!centroNombre}
          centroNombre={centroNombre}
          centroCiudad={centroCiudad}
        />
      ))}
    </div>
  )
}
```

---

### Task 14: CentroPerfilPage Redesign

**Files:**
- Modify: `src/pages/CentroPerfilPage.tsx`

- [ ] **Step 1: Rewrite CentroPerfilPage with X-style profile**

Replace content of `src/pages/CentroPerfilPage.tsx`:

```tsx
import { Link, useParams } from 'react-router-dom'
import type { AuthUser, PostWithUtil } from '@/types/db'
import { useCentro } from '@/features/centros/queries'
import { usePostsCentro } from '@/features/posts/queries'
import { useCrearPost } from '@/features/posts/mutations'
import { useRealtimePosts } from '@/features/posts/realtime'
import { PostFeed } from '@/components/post/PostFeed'
import { PostForm } from '@/components/post/PostForm'
import { MoreHorizontal, MapPin, Phone } from 'lucide-react'

interface Props {
  user: AuthUser | null
}

export function CentroPerfilPage({ user }: Props) {
  const { id = '' } = useParams()
  const { data: centro, isLoading, error } = useCentro(id)
  const {
    data: posts = [],
    isLoading: postsLoading,
    error: postsError,
    refetch,
  } = usePostsCentro(id)
  const isLive = useRealtimeSafe(id)
  void isLive
  const crearPost = useCrearPost()
  const esCoordinador = !!(user && centro && user.id === centro.coordinador_id)

  if (!id) return null

  if (isLoading) {
    return <p className="py-8 text-sm text-muted-foreground">Cargando centro...</p>
  }
  if (error || !centro) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No se encontro el centro solicitado.
      </p>
    )
  }

  const totalUtiles = (posts as PostWithUtil[]).reduce(
    (sum, p) => sum + (p.util_count ?? 0),
    0
  )

  return (
    <div className="space-y-0 pb-14">
      <div className="relative h-[140px] w-full overflow-hidden bg-gradient-to-b from-[#1A0A00] to-black">
        {centro.foto_portada && (
          <img
            src={centro.foto_portada}
            alt={centro.nombre}
            className="h-full w-full object-cover"
          />
        )}
        {esCoordinador && (
          <Link
            to={`/centro/${centro.id}/editar`}
            className="absolute right-3 top-3 rounded-full border border-border bg-black/60 p-1.5 text-white backdrop-blur hover:bg-black/80"
          >
            <MoreHorizontal size={18} />
          </Link>
        )}
      </div>

      <div className="space-y-3 px-4 py-3">
        <div>
          <h1 className="text-xl font-bold">{centro.nombre}</h1>
          <p className="text-[15px] text-muted-foreground">@{centro.ciudad}</p>
        </div>

        {centro.descripcion && (
          <p className="whitespace-pre-line text-[15px] leading-relaxed">
            {centro.descripcion}
          </p>
        )}

        <div className="flex flex-wrap gap-4 text-[13px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin size={14} />
            {centro.direccion}
          </span>
          {centro.contacto && (
            <a
              href={`https://wa.me/${centro.contacto.replace(/[^0-9]/g, '')}`}
              className="inline-flex items-center gap-1 text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Phone size={14} />
              {centro.contacto}
            </a>
          )}
        </div>

        <div className="flex gap-6 border-y border-border py-3 text-[13px]">
          <span>
            <strong className="text-foreground">{posts.length}</strong>{' '}
            <span className="text-muted-foreground">publicaciones</span>
          </span>
          <span>
            <strong className="text-foreground">{totalUtiles}</strong>{' '}
            <span className="text-muted-foreground">utiles</span>
          </span>
        </div>
      </div>

      <div className="border-b border-border px-4 py-2">
        <span className="text-[13px] font-semibold text-muted-foreground">
          Publicaciones
        </span>
      </div>

      {esCoordinador && (
        <div className="border-b border-border">
          <PostForm
            centroId={centro.id}
            submitting={crearPost.isPending}
            onSubmit={(values) =>
              crearPost.mutate(values, {
                onSuccess: () => refetch(),
              })
            }
          />
        </div>
      )}

      <PostFeed
        posts={posts as PostWithUtil[]}
        isLoading={postsLoading}
        isLive
        error={postsError}
        onRetry={() => refetch()}
        centroNombre={centro.nombre}
        centroCiudad={centro.ciudad}
      />
    </div>
  )
}

function useRealtimeSafe(centroId: string): boolean {
  useRealtimePosts(centroId)
  return true
}
```

---

### Task 15: PostForm Redesign (Inline X-style)

**Files:**
- Modify: `src/components/post/PostForm.tsx`

- [ ] **Step 1: Rewrite PostForm**

Replace content of `src/components/post/PostForm.tsx`:

```tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FotoUploader } from '@/components/common/FotoUploader'
import { NecesidadesSelector } from '@/components/common/NecesidadesSelector'
import { Image } from 'lucide-react'

export interface PostFormValues {
  centro_id: string
  contenido: string
  foto_url: string | null
  necesidades: string[]
}

interface Props {
  centroId: string
  onSubmit: (values: PostFormValues) => void
  submitting?: boolean
}

export function PostForm({ centroId, onSubmit, submitting = false }: Props) {
  const [contenido, setContenido] = useState('')
  const [foto, setFoto] = useState<string | null>(null)
  const [necesidades, setNecesidades] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showExtras, setShowExtras] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contenido.trim()) {
      setError('Escribi algo para publicar')
      return
    }
    setError(null)
    onSubmit({
      centro_id: centroId,
      contenido: contenido.trim(),
      foto_url: foto,
      necesidades,
    })
    setContenido('')
    setFoto(null)
    setNecesidades([])
    setShowExtras(false)
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3">
      <textarea
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        rows={3}
        placeholder="Que necesita este centro?"
        className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
      />

      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}

      {showExtras && (
        <div className="space-y-3 border-t border-border pt-3">
          <div>
            <FotoUploader
              value={foto}
              onChange={setFoto}
              storagePrefix={centroId}
            />
          </div>
          <NecesidadesSelector value={necesidades} onChange={setNecesidades} />
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => setShowExtras(!showExtras)}
          className="rounded-full p-2 text-primary hover:bg-primary/10"
        >
          <Image size={20} />
        </button>
        <Button
          type="submit"
          disabled={submitting || !contenido.trim()}
          size="sm"
          className="rounded-full px-5"
        >
          {submitting ? 'Publicando...' : 'Publicar'}
        </Button>
      </div>
    </form>
  )
}
```

---

### Task 16: Login / Registro Dark Restyle

**Files:**
- Modify: `src/pages/LoginPage.tsx`
- Modify: `src/pages/RegistroPage.tsx`

- [ ] **Step 1: Restyle LoginPage**

Replace the JSX in `src/pages/LoginPage.tsx`:

For the "sin-confirmar" state, replace its return block:
```tsx
      <div className="mx-auto max-w-[400px] space-y-6 px-6 py-16">
        <h1 className="text-xl font-bold">Confirma tu correo</h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Tu cuenta aun no esta activada. Revisa tu correo
          {email ? <><strong className="text-foreground"> {email}</strong> </> : null}
          y hace clic en el enlace de confirmacion para activarla.
        </p>
        {resendMsg && <p className="text-sm text-primary">{resendMsg}</p>}
        <Button type="button" variant="outline" onClick={handleResend} disabled={resending} className="w-full h-[52px] rounded-xl">
          {resending ? 'Enviando...' : 'Reenviar correo de confirmacion'}
        </Button>
        <div className="flex items-center justify-between text-[13px]">
          <button
            type="button"
            onClick={() => setEstado('form')}
            className="text-muted-foreground underline"
          >
            Volver
          </button>
          <Link to="/registro" className="font-medium text-primary underline">
            Crear cuenta
          </Link>
        </div>
      </div>
```

For the "form" state, replace its return block:
```tsx
    <div className="mx-auto max-w-[400px] space-y-6 px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Iniciar sesion</h1>
        <p className="text-[15px] text-muted-foreground">Continua para publicar</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email" className="text-[13px]">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="h-[52px] rounded-xl"
          />
        </div>
        <div>
          <Label htmlFor="password" className="text-[13px]">Contrasena</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="h-[52px] rounded-xl"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full h-[52px] rounded-xl">
          {submitting ? 'Entrando...' : 'Iniciar sesion'}
        </Button>
      </form>
      <p className="text-center text-[13px] text-muted-foreground">
        No tenes cuenta?{' '}
        <Link to="/registro" className="font-medium text-primary hover:underline">
          Crear cuenta
        </Link>
      </p>
    </div>
```

- [ ] **Step 2: Restyle RegistroPage** (same pattern)

Replace the "confirmacion" state return block in `src/pages/RegistroPage.tsx`:
```tsx
      <div className="mx-auto max-w-[400px] space-y-6 px-6 py-16">
        <h1 className="text-xl font-bold">Revisa tu correo</h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Hemos enviado un correo de confirmacion a <strong className="text-foreground">{email}</strong>. Hace
          clic en el enlace del correo para activar tu cuenta y poder registrar tu
          centro de acopio.
        </p>
        <p className="text-[13px] text-muted-foreground">
          Si no lo recibiste en unos minutos, revisa la carpeta de spam.
        </p>
        {resendMsg && <p className="text-sm text-primary">{resendMsg}</p>}
        <Button type="button" variant="outline" onClick={handleResend} disabled={resending} className="w-full h-[52px] rounded-xl">
          {resending ? 'Enviando...' : 'Reenviar correo'}
        </Button>
        <div className="flex items-center justify-between text-[13px]">
          <button
            type="button"
            onClick={() => setEstado('form')}
            className="text-muted-foreground underline"
          >
            Modificar mis datos
          </button>
          <Link to="/login" className="font-medium text-primary underline">
            Iniciar sesion
          </Link>
        </div>
      </div>
```

Replace the "form" state return block:
```tsx
    <div className="mx-auto max-w-[400px] space-y-6 px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Crear cuenta</h1>
        <p className="text-[15px] text-muted-foreground">Registrate para crear centros de acopio</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email" className="text-[13px]">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="h-[52px] rounded-xl"
          />
        </div>
        <div>
          <Label htmlFor="password" className="text-[13px]">Contrasena</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="h-[52px] rounded-xl"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full h-[52px] rounded-xl">
          {submitting ? 'Creando...' : 'Crear cuenta'}
        </Button>
      </form>
      <p className="text-center text-[13px] text-muted-foreground">
        Ya tenes cuenta?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Iniciar sesion
        </Link>
      </p>
    </div>
```

---

### Task 17: NuevoCentro / EditarCentro Dark Restyle

**Files:**
- Modify: `src/pages/NuevoCentroPage.tsx`
- Modify: `src/pages/EditarCentroPage.tsx`

- [ ] **Step 1: Restyle NuevoCentroPage**

Replace JSX return in `src/pages/NuevoCentroPage.tsx`:
```tsx
    <div className="mx-auto max-w-[400px] space-y-6 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Registrar centro de acopio</h1>
        <p className="text-[15px] text-muted-foreground">
          Registra la direccion y el contacto del centro.
        </p>
      </div>
      <CentroForm
        initial={{}}
        onSubmit={handleSubmit}
        submitting={crear.isPending}
        submitLabel="Registrar centro"
      />
    </div>
```

- [ ] **Step 2: Restyle EditarCentroPage**

Replace JSX return in `src/pages/EditarCentroPage.tsx`:
```tsx
    <div className="mx-auto max-w-[400px] space-y-4 px-6 py-8">
      <h1 className="text-2xl font-bold">Editar centro</h1>
      <CentroForm
        key={centro.id}
        initial={centro}
        onSubmit={handleSubmit}
        submitting={editar.isPending}
        submitLabel="Guardar cambios"
      />
    </div>
```

---

### Task 18: SearchOverlay Component

**Files:**
- Create: `src/components/common/SearchOverlay.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create SearchOverlay**

Create `src/components/common/SearchOverlay.tsx`:

```tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { useCentros } from '@/features/centros/queries'
import { Search, X } from 'lucide-react'
import { NECESIDADES_PREDEFINIDAS } from '@/lib/constants'

interface Props {
  open: boolean
  onClose: () => void
}

export function SearchOverlay({ open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const { data: centros = [] } = useCentros()
  const navigate = useNavigate()

  if (!open) return null

  const filtered =
    query.trim()
      ? centros.filter(
          (c) =>
            c.nombre.toLowerCase().includes(query.toLowerCase()) ||
            c.ciudad.toLowerCase().includes(query.toLowerCase())
        )
      : centros.slice(0, 10)

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-black animate-in slide-in-from-bottom duration-200">
      <div className="flex items-center gap-3 border-b border-border px-4 py-2">
        <button onClick={onClose} className="text-muted-foreground">
          <X size={20} />
        </button>
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar centros..."
          className="h-10 flex-1 border-0 bg-transparent text-[15px] focus-visible:ring-0"
        />
      </div>

      <div className="flex-1 overflow-auto">
        {!query.trim() && (
          <div className="flex flex-wrap gap-2 px-4 py-3">
            {NECESIDADES_PREDEFINIDAS.slice(0, 6).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setQuery(n)
                }}
                className="rounded-full bg-secondary px-4 py-1.5 text-[13px] text-muted-foreground hover:bg-primary/10 hover:text-primary"
              >
                {n}
              </button>
            ))}
          </div>
        )}

        {filtered.map((c) => (
          <Link
            key={c.id}
            to={`/centro/${c.id}`}
            onClick={onClose}
            className="flex items-center gap-3 border-b border-border px-4 py-3 hover:bg-secondary/50"
          >
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-secondary">
              {c.foto_portada && (
                <img src={c.foto_portada} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-medium">{c.nombre}</p>
              <p className="text-[13px] text-muted-foreground">{c.ciudad}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Integrate into App**

Wrap the search overlay tab logic. The MobileBottomBar uses a NavLink to `/centros` for search. We'll change the approach: use state + overlay on the bottom bar itself.

Modify `src/components/layout/MobileBottomBar.tsx` to handle search overlay locally:

Add to top of the component:
```tsx
import { useState } from 'react'
import { SearchOverlay } from '@/components/common/SearchOverlay'
```

Add state and render SearchOverlay inside the component:
```tsx
export function MobileBottomBar({ user }: Props) {
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const hideOn = ['/login', '/registro']
  if (hideOn.includes(location.pathname)) return null

  return (
    <>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-14 items-center justify-around border-t border-border bg-black pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
        <Tab to="/" icon={Home} label="Inicio" />
        <button
          onClick={() => setSearchOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <Search size={22} strokeWidth={2} />
          <span>Buscar</span>
        </button>
        <Tab
          to={user ? '/centros/nuevo' : '/login?redirect=/centros/nuevo'}
          icon={PlusCircle}
          label="Nuevo"
        />
        <Tab
          to={user ? '#' : '/login'}
          icon={User}
          label={user ? 'Perfil' : 'Entrar'}
        />
      </nav>
    </>
  )
}
```

---

### Task 19: CentroCard and CentroGrid Dark Style Tweaks

**Files:**
- Modify: `src/components/centro/CentroCard.tsx`
- Modify: `src/components/centro/CentroGrid.tsx`

- [ ] **Step 1: Update CentroCard**

Replace the className in the `<Link>` element:
```tsx
      className="block overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-shadow hover:border-primary/30 hover:shadow-md active:scale-[0.98]"
```

- [ ] **Step 2: Update CentroGrid**

Change the grid class:
```tsx
      className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 px-4"
```

---

### Task 20: Updates to Test Files

**Files:**
- Modify: `src/components/post/PostCard.test.tsx`
- Modify: `src/test/mocks/fixtures.ts`
- Modify: `src/test/mocks/handlers.ts`

- [ ] **Step 1: Update PostCard test for new props**

Replace `src/components/post/PostCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { PostWithUtil } from '@/types/db'
import { PostCard } from './PostCard'

const post: PostWithUtil = {
  id: '11111111-0000-0000-0000-000000000001',
  centro_id: 'c1',
  contenido: 'Necesitamos agua y panales urgentemente.',
  foto_url: null,
  necesidades: ['Agua', 'Panales'],
  created_at: '2025-01-12T10:00:00.000Z',
  util_count: 3,
  user_has_util: false,
}

function renderCard(props = {}) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <PostCard post={post} {...props} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('PostCard', () => {
  it('renders the post content and the formatted date', () => {
    renderCard()
    expect(screen.getByText(post.contenido)).toBeInTheDocument()
    expect(screen.getByText(/12.*ene/i)).toBeInTheDocument()
  })

  it('renders chips for each necesidad', () => {
    renderCard()
    expect(screen.getByText('Agua')).toBeInTheDocument()
    expect(screen.getByText('Panales')).toBeInTheDocument()
  })

  it('renders no chips when there are no necesidades', () => {
    renderCard({ post: { ...post, necesidades: [] } })
    expect(screen.queryByText('Agua')).not.toBeInTheDocument()
  })

  it('renders the photo when foto_url is provided', () => {
    renderCard({ post: { ...post, foto_url: 'https://cdn.example.com/p.jpg' } })
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://cdn.example.com/p.jpg')
  })

  it('shows centro name and link when showCentro is true', () => {
    renderCard({
      post,
      showCentro: true,
      centroNombre: 'Centro Test',
      centroCiudad: 'Caracas',
    })
    expect(screen.getByText('Centro Test')).toBeInTheDocument()
    expect(screen.getByText('@Caracas')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Add post_util to MSW fixtures**

Add to `src/test/mocks/fixtures.ts` at the end:
```ts
import type { PostUtil } from '@/types/db'

export const fixturePostUtil: PostUtil = {
  id: 'uuuuuuuu-0000-0000-0000-000000000001',
  post_id: fixturePost.id,
  user_id: fixtureUser.id,
  created_at: '2025-01-12T12:00:00.000Z',
}
```

- [ ] **Step 3: Add post_util MSW handler**

Add to `src/test/mocks/handlers.ts` in the Store interface:
```ts
interface Store {
  centros: CentroAcopio[]
  posts: Post[]
  postUtils: PostUtil[]
}
```

Add to `makeStore()`:
```ts
    postUtils: [structuredClone(fixturePostUtil)],
```

Add these handlers to the `restHandlers` array:
```ts
  http.get(`${BASE}/rest/v1/post_util`, ({ request }) => {
    const url = new URL(request.url)
    const { filters } = parseQuery(url)
    let rows = applyFilters(store.postUtils as unknown as Record<string, unknown>[], filters)
    return HttpResponse.json(rows)
  }),

  http.post(`${BASE}/rest/v1/post_util`, async ({ request }) => {
    const body = (await request.json()) as Partial<PostUtil>
    const created: PostUtil = {
      id: crypto.randomUUID(),
      post_id: body.post_id ?? '',
      user_id: body.user_id ?? '',
      created_at: new Date().toISOString(),
    }
    store.postUtils.push(created)
    return HttpResponse.json(created)
  }),

  http.delete(`${BASE}/rest/v1/post_util`, ({ request }) => {
    const url = new URL(request.url)
    const { filters } = parseQuery(url)
    store.postUtils = store.postUtils.filter(
      (pu) => !(filters.post_id && pu.post_id === filters.post_id)
    )
    return HttpResponse.json(null, { status: 204 })
  }),
```

Add the import for `PostUtil` and `fixturePostUtil`:
```ts
import type { CentroAcopio, Post, PostUtil } from '@/types/db'
```
and
```ts
  fixturePostUtil,
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: Tests pass. Some may need adjustments — fix inline if any fail.

---

### Task 21: Realtime Subscription for Feed and post_util Counters

**Files:**
- Create: `src/features/posts/realtime-feed.ts`
- Modify: `src/features/posts/realtime.ts`

- [ ] **Step 1: Create feed-wide realtime hook**

Create `src/features/posts/realtime-feed.ts`:

```ts
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Post, PostWithUtil } from '@/types/db'

export function useRealtimeFeedPosts(): void {
  const qc = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('posts:feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          const newPost = payload.new as Post
          qc.setQueryData<{ pages: PostWithUtil[][] }>(
            ['posts', 'feed'],
            (old) => {
              if (!old || !old.pages?.length) {
                return { pages: [[{ ...newPost, util_count: 0, user_has_util: false } as PostWithUtil]], pageParams: [undefined] } as unknown as { pages: PostWithUtil[][]; pageParams: unknown[] }
              }
              const newFirstPage = [
                { ...newPost, util_count: 0, user_has_util: false } as PostWithUtil,
                ...old.pages[0],
              ]
              return { ...old, pages: [newFirstPage, ...old.pages.slice(1)] }
            }
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])
}

export function useRealtimePostUtil(): void {
  const qc = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('post_util:changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_util',
        },
        (payload) => {
          updateUtilCount(qc, payload.new.post_id as string, 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'post_util',
        },
        (payload) => {
          updateUtilCount(qc, payload.old.post_id as string, -1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])
}

function updateUtilCount(qc: ReturnType<typeof useQueryClient>, postId: string, delta: number) {
  qc.setQueriesData<{ pages: PostWithUtil[][] }>(
    { queryKey: ['posts', 'feed'] },
    (old) => {
      if (!old) return old
      return {
        ...old,
        pages: old.pages.map((page) =>
          page.map((p) =>
            p.id === postId
              ? { ...p, util_count: p.util_count + delta }
              : p
          )
        ),
      }
    }
  )
}
```

- [ ] **Step 2: Wire realtime hooks into FeedPage**

Add to `src/pages/FeedPage.tsx`:

```tsx
import { useRealtimeFeedPosts, useRealtimePostUtil } from '@/features/posts/realtime-feed'
```

Inside the component, add:
```tsx
  useRealtimeFeedPosts()
  useRealtimePostUtil()
```

- [ ] **Step 3: Wire realtime post_util into CentroPerfilPage**

Add to `src/pages/CentroPerfilPage.tsx`:
```tsx
import { useRealtimePostUtil } from '@/features/posts/realtime-feed'
```

Inside the component, add:
```tsx
  useRealtimePostUtil()
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: builds.

---

### Task 22: Performance Optimizations

**Files:**
- Modify: `src/components/post/PostCard.tsx`
- Modify: `src/components/centro/CentroCard.tsx`
- Modify: `src/components/common/SearchOverlay.tsx`

- [ ] **Step 1: Add React.memo to PostCard**

Wrap PostCard at the bottom of `src/components/post/PostCard.tsx`:

Add `import { memo } from 'react'` and change:
```tsx
export function PostCard({ post, centroNombre, centroCiudad, showCentro = false }: Props) {
```
to:
```tsx
export const PostCard = memo(function PostCard({ post, centroNombre, centroCiudad, showCentro = false }: Props) {
```

And close with `})` at the end:
```tsx
})
```

- [ ] **Step 2: Add React.memo to CentroCard**

Wrap CentroCard at the bottom of `src/components/centro/CentroCard.tsx`:

Add `import { memo } from 'react'` and change:
```tsx
export function CentroCard({ centro }: Props) {
```
to:
```tsx
export const CentroCard = memo(function CentroCard({ centro }: Props) {
```

Close with `})`.

- [ ] **Step 3: Add useDeferredValue to search overlay**

In `src/components/common/SearchOverlay.tsx`, add import:
```tsx
import { useState, useDeferredValue } from 'react'
```

And use deferred value for the filter:
```tsx
  const deferredQuery = useDeferredValue(query)

  const filtered =
    deferredQuery.trim()
      ? centros.filter(
          (c) =>
            c.nombre.toLowerCase().includes(deferredQuery.toLowerCase()) ||
            c.ciudad.toLowerCase().includes(deferredQuery.toLowerCase())
        )
      : centros.slice(0, 10)
```

- [ ] **Step 4: Verify build and tests**

Run: `npm run build` then `npm test`
Expected: builds, tests pass.

---

### Task 23: Micro-interactions & Polish

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/ui/button.tsx`

- [ ] **Step 1: Add custom scrollbar and transition utilities**

Add to the end of `src/index.css`:

```css
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

- [ ] **Step 2: Update button for touch feedback**

Modify the `buttonVariants` cva base class in `src/components/ui/button.tsx`:
```ts
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50',
```

Note: changing `rounded-md` to `rounded-2xl` and adding `active:scale-[0.97]` and `ring-offset-black`.

---

### Task 24: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: TypeScript types check, Vite builds successfully.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: No lint errors (oxlint).

- [ ] **Step 3: Test**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 4: Coverage**

Run: `npm run test:coverage`
Expected: Coverage meets 80% threshold on lines, functions, statements, branches.

---

## Notes

- The `PostCard` component in `FeedPage` currently uses `post.centro_id` as the nombre since the feed query doesn't join centro data. A future task should fetch centro metadata alongside posts or add a Postgres view.
- The `useToggleUtil` mutation uses `supabase.auth.getUser()` to get the current user ID. This requires an authenticated session — the button is only interactive for logged-in users.
- Desktop sidebar: user profile section is minimal (just email + logout). A future enhancement could show user stats.
- Pull-to-refresh is omitted for now (complex touch interaction). The feed uses infinite scroll + skeleton loaders instead.
- The `tailwind.config.js` `borderRadius` update is technically a no-op since `--radius` changed but the reference stayed the same. The visual effect comes from the CSS variable value change.
