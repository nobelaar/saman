import { Link, Route, Routes } from 'react-router-dom'
import { useSession } from '@/features/auth/session'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/layout/Navbar'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
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
      <main className="container flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
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
                <p className="text-muted-foreground">La página no existe.</p>
                <Link to="/" className="mt-3 inline-block text-primary underline">
                  Volver al inicio
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        Acopio — ayuda humanitaria en Venezuela
      </footer>
    </div>
  )
}