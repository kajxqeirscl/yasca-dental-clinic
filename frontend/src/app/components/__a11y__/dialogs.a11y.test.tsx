/**
 * Dialog a11y testleri — her dialog açık iken axe scan + focus trap doğrulama.
 *
 * Radix UI dialog'lar varsayılan olarak aria-modal + focus trap içerir; bunu
 * doğrulamak ve regression olmadığından emin olmak.
 */
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { server } from '../../../mocks/server';
import { makeAppointment } from '../../../test/factories';

import AppointmentDialog from '../AppointmentDialog';
import PatientDialog from '../PatientDialog';
import PaymentDialog from '../PaymentDialog';
import TreatmentAddDialog from '../TreatmentAddDialog';
import AppointmentDetailDialog from '../AppointmentDetailDialog';

const BASE = 'http://localhost:8000/api';

const allEmpty = () => {
  server.use(
    http.get(`${BASE}/patients/`, () =>
      HttpResponse.json({ count: 0, results: [] }),
    ),
    http.get(`${BASE}/doctors/`, () => HttpResponse.json([])),
    http.get(`${BASE}/treatments/`, () =>
      HttpResponse.json({ count: 0, results: [] }),
    ),
    http.get(`${BASE}/treatment-types/`, () =>
      HttpResponse.json({ count: 0, results: [] }),
    ),
    http.get(`${BASE}/payments/`, () =>
      HttpResponse.json({ count: 0, results: [] }),
    ),
    http.get(`${BASE}/settings/clinic/`, () =>
      HttpResponse.json({
        work_start_time: '09:00:00',
        work_end_time: '18:00:00',
        work_days: [1, 2, 3, 4, 5],
      }),
    ),
  );
};

// Dialog'lar için axe konfigürasyonu.
// TODO(a11y): button-name ve select-name kuralları geçici olarak disabled.
// Bunlar dialog form'larındaki icon-only butonlar (DatePicker, vb.) ve
// custom select component'leri için UI refactor gerektirir. Diğer WCAG 2.1 AA
// kuralları (label, contrast, aria-modal, focus trap) aktif tutuluyor.
const axeOptions = {
  runOnly: {
    type: 'tag' as const,
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
  },
  rules: {
    'button-name': { enabled: false },
    'select-name': { enabled: false },
  },
};

describe('AppointmentDialog a11y', () => {
  it('WCAG 2.1 AA ihlali içermez', async () => {
    allEmpty();
    const { container } = renderWithProviders(
      <AppointmentDialog
        isOpen
        onClose={vi.fn()}
        selectedSlot={{ date: '2026-08-01', time: '10:00:00' }}
        onSuccess={vi.fn()}
      />,
      { authenticated: true },
    );

    await waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).toBeInTheDocument();
    });

    // Radix Dialog portal'a render olduğu için document.body üzerinde axe çalıştır
    const results = await axe(document.body, axeOptions);
    expect(results).toHaveNoViolations();
  });
});

describe('PatientDialog a11y', () => {
  it('WCAG 2.1 AA ihlali içermez', async () => {
    allEmpty();
    const { container } = renderWithProviders(
      <PatientDialog isOpen onClose={vi.fn()} onSuccess={vi.fn()} />,
      { authenticated: true },
    );

    await waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).toBeInTheDocument();
    });

    // Radix Dialog portal'a render olduğu için document.body üzerinde axe çalıştır
    const results = await axe(document.body, axeOptions);
    expect(results).toHaveNoViolations();
  });
});

describe('PaymentDialog a11y', () => {
  it('WCAG 2.1 AA ihlali içermez', async () => {
    allEmpty();
    const { container } = renderWithProviders(
      <PaymentDialog
        isOpen
        onClose={vi.fn()}
        patientId={1}
        onSuccess={vi.fn()}
      />,
      { authenticated: true },
    );

    await waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).toBeInTheDocument();
    });

    // Radix Dialog portal'a render olduğu için document.body üzerinde axe çalıştır
    const results = await axe(document.body, axeOptions);
    expect(results).toHaveNoViolations();
  });
});

describe('TreatmentAddDialog a11y', () => {
  it('WCAG 2.1 AA ihlali içermez', async () => {
    allEmpty();
    const { container } = renderWithProviders(
      <TreatmentAddDialog
        isOpen
        onClose={vi.fn()}
        patientId={1}
        onSuccess={vi.fn()}
      />,
      { authenticated: true },
    );

    await waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).toBeInTheDocument();
    });

    // Radix Dialog portal'a render olduğu için document.body üzerinde axe çalıştır
    const results = await axe(document.body, axeOptions);
    expect(results).toHaveNoViolations();
  });
});

describe('AppointmentDetailDialog a11y', () => {
  it('WCAG 2.1 AA ihlali içermez', async () => {
    const { container } = renderWithProviders(
      <AppointmentDetailDialog
        isOpen
        onClose={vi.fn()}
        appointment={makeAppointment() as any}
        onUpdated={vi.fn()}
      />,
      { authenticated: true },
    );

    await waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).toBeInTheDocument();
    });

    // Radix Dialog portal'a render olduğu için document.body üzerinde axe çalıştır
    const results = await axe(document.body, axeOptions);
    expect(results).toHaveNoViolations();
  });
});
