/**
 * Yaşca API servis katmanı
 * JWT token ile kimlik doğrulama, 401 yönlendirme
 */

const API_BASE = 'http://localhost:8000/api';

export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};

export const getAccessToken = () => localStorage.getItem('access_token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');

export const clearAuth = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  window.dispatchEvent(new Event('auth-logout'));
};

const getAuthHeaders = (): HeadersInit => {
  const token = getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

let refreshing = false;
let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    setTokens(data.access, data.refresh);
    return data.access;
  } catch {
    return null;
  }
};

async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const doFetch = (token?: string) => {
    const headers = new Headers(getAuthHeaders());
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(url, { ...options, headers });
  };

  let res = await doFetch();

  if (res.status === 401 && !refreshing) {
    refreshing = true;
    refreshPromise = refreshAccessToken();
    const newToken = await refreshPromise;
    refreshing = false;
    refreshPromise = null;
    if (newToken) {
      res = await doFetch(newToken);
    }
  }

  if (res.status === 401) {
    clearAuth();
  }

  return res;
}

// --- Auth ---
export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Giriş başarısız');
  }
  const data = await res.json();
  setTokens(data.access, data.refresh);
  return data;
}

export async function fetchCurrentUser() {
  const res = await fetchWithAuth(`${API_BASE}/auth/me/`);
  if (!res.ok) throw new Error('Oturum bilgisi alınamadı');
  return res.json();
}

// --- Patients ---
export async function fetchPatients(search = '') {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetchWithAuth(`${API_BASE}/patients/${params}`);
  if (!res.ok) throw new Error('Hastalar yüklenemedi');
  const data = await res.json();
  return data.results ? data.results : data;
}

export async function fetchPatient(id: string) {
  const res = await fetchWithAuth(`${API_BASE}/patients/${id}/`);
  if (!res.ok) throw new Error('Hasta bilgisi alınamadı');
  return res.json();
}

export async function createPatient(data: {
  first_name: string;
  last_name: string;
  phone: string;
  tckn?: string;
  birth_date?: string;
  address?: string;
  notes?: string;
}) {
  const res = await fetchWithAuth(`${API_BASE}/patients/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || JSON.stringify(err) || 'Hasta eklenemedi');
  }
  return res.json();
}

export async function updatePatient(
  id: string,
  data: Partial<{
    first_name: string;
    last_name: string;
    phone: string;
    tckn: string;
    birth_date: string;
    address: string;
    notes: string;
    anamnesis: Record<string, string>;
  }>
) {
  const res = await fetchWithAuth(`${API_BASE}/patients/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Hasta güncellenemedi');
  return res.json();
}

// --- Appointments ---
export async function fetchAppointments(date?: string) {
  const params = date ? `?date=${date}` : '';
  const res = await fetchWithAuth(`${API_BASE}/appointments/${params}`);
  if (!res.ok) throw new Error('Randevular yüklenemedi');
  const data = await res.json();
  return data.results ? data.results : data;
}

export async function fetchPatientAppointments(patientId: string) {
  const res = await fetchWithAuth(`${API_BASE}/appointments/?patient=${patientId}`);
  if (!res.ok) throw new Error('Hastanın randevuları yüklenemedi');
  const data = await res.json();
  return data.results ? data.results : data;
}

export async function createAppointment(data: {
  patient: number;
  doctor: number;
  date: string;
  time: string;
  notes?: string;
  treatment_type?: string;
  status?: string;
}) {
  const res = await fetchWithAuth(`${API_BASE}/appointments/`, {
    method: 'POST',
    body: JSON.stringify({
      patient: data.patient,
      doctor: data.doctor,
      date: data.date,
      time: data.time,
      notes: data.notes,
      treatment_type: data.treatment_type,
      status: data.status ?? 'scheduled',
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || JSON.stringify(err) || 'Randevu eklenemedi');
  }
  return res.json();
}

export async function updateAppointment(
  id: number,
  data: Partial<{ status: string; notes: string; treatment_type: string; date: string; time: string }>
) {
  const res = await fetchWithAuth(`${API_BASE}/appointments/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Randevu güncellenemedi');
  return res.json();
}

export async function deleteAppointment(id: number) {
  const res = await fetchWithAuth(`${API_BASE}/appointments/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Randevu silinemedi');
}

// --- Dashboard ---
export async function fetchDashboardToday() {
  const res = await fetchWithAuth(`${API_BASE}/dashboard/today/`);
  if (!res.ok) throw new Error('Dashboard verisi alınamadı');
  return res.json();
}

// --- Doctors ---
export async function fetchDoctors() {
  const res = await fetchWithAuth(`${API_BASE}/doctors/`);
  if (!res.ok) throw new Error('Hekimler yüklenemedi');
  return res.json();
}

// --- Treatments ---
export async function fetchTreatments(patientId?: string) {
  const params = patientId ? `?patient=${patientId}` : '';
  const res = await fetchWithAuth(`${API_BASE}/treatments/${params}`);
  if (!res.ok) throw new Error('Tedaviler yüklenemedi');
  const data = await res.json();
  return data.results ? data.results : data;
}

export async function createTreatment(data: {
  patient: number;
  doctor: number;
  treatment_type?: number | null;
  treatment_name?: string;
  tooth_number?: string;
  status?: string;
  notes?: string;
  date: string;
}) {
  const res = await fetchWithAuth(`${API_BASE}/treatments/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || JSON.stringify(err) || 'Tedavi eklenemedi');
  }
  return res.json();
}

// --- Treatment Types ---
export async function fetchTreatmentTypes() {
  const res = await fetchWithAuth(`${API_BASE}/treatment-types/`);
  if (!res.ok) throw new Error('Tedavi türleri yüklenemedi');
  const data = await res.json();
  return data.results ? data.results : data;
}

// --- Payments ---
export async function fetchPayments(patientId?: string) {
  const params = patientId ? `?patient=${patientId}` : '';
  const res = await fetchWithAuth(`${API_BASE}/payments/${params}`);
  if (!res.ok) throw new Error('Ödemeler yüklenemedi');
  const data = await res.json();
  return data.results ? data.results : data;
}

export async function createPayment(data: {
  patient: number;
  amount: number | string;
  description?: string;
  payment_date: string;
}) {
  const res = await fetchWithAuth(`${API_BASE}/payments/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || JSON.stringify(err) || 'Ödeme eklenemedi');
  }
  return res.json();
}

// --- Clinic Settings ---
export async function fetchClinicSettings() {
  const res = await fetchWithAuth(`${API_BASE}/settings/clinic/`);
  if (!res.ok) throw new Error('Klinik ayarları yüklenemedi');
  return res.json();
}

export async function updateClinicSettings(data: {
  work_start_time?: string;
  work_end_time?: string;
  work_days?: number[];
}) {
  const res = await fetchWithAuth(`${API_BASE}/settings/clinic/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || JSON.stringify(err) || 'Ayarlar kaydedilemedi');
  }
  return res.json();
}

// --- Doküman API ---
export async function fetchPatientDocuments(patientId: number) {
  const res = await fetchWithAuth(`${API_BASE}/documents/?patient=${patientId}`);
  if (!res.ok) throw new Error('Dokümanlar yüklenemedi');
  const data = await res.json();
  return data.results ? data.results : data;
}

export async function uploadDocument(patientId: number, name: string, file: File) {
  const token = getAccessToken();
  const formData = new FormData();
  formData.append('patient', patientId.toString());
  formData.append('name', name);
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/documents/`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Doküman yüklenemedi');
  }
  return res.json();
}

export async function deleteDocument(documentId: number) {
  const res = await fetchWithAuth(`${API_BASE}/documents/${documentId}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Doküman silinemedi');
}
