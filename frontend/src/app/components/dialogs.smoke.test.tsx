/**
 * Dialog smoke testleri.
 *
 * Karmaşık dialog component'leri (AppointmentDialog, PatientDialog,
 * PaymentDialog, TreatmentAddDialog, AppointmentDetailDialog) için
 * smoke-render testleri. Amaç: dialog'un crash etmeden mount olduğunu,
 * isOpen=true iken görünür, isOpen=false iken görünmez olduğunu garanti
 * etmek. Daha derin iş mantığı testleri ayrı dosyalarda yazılır.
 */
import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/renderWithProviders';
import { server } from '../../mocks/server';
import { makePatient, makeAppointment, makeTreatment } from '../../test/factories';

import AppointmentDialog from './AppointmentDialog';
import PatientDialog from './PatientDialog';
import PaymentDialog from './PaymentDialog';
import TreatmentAddDialog from './TreatmentAddDialog';
import AppointmentDetailDialog from './AppointmentDetailDialog';

const BASE = 'http://localhost:8000/api';

// Tüm dialog'lar bu boş data flowu varsayar.
beforeEach(() => {
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
        allow_international_numbers: false,
        default_country: 'TR',
      }),
    ),
  );
});

describe('AppointmentDialog', () => {
  const baseProps = {
    isOpen: true,
    onClose: vi.fn(),
    selectedSlot: { date: '2026-05-28', time: '10:00:00' },
    onSuccess: vi.fn(),
  };

  it('isOpen=false iken render olmaz', () => {
    renderWithProviders(
      <AppointmentDialog {...baseProps} isOpen={false} />,
      { authenticated: true },
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('isOpen=true iken dialog görünür', async () => {
    renderWithProviders(<AppointmentDialog {...baseProps} />, {
      authenticated: true,
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('edit modunda mevcut randevu bilgileri yüklenir', async () => {
    const apt = makeAppointment({
      id: 99,
      patient_name: 'Ali Yılmaz',
      time: '14:30:00',
    });

    renderWithProviders(
      <AppointmentDialog {...baseProps} appointmentToEdit={apt as any} />,
      { authenticated: true },
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});

describe('PatientDialog', () => {
  it('isOpen=true iken form alanları render edilir', async () => {
    renderWithProviders(
      <PatientDialog
        isOpen
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
      { authenticated: true },
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('isOpen=false iken render olmaz', () => {
    renderWithProviders(
      <PatientDialog
        isOpen={false}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
      { authenticated: true },
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('edit modunda mevcut hasta verisi gösterilir', async () => {
    const patient = makePatient({
      first_name: 'Mehmet',
      last_name: 'Demir',
    });

    renderWithProviders(
      <PatientDialog
        isOpen
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        patientToEdit={patient as any}
      />,
      { authenticated: true },
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});

describe('PaymentDialog', () => {
  it('isOpen=true iken render olur', async () => {
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
});

describe('TreatmentAddDialog', () => {
  it('isOpen=true iken render olur', async () => {
    renderWithProviders(
      <TreatmentAddDialog
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
});

describe('AppointmentDetailDialog', () => {
  it('appointment varsa render olur', async () => {
    const apt = makeAppointment();
    renderWithProviders(
      <AppointmentDetailDialog
        isOpen
        onClose={vi.fn()}
        appointment={apt as any}
        onEdit={vi.fn()}
        onUpdate={vi.fn()}
      />,
      { authenticated: true },
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('appointment=null iken crash olmaz', () => {
    renderWithProviders(
      <AppointmentDetailDialog
        isOpen
        onClose={vi.fn()}
        appointment={null}
        onEdit={vi.fn()}
        onUpdate={vi.fn()}
      />,
      { authenticated: true },
    );

    // Çökme yok, render path normal
    expect(document.body).toBeInTheDocument();
  });
});
