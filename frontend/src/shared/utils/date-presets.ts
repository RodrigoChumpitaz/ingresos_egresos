import { monthStart, today } from './format';

export type DatePresetKey = 'this_month' | 'prev_month' | 'last_30' | 'last_90' | 'this_year';

export interface DatePreset {
  key: DatePresetKey;
  label: string;
  getRange: () => { from: string; to: string };
}

function fmtLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysBack(days: number): { from: string; to: string } {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  return { from: fmtLocal(start), to: fmtLocal(end) };
}

export const DATE_PRESETS: DatePreset[] = [
  {
    key: 'this_month',
    label: 'Este mes',
    getRange: () => ({ from: monthStart(), to: today() }),
  },
  {
    key: 'prev_month',
    label: 'Mes anterior',
    getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: fmtLocal(start), to: fmtLocal(end) };
    },
  },
  {
    key: 'last_30',
    label: 'Últimos 30 días',
    getRange: () => daysBack(30),
  },
  {
    key: 'last_90',
    label: 'Últimos 90 días',
    getRange: () => daysBack(90),
  },
  {
    key: 'this_year',
    label: 'Año actual',
    getRange: () => ({ from: `${new Date().getFullYear()}-01-01`, to: today() }),
  },
];

export function detectPreset(from: string, to: string): DatePresetKey | null {
  for (const preset of DATE_PRESETS) {
    const r = preset.getRange();
    if (r.from === from && r.to === to) return preset.key;
  }
  return null;
}
