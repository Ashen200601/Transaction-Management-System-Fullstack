import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { STAKEHOLDER_TYPES } from '@/test/factories';
import { server } from '@/test/server';
import { renderWithProviders, screen } from '@/test/test-utils';

import { StakeholderCreatePage } from './stakeholder-create-page';

function renderPage() {
  return renderWithProviders(<StakeholderCreatePage />, {
    route: '/people-and-profiles/stakeholders',
    path: '/people-and-profiles/stakeholders',
  });
}

async function fillForm(user: ReturnType<typeof renderPage>['user']) {
  await user.click(await screen.findByRole('checkbox', { name: 'Vendor' }));
  await user.click(screen.getByRole('checkbox', { name: 'Customer' }));
  const fields = {
    'Stakeholder code': 'abc-traders',
    'Stakeholder name': 'ABC Traders',
    Phone: '+94 77 123 4567',
  };
  for (const [label, value] of Object.entries(fields)) {
    await user.click(screen.getByLabelText(label));
    await user.paste(value);
  }
}

describe('StakeholderCreatePage', () => {
  beforeEach(() => {
    server.use(http.get('*/stakeholder-types', () => HttpResponse.json(STAKEHOLDER_TYPES)));
  });

  it('heads the form with a checkbox for each stakeholder type from the server', async () => {
    renderPage();

    const group = screen.getByRole('group', { name: 'Stakeholder type' });
    expect(await screen.findByRole('checkbox', { name: 'Customer' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Vendor' })).not.toBeChecked();
    expect(group).toContainElement(screen.getByRole('checkbox', { name: 'Vendor' }));
  });

  it('points out what needs fixing without calling the API', async () => {
    const { user } = renderPage();
    await screen.findByRole('checkbox', { name: 'Customer' });

    await user.click(screen.getByRole('button', { name: 'Save stakeholder' }));

    expect(screen.getByRole('group', { name: 'Stakeholder type' })).toHaveAccessibleDescription(
      'Choose at least one stakeholder type',
    );
    expect(screen.getByLabelText('Stakeholder name')).toHaveAccessibleDescription('Enter the stakeholder name');
  });

  it('saves the stakeholder with every ticked type, in list order, and clears the form', async () => {
    let payload: unknown;
    server.use(
      http.post('*/stakeholders', async ({ request }) => {
        payload = await request.json();
        return HttpResponse.json(
          {
            id: '51',
            stakeholderCode: 'ABC-TRADERS',
            stakeholderName: 'ABC Traders',
            phone: '+94 77 123 4567',
            email: null,
            address: null,
            taxNo: null,
            stakeholderTypes: STAKEHOLDER_TYPES,
          },
          { status: 201 },
        );
      }),
    );
    const { user } = renderPage();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Save stakeholder' }));

    expect(await screen.findByRole('status')).toHaveTextContent('ABC Traders (ABC-TRADERS) was saved.');
    expect(payload).toEqual({
      stakeholderTypeIds: ['1', '2'],
      stakeholderCode: 'ABC-TRADERS',
      stakeholderName: 'ABC Traders',
      phone: '+94 77 123 4567',
      email: null,
      address: null,
      taxNo: null,
    });
    expect(screen.getByLabelText('Stakeholder code')).toHaveValue('');
    expect(screen.getByRole('checkbox', { name: 'Vendor' })).not.toBeChecked();
  });

  it('shows a taken code on the code field', async () => {
    server.use(
      http.post('*/stakeholders', () =>
        HttpResponse.json(
          {
            title: 'Conflict',
            status: 409,
            code: 'CONFLICT',
            detail: 'Another stakeholder already uses this code.',
            errors: { stakeholderCode: ['Another stakeholder already uses this code. Try another.'] },
          },
          { status: 409 },
        ),
      ),
    );
    const { user } = renderPage();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Save stakeholder' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Another stakeholder already uses this code.');
    expect(screen.getByLabelText('Stakeholder code')).toHaveAccessibleDescription(
      'Another stakeholder already uses this code. Try another.',
    );
  });

  it('says so when the types fail to load', async () => {
    server.use(http.get('*/stakeholder-types', () => HttpResponse.error()));
    renderPage();

    expect(await screen.findByText("Couldn't load the stakeholder types.")).toBeInTheDocument();
  });
});
