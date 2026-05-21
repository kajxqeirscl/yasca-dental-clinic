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
import { createPatient, updatePatient } from '../services/api';

import { useTranslation } from 'react-i18next';

interface PatientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  patientId?: number;
  initialData?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    tckn?: string;
    birth_date?: string | null;
    address?: string;
    notes?: string;
  };
}

export default function PatientDialog({
  isOpen,
  onClose,
  onSuccess,
  patientId,
  initialData,
}: PatientDialogProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    tckn: '',
    birth_date: '',
    address: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [missingFields, setMissingFields] = useState<string[]>([]);
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          first_name: initialData.first_name || '',
          last_name: initialData.last_name || '',
          phone: initialData.phone || '',
          tckn: initialData.tckn || '',
          birth_date: initialData.birth_date || '',
          address: initialData.address || '',
          notes: initialData.notes || '',
        });
      } else {
        setFormData({
          first_name: '', last_name: '', phone: '', tckn: '', birth_date: '', address: '', notes: ''
        });
      }
      setError('');
      setMissingFields([]);
    }
  }, [isOpen, initialData]);

  const handleSave = async () => {
    const newMissingFields = [];
    if (!formData.first_name.trim()) newMissingFields.push('Ad');
    if (!formData.last_name.trim()) newMissingFields.push('Soyad');
    if (!formData.phone.trim()) newMissingFields.push('Telefon');
    if (!formData.tckn.trim()) newMissingFields.push('TC Kimlik No');

    if (newMissingFields.length > 0) {
      setMissingFields(newMissingFields);
      setError(`Lütfen eksik alanları doldurunuz: ${newMissingFields.join(', ')}`);
      return;
    }
    
    setMissingFields([]);
    setLoading(true);
    setError('');
    try {
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
        tckn: formData.tckn || undefined,
        birth_date: formData.birth_date || undefined,
        address: formData.address || undefined,
        notes: formData.notes || undefined,
      };

      if (patientId) {
        await updatePatient(patientId.toString(), payload as any);
      } else {
        await createPatient(payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('patients:dialog.error_add'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setError('');
      setMissingFields([]);
      setFormData({
        first_name: '',
        last_name: '',
        phone: '',
        tckn: '',
        birth_date: '',
        address: '',
        notes: '',
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{patientId ? t('patients:dialog.title_edit') : t('patients:dialog.title_add')}</DialogTitle>
          <DialogDescription>
            {t('patients:dialog.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('patients:dialog.fields.first_name')}</Label>
              <Input
                id="name"
                value={formData.first_name}
                className={missingFields.includes('Ad') ? 'border-red-500 focus-visible:ring-red-500' : ''}
                onChange={(e) => {
                  setFormData({ ...formData, first_name: e.target.value });
                  if (missingFields.includes('Ad')) setMissingFields(missingFields.filter(f => f !== 'Ad'));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surname">{t('patients:dialog.fields.last_name')}</Label>
              <Input
                id="surname"
                value={formData.last_name}
                className={missingFields.includes('Soyad') ? 'border-red-500 focus-visible:ring-red-500' : ''}
                onChange={(e) => {
                  setFormData({ ...formData, last_name: e.target.value });
                  if (missingFields.includes('Soyad')) setMissingFields(missingFields.filter(f => f !== 'Soyad'));
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t('patients:dialog.fields.phone')}</Label>
              <Input
                id="phone"
                type="tel"
                placeholder={t('patients:dialog.fields.phone_placeholder')}
                value={formData.phone}
                className={missingFields.includes('Telefon') ? 'border-red-500 focus-visible:ring-red-500' : ''}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (missingFields.includes('Telefon')) setMissingFields(missingFields.filter(f => f !== 'Telefon'));
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tckn">{t('patients:dialog.fields.tckn')}</Label>
              <Input
                id="tckn"
                type="text"
                placeholder={t('patients:dialog.fields.tckn_placeholder')}
                maxLength={11}
                value={formData.tckn}
                className={missingFields.includes('TC Kimlik No') ? 'border-red-500 focus-visible:ring-red-500' : ''}
                onChange={(e) => {
                  setFormData({ ...formData, tckn: e.target.value });
                  if (missingFields.includes('TC Kimlik No')) setMissingFields(missingFields.filter(f => f !== 'TC Kimlik No'));
                }}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">{t('patients:dialog.fields.birth_date')}</Label>
            <div className="flex gap-2">
              <select
                className="w-1/3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                value={formData.birth_date ? formData.birth_date.split('-')[2] : ''}
                onChange={(e) => {
                  const parts = formData.birth_date ? formData.birth_date.split('-') : ['1990', '01', '01'];
                  setFormData({ ...formData, birth_date: `${parts[0]}-${parts[1]}-${e.target.value.padStart(2, '0')}` });
                }}
              >
                <option value="" disabled>Gün</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                className="w-1/3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                value={formData.birth_date ? formData.birth_date.split('-')[1] : ''}
                onChange={(e) => {
                  const parts = formData.birth_date ? formData.birth_date.split('-') : ['1990', '01', '01'];
                  setFormData({ ...formData, birth_date: `${parts[0]}-${e.target.value.padStart(2, '0')}-${parts[2]}` });
                }}
              >
                <option value="" disabled>Ay</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                className="w-1/3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                value={formData.birth_date ? formData.birth_date.split('-')[0] : ''}
                onChange={(e) => {
                  const parts = formData.birth_date ? formData.birth_date.split('-') : ['1990', '01', '01'];
                  setFormData({ ...formData, birth_date: `${e.target.value}-${parts[1]}-${parts[2]}` });
                }}
              >
                <option value="" disabled>Yıl</option>
                {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t('patients:dialog.fields.address')}</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('patients:dialog.fields.notes')}</Label>
            <Textarea
              id="notes"
              placeholder={t('patients:dialog.fields.notes_placeholder')}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t('common:cancel')}
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? t('patients:dialog.saving') : t('common:save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
