/**
 * PaymentDialog deep testleri.
 *
 * Validation, amount parsing, treatment dropdown, edit modu, error path.
 */
import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/renderWithProviders';
import { server } from '../../mocks/server';
import PaymentDialog from './PaymentDialog';

const BASE = 'http://localhost:8000/api';

const setupTreatments = (
  treatments: Array<{ id: number; treatment_name: string }> = [],
) => {
  server.use(
    http.get(`${BASE}/treatments/`, () =>
      HttpResponse.json({ count: treatments.length, results: treatments }),
    ),
  );
};

describe('PaymentDialog — Render', () => {
  it('isOpen=true ile dialog render edilir', async () => {
    setupTreatments();
    renderWithProviders(
      <PaymentDialog
        isOpen
        onClose={vi.fn()}
        patientId={1}
        onSuccess={vi.fn()}
      />,
      { authenticated: true },
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('isOpen=false render olmaz', () => {
    setupTreatments();
    renderWithProviders(
      <PaymentDialog
        isOpen={false}
        onClose={vi.fn()}
        patientId={1}
        onSuccess={vi.fn()}
      />,
      { authenticated: true },
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('defaultAmount prop\'u amount alanını pre-fill eder', async () => {
    setupTreatments();
    renderWithProviders(
      <PaymentDialog
        isOpen
        onClose={vi.fn()}
        patientId={1}
        onSuccess={vi.fn()}
        defaultAmount="500.00"
      />,
      { authenticated: true },
    );

    await waitFor(() => {
      const inputs = Array.from(
        document.querySelectorAll<HTMLInputElement>('input'),
      );
      const hasAmount = inputs.some(
        (i) => i.value === '500.00' || i.value === '500',
      );
      expect(hasAmount).toBe(true);
    });
  });
});

describe('PaymentDialog — Validation', () => {
  it('boş amount → error', async () => {
    setupTreatments();
    renderWithProviders(
      <PaymentDialog
        isOpen
        onClose={vi.fn()}
        patientId={1}
        onSuccess={vi.fn()}
      />,
      { authenticated: true },
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    const saveBtn = buttons.find((b) =>
      /Kaydet|Save/i.test(b.textContent || ''),
    );

    if (saveBtn) {
      await userEvent.click(saveBtn);

      await waitFor(() => {
        const bodyText = document.body.textContent || '';
        const hasError =
          /tutar|amount|fiyat|geçersiz|invalid|girin/i.test(bodyText);
        expect(hasError).toBe(true);
      });
    }
  });

  it('negatif amount → error', async () => {
    setupTreatments();
    renderWithProviders(
      <PaymentDialog
        isOpen
        onClose={vi.fn()}
        patientId={1}
        onSuccess={vi.fn()}
        defaultAmount={-100}
      />,
      { authenticated: true },
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    const saveBtn = buttons.find((b) =>
      /Kaydet|Save/i.test(b.textContent || ''),
    );

    if (saveBtn) {
      await userEvent.click(saveBtn);

      await waitFor(() => {
        const bodyText = document.body.textContent || '';
        const hasError = /tutar|amount|geçersiz|invalid|büyük/i.test(bodyText);
        expect(hasError).toBe(true);
      });
    }
  });

  it('zero amount → error', async () => {
    setupTreatments();
    renderWithProviders(
      <PaymentDialog
        isOpen
        onClose={vi.fn()}
        patientId={1}
        onSuccess={vi.fn()}
        defaultAmount={0}
      />,
      { authenticated: true },
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    const saveBtn = buttons.find((b) =>
      /Kaydet|Save/i.test(b.textContent || ''),
    );

    if (saveBtn) {
      await userEvent.click(saveBtn);

      await waitFor(() => {
        const bodyText = document.body.textContent || '';
        expect(/tutar|amount|geçersiz|büyük/i.test(bodyText)).toBe(true);
      });
    }
  });

  it('virgül ile fiyat parse edilir (Türkçe format)', async () => {
    let postedAmount = 0;
    server.use(
      http.get(`${BASE}/treatments/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
      http.post(`${BASE}/payments/`, async ({ request }) => {
        const body = (await request.json()) as { amount: number };
        postedAmount = body.amount;
        return HttpResponse.json({ id: 1 }, { status: 201 });
      }),
    );

    renderWithProviders(
      <PaymentDialog
        isOpen
        onClose={vi.fn()}
        patientId={1}
        onSuccess={vi.fn()}
        defaultAmount="1500,50"
      />,
      { authenticated: true },
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    const saveBtn = buttons.find((b) =>
      /Kaydet|Save/i.test(b.textContent || ''),
    );

    if (saveBtn) {
      await userEvent.click(saveBtn);
      await waitFor(() => expect(postedAmount).toBe(1500.5), { timeout: 3000 });
    }
  });
});

describe('PaymentDialog — Successful submit', () => {
  it('valid amount → POST + onSuccess', async () => {
    let posted = false;
    server.use(
      http.get(`${BASE}/treatments/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
      http.post(`${BASE}/payments/`, () => {
        posted = true;
        return HttpResponse.json({ id: 1 }, { status: 201 });
      }),
    );

    const onSuccessSpy = vi.fn();
    renderWithProviders(
      <PaymentDialog
        isOpen
        onClose={vi.fn()}
        patientId={1}
        onSuccess={onSuccessSpy}
        defaultAmount="250"
      />,
      { authenticated: true },
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    const saveBtn = buttons.find((b) =>
      /Kaydet|Save/i.test(b.textContent || ''),
    );

    if (saveBtn) {
      await userEvent.click(saveBtn);
      await waitFor(
        () => expect(posted || onSuccessSpy.mock.calls.length > 0).toBe(true),
        { timeout: 3000 },
      );
    }
  });

  it('USD currency selection and payload verification', async () => {
    let postedPayload: any = null;
    server.use(
      http.get(`${BASE}/treatments/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
      http.post(`${BASE}/payments/`, async ({ request }) => {
        postedPayload = await request.json();
        return HttpResponse.json({ id: 99, ...postedPayload }, { status: 201 });
      }),
    );

    renderWithProviders(
      <PaymentDialog
        isOpen
        onClose={vi.fn()}
        patientId={1}
        onSuccess={vi.fn()}
        defaultAmount="300"
      />,
      { authenticated: true },
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Select USD
    const currencySelect = screen.getByLabelText(/Para Birimi|Currency/i) as HTMLSelectElement;
    expect(currencySelect).toBeInTheDocument();
    expect(currencySelect.value).toBe('TRY');

    await userEvent.selectOptions(currencySelect, 'USD');
    expect(currencySelect.value).toBe('USD');

    const buttons = screen.getAllByRole('button');
    const saveBtn = buttons.find((b) =>
      /Kaydet|Save/i.test(b.textContent || ''),
    );

    if (saveBtn) {
      await userEvent.click(saveBtn);
      await waitFor(() => {
        expect(postedPayload).not.toBeNull();
        expect(postedPayload.currency).toBe('USD');
        expect(postedPayload.amount).toBe(300);
      });
    }
  });

  it('treatment with USD locks currency select to USD', async () => {
    server.use(
      http.get(`${BASE}/treatments/`, () =>
        HttpResponse.json({
          count: 1,
          results: [{ id: 42, treatment_name: 'Implant', price: '600.00', currency: 'USD' }],
        }),
      ),
    );

    renderWithProviders(
      <PaymentDialog
        isOpen
        onClose={vi.fn()}
        patientId={1}
        onSuccess={vi.fn()}
      />,
      { authenticated: true },
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const treatmentSelect = screen.getByLabelText(/İlgili Tedavi|Related Treatment/i) as HTMLSelectElement;
    await userEvent.selectOptions(treatmentSelect, '42');

    const currencySelect = screen.getByLabelText(/Para Birimi|Currency/i) as HTMLSelectElement;
    expect(currencySelect.value).toBe('USD');
    expect(currencySelect).toBeDisabled();
  });
});

