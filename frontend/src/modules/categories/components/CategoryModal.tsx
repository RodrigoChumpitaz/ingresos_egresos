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
import { errorText } from '@/shared/utils/format';
import type { Category, MoneyType } from '@/types/finance';

export function CategoryModal({
  item,
  onClose,
  onSuccess,
}: {
  item: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(item?.name ?? '');
  const [type, setType] = useState<MoneyType>(item?.type ?? 'EXPENSE');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const value = name.trim();
    if (value.length < 2 || value.length > 50) {
      toast.error('El nombre debe tener entre 2 y 50 caracteres');
      return;
    }

    setBusy(true);
    try {
      if (item) {
        await api.updateCategory(item.id, value);
        toast.success('Categoría actualizada correctamente');
      } else {
        await api.createCategory({ name: value, type });
        toast.success('Categoría creada correctamente');
      }
      onSuccess();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
          <DialogDescription>
            Clasifica tus fuentes de ingresos y rubros de egresos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="category-name">Nombre de la categoría *</FieldLabel>
              <Input
                id="category-name"
                minLength={2}
                maxLength={50}
                required
                placeholder="Ej. Alimentación, Sueldo, Transporte"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <FieldDescription>{name.length}/50 caracteres</FieldDescription>
            </Field>

            <Field>
              <FieldLabel>Tipo de categoría *</FieldLabel>
              <ToggleGroup
                type="single"
                variant="outline"
                value={type}
                disabled={Boolean(item)}
                onValueChange={(next) => {
                  if (next === 'INCOME' || next === 'EXPENSE') {
                    setType(next);
                  }
                }}
                className="grid w-full grid-cols-2"
              >
                <ToggleGroupItem value="EXPENSE" className="gap-1.5">
                  <ArrowUpRight className="size-4 text-expense" />
                  Egreso
                </ToggleGroupItem>
                <ToggleGroupItem value="INCOME" className="gap-1.5">
                  <ArrowDownLeft className="size-4 text-income" />
                  Ingreso
                </ToggleGroupItem>
              </ToggleGroup>
              {item ? (
                <FieldDescription>
                  El tipo no se puede cambiar después de crear la categoría.
                </FieldDescription>
              ) : null}
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              <Check data-icon="inline-start" />
              {busy ? 'Guardando...' : item ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
