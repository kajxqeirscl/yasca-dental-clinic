/**
 * Yaşca API servis katmanı
 * JWT token ile kimlik doğrulama, 401 yönlendirme
 */

// ---------------------------------------------------------------------------
// API Base URL & Tenant Detection
// ---------------------------------------------------------------------------
// Lokalde: localhost:8000 -> django-tenants Host header ile tenant bulur
// Canlıda: VITE_API_URL env var'dan okunur (Railway backend URL)
const HOSTNAME = window.location.hostname;

const isLocal = HOSTNAME.endsWith('localhost') || HOSTNAME === '127.0.0.1';

let API_BASE: string = import.meta.env.VITE_API_URL || '';
let TENANT_SUBDOMAIN = ''; // Canlı ortamda backend'e gönderilecek tenant adı

if (!API_BASE) {
  // VITE_API_URL tanımlı değilse lokal geliştirme moduna geç
  API_BASE = `http://${HOSTNAME}:8000/api`;
}

/**
 * Backend base URL'ini döndürür (sadece origin kısmı, /api olmadan).
 * Dosya URL'leri (media) gibi durumlarda kullanılır.
 */
export function getApiOrigin(): string {
  if (import.meta.env.VITE_API_URL) {
    // https://api.yascadental.com/api -> https://api.yascadental.com
    return (import.meta.env.VITE_API_URL as string).replace(/\/api\/?$/, '');
  }
  return `http://${HOSTNAME}:8000`;
}

/**
 * Canlı ortamda ClinicApp tarafından çağrılır.
 * URL path'inden alınan tenant slug'ı (Örn: 'ali') API isteklerine X-Tenant header olarak eklenir.
 */
export function setTenantSlug(slug: string) {
  TENANT_SUBDOMAIN = slug;
}

export { TENANT_SUBDOMAIN };

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
    ...(TENANT_SUBDOMAIN ? { 'X-Tenant': TENANT_SUBDOMAIN } : {}),
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
      headers: {
        'Content-Type': 'application/json',
        ...(TENANT_SUBDOMAIN ? { 'X-Tenant': TENANT_SUBDOMAIN } : {}),
      },
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

// --- API Error Parser Helper ---
export function parseApiError(err: any, defaultMsg = 'Bir hata oluştu'): string {
  if (!err) return defaultMsg;
  if (typeof err === 'string') return err;
  if (err.detail) return err.detail;
  
  if (typeof err === 'object') {
    const messages: string[] = [];
    for (const key of Object.keys(err)) {
      const fieldErrors = err[key];
      if (Array.isArray(fieldErrors)) {
        messages.push(...fieldErrors);
      } else if (typeof fieldErrors === 'string') {
        messages.push(fieldErrors);
      } else if (typeof fieldErrors === 'object' && fieldErrors !== null) {
        messages.push(parseApiError(fieldErrors));
      }
    }
    if (messages.length > 0) {
      return messages.join('\n');
    }
  }
  return defaultMsg;
}

// --- Auth ---
export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/token/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(TENANT_SUBDOMAIN ? { 'X-Tenant': TENANT_SUBDOMAIN } : {}),
    },
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

export async function apiLogout() {
  try {
    await fetchWithAuth(`${API_BASE}/auth/logout/`, {
      method: 'POST',
    });
  } catch (err) {
    console.error('Logout request failed:', err);
  } finally {
    clearAuth();
  }
}

export async function requestPasswordReset(email: string) {
  const res = await fetch(`${API_BASE}/auth/password-reset/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(TENANT_SUBDOMAIN ? { 'X-Tenant': TENANT_SUBDOMAIN } : {}),
    },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Şifre sıfırlama bağlantısı gönderilemedi');
  }
  return res.json();
}

export async function confirmPasswordReset(uid: string, token: string, new_password: string) {
  const res = await fetch(`${API_BASE}/auth/password-reset/confirm/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(TENANT_SUBDOMAIN ? { 'X-Tenant': TENANT_SUBDOMAIN } : {}),
    },
    body: JSON.stringify({ uid, token, new_password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Şifre güncellenemedi');
  }
  return res.json();
}

export async function fetchCurrentUser() {
  const res = await fetchWithAuth(`${API_BASE}/auth/me/`);
  if (!res.ok) throw new Error('Oturum bilgisi alınamadı');
  return res.json();
}

export async function fetchPublicClinicInfo() {
  const res = await fetch(`${API_BASE}/public/clinic-info/`, {
    headers: {
      ...(TENANT_SUBDOMAIN ? { 'X-Tenant': TENANT_SUBDOMAIN } : {}),
    },
  });
  if (!res.ok) throw new Error('Klinik bilgisi alınamadı');
  return res.json();
}

// --- Patients ---
export async function fetchPatients(search = '', page = 1, ordering = '') {
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
  const orderParam = ordering ? `&ordering=${encodeURIComponent(ordering)}` : '';
  const res = await fetchWithAuth(`${API_BASE}/patients/?page=${page}${searchParam}${orderParam}`);
  if (!res.ok) throw new Error('Hastalar yüklenemedi');
  const data = await res.json();
  // Return the full paginated object (with .count and .results) so the UI can do remote pagination
  return data.results ? data : { results: data, count: data.length };
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
    throw new Error(parseApiError(err, 'Hasta eklenemedi'));
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
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, 'Hasta güncellenemedi'));
  }
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
  treatment?: number | null;
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
      treatment: data.treatment,
      status: data.status ?? 'scheduled',
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, 'Randevu eklenemedi'));
  }
  return res.json();
}

export async function updateAppointment(
  id: number,
  data: Partial<{ status: string; notes: string; treatment: number | null; date: string; time: string }>
) {
  const res = await fetchWithAuth(`${API_BASE}/appointments/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, 'Randevu güncellenemedi'));
  }
  return res.json();
}

export async function deleteAppointment(id: number) {
  const res = await fetchWithAuth(`${API_BASE}/appointments/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, 'Randevu silinemedi'));
  }
}

// --- Dashboard ---
export async function fetchDashboardToday() {
  const res = await fetchWithAuth(`${API_BASE}/dashboard/today/`);
  if (!res.ok) throw new Error('Dashboard verisi alınamadı');
  return res.json();
}

// --- Doctors ---
export async function fetchDoctors() {
  return fetchAllPages(`/doctors/`, 'Hekimler yüklenemedi');
}

// --- Treatments ---
export async function fetchTreatments(patientId?: string) {
  const params = patientId ? `?patient=${patientId}` : '';
  return fetchAllPages(`/treatments/${params}`, 'Tedaviler yüklenemedi');
}

export interface Treatment {
  treatment_type_name?: string;
  treatment_type_category?: string;
  treatment_name?: string;
  teeth?: string[];
  status: 'completed' | 'planned';
  date: string;
  price?: string | number;
}

export interface TreatmentCreatePayload {
  patient: number;
  doctor: number;
  treatment_type: number | null;
  treatment_name?: string;
  teeth?: string[];
  status?: string;
  notes?: string;
  date: string;
}

export async function createTreatment(data: TreatmentCreatePayload) {
  const res = await fetchWithAuth(`${API_BASE}/treatments/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, 'Tedavi eklenemedi'));
  }
  return res.json();
}

export async function updateTreatment(
  id: number,
  data: Partial<{
    doctor: number;
    treatment_type: number | null;
    treatment_name: string;
    tooth_number: string;
    status: string;
    notes: string;
    date: string;
  }>
) {
  const res = await fetchWithAuth(`${API_BASE}/treatments/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, 'Tedavi güncellenemedi'));
  }
  return res.json();
}

export async function updatePayment(id: number, data: any) {
  const res = await fetchWithAuth(`${API_BASE}/payments/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, 'Ödeme güncellenemedi'));
  }
  return res.json();
}

export async function deletePayment(id: number) {
  const res = await fetchWithAuth(`${API_BASE}/payments/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, 'Ödeme silinemedi'));
  }
  return true;
}

export async function deleteTreatment(id: number) {
  const res = await fetchWithAuth(`${API_BASE}/treatments/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, 'Tedavi silinemedi'));
  }
}

// --- Treatment Types ---
export async function fetchTreatmentTypes() {
  const res = await fetchWithAuth(`${API_BASE}/treatment-types/`);
  if (!res.ok) throw new Error('Tedavi türleri yüklenemedi');
  const data = await res.json();
  return data.results ? data.results : data;
}

export async function createTreatmentType(data: { name: string; default_price: number | string }) {
  const res = await fetchWithAuth(`${API_BASE}/treatment-types/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, 'Tedavi türü eklenemedi'));
  }
  return res.json();
}

export async function updateTreatmentType(
  id: number,
  data: Partial<{ name: string; default_price: number | string; is_active: boolean }>
) {
  const res = await fetchWithAuth(`${API_BASE}/treatment-types/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, 'Tedavi türü güncellenemedi'));
  }
  return res.json();
}

export async function deleteTreatmentType(id: number) {
  const res = await fetchWithAuth(`${API_BASE}/treatment-types/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, 'Tedavi türü silinemedi'));
  }
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
  treatment?: number;
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
    throw new Error(parseApiError(err, 'Ödeme eklenemedi'));
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
  allow_international_numbers?: boolean;
  default_country?: string;
}) {
  const res = await fetchWithAuth(`${API_BASE}/settings/clinic/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, 'Ayarlar kaydedilemedi'));
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
      ...(TENANT_SUBDOMAIN ? { 'X-Tenant': TENANT_SUBDOMAIN } : {}),
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


// --- Kullanici Yonetimi ---

export async function fetchUsers() {
  const res = await fetchWithAuth(`${API_BASE}/users/`);
  if (!res.ok) throw new Error('Kullanıcılar yüklenemedi');
  const data = await res.json();
  return data.results ? data.results : data;
}

export async function createUser(data: any) {
  const res = await fetchWithAuth(`${API_BASE}/users/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, 'Kullanıcı eklenemedi'));
  }
  return res.json();
}

export async function updateUser(id: number, data: any) {
  const res = await fetchWithAuth(`${API_BASE}/users/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, 'Kullanıcı güncellenemedi'));
  }
  return res.json();
}

export async function deleteUser(id: number) {
  const res = await fetchWithAuth(`${API_BASE}/users/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, 'Kullanıcı silinemedi'));
  }
}

// ── Audit Logs ──
export async function getAuditLogs(page = 1) {
  const res = await fetchWithAuth(`${API_BASE}/audit-logs/?page=${page}`);
  if (!res.ok) throw new Error('İşlem geçmişi yüklenemedi');
  return res.json();
}

// --- Helper for traversing paginated endpoints ---
export async function fetchAllPages(endpoint: string, errorMessage = 'Veriler yüklenemedi') {
  const allResults: any[] = [];
  let nextUrl: string | null = `${API_BASE}${endpoint}`;

  while (nextUrl) {
    const res = await fetchWithAuth(nextUrl);
    if (!res.ok) throw new Error(errorMessage);
    const data = await res.json();
    
    if (data && data.results !== undefined) {
      allResults.push(...data.results);
      nextUrl = data.next ? data.next.replace(/^http:/i, 'https:') : null; // enforce https if proxy drops it
    } else {
      return data;
    }
  }
  return allResults;
}

