import { useEffect, useState, type FormEvent } from 'react';
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { api } from '@/services/api';
import { usePreferences } from '@/shared/context/PreferencesContext';
import { dateForInput, dateToISO, errorText, formatCurrency, today } from '@/shared/utils/format';
import type { Category, CurrencyCode, MoneyType, Transaction, TransactionInput } from '@/types/finance';

export function MovementModal({
  item,
  categories,
  onClose,
  onSuccess,
}: {
  item: Transaction | null;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { rateToBase } = usePreferences();
  const [type, setType] = useState<MoneyType>(item?.type ?? 'EXPENSE');
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? '');
  const [currency, setCurrency] = useState<CurrencyCode>(item?.currency ?? 'PEN');
  const [amount, setAmount] = useState(
    item ? String(item.originalAmount ?? item.amount) : '',
  );
  const [exchangeRate, setExchangeRate] = useState(
    item?.exchangeRate ? String(item.exchangeRate) : String(rateToBase(item?.currency ?? 'PEN')),
  );
  const [description, setDescription] = useState(item?.description ?? '');
  const [date, setDate] = useState(item ? dateForInput(item.date) : today());
  const [busy, setBusy] = useState(false);

  const available = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (currency === 'PEN') {
      setExchangeRate('1');
    } else if (!item || item.currency !== currency) {
      setExchangeRate(String(rateToBase(currency)));
    }
  }, [currency, item, rateToBase]);

  const numericAmount = Number(amount);
  const numericRate = Number(exchangeRate);
  const estimatedPen =
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    Number.isFinite(numericRate) &&
    numericRate > 0
      ? Math.round(numericAmount * numericRate * 100) / 100
      : null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!categoryId) {
      toast.error('Selecciona una categoría para continuar');
      return;
    }
    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      Math.round(numericAmount * 100) !== numericAmount * 100
    ) {
      toast.error('El monto debe ser mayor a cero y tener máximo dos decimales');
      return;
    }
    if (currency !== 'PEN' && (!Number.isFinite(numericRate) || numericRate <= 0)) {
      toast.error('Ingresa un tipo de cambio válido mayor a cero');
      return;
    }

    const payload: TransactionInput = {
      amount: numericAmount,
      currency,
      ...(currency !== 'PEN' ? { exchangeRate: numericRate } : {}),
      categoryId,
      description: description.trim(),
      date: dateToISO(date),
    };

    setBusy(true);
    try {
      if (item) {
        await api.updateTransaction(item.id, payload);
        toast.success('Movimiento actualizado correctamente');
      } else {
        await api.createTransaction(payload);
        toast.success('Movimiento registrado correctamente');
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar movimiento' : 'Registrar movimiento'}</DialogTitle>
          <DialogDescription>
            Completa los datos de tu operación financiera.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Tipo de movimiento</FieldLabel>
              <ToggleGroup
                type="single"
                variant="outline"
                value={type}
                disabled={Boolean(item)}
                onValueChange={(next) => {
                  if (next === 'INCOME' || next === 'EXPENSE') {
                    setType(next);
                    setCategoryId('');
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
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="movement-amount">Monto *</FieldLabel>
                <Input
                  id="movement-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="movement-currency">Moneda</FieldLabel>
                <Select
                  value={currency}
                  onValueChange={(v) => setCurrency(v as CurrencyCode)}
                >
                  <SelectTrigger id="movement-currency">
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
              </Field>
            </div>

            {currency !== 'PEN' ? (
              <Field>
                <FieldLabel htmlFor="movement-rate">
                  Tipo de cambio (1 {currency} en PEN)
                </FieldLabel>
                <Input
                  id="movement-rate"
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  required
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                />
                <FieldDescription>
                  {estimatedPen !== null
                    ? `Equivalente congelado en PEN: ${formatCurrency(estimatedPen, 'PEN')}`
                    : 'Se obtiene automáticamente de la tasa actual; puedes ajustarlo.'}
                </FieldDescription>
              </Field>
            ) : null}

            <Field>
              <FieldLabel htmlFor="movement-category">Categoría *</FieldLabel>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="movement-category">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {available.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {!available.length ? (
                <FieldDescription>
                  No hay categorías de este tipo. Crea una primero en Categorías.
                </FieldDescription>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="movement-description">Descripción</FieldLabel>
              <Input
                id="movement-description"
                maxLength={200}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Compras del supermercado"
              />
              <FieldDescription>{description.length}/200 caracteres</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="movement-date">Fecha *</FieldLabel>
              <Input
                id="movement-date"
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
            <Button type="submit" disabled={busy || !available.length}>
              <Check data-icon="inline-start" />
              {busy ? 'Guardando...' : item ? 'Guardar cambios' : 'Registrar movimiento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
