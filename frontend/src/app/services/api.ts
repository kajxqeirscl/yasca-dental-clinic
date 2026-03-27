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
  return res.json();
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
  return res.json();
}

export async function createAppointment(data: {
  patient: number;
  doctor: number;
  date: string;
  time: string;
  duration?: number;
  notes?: string;
  treatment_type?: string;
  status?: string;
}) {
  const res = await fetchWithAuth(`${API_BASE}/appointments/`, {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      duration: data.duration ?? 60,
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
  data: Partial<{ status: string; notes: string; treatment_type: string }>
) {
  const res = await fetchWithAuth(`${API_BASE}/appointments/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Randevu güncellenemedi');
  return res.json();
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
  return res.json();
}

// --- Treatment Types ---
export async function fetchTreatmentTypes() {
  const res = await fetchWithAuth(`${API_BASE}/treatment-types/`);
  if (!res.ok) throw new Error('Tedavi türleri yüklenemedi');
  return res.json();
}
