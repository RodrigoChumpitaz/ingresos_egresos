import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthPage } from '@/modules/auth/AuthPage';
import { CategoriesPage } from '@/modules/categories/CategoriesPage';
import { CategoryModal } from '@/modules/categories/components/CategoryModal';
import { DashboardPage } from '@/modules/dashboard/DashboardPage';
import { MovementModal } from '@/modules/movements/components/MovementModal';
import { MovementsPage } from '@/modules/movements/MovementsPage';
import { ReportsPage } from '@/modules/reports/ReportsPage';
import { SavingsPage } from '@/modules/savings/SavingsPage';
import { SettingsPage } from '@/modules/settings/SettingsPage';
import { api, ApiError } from '@/services/api';
import { AppShell, type ApiStatusInfo } from '@/shared/components/AppShell';
import { AuthProvider, useAuth } from '@/shared/context/AuthContext';
import { PreferencesProvider, usePreferences } from '@/shared/context/PreferencesContext';
import { queryCache } from '@/shared/utils/query-cache';
import type { Category, Transaction } from '@/types/finance';

function AppRoutes() {
  const { resolvedTheme } = usePreferences();
  const { status, refreshSession } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [apiStatus, setApiStatus] = useState<ApiStatusInfo>({ online: true });
  const [movementModal, setMovementModal] = useState<Transaction | null | 'new'>(null);
  const [categoryModal, setCategoryModal] = useState<Category | null | 'new'>(null);

  const reloadAll = useCallback(() => {
    queryCache.clear();
    setRefreshKey((n) => n + 1);
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let active = true;
    Promise.all([api.health(), api.categories()])
      .then(([health, cats]) => {
        if (!active) return;
        setApiStatus({ online: health.status === 'ok', storageMode: health.storageMode });
        setCategories(cats);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          void refreshSession();
        } else {
          setApiStatus({ online: false });
        }
      });
    return () => {
      active = false;
    };
  }, [refreshKey, status, refreshSession]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Cargando sesión...
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <>
        <AuthPage />
        <Toaster theme={resolvedTheme} richColors position="bottom-right" />
      </>
    );
  }

  const handleSaved = () => {
    setMovementModal(null);
    setCategoryModal(null);
    reloadAll();
  };

  return (
    <>
      <AppShell
        apiStatus={apiStatus}
        onRefresh={reloadAll}
        onNewMovement={() => setMovementModal('new')}
      >
        <Routes>
          <Route
            path="/"
            element={
              <DashboardPage
                categories={categories}
                refreshKey={refreshKey}
                onAddMovement={() => setMovementModal('new')}
              />
            }
          />
          <Route
            path="/movements"
            element={
              <MovementsPage
                categories={categories}
                refreshKey={refreshKey}
                onEdit={setMovementModal}
                onAdd={() => setMovementModal('new')}
                onChanged={reloadAll}
              />
            }
          />
          <Route
            path="/categories"
            element={
              <CategoriesPage
                categories={categories}
                refreshKey={refreshKey}
                onEdit={setCategoryModal}
                onChanged={reloadAll}
              />
            }
          />
          <Route
            path="/savings"
            element={<SavingsPage refreshKey={refreshKey} onChanged={reloadAll} />}
          />
          <Route
            path="/reports"
            element={<ReportsPage categories={categories} refreshKey={refreshKey} />}
          />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>

      {movementModal !== null ? (
        <MovementModal
          item={movementModal === 'new' ? null : movementModal}
          categories={categories}
          onClose={() => setMovementModal(null)}
          onSuccess={handleSaved}
        />
      ) : null}

      {categoryModal !== null ? (
        <CategoryModal
          item={categoryModal === 'new' ? null : categoryModal}
          onClose={() => setCategoryModal(null)}
          onSuccess={handleSaved}
        />
      ) : null}

      <Toaster theme={resolvedTheme} richColors position="bottom-right" />
    </>
  );
}

export function App() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </PreferencesProvider>
  );
}

export default App;
