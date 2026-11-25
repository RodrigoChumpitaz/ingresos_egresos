import { useEffect, useRef, useState } from 'react';
import { Pipette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const QUICK_SWATCHES = [
  '#5b5ce2',
  '#2563eb',
  '#0ea5e9',
  '#10b981',
  '#059669',
  '#f59e0b',
  '#f97316',
  '#f43f5e',
  '#e11d48',
  '#475569',
];

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  const s = max === 0 ? 0 : (d / max) * 100;
  const v = max * 100;
  return { h, s, v };
}

function hsvToHex(h: number, s: number, v: number): string {
  const sn = clamp(s, 0, 100) / 100;
  const vn = clamp(v, 0, 100) / 100;
  const c = vn * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = vn - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function ColorPickerField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(value);
    setHsv(hexToHsv(value));
  }, [value]);

  const applyHsv = (nextH: number, nextS: number, nextV: number) => {
    setHsv({ h: nextH, s: nextS, v: nextV });
    const hex = hsvToHex(nextH, nextS, nextV);
    setDraft(hex);
    onChange(hex);
  };

  const handleAreaPointer = (clientX: number, clientY: number) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    const s = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
    const v = clamp((1 - (clientY - rect.top) / rect.height) * 100, 0, 100);
    applyHsv(hsv.h, s, v);
  };

  const handleHexInput = (raw: string) => {
    const formatted = raw.startsWith('#') ? raw : `#${raw}`;
    setDraft(formatted);
    if (/^#[0-9a-fA-F]{6}$/.test(formatted)) {
      const normalized = formatted.toLowerCase();
      setHsv(hexToHsv(normalized));
      onChange(normalized);
    }
  };

  const handleHexBlur = () => {
    const shortMatch = /^#([0-9a-fA-F]{3})$/.exec(draft.trim());
    if (shortMatch) {
      const [r, g, b] = shortMatch[1].split('');
      const expanded = `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
      setDraft(expanded);
      setHsv(hexToHsv(expanded));
      onChange(expanded);
      return;
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(draft)) {
      setDraft(value);
    }
  };

  const pureHueHex = hsvToHex(hsv.h, 100, 100);

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className="h-9 shrink-0 gap-2 px-2.5"
            aria-label={`Abrir selector visual para ${label}`}
          >
            <span
              className="size-5 rounded border border-black/15 shadow-xs"
              style={{ backgroundColor: value }}
            />
            <Pipette className="size-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-3">
          <div className="flex flex-col gap-3">
            <div
              ref={areaRef}
              role="slider"
              aria-label={`Saturación y brillo para ${label}`}
              aria-valuetext={value}
              tabIndex={0}
              className="relative h-36 w-full cursor-crosshair touch-none overflow-hidden rounded-md border"
              style={{
                backgroundColor: pureHueHex,
                backgroundImage:
                  'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)',
              }}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                handleAreaPointer(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (e.buttons === 1) handleAreaPointer(e.clientX, e.clientY);
              }}
            >
              <span
                className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                style={{
                  left: `${hsv.s}%`,
                  top: `${100 - hsv.v}%`,
                  backgroundColor: value,
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">Tono</span>
              <input
                type="range"
                min={0}
                max={359}
                value={Math.round(hsv.h)}
                aria-label={`Tono para ${label}`}
                onChange={(e) => applyHsv(Number(e.target.value), hsv.s, hsv.v)}
                className="h-3 w-full cursor-pointer appearance-none rounded-full border"
                style={{
                  background:
                    'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
                }}
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {QUICK_SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  title={swatch}
                  aria-label={`Color ${swatch}`}
                  onClick={() => {
                    setDraft(swatch);
                    setHsv(hexToHsv(swatch));
                    onChange(swatch);
                  }}
                  className="size-6 cursor-pointer rounded-md border border-black/15 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: swatch,
                    outline: value === swatch ? '2px solid var(--ring)' : 'none',
                    outlineOffset: '1px',
                  }}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Input
        aria-label={`Hexadecimal para ${label}`}
        value={draft}
        maxLength={7}
        onChange={(e) => handleHexInput(e.target.value)}
        onBlur={handleHexBlur}
        className="font-mono text-xs uppercase"
      />
    </div>
  );
}
