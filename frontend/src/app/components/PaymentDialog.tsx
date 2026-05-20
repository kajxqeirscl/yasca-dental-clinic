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
import { formatDate } from '../utils/date';
import { useTranslation } from 'react-i18next';
import { DatePicker } from './ui/date-picker';

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
  const { t } = useTranslation();
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
      setError(t('payments:dialog.error_amount'));
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
      setError(err instanceof Error ? err.message : t('payments:dialog.error_fail'));
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
      setError(t('payments:dialog.error_delete'));
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
          <DialogTitle>{paymentToEdit ? t('payments:dialog.title_edit') : t('payments:dialog.title_add')}</DialogTitle>
          <DialogDescription>
            {paymentToEdit ? t('payments:dialog.description_edit') : t('payments:dialog.description_add')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="pay-treatment">{t('payments:dialog.treatment')}</Label>
            <select
              id="pay-treatment"
              className="w-full h-10 px-3 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={treatmentId}
              onChange={(e) => setTreatmentId(Number(e.target.value) || '')}
            >
              <option value="">{t('payments:dialog.select_treatment')}</option>
              {treatments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.treatment_type_name || t.treatment_name} - {formatDate(t.date)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-amount">{t('payments:dialog.amount')}</Label>
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
            <Label htmlFor="pay-date">{t('payments:dialog.date')}</Label>
            <DatePicker
              date={paymentDate}
              onDateChange={setPaymentDate}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-desc">{t('payments:dialog.description')}</Label>
            <Input
              id="pay-desc"
              placeholder={t('payments:dialog.description_placeholder')}
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
              {t('payments:dialog.delete')}
            </Button>
          ) : <div />}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              {t('common:cancel')}
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? t('payments:dialog.saving') : paymentToEdit ? t('payments:dialog.update') : t('payments:dialog.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('payments:delete_dialog.title')}</DialogTitle>
            <DialogDescription>
              {t('payments:delete_dialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>{t('payments:delete_dialog.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? t('payments:delete_dialog.deleting') : t('payments:delete_dialog.confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
