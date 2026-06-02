/**
 * Test data factories for the Yaşca frontend.
 *
 * factory-boy ergonomisini taklit eden basit override-able factory'ler:
 *   const p = makePatient({ first_name: 'Veli' });
 *   const apt = makeAppointment({ status: 'completed' });
 *
 * Test'lerde hardcoded mock objeleri yerine bu factory'leri kullan;
 * bir alan rename edildiğinde merkezi olarak güncellenir.
 */

let _seq = 0;
const nextId = () => ++_seq;

export type UserRole = 'admin' | 'doctor' | 'assistant';

export interface MockUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  clinic_name?: string;
}

export interface MockPatient {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  tckn: string;
  birth_date?: string | null;
  last_visit: string | null;
}

export interface MockAppointment {
  id: number;
  patient: number;
  patient_name: string;
  patient_phone: string;
  doctor: number;
  doctor_name: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string;
  treatment_type: string;
  created_at: string;
}

export interface MockTreatment {
  id: number;
  patient: number;
  doctor: number;
  treatment_type: number;
  treatment_name: string;
  tooth_number: string;
  status: 'planned' | 'completed' | 'cancelled';
  date: string;
  price: string;
}

export interface MockPayment {
  id: number;
  patient: number;
  treatment?: number;
  amount: string;
  description: string;
  payment_date: string;
}

export interface MockClinicSettings {
  id: number;
  work_start_time: string;
  work_end_time: string;
  work_days: number[];
}

export function makeUser(overrides: Partial<MockUser> = {}): MockUser {
  const id = overrides.id ?? nextId();
  return {
    id,
    username: `user${id}`,
    email: `user${id}@test.com`,
    first_name: 'Test',
    last_name: 'Kullanıcı',
    role: 'doctor',
    ...overrides,
  };
}

export function makePatient(overrides: Partial<MockPatient> = {}): MockPatient {
  const id = overrides.id ?? nextId();
  const first = overrides.first_name ?? 'Ali';
  const last = overrides.last_name ?? 'Yılmaz';
  return {
    id,
    first_name: first,
    last_name: last,
    full_name: `${first} ${last}`,
    phone: '05551234567',
    tckn: '',
    birth_date: null,
    last_visit: null,
    ...overrides,
  };
}

export function makeAppointment(
  overrides: Partial<MockAppointment> = {},
): MockAppointment {
  const id = overrides.id ?? nextId();
  return {
    id,
    patient: 1,
    patient_name: 'Ali Yılmaz',
    patient_phone: '05551234567',
    doctor: 1,
    doctor_name: 'Dr. Test',
    date: '2026-05-28',
    time: '10:00:00',
    status: 'scheduled',
    notes: '',
    treatment_type: '',
    created_at: '2026-05-28T07:00:00Z',
    ...overrides,
  };
}

export function makeTreatment(
  overrides: Partial<MockTreatment> = {},
): MockTreatment {
  const id = overrides.id ?? nextId();
  return {
    id,
    patient: 1,
    doctor: 1,
    treatment_type: 1,
    treatment_name: 'Kanal Tedavisi',
    tooth_number: '21',
    status: 'planned',
    date: '2026-05-28',
    price: '2500.00',
    ...overrides,
  };
}

export function makePayment(
  overrides: Partial<MockPayment> = {},
): MockPayment {
  const id = overrides.id ?? nextId();
  return {
    id,
    patient: 1,
    amount: '500.00',
    description: 'Ödeme',
    payment_date: '2026-05-28',
    ...overrides,
  };
}

export function makeClinicSettings(
  overrides: Partial<MockClinicSettings> = {},
): MockClinicSettings {
  return {
    id: 1,
    work_start_time: '09:00:00',
    work_end_time: '18:00:00',
    work_days: [1, 2, 3, 4, 5],
    ...overrides,
  };
}

/** Test'ler arasında sequence sayacını sıfırla (deterministik ID'ler için). */
export function resetSequence() {
  _seq = 0;
}
