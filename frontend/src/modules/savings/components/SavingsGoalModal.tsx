import { useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
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
import { api } from '@/services/api';
import { ColorPickerField } from '@/shared/components/ColorPickerField';
import { dateForInput, dateToISO, errorText } from '@/shared/utils/format';
import type { SavingsGoal } from '@/types/finance';

export function SavingsGoalModal({
  item,
  onClose,
  onSuccess,
}: {
  item: SavingsGoal | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(item?.name ?? '');
  const [targetAmount, setTargetAmount] = useState(item ? String(item.targetAmount) : '');
  const [deadline, setDeadline] = useState(item?.deadline ? dateForInput(item.deadline) : '');
  const [color, setColor] = useState(item?.color ?? '#6366f1');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const cleanName = name.trim();
    const target = Number(targetAmount);
    if (cleanName.length < 2 || cleanName.length > 60) {
      toast.error('El nombre debe tener entre 2 y 60 caracteres');
      return;
    }
    if (!Number.isFinite(target) || target <= 0 || Math.round(target * 100) !== target * 100) {
      toast.error('El objetivo debe ser mayor a cero y tener máximo dos decimales');
      return;
    }

    setBusy(true);
    try {
      const payload = {
        name: cleanName,
        targetAmount: target,
        deadline: deadline ? dateToISO(deadline) : null,
        color,
      };
      if (item) {
        await api.updateSavingsGoal(item.id, payload);
        toast.success('Meta actualizada correctamente');
      } else {
        await api.createSavingsGoal(payload);
        toast.success('Meta de ahorro creada');
      }
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
          <DialogTitle>{item ? 'Editar meta de ahorro' : 'Nueva meta de ahorro'}</DialogTitle>
          <DialogDescription>
            Aparta dinero para objetivos concretos sin inflar tus egresos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="goal-name">Nombre de la meta *</FieldLabel>
              <Input
                id="goal-name"
                minLength={2}
                maxLength={60}
                required
                placeholder="Ej. Fondo de emergencia, Viaje, Laptop"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="goal-target">Monto objetivo (PEN) *</FieldLabel>
              <Input
                id="goal-target"
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="5000.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
              />
              <FieldDescription>Se guarda en moneda base (PEN).</FieldDescription>
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="goal-deadline">Fecha objetivo</FieldLabel>
                <Input
                  id="goal-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="goal-color">Color</FieldLabel>
                <ColorPickerField id="goal-color" label="Color de la meta" value={color} onChange={setColor} />
              </Field>
            </div>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              <Check data-icon="inline-start" />
              {busy ? 'Guardando...' : item ? 'Guardar cambios' : 'Crear meta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
