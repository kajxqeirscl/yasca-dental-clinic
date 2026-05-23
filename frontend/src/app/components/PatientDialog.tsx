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
import { DatePicker } from './ui/date-picker';
import { PhoneInput } from './ui/phone-input';
import { isValidPhoneNumber } from 'react-phone-number-input';
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
  const [showFutureWarning, setShowFutureWarning] = useState(false);
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
    
    // Phone validation
    const phoneClean = formData.phone || '';
    if (!phoneClean) {
      newMissingFields.push('Telefon');
    } else if (!isValidPhoneNumber(phoneClean)) {
      setError('Lütfen geçerli bir telefon numarası giriniz.');
      setMissingFields(['Telefon']);
      return;
    }

    // TCKN validation (optional, but must be 11 digits if provided)
    if (formData.tckn.trim() && !/^[0-9]{11}$/.test(formData.tckn.trim())) {
      setError('TC Kimlik No 11 haneli ve sadece rakamlardan oluşmalıdır.');
      setMissingFields(['TC Kimlik No']);
      return;
    }

    if (newMissingFields.length > 0) {
      setMissingFields(newMissingFields);
      setError(`Lütfen eksik alanları doldurunuz: ${newMissingFields.join(', ')}`);
      return;
    }
    
    setMissingFields([]);

    let isFuture = false;
    if (formData.birth_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bDate = new Date(formData.birth_date);
      bDate.setHours(0, 0, 0, 0);
      if (bDate > today) {
        isFuture = true;
      }
    }

    if (isFuture) {
      setShowFutureWarning(true);
      return;
    }

    proceedSave();
  };

  const proceedSave = async () => {
    setShowFutureWarning(false);
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
    <>
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
              <PhoneInput
                id="phone"
                value={formData.phone}
                className={missingFields.includes('Telefon') ? 'border-red-500 focus-within:ring-red-500' : ''}
                onChange={(val) => {
                  setFormData({ ...formData, phone: val || '' });
                  if (missingFields.includes('Telefon')) setMissingFields(missingFields.filter(f => f !== 'Telefon'));
                }}
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
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">{t('patients:dialog.fields.birth_date')}</Label>
            <DatePicker
              date={formData.birth_date}
              onDateChange={(d) => setFormData({ ...formData, birth_date: d })}
              maxDate={new Date().toLocaleDateString('en-CA')}
            />
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

    <Dialog open={showFutureWarning} onOpenChange={setShowFutureWarning}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('patients:dialog.future_warning_title', 'Gelecek Tarih Uyarısı')}</DialogTitle>
          <DialogDescription>
            {t('patients:dialog.future_warning_desc', 'Doğum tarihi olarak gelecekteki bir tarihi seçtiniz. Yine de devam etmek istiyor musunuz?')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setShowFutureWarning(false)}>
            {t('common:cancel', 'İptal')}
          </Button>
          <Button onClick={proceedSave} disabled={loading} className="bg-yellow-600 hover:bg-yellow-700">
            {loading ? t('patients:dialog.saving', 'Kaydediliyor...') : t('common:continue', 'Devam Et')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
