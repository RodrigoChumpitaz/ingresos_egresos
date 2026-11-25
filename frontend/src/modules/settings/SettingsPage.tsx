import { LayoutTemplate, Monitor, Moon, Palette, RefreshCw, RotateCcw, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ColorPickerField } from '@/shared/components/ColorPickerField';
import {
  PALETTE_PRESETS,
  usePreferences,
  type BorderContrast,
  type CardShadowMode,
  type DensityMode,
  type PaletteColors,
  type PalettePresetId,
  type RadiusPreset,
  type ThemeMode,
} from '@/shared/context/PreferencesContext';
import type { CurrencyCode } from '@/types/finance';

const CURRENCY_LIST: CurrencyCode[] = ['PEN', 'USD', 'EUR', 'MXN'];

export function SettingsPage() {
  const {
    prefs,
    updatePrefs,
    applyPreset,
    updateColor,
    resetPrefs,
    rates,
    ratesLoading,
    refreshRates,
    rateToBase,
    formatMoney,
  } = usePreferences();

  const handleRefreshRates = async () => {
    await refreshRates();
    toast.success('Tasas de cambio actualizadas');
  };

  const handleReset = () => {
    resetPrefs();
    toast.success('Preferencias restauradas a los valores iniciales');
  };

  const colorFields: Array<{ key: keyof PaletteColors; label: string; hint: string }> = [
    { key: 'primary', label: 'Color principal (acentos y botones)', hint: 'Afecta navegación, botones y foco.' },
    { key: 'income', label: 'Color de ingresos', hint: 'Usado en KPIs, gráficos y badges positivos.' },
    { key: 'expense', label: 'Color de egresos', hint: 'Usado en gastos, alertas y salidas.' },
    { key: 'savings', label: 'Color de ahorro', hint: 'Usado en KPI de ahorro, metas y tasa.' },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="size-5 text-primary" />
              Apariencia y colores en vivo
            </CardTitle>
            <CardDescription>
              Elige una paleta o abre el selector visual interactivo de cada color. Todos los
              cambios se aplican en tiempo real.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <FieldGroup>
              <Field>
                <FieldLabel>Modo de tema</FieldLabel>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={prefs.theme}
                  onValueChange={(v) => {
                    if (v === 'light' || v === 'dark' || v === 'system') {
                      updatePrefs({ theme: v as ThemeMode });
                    }
                  }}
                  className="grid w-full max-w-md grid-cols-3"
                >
                  <ToggleGroupItem value="light" className="gap-1.5">
                    <Sun className="size-4" />
                    Claro
                  </ToggleGroupItem>
                  <ToggleGroupItem value="dark" className="gap-1.5">
                    <Moon className="size-4" />
                    Oscuro
                  </ToggleGroupItem>
                  <ToggleGroupItem value="system" className="gap-1.5">
                    <Monitor className="size-4" />
                    Sistema
                  </ToggleGroupItem>
                </ToggleGroup>
              </Field>

              <Field>
                <FieldLabel>Paletas predefinidas</FieldLabel>
                <div className="flex flex-wrap items-center gap-2">
                  {(Object.keys(PALETTE_PRESETS) as Array<Exclude<PalettePresetId, 'custom'>>).map(
                    (presetKey) => {
                      const preset = PALETTE_PRESETS[presetKey];
                      const active = prefs.palettePreset === presetKey;
                      return (
                        <Button
                          key={presetKey}
                          type="button"
                          variant={active ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => applyPreset(presetKey)}
                          className="gap-2"
                        >
                          <span
                            className="size-3 rounded-full border border-white/40"
                            style={{ backgroundColor: preset.colors.primary }}
                          />
                          {preset.label}
                        </Button>
                      );
                    },
                  )}
                  {prefs.palettePreset === 'custom' ? (
                    <Badge variant="secondary">Personalizado</Badge>
                  ) : null}
                </div>
              </Field>

              <Separator />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {colorFields.map((item) => (
                  <Field key={item.key}>
                    <FieldLabel htmlFor={`color-${item.key}`}>{item.label}</FieldLabel>
                    <ColorPickerField
                      id={`color-${item.key}`}
                      label={item.label}
                      value={prefs.colors[item.key]}
                      onChange={(hex) => updateColor(item.key, hex)}
                    />
                    <FieldDescription>{item.hint}</FieldDescription>
                  </Field>
                ))}
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutTemplate className="size-5 text-primary" />
              Estructura, bordes y cuadrantes
            </CardTitle>
            <CardDescription>
              Ajusta la forma, bordes, sombras y densidad de las tarjetas y gráficos en toda la app.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <FieldGroup>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Radio de bordes</FieldLabel>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={prefs.borderRadius}
                    onValueChange={(v) => {
                      if (v === 'sharp' || v === 'subtle' || v === 'rounded' || v === 'pill') {
                        updatePrefs({ borderRadius: v as RadiusPreset });
                      }
                    }}
                    className="grid w-full grid-cols-4"
                  >
                    <ToggleGroupItem value="sharp">Recto</ToggleGroupItem>
                    <ToggleGroupItem value="subtle">Suave</ToggleGroupItem>
                    <ToggleGroupItem value="rounded">Medio</ToggleGroupItem>
                    <ToggleGroupItem value="pill">Amplio</ToggleGroupItem>
                  </ToggleGroup>
                </Field>

                <Field>
                  <FieldLabel>Borde de cuadrantes</FieldLabel>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={prefs.borderStyle}
                    onValueChange={(v) => {
                      if (v === 'subtle' || v === 'default' || v === 'strong') {
                        updatePrefs({ borderStyle: v as BorderContrast });
                      }
                    }}
                    className="grid w-full grid-cols-3"
                  >
                    <ToggleGroupItem value="subtle">Sutil</ToggleGroupItem>
                    <ToggleGroupItem value="default">Normal</ToggleGroupItem>
                    <ToggleGroupItem value="strong">Marcado</ToggleGroupItem>
                  </ToggleGroup>
                </Field>

                <Field>
                  <FieldLabel>Sombra de tarjetas</FieldLabel>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={prefs.cardShadow}
                    onValueChange={(v) => {
                      if (v === 'none' || v === 'soft' || v === 'elevated') {
                        updatePrefs({ cardShadow: v as CardShadowMode });
                      }
                    }}
                    className="grid w-full grid-cols-3"
                  >
                    <ToggleGroupItem value="none">Plano</ToggleGroupItem>
                    <ToggleGroupItem value="soft">Suave</ToggleGroupItem>
                    <ToggleGroupItem value="elevated">Elevado</ToggleGroupItem>
                  </ToggleGroup>
                </Field>

                <Field>
                  <FieldLabel>Densidad de espaciado</FieldLabel>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={prefs.density}
                    onValueChange={(v) => {
                      if (v === 'comfortable' || v === 'compact') {
                        updatePrefs({ density: v as DensityMode });
                      }
                    }}
                    className="grid w-full grid-cols-2"
                  >
                    <ToggleGroupItem value="comfortable">Cómoda</ToggleGroupItem>
                    <ToggleGroupItem value="compact">Compacta</ToggleGroupItem>
                  </ToggleGroup>
                </Field>
              </div>

              <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <FieldLabel htmlFor="pref-grid">Líneas guía en gráficos</FieldLabel>
                  <FieldDescription>
                    Muestra u oculta la cuadrícula de fondo en barras y líneas.
                  </FieldDescription>
                </div>
                <Switch
                  id="pref-grid"
                  checked={prefs.showChartGrid}
                  onCheckedChange={(checked) => updatePrefs({ showChartGrid: checked })}
                />
              </div>
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-end border-t pt-4">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw data-icon="inline-start" />
              Restaurar valores por defecto
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferencias financieras y meta de ahorro</CardTitle>
            <CardDescription>
              Configura la divisa de visualización y tu porcentaje objetivo de ahorro.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="pref-currency">Moneda de visualización</FieldLabel>
              <Select
                value={prefs.displayCurrency}
                onValueChange={(v) => updatePrefs({ displayCurrency: v as CurrencyCode })}
              >
                <SelectTrigger id="pref-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="PEN">Sol peruano (PEN)</SelectItem>
                    <SelectItem value="USD">Dólar estadounidense (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="MXN">Peso mexicano (MXN)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                La contabilidad base se mantiene en PEN y se convierte con la tasa vigente.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="pref-goal">Meta mensual de ahorro (%)</FieldLabel>
              <Input
                id="pref-goal"
                type="number"
                min={5}
                max={80}
                value={prefs.savingsGoalPct}
                onChange={(e) => {
                  const val = Math.max(5, Math.min(80, Number(e.target.value) || 20));
                  updatePrefs({ savingsGoalPct: val });
                }}
              />
              <FieldDescription>
                Referencia usada en el Resumen general y Análisis detallado (actual: {prefs.savingsGoalPct}%).
              </FieldDescription>
            </Field>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vista previa en vivo</CardTitle>
            <CardDescription>Así lucen tus cuadrantes, bordes y colores</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="rounded-lg border p-3 transition-all duration-200">
              <div className="text-xs text-muted-foreground">Ejemplo de ingreso</div>
              <div className="text-lg font-bold text-income tabular-nums">{formatMoney(3200)}</div>
            </div>
            <div className="rounded-lg border p-3 transition-all duration-200">
              <div className="text-xs text-muted-foreground">Ejemplo de egreso</div>
              <div className="text-lg font-bold text-expense tabular-nums">{formatMoney(1450)}</div>
            </div>
            <div className="rounded-lg border p-3 transition-all duration-200">
              <div className="text-xs text-muted-foreground">Ejemplo de ahorro</div>
              <div className="text-lg font-bold text-savings tabular-nums">{formatMoney(1750)}</div>
            </div>
            <Button className="w-full">Botón principal</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle>Tipos de cambio</CardTitle>
              <CardDescription>
                Fuente: <strong>{rates.source}</strong>{' '}
                {rates.stale ? '(respaldo)' : '(en vivo)'}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={ratesLoading}
              aria-label="Actualizar tasas de cambio"
              onClick={handleRefreshRates}
            >
              <RefreshCw className={ratesLoading ? 'animate-spin' : ''} />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {CURRENCY_LIST.filter((c) => c !== 'PEN').map((code) => (
              <div key={code} className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="font-medium">1 {code}</span>
                <span className="font-mono font-semibold tabular-nums">
                  {rateToBase(code)} PEN
                </span>
              </div>
            ))}
            <p className="pt-1 text-xs text-muted-foreground">
              Última lectura: {new Date(rates.updatedAt).toLocaleString('es-PE')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
