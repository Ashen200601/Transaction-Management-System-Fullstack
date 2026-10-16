import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { UNITS } from '@/test/factories';
import { server } from '@/test/server';
import { renderWithProviders, screen } from '@/test/test-utils';

import { ItemCreatePage } from './item-create-page';

function renderPage() {
  return renderWithProviders(<ItemCreatePage />, { route: '/items', path: '/items' });
}

async function fillForm(user: ReturnType<typeof renderPage>['user']) {
  const fields = {
    'Item name': 'Espresso Beans 1kg',
    'Item code': 'esp-1kg',
    Description: 'Medium roast.',
    Price: '25.50',
  };
  for (const [label, value] of Object.entries(fields)) {
    await user.click(screen.getByLabelText(label));
    await user.paste(value);
  }
  await screen.findByRole('option', { name: 'Kilogram (kg)' });
  await user.selectOptions(screen.getByLabelText('Unit'), 'Kilogram (kg)');
}

describe('ItemCreatePage', () => {
  beforeEach(() => {
    server.use(http.get('*/units', () => HttpResponse.json(UNITS)));
  });

  it('points out what needs fixing without calling the API', async () => {
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Save item' }));

    expect(screen.getByLabelText('Item name')).toHaveAccessibleDescription('Enter the item name');
    expect(screen.getByLabelText('Price')).toHaveAccessibleDescription('Enter the price');
    expect(screen.getByLabelText('Unit')).toHaveAccessibleDescription('Choose a unit');
  });

  it('saves the item, confirms it in a green toast, and clears the form for the next one', async () => {
    let payload: unknown;
    server.use(
      http.post('*/items', async ({ request }) => {
        payload = await request.json();
        return HttpResponse.json(
          {
            id: '41',
            itemCode: 'ESP-1KG',
            itemName: 'Espresso Beans 1kg',
            description: 'Medium roast.',
            price: 2550,
            unit: UNITS[1],
          },
          { status: 201 },
        );
      }),
    );
    const { user } = renderPage();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Save item' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Espresso Beans 1kg (ESP-1KG) was saved.');
    expect(payload).toEqual({
      itemName: 'Espresso Beans 1kg',
      itemCode: 'ESP-1KG',
      description: 'Medium roast.',
      price: 2550,
      unitId: '2',
    });
    expect(screen.getByLabelText('Item name')).toHaveValue('');
    expect(screen.getByLabelText('Unit')).toHaveValue('');
  });

  it('shows a taken item code on the code field', async () => {
    server.use(
      http.post('*/items', () =>
        HttpResponse.json(
          {
            title: 'Conflict',
            status: 409,
            code: 'CONFLICT',
            detail: 'Another item already uses this code.',
            errors: { itemCode: ['Another item already uses this code. Try another.'] },
          },
          { status: 409 },
        ),
      ),
    );
    const { user } = renderPage();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Save item' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Another item already uses this code.');
    expect(screen.getByLabelText('Item code')).toHaveAccessibleDescription('Another item already uses this code. Try another.');
    expect(screen.getByLabelText('Item name')).toHaveValue('Espresso Beans 1kg');
  });

  it('lists the units from the server, by name and code', async () => {
    renderPage();

    expect(await screen.findByRole('option', { name: 'Kilogram (kg)' })).toHaveValue('2');
    expect(screen.getByRole('option', { name: 'Box' })).toHaveValue('7');
    expect(screen.getByRole('option', { name: 'Choose a unit' })).toBeDisabled();
  });

  it('says so in the unit list when the units fail to load', async () => {
    server.use(http.get('*/units', () => HttpResponse.error()));
    renderPage();

    expect(await screen.findByRole('option', { name: "Couldn't load the units" })).toBeInTheDocument();
  });

  it('shows a unit the server turned down on the unit field', async () => {
    server.use(
      http.post('*/items', () =>
        HttpResponse.json(
          {
            title: 'Validation failed',
            status: 422,
            code: 'VALIDATION_ERROR',
            detail: 'Some fields need attention.',
            errors: { unitId: ['Choose a unit'] },
          },
          { status: 422 },
        ),
      ),
    );
    const { user } = renderPage();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Save item' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Some fields need attention.');
    expect(screen.getByLabelText('Unit')).toHaveAccessibleDescription('Choose a unit');
  });

  it('shows other failures in a red toast', async () => {
    server.use(http.post('*/items', () => HttpResponse.error()));
    const { user } = renderPage();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Save item' }));

    expect(await screen.findByRole('alert')).toHaveClass('bg-destructive');
  });

  it('clears the form', async () => {
    const { user } = renderPage();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByLabelText('Item code')).toHaveValue('');
    expect(screen.getByLabelText('Price')).toHaveValue('');
  });
});
