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
import { createPayment, fetchTreatments, updatePayment, deletePayment } from '../services/api';

interface Payment {
  id: number;
  amount: number | string;
  description: string;
  payment_date: string;
}

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number;
  onSuccess?: () => void;
  paymentToEdit?: Payment | null;
}

export default function PaymentDialog({
  isOpen,
  onClose,
  patientId,
  onSuccess,
  paymentToEdit,
}: PaymentDialogProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [treatmentId, setTreatmentId] = useState<number | ''>('');
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && patientId) {
      fetchTreatments(patientId.toString())
        .then((data) => setTreatments(data))
        .catch(() => setTreatments([]));
    }
  }, [isOpen, patientId]);

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setTreatmentId('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setError('');
    setConfirmDelete(false);
  };

  useEffect(() => {
    if (isOpen && paymentToEdit) {
      setAmount(paymentToEdit.amount.toString());
      setDescription(paymentToEdit.description || '');
      setPaymentDate(paymentToEdit.payment_date);
    } else if (isOpen) {
      resetForm();
    }
  }, [isOpen, paymentToEdit]);

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount.toString().replace(',', '.'));
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Geçerli bir tutar giriniz.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        patient: patientId,
        treatment: treatmentId ? (treatmentId as number) : undefined,
        amount: parsedAmount,
        description: description.trim() || undefined,
        payment_date: paymentDate,
      };

      if (paymentToEdit) {
        await updatePayment(paymentToEdit.id, payload);
      } else {
        await createPayment(payload);
      }

      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!paymentToEdit) return;
    setLoading(true);
    try {
      await deletePayment(paymentToEdit.id);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError('Silinemedi');
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{paymentToEdit ? 'Ödemeyi Düzenle' : 'Ödeme Ekle'}</DialogTitle>
          <DialogDescription>
            {paymentToEdit ? 'Ödeme bilgilerini güncelleyin veya silin.' : 'Hastadan alınan ödemeyi kaydedin.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="pay-treatment">İlgili Tedavi (Opsiyonel)</Label>
            <select
              id="pay-treatment"
              className="w-full h-10 px-3 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={treatmentId}
              onChange={(e) => setTreatmentId(Number(e.target.value) || '')}
            >
              <option value="">Genel Ödeme (Tedavi seçilmedi)</option>
              {treatments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.treatment_type_name || t.treatment_name} - {t.date}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-amount">Tutar (TL) *</Label>
            <Input
              id="pay-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-date">Ödeme Tarihi *</Label>
            <Input
              id="pay-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-desc">Açıklama</Label>
            <Input
              id="pay-desc"
              placeholder="Örn: Kanal tedavisi ödemesi"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          {paymentToEdit ? (
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 shadow-sm shadow-red-100"
              onClick={() => setConfirmDelete(true)}
              disabled={loading}
            >
              Sil
            </Button>
          ) : <div />}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? 'Kaydediliyor...' : paymentToEdit ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ödemeyi Sil</DialogTitle>
            <DialogDescription>
              Bu ödemeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Vazgeç</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? 'Siliniyor...' : 'Evet, Sil'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
