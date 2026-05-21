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
  fetchTreatmentTypes,
  fetchClinicSettings,
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatTimeStr } from '../utils/date';
import { useTranslation } from 'react-i18next';

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
  treatment_type?: number;
  treatment_type_name?: string;
}

interface AppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: { date: string; time: string } | null;
  appointmentToEdit?: Appointment | null;
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

interface TreatmentTypeOption {
  id: number;
  name: string;
  default_price: string;
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

  // --- Treatment type state ---
  const [treatmentTypes, setTreatmentTypes] = useState<TreatmentTypeOption[]>([]);
  const [selectedTreatment, setSelectedTreatment] = useState('');

  // --- Other ---
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [workHours, setWorkHours] = useState({ start: 9, end: 18 });

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

    fetchTreatmentTypes()
      .then((list: TreatmentTypeOption[]) => setTreatmentTypes(list))
      .catch(() => setTreatmentTypes([]));

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

      if (appointmentToEdit.treatment_type) {
        setSelectedTreatment(appointmentToEdit.treatment_type);
      }
    } else if (selectedSlot) {
      setDate(selectedSlot.date);
      setTime(selectedSlot.time);
    }
  }, [appointmentToEdit, selectedSlot, treatmentTypes]);

  // Search patients with debounce
  useEffect(() => {
    if (!isOpen) return;
    if (!debouncedSearch.trim()) {
      setPatientResults([]);
      setPatientDropdownOpen(false);
      return;
    }
    setPatientLoading(true);
    fetchPatients(debouncedSearch.trim())
      .then((results: PatientOption[]) => {
        setPatientResults(results);
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

  const resetForm = () => {
    setPatientSearch('');
    setSelectedPatient(null);
    setPatientResults([]);
    setPatientDropdownOpen(false);
    setSelectedTreatment('');
    setDate(appointmentToEdit?.date || selectedSlot?.date || '');
    setTime(appointmentToEdit?.time || selectedSlot?.time || '');
    setNotes('');
    setError('');
    setValidationErrors([]);
  };

  const handleSave = async () => {
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
    setLoading(true);
    setError('');
    try {
      const payload = {
        patient: selectedPatient.id,
        doctor: selectedDoctorId as number,
        date: date,
        time: time,
        notes: notes || undefined,
        treatment_type: selectedTreatment ? Number(selectedTreatment) : undefined,
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
            <input
              type="date"
              className={`w-full h-10 px-3 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.includes('date') ? 'border-red-500 focus:ring-red-500' : ''}`}
              value={date}
              min={new Date().toLocaleDateString('en-CA')}
              onChange={(e) => setDate(e.target.value)}
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
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-md px-3 py-2 text-sm text-gray-500">
                {t('appointments:dialog.fields.not_found')}
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

        {/* Treatment Type Dropdown */}
        <div className="space-y-2">
          <Label htmlFor="treatment">{t('appointments:dialog.fields.treatment')}</Label>
          <select
            id="treatment"
            className="w-full h-10 px-3 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedTreatment}
            onChange={(e) => setSelectedTreatment(e.target.value)}
          >
            <option value="">{t('appointments:dialog.fields.select_treatment')}</option>
            {treatmentTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {treatmentTypes.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {t('appointments:dialog.fields.treatment_empty')}
            </p>
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
);
}
