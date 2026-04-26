import { useState, useEffect } from 'react';
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
import { createTreatment, fetchDoctors, fetchTreatmentTypes } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface TreatmentAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number;
  onSuccess?: () => void;
  initialToothNumber?: string | number;
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

const TOOTH_NUMBERS = [
  '11','12','13','14','15','16','17','18',
  '21','22','23','24','25','26','27','28',
  '31','32','33','34','35','36','37','38',
  '41','42','43','44','45','46','47','48',
];

export default function TreatmentAddDialog({
  isOpen,
  onClose,
  patientId,
  onSuccess,
  initialToothNumber,
}: TreatmentAddDialogProps) {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [treatmentTypes, setTreatmentTypes] = useState<TreatmentTypeOption[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | ''>('');
  const [selectedTypeId, setSelectedTypeId] = useState<number | ''>('');
  const [treatmentName, setTreatmentName] = useState('');
  const [toothNumber, setToothNumber] = useState(initialToothNumber?.toString() || '');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('completed');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dialog her açıldığında varsayılanı resetlerken initialToothNumber'ı da basıyoruz
  useEffect(() => {
    if (isOpen) {
      setToothNumber(initialToothNumber?.toString() || '');
    }
  }, [isOpen, initialToothNumber]);

  useEffect(() => {
    if (!isOpen) return;
    fetchDoctors()
      .then((list: DoctorOption[]) => {
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

  const resetForm = () => {
    setSelectedTypeId('');
    setTreatmentName('');
    setToothNumber('');
    setNotes('');
    setStatus('completed');
    setDate(new Date().toISOString().split('T')[0]);
    setError('');
  };

  const handleSave = async () => {
    if (!selectedDoctorId) {
      setError('Lütfen hekim seçin.');
      return;
    }
    if (!selectedTypeId && !treatmentName.trim()) {
      setError('Tedavi türü veya işlem adı giriniz.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createTreatment({
        patient: patientId,
        doctor: selectedDoctorId as number,
        treatment_type: selectedTypeId ? (selectedTypeId as number) : null,
        treatment_name: treatmentName.trim() || undefined,
        tooth_number: toothNumber || undefined,
        status,
        notes: notes.trim() || undefined,
        date,
      });
      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tedavi eklenemedi');
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni Tedavi Kaydı Ekle</DialogTitle>
          <DialogDescription>
            Hastaya yapılan tedaviyi kaydedin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
          )}

          {/* Tarih & Hekim */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="treat-date">Tarih *</Label>
              <Input
                id="treat-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="treat-doctor">Hekim *</Label>
              <select
                id="treat-doctor"
                className="w-full h-10 px-3 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(Number(e.target.value) || '')}
              >
                <option value="">Seçin...</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name || d.username}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tedavi Türü */}
          <div className="space-y-2">
            <Label htmlFor="treat-type">İşlem Türü</Label>
            <select
              id="treat-type"
              className="w-full h-10 px-3 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedTypeId}
              onChange={(e) => {
                const val = Number(e.target.value) || '';
                setSelectedTypeId(val);
                if (val) {
                  const found = treatmentTypes.find((t) => t.id === val);
                  if (found) setTreatmentName('');
                }
              }}
            >
              <option value="">Listeden seçin (veya aşağıya yazın)</option>
              {treatmentTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Özel İşlem Adı */}
          {!selectedTypeId && (
            <div className="space-y-2">
              <Label htmlFor="treat-name">Özel İşlem Adı</Label>
              <Input
                id="treat-name"
                placeholder="Örn: Özel Beyazlatma"
                value={treatmentName}
                onChange={(e) => setTreatmentName(e.target.value)}
              />
            </div>
          )}

          {/* Diş No & Durum */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="treat-tooth">Diş No (FDI)</Label>
              <select
                id="treat-tooth"
                className="w-full h-10 px-3 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={toothNumber}
                onChange={(e) => setToothNumber(e.target.value)}
              >
                <option value="">Seçin (opsiyonel)</option>
                {TOOTH_NUMBERS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="treat-status">Durum</Label>
              <select
                id="treat-status"
                className="w-full h-10 px-3 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="completed">Tamamlandı</option>
                <option value="planned">Yapılacak</option>
              </select>
            </div>
          </div>

          {/* Notlar */}
          <div className="space-y-2">
            <Label htmlFor="treat-notes">Notlar</Label>
            <Textarea
              id="treat-notes"
              placeholder="Varsa ek bilgiler..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
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
