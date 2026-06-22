import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { DatePicker } from './ui/date-picker';
import {
  createAppointment,
  updateAppointment,
  fetchPatients,
  fetchDoctors,
  fetchTreatments,
  fetchClinicSettings,
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatTimeStr } from '../utils/date';
import { useTranslation } from 'react-i18next';
import { UserPlus, Plus } from 'lucide-react';
import PatientDialog from './PatientDialog';
import TreatmentAddDialog from './TreatmentAddDialog';

interface Appointment {
  id: number;
  date: string;
  time: string;
  patient_name: string;
  patient_phone: string;
  patient: number;
  doctor: number;
  doctor_name?: string;
  status: string;
  notes?: string;
  treatment?: number;
  treatment_name?: string;
}

interface AppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: { date: string; time: string } | null;
  appointmentToEdit?: Appointment | null;
  defaultTreatmentId?: number;
  defaultPatient?: PatientOption | null;
  onSuccess?: () => void;
}

interface PatientOption {
  id: number;
  full_name: string;
  phone: string;
  tckn?: string;
}

interface DoctorOption {
  id: number;
  username: string;
  full_name: string;
}

interface TreatmentOption {
  id: number;
  treatment_name: string;
  treatment_type_name: string;
  tooth_number?: string;
  status: string;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function AppointmentDialog({
  isOpen,
  onClose,
  selectedSlot,
  appointmentToEdit,
  defaultTreatmentId,
  defaultPatient,
  onSuccess,
}: AppointmentDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  // --- Patient search state ---
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<PatientOption[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const [patientLoading, setPatientLoading] = useState(false);
  const patientRef = useRef<HTMLDivElement>(null);

  // --- Doctor state ---
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | ''>('');

  // --- Treatment state ---
  const [patientTreatments, setPatientTreatments] = useState<TreatmentOption[]>([]);
  const [selectedTreatment, setSelectedTreatment] = useState<number | ''>('');

  // --- Other ---
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showPastWarning, setShowPastWarning] = useState(false);
  const [workHours, setWorkHours] = useState({ start: 9, end: 18 });

  // --- Patient creation dialog state ---
  const [showPatientDialog, setShowPatientDialog] = useState(false);

  // --- Treatment creation dialog state ---
  const [showTreatmentDialog, setShowTreatmentDialog] = useState(false);

  const debouncedSearch = useDebounce(patientSearch, 300);

  // Load doctors and treatment types when dialog opens
  useEffect(() => {
    if (!isOpen) return;
    fetchDoctors()
      .then((list: DoctorOption[]) => {
        // Alphabetical sort
        const sorted = [...list].sort((a, b) =>
          (a.full_name || a.username).localeCompare(b.full_name || b.username, 'tr')
        );
        setDoctors(sorted);
        if (sorted.length > 0) {
          const doc =
            user?.role === 'doctor'
              ? sorted.find((d) => d.id === user.id) || sorted[0]
              : sorted[0];
          setSelectedDoctorId(doc.id);
        }
      })
      .catch(() => setDoctors([]));

    fetchClinicSettings()
      .then((settings) => {
        if (settings.work_start_time) {
          setWorkHours(prev => ({ ...prev, start: parseInt(settings.work_start_time.split(':')[0], 10) }));
        }
        if (settings.work_end_time) {
          setWorkHours(prev => ({ ...prev, end: parseInt(settings.work_end_time.split(':')[0], 10) }));
        }
      })
      .catch(() => { });
  }, [isOpen, user?.role, user?.id]);

  useEffect(() => {
    if (appointmentToEdit) {
      setSelectedPatient({
        id: appointmentToEdit.patient,
        full_name: appointmentToEdit.patient_name,
        phone: appointmentToEdit.patient_phone
      });
      setPatientSearch(appointmentToEdit.patient_name);
      setDate(appointmentToEdit.date);
      setTime(appointmentToEdit.time);
      setSelectedDoctorId(appointmentToEdit.doctor);
      setNotes(appointmentToEdit.notes || '');

      if (appointmentToEdit.treatment) {
        setSelectedTreatment(appointmentToEdit.treatment);
      }
    } else if (selectedSlot) {
      setDate(selectedSlot.date);
      setTime(selectedSlot.time);
    } else {
      setDate(new Date().toLocaleDateString('en-CA'));
      setTime('');
    }
    
    if (defaultTreatmentId && !appointmentToEdit) {
      setSelectedTreatment(defaultTreatmentId);
    }

    if (defaultPatient && !appointmentToEdit) {
      setSelectedPatient(defaultPatient);
      setPatientSearch(defaultPatient.full_name);
    }
  }, [appointmentToEdit, selectedSlot, defaultTreatmentId, defaultPatient]);

  // Fetch treatments when patient changes
  useEffect(() => {
    if (selectedPatient) {
      fetchTreatments(selectedPatient.id.toString())
        .then((list: TreatmentOption[]) => setPatientTreatments(list))
        .catch(() => setPatientTreatments([]));
    } else {
      setPatientTreatments([]);
    }
  }, [selectedPatient]);

  // Search patients with debounce
  useEffect(() => {
    if (!isOpen) return;
    if (!debouncedSearch.trim()) {
      setPatientResults([]);
      setPatientDropdownOpen(false);
      return;
    }

    // Prevent re-fetching and reopening the dropdown if the search exactly matches the currently selected patient's name
    if (selectedPatient && debouncedSearch.trim() === selectedPatient.full_name.trim()) {
      return;
    }
    setPatientLoading(true);
    fetchPatients(debouncedSearch.trim())
      .then((data: any) => {
        // Handle paginated response ({ count, results }) or fallback to array
        const resultsArray = data.results || data;
        setPatientResults(resultsArray);
        setPatientDropdownOpen(true);
      })
      .catch(() => setPatientResults([]))
      .finally(() => setPatientLoading(false));
  }, [debouncedSearch, isOpen]);

  // Close patient dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (patientRef.current && !patientRef.current.contains(e.target as Node)) {
        setPatientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPatient = useCallback((patient: PatientOption) => {
    setSelectedPatient(patient);
    setPatientSearch(patient.full_name);
    setPatientDropdownOpen(false);
  }, []);

  const handlePatientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPatientSearch(val);
    if (!val) {
      setSelectedPatient(null);
    }
  };

  // Parse search text into first_name / last_name for pre-filling PatientDialog
  const parseNameFromSearch = (text: string) => {
    const parts = text.trim().split(/\s+/);
    if (parts.length >= 2) {
      return { first_name: parts.slice(0, -1).join(' '), last_name: parts[parts.length - 1] };
    }
    return { first_name: parts[0] || '', last_name: '' };
  };

  const resetForm = () => {
    if (defaultPatient) {
      setPatientSearch(defaultPatient.full_name);
      setSelectedPatient(defaultPatient);
    } else {
      setPatientSearch('');
      setSelectedPatient(null);
    }
    setPatientResults([]);
    setPatientDropdownOpen(false);
    setSelectedTreatment(defaultTreatmentId || '');
    setDate(appointmentToEdit?.date || selectedSlot?.date || new Date().toLocaleDateString('en-CA'));
    setTime(appointmentToEdit?.time || selectedSlot?.time || '');
    setNotes('');
    setError('');
    setValidationErrors([]);
  };

  const handleSave = () => {
    const missing: string[] = [];
    if (!selectedPatient) missing.push('patient');
    if (!selectedDoctorId) missing.push('doctor');
    if (!date) missing.push('date');
    if (!time || time === ':00') missing.push('time');

    setValidationErrors(missing);
    if (missing.length > 0) {
      if (missing.length === 1) {
        const singleMessages: { [key: string]: string } = {
          patient: t('appointments:dialog.errors.patient'),
          doctor: t('appointments:dialog.errors.doctor'),
          date: t('appointments:dialog.errors.date'),
          time: t('appointments:dialog.errors.time')
        };
        setError(singleMessages[missing[0]]);
      } else {
        const fieldNames: { [key: string]: string } = {
          patient: t('appointments:dialog.errors.field_patient'),
          doctor: t('appointments:dialog.errors.field_doctor'),
          date: t('appointments:dialog.errors.field_date'),
          time: t('appointments:dialog.errors.field_time')
        };
        const list = missing.map(m => fieldNames[m]).join(', ');
        setError(`${t('appointments:dialog.errors.multi_prefix')}${list}.`);
      }
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateObj = new Date(date);
    selectedDateObj.setHours(0, 0, 0, 0);

    const isNewDate = !appointmentToEdit || appointmentToEdit.date !== date;
    const isNewTime = !appointmentToEdit || appointmentToEdit.time !== time;

    let isPast = false;
    
    if (isNewDate || isNewTime) {
      if (selectedDateObj < today) {
        isPast = true;
      } else if (selectedDateObj.getTime() === today.getTime() && time) {
        const [hours, minutes] = time.split(':').map(Number);
        const now = new Date();
        if (hours < now.getHours() || (hours === now.getHours() && minutes < now.getMinutes())) {
          isPast = true;
        }
      }
    }

    if (isPast) {
      setShowPastWarning(true);
      return;
    }

    proceedSave();
  };

  const proceedSave = async () => {
    setShowPastWarning(false);
    setLoading(true);
    setError('');
    try {
      const payload = {
        patient: selectedPatient.id,
        doctor: selectedDoctorId as number,
        date: date,
        time: time,
        notes: notes || undefined,
        treatment: selectedTreatment ? Number(selectedTreatment) : null,
        status: appointmentToEdit ? appointmentToEdit.status : 'scheduled',
      };

    if (appointmentToEdit) {
      await updateAppointment(appointmentToEdit.id, payload);
    } else {
      await createAppointment(payload);
    }
    resetForm();
    onSuccess?.();
    onClose();
  } catch (err) {
    setError(err instanceof Error ? err.message : t('appointments:dialog.error_add'));
  } finally {
    setLoading(false);
  }
};

const generateTimeOptions = () => {
  const options = [];
  for (let h = workHours.start; h < workHours.end; h++) {
    for (let m = 0; m < 60; m += 15) {
      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      options.push(timeStr);
    }
  }
  // Add the end hour (e.g., 18:00)
  options.push(`${workHours.end.toString().padStart(2, '0')}:00`);
  return options;
};

const handleOpenChange = (open: boolean) => {
  if (!open) resetForm();
  onClose();
};

return (
  <>
  <Dialog open={isOpen} onOpenChange={handleOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{appointmentToEdit ? t('appointments:dialog.title_edit') : t('appointments:dialog.title_add')}</DialogTitle>
        <DialogDescription>
          {appointmentToEdit ? t('appointments:dialog.description_edit') : t('appointments:dialog.description_add')}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('appointments:dialog.fields.date')}</Label>
            <DatePicker
              date={date}
              onDateChange={setDate}
              minDate={new Date().toLocaleDateString('en-CA')}
              className={validationErrors.includes('date') ? 'border-red-500 focus-within:ring-red-500' : ''}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{t('appointments:dialog.fields.time')}</Label>
            <select
              className={`w-full h-10 px-3 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.includes('time') ? 'border-red-500 focus:ring-red-500' : ''
                }`}
              value={time.substring(0, 5)}
              onChange={(e) => setTime(e.target.value + ':00')}
              required
            >
              <option value="">{t('appointments:dialog.fields.select_time')}</option>
              {generateTimeOptions().map((t) => (
                <option key={t} value={t}>
                  {formatTimeStr(t)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Patient Search Dropdown */}
        <div className="space-y-2" ref={patientRef}>
          <Label htmlFor="patient-search">{t('appointments:dialog.fields.patient')}</Label>
          <div className="relative">
            <Input
              id="patient-search"
              placeholder={t('appointments:dialog.fields.patient_search')}
              value={patientSearch}
              onChange={handlePatientSearchChange}
              onFocus={() => {
                if (patientResults.length > 0) setPatientDropdownOpen(true);
              }}
              autoComplete="off"
              className={validationErrors.includes('patient') ? 'border-red-500 focus:ring-red-500' : ''}
            />
            {patientLoading && (
              <div className="absolute right-3 top-2.5 text-gray-400 text-sm">
                {t('appointments:dialog.fields.searching')}
              </div>
            )}

            {patientDropdownOpen && patientResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-52 overflow-y-auto">
                {patientResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 outline-none transition-colors"
                    onClick={() => handleSelectPatient(p)}
                  >
                    <span className="font-medium text-gray-900">{p.full_name}</span>
                    <span className="ml-2 text-sm text-gray-500">{p.phone}</span>
                    {p.tckn && (
                      <span className="ml-2 text-xs text-gray-400">TC: {p.tckn}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {patientDropdownOpen && !patientLoading && patientResults.length === 0 && debouncedSearch.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
                <div className="px-3 py-2 text-sm text-gray-500">
                  {t('appointments:dialog.fields.not_found')}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPatientDropdownOpen(false);
                    setShowPatientDialog(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-sm border-t border-emerald-100 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Yeni Hasta Oluştur</span>
                </button>
              </div>
            )}
          </div>

          {selectedPatient && (
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {selectedPatient.full_name} {t('appointments:dialog.fields.selected')}
            </p>
          )}
        </div>

        {/* Doctor Dropdown */}
        <div className="space-y-2">
          <Label htmlFor="doctor">{t('appointments:dialog.fields.doctor')}</Label>
          <select
            id="doctor"
            className={`w-full h-10 px-3 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.includes('doctor') ? 'border-red-500 focus:ring-red-500' : ''
              }`}
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(Number(e.target.value) || '')}
          >
            <option value="">{t('appointments:dialog.fields.select_doctor')}</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name || d.username}
              </option>
            ))}
          </select>
          {doctors.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {t('appointments:dialog.fields.doctor_empty')}
            </p>
          )}
        </div>

        {/* Treatment Dropdown */}
        <div className="space-y-2">
          <Label htmlFor="treatment">{t('appointments:dialog.fields.treatment', 'İşlem (Tedavi)')}</Label>
          <select
            id="treatment"
            className="w-full h-10 px-3 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            value={selectedTreatment}
            onChange={(e) => setSelectedTreatment(e.target.value ? Number(e.target.value) : '')}
            disabled={!selectedPatient}
          >
            <option value="">{t('appointments:dialog.fields.select_treatment', 'Tedavi Seçin (İsteğe Bağlı)')}</option>
            {patientTreatments.map((tr) => (
              <option key={tr.id} value={tr.id} disabled={tr.status === 'completed'}>
                {tr.treatment_type_name || tr.treatment_name} {tr.tooth_number ? `(Diş: ${tr.tooth_number})` : ''}
                {tr.status === 'completed' ? ` - ${t('patients:profile.treatments.status.completed', 'Tamamlandı')}` : ''}
              </option>
            ))}
          </select>
          {!selectedPatient && (
             <p className="text-xs text-gray-400 mt-1">
               {t('appointments:dialog.fields.treatment_need_patient', 'Tedavi seçmek için önce hasta seçmelisiniz.')}
             </p>
          )}
          {selectedPatient && patientTreatments.length === 0 && (
            <p className="text-xs text-gray-400 mt-1 mb-2">
              {t('appointments:dialog.fields.treatment_empty', 'Bu hastanın kayıtlı tedavisi yok.')}
            </p>
          )}
          {selectedPatient && (
            <button
              type="button"
              onClick={() => setShowTreatmentDialog(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 mt-2 text-left bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-sm border border-emerald-100 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Tedavi Ekle</span>
            </button>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">{t('appointments:dialog.fields.notes')}</Label>
          <Textarea
            id="notes"
            placeholder={t('appointments:dialog.fields.notes_placeholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => handleOpenChange(false)}>
          {t('common:cancel')}
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? t('appointments:dialog.saving') : t('common:save')}
        </Button>
      </div>
    </DialogContent>
  </Dialog>

  {/* Geçmiş Tarih/Saat Uyarı Dialogu */}
  <Dialog open={showPastWarning} onOpenChange={setShowPastWarning}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{t('appointments:dialog.past_warning_title', 'Geçmiş Tarih/Saat Uyarısı')}</DialogTitle>
        <DialogDescription>
          {t('appointments:dialog.past_warning_desc', 'Geçmiş bir tarihe veya saate randevu oluşturuyorsunuz. Yine de devam etmek istiyor musunuz?')}
        </DialogDescription>
      </DialogHeader>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={() => setShowPastWarning(false)}>
          {t('common:cancel', 'İptal')}
        </Button>
        <Button onClick={proceedSave} disabled={loading} className="bg-yellow-600 hover:bg-yellow-700">
          {loading ? t('appointments:dialog.saving', 'Kaydediliyor...') : t('common:continue', 'Devam Et')}
        </Button>
      </div>
    </DialogContent>
  </Dialog>

  {/* Hasta Oluşturma Dialog */}
  <PatientDialog
    isOpen={showPatientDialog}
    onClose={() => setShowPatientDialog(false)}
    initialData={patientSearch.trim() ? parseNameFromSearch(patientSearch) : undefined}
    onSuccess={() => {
      // Re-search to find the newly created patient
      setShowPatientDialog(false);
      fetchPatients(patientSearch.trim())
        .then((results: PatientOption[]) => {
          if (results.length > 0) {
            handleSelectPatient(results[0]);
          }
        })
        .catch(() => {});
    }}
  />

  {selectedPatient && (
    <TreatmentAddDialog
      isOpen={showTreatmentDialog}
      onClose={() => setShowTreatmentDialog(false)}
      patientId={selectedPatient.id}
      onSuccess={() => {
        setShowTreatmentDialog(false);
        // Re-fetch treatments to update the dropdown list
        fetchTreatments(selectedPatient.id.toString())
          .then((list) => setPatientTreatments(list))
          .catch(() => {});
      }}
    />
  )}
  </>
);
}
