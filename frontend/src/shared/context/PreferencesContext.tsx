import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '@/services/api';
import { formatCurrency, shortMoney } from '@/shared/utils/format';
import type { CurrencyCode, ExchangeRatesResponse } from '@/types/finance';

export type ThemeMode = 'light' | 'dark' | 'system';
export type DensityMode = 'comfortable' | 'compact';
export type RadiusPreset = 'sharp' | 'subtle' | 'rounded' | 'pill';
export type BorderContrast = 'subtle' | 'default' | 'strong';
export type CardShadowMode = 'none' | 'soft' | 'elevated';
export type PalettePresetId = 'finanza' | 'emerald' | 'ocean' | 'slate' | 'custom';

export interface PaletteColors {
  primary: string;
  income: string;
  expense: string;
  savings: string;
}

export const RADIUS_VALUES: Record<RadiusPreset, string> = {
  sharp: '0.25rem',
  subtle: '0.5rem',
  rounded: '0.75rem',
  pill: '1.125rem',
};

export const PALETTE_PRESETS: Record<
  Exclude<PalettePresetId, 'custom'>,
  { label: string; colors: PaletteColors }
> = {
  finanza: {
    label: 'Violeta Finanza',
    colors: { primary: '#5b5ce2', income: '#10b981', expense: '#f43f5e', savings: '#6366f1' },
  },
  emerald: {
    label: 'Esmeralda',
    colors: { primary: '#059669', income: '#10b981', expense: '#e11d48', savings: '#0ea5e9' },
  },
  ocean: {
    label: 'Azul Océano',
    colors: { primary: '#2563eb', income: '#14b8a6', expense: '#f97316', savings: '#4f46e5' },
  },
  slate: {
    label: 'Grafito',
    colors: { primary: '#334155', income: '#16a34a', expense: '#dc2626', savings: '#0284c7' },
  },
};

export interface UserPreferences {
  theme: ThemeMode;
  palettePreset: PalettePresetId;
  colors: PaletteColors;
  density: DensityMode;
  borderRadius: RadiusPreset;
  borderStyle: BorderContrast;
  cardShadow: CardShadowMode;
  showChartGrid: boolean;
  displayCurrency: CurrencyCode;
  savingsGoalPct: number;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  palettePreset: 'finanza',
  colors: PALETTE_PRESETS.finanza.colors,
  density: 'comfortable',
  borderRadius: 'rounded',
  borderStyle: 'default',
  cardShadow: 'soft',
  showChartGrid: true,
  displayCurrency: 'PEN',
  savingsGoalPct: 20,
};

const STORAGE_KEY = 'finanza.preferences.v1';

const FALLBACK_RATES: ExchangeRatesResponse = {
  base: 'PEN',
  rates: { PEN: 1, USD: 0.2933, EUR: 0.27, MXN: 5.85 },
  updatedAt: new Date().toISOString(),
  source: 'fallback',
  stale: true,
};

function loadStoredPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      colors: { ...DEFAULT_PREFERENCES.colors, ...parsed.colors },
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function resolveDark(theme: ThemeMode): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

interface PreferencesContextValue {
  prefs: UserPreferences;
  resolvedTheme: 'light' | 'dark';
  updatePrefs: (patch: Partial<UserPreferences>) => void;
  applyPreset: (preset: Exclude<PalettePresetId, 'custom'>) => void;
  updateColor: (key: keyof PaletteColors, hex: string) => void;
  resetPrefs: () => void;
  rates: ExchangeRatesResponse;
  ratesLoading: boolean;
  refreshRates: () => Promise<void>;
  convertFromBase: (amountPen: number) => number;
  rateToBase: (currency: CurrencyCode) => number;
  formatMoney: (amountPen: number) => string;
  formatCompact: (amountPen: number) => string;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<UserPreferences>(loadStoredPreferences);
  const [rates, setRates] = useState<ExchangeRatesResponse>(FALLBACK_RATES);
  const [ratesLoading, setRatesLoading] = useState(false);

  const resolvedTheme: 'light' | 'dark' = resolveDark(prefs.theme) ? 'dark' : 'light';

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Ignorar si storage está bloqueado
    }
  }, [prefs]);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const isDark = resolveDark(prefs.theme);
      root.classList.toggle('dark', isDark);
      root.dataset.density = prefs.density;
      root.dataset.borderStyle = prefs.borderStyle;
      root.dataset.cardShadow = prefs.cardShadow;
      root.style.setProperty('--radius', RADIUS_VALUES[prefs.borderRadius]);
      root.style.setProperty('--primary', prefs.colors.primary);
      root.style.setProperty('--primary-foreground', '#ffffff');
      root.style.setProperty('--sidebar-primary', prefs.colors.primary);
      root.style.setProperty('--sidebar-primary-foreground', '#ffffff');
      root.style.setProperty('--ring', prefs.colors.primary);
      root.style.setProperty('--income', prefs.colors.income);
      root.style.setProperty('--expense', prefs.colors.expense);
      root.style.setProperty('--savings', prefs.colors.savings);
    };
    apply();

    if (prefs.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [prefs]);

  const refreshRates = useCallback(async () => {
    setRatesLoading(true);
    try {
      const data = await api.exchangeRates('PEN');
      setRates(data);
    } catch {
      // Mantener último fallback/caché
    } finally {
      setRatesLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshRates();
  }, [refreshRates]);

  const updatePrefs = useCallback((patch: Partial<UserPreferences>) => {
    setPrefs((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyPreset = useCallback((preset: Exclude<PalettePresetId, 'custom'>) => {
    setPrefs((prev) => ({
      ...prev,
      palettePreset: preset,
      colors: { ...PALETTE_PRESETS[preset].colors },
    }));
  }, []);

  const updateColor = useCallback((key: keyof PaletteColors, hex: string) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    setPrefs((prev) => ({
      ...prev,
      palettePreset: 'custom',
      colors: { ...prev.colors, [key]: hex.toLowerCase() },
    }));
  }, []);

  const resetPrefs = useCallback(() => {
    setPrefs(DEFAULT_PREFERENCES);
  }, []);

  const convertFromBase = useCallback(
    (amountPen: number) => {
      if (prefs.displayCurrency === 'PEN') return amountPen;
      const factor = rates.rates[prefs.displayCurrency] ?? 1;
      return Math.round(amountPen * factor * 100) / 100;
    },
    [prefs.displayCurrency, rates],
  );

  const rateToBase = useCallback(
    (currency: CurrencyCode) => {
      if (currency === 'PEN') return 1;
      const penToTarget = rates.rates[currency];
      if (!penToTarget || penToTarget <= 0) return 1;
      return Math.round((1 / penToTarget) * 10000) / 10000;
    },
    [rates],
  );

  const formatMoney = useCallback(
    (amountPen: number) => formatCurrency(convertFromBase(amountPen), prefs.displayCurrency),
    [convertFromBase, prefs.displayCurrency],
  );

  const formatCompact = useCallback(
    (amountPen: number) => shortMoney(convertFromBase(amountPen), prefs.displayCurrency),
    [convertFromBase, prefs.displayCurrency],
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({
      prefs,
      resolvedTheme,
      updatePrefs,
      applyPreset,
      updateColor,
      resetPrefs,
      rates,
      ratesLoading,
      refreshRates,
      convertFromBase,
      rateToBase,
      formatMoney,
      formatCompact,
    }),
    [
      prefs,
      resolvedTheme,
      updatePrefs,
      applyPreset,
      updateColor,
      resetPrefs,
      rates,
      ratesLoading,
      refreshRates,
      convertFromBase,
      rateToBase,
      formatMoney,
      formatCompact,
    ],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences debe usarse dentro de PreferencesProvider');
  return ctx;
}
