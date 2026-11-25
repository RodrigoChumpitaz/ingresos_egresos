import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DATE_PRESETS, detectPreset } from '@/shared/utils/date-presets';

export function DateRangeBar({
  from,
  to,
  onChange,
  extra,
}: {
  from: string;
  to: string;
  onChange: (next: { from: string; to: string }) => void;
  extra?: React.ReactNode;
}) {
  const activePreset = detectPreset(from, to);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <CalendarDays className="size-4" />
            Período
          </span>
          {DATE_PRESETS.map((preset) => (
            <Button
              key={preset.key}
              type="button"
              size="sm"
              variant={activePreset === preset.key ? 'default' : 'outline'}
              onClick={() => onChange(preset.getRange())}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="range-from" className="text-xs text-muted-foreground">
              Desde
            </Label>
            <Input
              id="range-from"
              type="date"
              className="h-8 w-auto"
              value={from}
              max={to || undefined}
              onChange={(e) => onChange({ from: e.target.value, to })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="range-to" className="text-xs text-muted-foreground">
              Hasta
            </Label>
            <Input
              id="range-to"
              type="date"
              className="h-8 w-auto"
              value={to}
              min={from || undefined}
              onChange={(e) => onChange({ from, to: e.target.value })}
            />
          </div>
          {extra}
        </div>
      </CardContent>
    </Card>
  );
}
