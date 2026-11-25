import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PiggyBank,
  Plus,
  RefreshCw,
  Settings,
  Sun,
  Tags,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/shared/context/AuthContext';
import { usePreferences } from '@/shared/context/PreferencesContext';
import type { CurrencyCode } from '@/types/finance';

const NAV_ITEMS = [
  { to: '/', label: 'Resumen general', icon: LayoutDashboard, badge: 'Simple' },
  { to: '/movements', label: 'Movimientos', icon: CreditCard },
  { to: '/categories', label: 'Categorías', icon: Tags },
  { to: '/savings', label: 'Metas de ahorro', icon: PiggyBank },
  { to: '/reports', label: 'Análisis detallado', icon: BarChart3, badge: 'Pro' },
  { to: '/settings', label: 'Personalización', icon: Settings },
];

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Resumen general',
    subtitle: 'Vista rápida y clara de tus ingresos, egresos y ahorro.',
  },
  '/movements': {
    title: 'Movimientos',
    subtitle: 'Busca, filtra y gestiona todas tus operaciones.',
  },
  '/categories': {
    title: 'Categorías',
    subtitle: 'Organiza tus fuentes de ingreso y rubros de gasto.',
  },
  '/savings': {
    title: 'Metas de ahorro',
    subtitle: 'Aparta dinero hacia objetivos concretos sin distorsionar tus egresos.',
  },
  '/reports': {
    title: 'Análisis detallado',
    subtitle: 'Comparativas entre períodos, tasa de ahorro y desglose completo.',
  },
  '/settings': {
    title: 'Personalización y preferencias',
    subtitle: 'Ajusta colores, tema, moneda de visualización y meta de ahorro.',
  },
};

export interface ApiStatusInfo {
  online: boolean;
  storageMode?: string;
}

function SidebarBody({
  onNavigate,
  onNewMovement,
}: {
  onNavigate?: () => void;
  onNewMovement: () => void;
}) {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center gap-2.5 px-2 py-1">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Activity className="size-5" />
        </span>
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight">
            finanza<span className="text-primary">.</span>
          </span>
          <span className="text-xs text-muted-foreground">Espacio personal</span>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-1">
        <span className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Menú principal
        </span>
        <nav className="flex flex-col gap-1" aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="flex items-center gap-2.5">
                    <item.icon className="size-4" />
                    {item.label}
                  </span>
                  {item.badge ? (
                    <Badge
                      variant={isActive ? 'secondary' : 'outline'}
                      className="text-[10px] font-normal"
                    >
                      {item.badge}
                    </Badge>
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-3.5">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Registro rápido</span>
            <span className="text-xs text-muted-foreground">
              Anota un ingreso o gasto al instante.
            </span>
          </div>
          <Button onClick={() => { onNavigate?.(); onNewMovement(); }} className="w-full">
            <Plus data-icon="inline-start" />
            Nuevo movimiento
          </Button>
        </div>

        {user ? (
          <div className="flex items-center justify-between gap-2 rounded-xl border bg-card px-3 py-2.5">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs font-semibold">{user.name}</span>
              <span className="truncate text-[11px] text-muted-foreground">{user.email}</span>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              onClick={() => void logout()}
            >
              <LogOut />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AppShell({
  children,
  apiStatus,
  onRefresh,
  onNewMovement,
}: {
  children: ReactNode;
  apiStatus: ApiStatusInfo;
  onRefresh: () => void;
  onNewMovement: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const { prefs, resolvedTheme, updatePrefs } = usePreferences();
  const meta = PAGE_META[pathname] ?? PAGE_META['/'];

  const toggleTheme = () => {
    updatePrefs({ theme: resolvedTheme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <div className="flex min-h-screen bg-muted/30 text-foreground transition-colors duration-300 ease-out">
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar transition-colors duration-300 ease-out lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarBody onNewMovement={onNewMovement} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b bg-background/95 px-3 backdrop-blur transition-colors duration-300 ease-out sm:gap-3 sm:px-4 lg:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" aria-label="Abrir menú">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-68 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Menú de navegación</SheetTitle>
                </SheetHeader>
                <SidebarBody
                  onNavigate={() => setMobileOpen(false)}
                  onNewMovement={onNewMovement}
                />
              </SheetContent>
            </Sheet>
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline">Finanza</span>
            <span className="hidden text-muted-foreground sm:inline">/</span>
            <span className="truncate text-sm font-semibold">{meta.title}</span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Select
              value={prefs.displayCurrency}
              onValueChange={(v) => updatePrefs({ displayCurrency: v as CurrencyCode })}
            >
              <SelectTrigger className="h-8 w-24 text-xs" aria-label="Moneda de visualización">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="PEN">PEN (S/)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="MXN">MXN ($)</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Cambiar tema claro u oscuro"
              title={resolvedTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
            </Button>

            <Badge
              variant="outline"
              className={cn(
                'hidden gap-1.5 sm:inline-flex',
                apiStatus.online
                  ? 'border-income/30 bg-income/10 text-income'
                  : 'border-expense/30 bg-expense/10 text-expense',
              )}
            >
              {apiStatus.online ? <Wifi /> : <WifiOff />}
              {apiStatus.online
                ? `API ${apiStatus.storageMode === 'memory' ? 'local (demo)' : 'conectada'}`
                : 'API sin conexión'}
            </Badge>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 lg:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{meta.title}</h1>
              <p className="text-sm text-muted-foreground">{meta.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw data-icon="inline-start" />
                Actualizar
              </Button>
              <Button size="sm" onClick={onNewMovement}>
                <Plus data-icon="inline-start" />
                Nuevo movimiento
              </Button>
            </div>
          </div>

          <div key={pathname} className="animate-in fade-in-0 duration-200">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
