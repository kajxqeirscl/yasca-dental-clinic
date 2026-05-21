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
import { createTreatment, updateTreatment, deleteTreatment, fetchDoctors, fetchTreatmentTypes } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { type TreatmentCategory } from './TreatmentTypesPage';
import { DatePicker } from './ui/date-picker';
import { useTranslation } from 'react-i18next';

interface Treatment {
  id: number;
  doctor: number;
  treatment_type?: number;
  treatment_name?: string;
  tooth_number?: string;
  notes?: string;
  status: string;
  date: string;
  price?: number | string;
}

interface TreatmentAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number;
  onSuccess?: () => void;
  initialToothNumber?: string | number;
  /** Pre-selects the first treatment type matching this category. Replaces the old string-matching approach. */
  initialCategory?: TreatmentCategory;
  treatmentToEdit?: Treatment | null;
}

interface DoctorOption {
  id: number;
  username: string;
  full_name: string;
}

interface TreatmentTypeOption {
  id: number;
  name: string;
  category: string;
  default_price: string;
}

const TOOTH_NUMBERS = [
  '11', '12', '13', '14', '15', '16', '17', '18',
  '21', '22', '23', '24', '25', '26', '27', '28',
  '31', '32', '33', '34', '35', '36', '37', '38',
  '41', '42', '43', '44', '45', '46', '47', '48',
];

export default function TreatmentAddDialog({
  isOpen,
  onClose,
  patientId,
  onSuccess,
  initialToothNumber,
  initialCategory,
  treatmentToEdit,
}: TreatmentAddDialogProps) {
  const { t } = useTranslation();
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
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  // Dialog her açıldığında varsayılanı resetlerken initialToothNumber ve initialCategory'yi de uyguluyoruz
  useEffect(() => {
    if (isOpen) {
      if (treatmentToEdit) {
        setSelectedDoctorId(treatmentToEdit.doctor);
        setSelectedTypeId(treatmentToEdit.treatment_type || '');
        setTreatmentName(treatmentToEdit.treatment_name || '');
        setToothNumber(treatmentToEdit.tooth_number || '');
        setNotes(treatmentToEdit.notes || '');
        setStatus(treatmentToEdit.status);
        setDate(treatmentToEdit.date);
      } else {
        setToothNumber(initialToothNumber?.toString() || '');
        if (initialCategory) {
          // Find the first active treatment type with matching category — no string matching.
          const match = treatmentTypes.find((t) => t.category === initialCategory);
          if (match) {
            setSelectedTypeId(match.id);
            setPrice(match.default_price);
          } else {
            setSelectedTypeId('');
          }
          setTreatmentName('');
        } else {
          setSelectedTypeId('');
          setTreatmentName('');
        }
      }
    }
  }, [isOpen, treatmentToEdit, initialToothNumber, initialCategory, treatmentTypes]);

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
    setPrice('');
    setError('');
  };

  const handleSave = async () => {
    if (!selectedDoctorId) {
      setError(t('treatments:dialog.error_doctor'));
      return;
    }
    if (!selectedTypeId && !treatmentName.trim()) {
      setError(t('treatments:dialog.error_type'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        patient: patientId,
        doctor: selectedDoctorId as number,
        treatment_type: selectedTypeId ? (selectedTypeId as number) : null,
        treatment_name: treatmentName.trim() || undefined,
        tooth_number: toothNumber || undefined,
        status,
        notes: notes.trim() || undefined,
        date,
        price: price || undefined,
      };

      if (treatmentToEdit) {
        await updateTreatment(treatmentToEdit.id, payload);
      } else {
        await createTreatment(payload);
      }
      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('treatments:dialog.error_fail'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!treatmentToEdit) return;
    setLoading(true);
    try {
      await deleteTreatment(treatmentToEdit.id);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(t('treatments:dialog.error_delete'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onClose();
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{treatmentToEdit ? t('treatments:dialog.title_edit') : t('treatments:dialog.title_add')}</DialogTitle>
          <DialogDescription>
            {treatmentToEdit ? t('treatments:dialog.description_edit') : t('treatments:dialog.description_add')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
          )}

          {/* Tarih & Hekim */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="treat-date">{t('treatments:dialog.date')}</Label>
              <input
                type="date"
                id="treat-date"
                className="w-full h-10 px-3 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="treat-doctor">{t('treatments:dialog.doctor')}</Label>
              <select
                id="treat-doctor"
                className="w-full h-10 px-3 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(Number(e.target.value) || '')}
              >
                <option value="">{t('treatments:dialog.select_doctor')}</option>
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
            <Label htmlFor="treat-type">{t('treatments:dialog.type')}</Label>
            <select
              id="treat-type"
              className="w-full h-10 px-3 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedTypeId}
              onChange={(e) => {
                const val = Number(e.target.value) || '';
                setSelectedTypeId(val);
                if (val) {
                  const found = treatmentTypes.find((t) => t.id === val);
                  if (found) {
                    setTreatmentName('');
                    setPrice(found.default_price);
                  }
                } else {
                  setPrice('');
                }
              }}
            >
              <option value="">{t('treatments:dialog.select_type')}</option>
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
              <Label htmlFor="treat-name">{t('treatments:dialog.custom_name')}</Label>
              <Input
                id="treat-name"
                placeholder={t('treatments:dialog.custom_name_placeholder')}
                value={treatmentName}
                onChange={(e) => setTreatmentName(e.target.value)}
              />
            </div>
          )}

          {/* Diş No & Durum */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="treat-tooth">{t('treatments:dialog.tooth')}</Label>
              <select
                id="treat-tooth"
                className="w-full h-10 px-3 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={toothNumber}
                onChange={(e) => setToothNumber(e.target.value)}
              >
                <option value="">{t('treatments:dialog.select_tooth')}</option>
                {TOOTH_NUMBERS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="treat-status">{t('treatments:dialog.status')}</Label>
              <select
                id="treat-status"
                className="w-full h-10 px-3 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="completed">{t('treatments:dialog.status_completed')}</option>
                <option value="planned">{t('treatments:dialog.status_planned')}</option>
              </select>
            </div>
          </div>

          {/* Fiyat & Notlar */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="treat-price">{t('treatments:dialog.price')}</Label>
              <Input
                id="treat-price"
                type="number"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="treat-notes">{t('treatments:dialog.notes')}</Label>
              <Textarea
                id="treat-notes"
                placeholder={t('treatments:dialog.notes_placeholder')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={1}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          {treatmentToEdit ? (
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 shadow-sm shadow-red-100"
              onClick={() => setConfirmDelete(true)}
              disabled={loading}
            >
              {t('treatments:dialog.delete')}
            </Button>
          ) : <div />}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              {t('common:cancel')}
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? t('treatments:dialog.saving') : treatmentToEdit ? t('treatments:dialog.update') : t('treatments:dialog.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('treatments:delete_dialog.title')}</DialogTitle>
            <DialogDescription>
              {t('treatments:delete_dialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>{t('treatments:delete_dialog.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? t('treatments:delete_dialog.deleting') : t('treatments:delete_dialog.confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
