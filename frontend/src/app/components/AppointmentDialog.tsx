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
import {
  createAppointment,
  fetchPatients,
  fetchDoctors,
  fetchTreatmentTypes,
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface AppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: { date: string; time: string } | null;
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
  onSuccess,
}: AppointmentDialogProps) {
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
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
  }, [isOpen, user?.role, user?.id]);

  useEffect(() => {
    if (selectedSlot) {
      setTime(selectedSlot.time);
    }
  }, [selectedSlot]);

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
    setTime(selectedSlot?.time || '');
    setNotes('');
    setError('');
  };

  const handleSave = async () => {
    if (!selectedPatient || !selectedSlot || !selectedDoctorId) {
      setError('Lütfen hasta ve hekim seçin.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createAppointment({
        patient: selectedPatient.id,
        doctor: selectedDoctorId as number,
        date: selectedSlot.date,
        time: time,
        notes: notes || undefined,
        treatment_type: selectedTreatment || undefined,
        status: 'scheduled',
      });
      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Randevu eklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Randevu Ekle</DialogTitle>
          <DialogDescription>
            Randevu bilgilerini girin ve kaydedin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Date & Time (read-only) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tarih</Label>
              <Input value={selectedSlot?.date || ''} readOnly className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label>Saat</Label>
              <Input 
                type="time" 
                value={time} 
                onChange={(e) => setTime(e.target.value)} 
                required 
              />
            </div>
          </div>

          {/* Patient Search Dropdown */}
          <div className="space-y-2" ref={patientRef}>
            <Label htmlFor="patient-search">Hasta Seç *</Label>
            <div className="relative">
              <Input
                id="patient-search"
                placeholder="Ad, soyad, telefon veya TC No ile ara..."
                value={patientSearch}
                onChange={handlePatientSearchChange}
                onFocus={() => {
                  if (patientResults.length > 0) setPatientDropdownOpen(true);
                }}
                autoComplete="off"
              />
              {patientLoading && (
                <div className="absolute right-3 top-2.5 text-gray-400 text-sm">
                  Aranıyor...
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
                  Hasta bulunamadı
                </div>
              )}
            </div>

            {selectedPatient && (
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {selectedPatient.full_name} seçildi
              </p>
            )}
          </div>

          {/* Doctor Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="doctor">Hekim *</Label>
            <select
              id="doctor"
              className="w-full h-10 px-3 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(Number(e.target.value) || '')}
            >
              <option value="">Hekim seçin</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name || d.username}
                </option>
              ))}
            </select>
            {doctors.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Henüz hekim tanımlanmamış. Admin panelinden ekleyebilirsiniz.
              </p>
            )}
          </div>

          {/* Treatment Type Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="treatment">İşlem</Label>
            <select
              id="treatment"
              className="w-full h-10 px-3 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedTreatment}
              onChange={(e) => setSelectedTreatment(e.target.value)}
            >
              <option value="">İşlem seçin (opsiyonel)</option>
              {treatmentTypes.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
            {treatmentTypes.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Henüz tedavi türü tanımlanmamış. Admin panelinden ekleyebilirsiniz.
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              placeholder="Ek bilgiler..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
