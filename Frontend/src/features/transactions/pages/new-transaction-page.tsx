import { ArrowLeft, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { MoneyText } from '@/components/common/money-text';
import { PageHeader } from '@/components/common/page-header';
import { ErrorState, LoadingState } from '@/components/common/states';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useCustomers } from '@/features/customers/api';
import type { Product } from '@/features/products/types';
import { useTenant } from '@/features/tenancy/tenant-context';
import { getErrorMessage, isApiError } from '@/lib/api/errors';
import { apiFieldErrors, issuesToFieldErrors } from '@/lib/form-errors';
import { createIdempotencyKey } from '@/lib/id';
import { toDecimalInput, toMinorUnits } from '@/lib/money';

import { useCreateTransaction, useTransaction } from '../api';
import { ProductPicker } from '../components/product-picker';
import { paymentMethodLabel } from '../labels';
import { PAYMENT_METHODS, newTransactionSchema } from '../schemas';
import { calculateLineTotal, calculateTransactionTotals } from '../totals';
import type { PaymentMethod, Transaction } from '../types';

interface DraftLine {
  productId: string;
  productName: string;
  unitPrice: number;
  /** Raw input text, validated on submit. */
  quantity: string;
  discount: string;
}

const toWholeNumber = (value: string) => (/^\d+$/.test(value.trim()) ? Number(value) : Number.NaN);

function toDiscountMinor(value: string) {
  if (!value.trim()) return 0;
  try {
    return toMinorUnits(value.trim());
  } catch {
    return Number.NaN;
  }
}

export function NewTransactionPage() {
  const [searchParams] = useSearchParams();
  const refundOf = searchParams.get('refundOf');
  const original = useTransaction(refundOf ?? '', { enabled: Boolean(refundOf) });

  if (!refundOf) return <TransactionForm />;
  if (original.isPending) return <LoadingState label="Loading the original sale…" />;
  if (original.isError) return <ErrorState error={original.error} onRetry={() => void original.refetch()} />;
  return <TransactionForm refundOf={original.data} />;
}

function TransactionForm({ refundOf }: { refundOf?: Transaction }) {
  const navigate = useNavigate();
  const { activeBusiness } = useTenant();
  const currency = refundOf?.currency ?? activeBusiness?.currency ?? 'USD';
  const taxRatePercent = activeBusiness?.taxRatePercent ?? 0;
  const customers = useCustomers({ pageSize: 100 });
  const create = useCreateTransaction();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(refundOf?.paymentMethod ?? 'cash');
  const [customerId, setCustomerId] = useState(refundOf?.customerId ?? '');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<DraftLine[]>(() =>
    (refundOf?.lines ?? []).map((line) => ({
      productId: line.productId,
      productName: line.productName,
      unitPrice: line.unitPrice,
      quantity: String(line.quantity),
      discount: line.discount ? toDecimalInput(line.discount) : '',
    })),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // One key per submission attempt: a retry after a timeout reuses it, so the
  // API can't record the same sale twice. A new key is made after success.
  const idempotencyKey = useRef(createIdempotencyKey());
  useEffect(() => {
    if (create.isSuccess) idempotencyKey.current = createIdempotencyKey();
  }, [create.isSuccess]);

  const amounts = lines.map((line) => ({
    quantity: toWholeNumber(line.quantity) || 0,
    unitPrice: line.unitPrice,
    discount: toDiscountMinor(line.discount) || 0,
  }));
  const totals = calculateTransactionTotals(amounts, { taxRatePercent });

  function addProduct(product: Product) {
    setLines((previous) => {
      const existing = previous.findIndex((line) => line.productId === product.id);
      if (existing >= 0) {
        return previous.map((line, index) =>
          index === existing ? { ...line, quantity: String((toWholeNumber(line.quantity) || 0) + 1) } : line,
        );
      }
      return [
        ...previous,
        { productId: product.id, productName: product.name, unitPrice: product.price, quantity: '1', discount: '' },
      ];
    });
  }

  function updateLine(index: number, change: Partial<DraftLine>) {
    setLines((previous) => previous.map((line, i) => (i === index ? { ...line, ...change } : line)));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = newTransactionSchema.safeParse({
      type: refundOf ? 'refund' : 'sale',
      paymentMethod,
      customerId: customerId || null,
      originalTransactionId: refundOf?.id ?? null,
      note,
      lines: lines.map((line) => ({
        productId: line.productId,
        quantity: toWholeNumber(line.quantity),
        unitPrice: line.unitPrice,
        discount: toDiscountMinor(line.discount),
      })),
    });
    if (!result.success) {
      setErrors(issuesToFieldErrors(result.error.issues));
      return;
    }
    setErrors({});
    create.mutate(
      { input: result.data, idempotencyKey: idempotencyKey.current },
      {
        onSuccess: (transaction) => navigate(`/transactions/${transaction.id}`, { replace: true }),
        onError: (error) => {
          if (isApiError(error)) setErrors(apiFieldErrors(error.fieldErrors));
        },
      },
    );
  }

  const title = refundOf ? `Refund ${refundOf.reference}` : 'New sale';

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Link to={refundOf ? `/transactions/${refundOf.id}` : '/transactions'} className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-ml-3 mb-2' })}>
        <ArrowLeft aria-hidden />
        {refundOf ? refundOf.reference : 'Transactions'}
      </Link>
      <PageHeader
        title={title}
        description={refundOf ? 'Adjust quantities to what is being returned. Stock is added back.' : 'Add items, choose how the customer paid, and record the sale.'}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {!refundOf && <ProductPicker currency={currency} onPick={addProduct} />}

            {lines.length === 0 ? (
              <p className={errors.lines ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
                {errors.lines ?? 'No items yet. Search for a product to add it.'}
              </p>
            ) : (
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Product</TableHeaderCell>
                    <TableHeaderCell className="w-24">Qty</TableHeaderCell>
                    <TableHeaderCell className="w-28">Discount</TableHeaderCell>
                    <TableHeaderCell className="text-right">Amount</TableHeaderCell>
                    <TableHeaderCell>
                      <span className="sr-only">Remove</span>
                    </TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {lines.map((line, index) => {
                    const qtyError = errors[`lines.${index}.quantity`];
                    const discountError = errors[`lines.${index}.discount`];
                    return (
                      <TableRow key={`${line.productId}-${index}`}>
                        <TableCell>
                          <div className="font-medium">{line.productName}</div>
                          <div className="text-xs text-muted-foreground">
                            <MoneyText amount={line.unitPrice} currency={currency} /> each
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <Input
                            aria-label={`Quantity of ${line.productName}`}
                            aria-invalid={qtyError ? true : undefined}
                            inputMode="numeric"
                            value={line.quantity}
                            onChange={(event) => updateLine(index, { quantity: event.target.value })}
                          />
                          {qtyError && <p className="mt-1 text-xs text-destructive">{qtyError}</p>}
                        </TableCell>
                        <TableCell className="align-top">
                          <Input
                            aria-label={`Discount on ${line.productName}`}
                            aria-invalid={discountError ? true : undefined}
                            inputMode="decimal"
                            placeholder="0.00"
                            value={line.discount}
                            onChange={(event) => updateLine(index, { discount: event.target.value })}
                          />
                          {discountError && <p className="mt-1 text-xs text-destructive">{discountError}</p>}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <MoneyText amount={calculateLineTotal(amounts[index])} currency={currency} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove ${line.productName}`}
                            onClick={() => setLines((previous) => previous.filter((_, i) => i !== index))}
                          >
                            <Trash2 aria-hidden />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <FormField label="Payment method" error={errors.paymentMethod}>
                {(control) => (
                  <NativeSelect {...control} value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}>
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {paymentMethodLabel(method)}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </FormField>

              <FormField label="Customer" error={errors.customerId} hint="Optional.">
                {(control) => (
                  <NativeSelect {...control} value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
                    <option value="">Walk-in customer</option>
                    {customers.data?.items.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </FormField>

              <FormField label="Note" error={errors.note} hint="Optional. Printed on the receipt.">
                {(control) => <Textarea {...control} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />}
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <MoneyText amount={totals.subtotal} currency={currency} />
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discounts</span>
                  <MoneyText amount={-totals.discount} currency={currency} />
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax{taxRatePercent ? ` (${taxRatePercent}%)` : ''}</span>
                <MoneyText amount={totals.tax} currency={currency} />
              </div>
              <div className="mt-1 flex justify-between border-t border-border pt-3 text-base font-semibold">
                <span>{refundOf ? 'Refund total' : 'Total'}</span>
                <MoneyText amount={totals.total} currency={currency} />
              </div>

              {create.isError && !(isApiError(create.error) && Object.keys(create.error.fieldErrors).length > 0) && (
                <p role="alert" className="text-destructive">
                  {getErrorMessage(create.error)}
                </p>
              )}

              <Button type="submit" className="mt-3 w-full" disabled={create.isPending}>
                {create.isPending ? 'Saving…' : refundOf ? 'Record refund' : 'Record sale'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
