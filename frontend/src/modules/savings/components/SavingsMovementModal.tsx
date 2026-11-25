import { useState, type FormEvent } from 'react';
import { ArrowDownLeft, ArrowUpRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { api } from '@/services/api';
import { usePreferences } from '@/shared/context/PreferencesContext';
import { dateToISO, errorText, today } from '@/shared/utils/format';
import type { SavingsGoal, SavingsMovementType } from '@/types/finance';

export function SavingsMovementModal({
  goal,
  initialType,
  onClose,
  onSuccess,
}: {
  goal: SavingsGoal;
  initialType: SavingsMovementType;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { formatMoney } = usePreferences();
  const [type, setType] = useState<SavingsMovementType>(initialType);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(today());
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const val = Number(amount);
    if (!Number.isFinite(val) || val <= 0 || Math.round(val * 100) !== val * 100) {
      toast.error('Ingresa un monto mayor a cero con máximo dos decimales');
      return;
    }

    setBusy(true);
    try {
      await api.recordSavingsMovement(goal.id, {
        type,
        amount: val,
        note: note.trim(),
        date: dateToISO(date),
      });
      toast.success(
        type === 'CONTRIBUTION'
          ? 'Aporte guardado en la meta'
          : 'Retiro registrado correctamente',
      );
      onSuccess();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{goal.name}</DialogTitle>
          <DialogDescription>
            Saldo actual en esta meta: <strong>{formatMoney(goal.currentAmount)}</strong> (no afecta
            tus egresos).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Operación</FieldLabel>
              <ToggleGroup
                type="single"
                variant="outline"
                value={type}
                onValueChange={(v) => {
                  if (v === 'CONTRIBUTION' || v === 'WITHDRAWAL') setType(v);
                }}
                className="grid w-full grid-cols-2"
              >
                <ToggleGroupItem value="CONTRIBUTION" className="gap-1.5">
                  <ArrowDownLeft className="size-4 text-income" />
                  Aportar
                </ToggleGroupItem>
                <ToggleGroupItem value="WITHDRAWAL" className="gap-1.5">
                  <ArrowUpRight className="size-4 text-expense" />
                  Retirar
                </ToggleGroupItem>
              </ToggleGroup>
            </Field>

            <Field>
              <FieldLabel htmlFor="sav-amount">Monto (PEN) *</FieldLabel>
              <Input
                id="sav-amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <FieldDescription>
                {type === 'CONTRIBUTION'
                  ? 'Se descuenta de tu Disponible real sin sumarse a gastos.'
                  : 'Regresa liquidez desde esta meta hacia tu disponible.'}
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="sav-note">Nota</FieldLabel>
              <Input
                id="sav-note"
                maxLength={200}
                placeholder="Ej. Aporte de quincena"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="sav-date">Fecha *</FieldLabel>
              <Input
                id="sav-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              <Check data-icon="inline-start" />
              {busy ? 'Guardando...' : type === 'CONTRIBUTION' ? 'Confirmar aporte' : 'Confirmar retiro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
