/**
 * MSW request handlers for all Yaşca API endpoints.
 * Used in both unit tests and E2E test setups.
 */
import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost:8000/api';

// Canonical mock data
export const mockUser = {
  id: 1,
  username: 'testdoctor',
  email: 'doctor@test.com',
  first_name: 'Test',
  last_name: 'Doctor',
  role: 'doctor' as const,
};

export const mockPatient = {
  id: 1,
  first_name: 'Ali',
  last_name: 'Yılmaz',
  full_name: 'Ali Yılmaz',
  phone: '05551234567',
  tckn: '',
  last_visit: null,
};

export const mockAppointment = {
  id: 1,
  patient: 1,
  patient_name: 'Ali Yılmaz',
  patient_phone: '05551234567',
  doctor: 1,
  doctor_name: 'Test Doctor',
  date: '2026-05-04',
  time: '10:00:00',
  status: 'scheduled',
  notes: '',
  treatment_type: '',
  created_at: '2026-05-04T07:00:00Z',
};

export const handlers = [
  // --- Auth ---
  http.post(`${BASE}/auth/token/`, () =>
    HttpResponse.json({ access: 'mock-access-token', refresh: 'mock-refresh-token' })
  ),
  http.post(`${BASE}/auth/token/refresh/`, () =>
    HttpResponse.json({ access: 'new-access-token', refresh: 'new-refresh-token' })
  ),
  http.get(`${BASE}/auth/me/`, () => HttpResponse.json(mockUser)),

  // --- Patients ---
  http.get(`${BASE}/patients/`, () =>
    HttpResponse.json({ count: 1, results: [mockPatient] })
  ),
  http.get(`${BASE}/patients/:id/`, () => HttpResponse.json({ ...mockPatient, anamnesis: null })),
  http.post(`${BASE}/patients/`, () => HttpResponse.json({ ...mockPatient, id: 99 }, { status: 201 })),
  http.put(`${BASE}/patients/:id/`, () => HttpResponse.json(mockPatient)),

  // --- Appointments ---
  http.get(`${BASE}/appointments/`, () =>
    HttpResponse.json({ count: 1, results: [mockAppointment] })
  ),
  http.post(`${BASE}/appointments/`, () =>
    HttpResponse.json({ ...mockAppointment, id: 99 }, { status: 201 })
  ),
  http.patch(`${BASE}/appointments/:id/`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...mockAppointment, ...body });
  }),
  http.delete(`${BASE}/appointments/:id/`, () => new HttpResponse(null, { status: 204 })),

  // --- Dashboard ---
  http.get(`${BASE}/dashboard/today/`, () =>
    HttpResponse.json({
      today_appointments: [mockAppointment],
      today_total: 1,
      today_completed: 0,
      total_patients: 5,
    })
  ),

  // --- Doctors ---
  http.get(`${BASE}/doctors/`, () =>
    HttpResponse.json([{ id: 1, username: 'testdoctor', full_name: 'Test Doctor' }])
  ),

  // --- Treatments ---
  http.get(`${BASE}/treatments/`, () => HttpResponse.json({ count: 0, results: [] })),
  http.post(`${BASE}/treatments/`, () =>
    HttpResponse.json({ id: 1, patient: 1, doctor: 1, date: '2026-05-04' }, { status: 201 })
  ),

  // --- Treatment Types ---
  http.get(`${BASE}/treatment-types/`, () =>
    HttpResponse.json({ count: 1, results: [{ id: 1, name: 'Kanal Tedavisi', default_price: '500.00', is_active: true }] })
  ),

  // --- Payments ---
  http.get(`${BASE}/payments/`, () => HttpResponse.json({ count: 0, results: [] })),

  // --- Clinic Settings ---
  http.get(`${BASE}/settings/clinic/`, () =>
    HttpResponse.json({ id: 1, work_start_time: '09:00:00', work_end_time: '18:00:00', work_days: [1, 2, 3, 4, 5] })
  ),
  http.put(`${BASE}/settings/clinic/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(body);
  }),

  // --- Documents ---
  http.get(`${BASE}/documents/`, () => HttpResponse.json({ count: 0, results: [] })),
];
