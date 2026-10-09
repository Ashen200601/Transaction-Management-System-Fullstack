import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { buildProduct } from '@/test/factories';
import { server } from '@/test/server';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';

import { ProductFormDialog } from './product-form-dialog';

type User = ReturnType<typeof userEvent.setup>;

async function fillNewProduct(user: User) {
  await user.type(screen.getByLabelText(/^name/i), 'Oat Milk 1L');
  await user.type(screen.getByLabelText(/^sku/i), 'oat-1l');
  await user.type(screen.getByLabelText(/^price/i), '4.50');
  await user.clear(screen.getByLabelText(/reorder level/i));
  await user.type(screen.getByLabelText(/reorder level/i), '10');
}

const saveButton = () => screen.getByRole('button', { name: /save product/i });

describe('ProductFormDialog', () => {
  it('creates a product and closes', async () => {
    let body: unknown;
    server.use(
      http.post('*/products', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(buildProduct({ id: 'prod_0100' }), { status: 201 });
      }),
    );
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(<ProductFormDialog open onOpenChange={onOpenChange} />);

    await fillNewProduct(user);
    await user.click(saveButton());

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(body).toEqual({
      name: 'Oat Milk 1L',
      sku: 'OAT-1L',
      price: 450,
      cost: null,
      reorderLevel: 10,
      active: true,
    });
  });

  it('pre-fills and updates an existing product', async () => {
    const product = buildProduct({ id: 'prod_0007', name: 'Espresso Beans 1kg', sku: 'ESP-1KG', price: 2500 });
    let updatedId: unknown;
    let body: unknown;
    server.use(
      http.put('*/products/:id', async ({ params, request }) => {
        updatedId = params.id;
        body = await request.json();
        return HttpResponse.json({ ...product, price: 2700 });
      }),
    );
    const { user } = renderWithProviders(<ProductFormDialog open onOpenChange={vi.fn()} product={product} />);

    expect(screen.getByLabelText(/^name/i)).toHaveValue('Espresso Beans 1kg');
    expect(screen.getByLabelText(/^price/i)).toHaveValue('25.00');

    await user.clear(screen.getByLabelText(/^price/i));
    await user.type(screen.getByLabelText(/^price/i), '27.00');
    await user.click(saveButton());

    await waitFor(() => expect(body).toMatchObject({ price: 2700 }));
    expect(updatedId).toBe('prod_0007');
  });

  it('shows validation errors and does not submit', async () => {
    const posted = vi.fn();
    server.use(
      http.post('*/products', () => {
        posted();
        return HttpResponse.json(buildProduct(), { status: 201 });
      }),
    );
    const { user } = renderWithProviders(<ProductFormDialog open onOpenChange={vi.fn()} />);

    await user.click(saveButton());

    await waitFor(() => expect(screen.getByLabelText(/^name/i)).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.getByLabelText(/^sku/i)).toHaveAttribute('aria-invalid', 'true');
    expect(posted).not.toHaveBeenCalled();
  });

  it('shows field errors returned by the server', async () => {
    server.use(
      http.post('*/products', () =>
        HttpResponse.json(
          { title: 'Validation failed', code: 'VALIDATION_ERROR', errors: { sku: ['SKU already exists'] } },
          { status: 422 },
        ),
      ),
    );
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(<ProductFormDialog open onOpenChange={onOpenChange} />);

    await fillNewProduct(user);
    await user.click(saveButton());

    expect(await screen.findByText('SKU already exists')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
