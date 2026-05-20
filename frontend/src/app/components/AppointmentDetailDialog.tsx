import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Clock, User, Stethoscope, Activity, FileText, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { updateAppointment, deleteAppointment } from '../services/api';
import { formatDate, formatTimeStr } from '../utils/date';
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

interface AppointmentDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onUpdated?: () => void;
  onEdit?: (appointment: Appointment) => void;
}

const STATUS_OPTIONS = [
  { value: 'scheduled', labelKey: 'appointments:detail.status.scheduled', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'completed', labelKey: 'appointments:detail.status.completed', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'cancelled', labelKey: 'appointments:detail.status.cancelled', color: 'bg-red-100 text-red-800 border-red-300' },
  { value: 'no_show', labelKey: 'appointments:detail.status.no_show', color: 'bg-orange-100 text-orange-800 border-orange-300' },
];

export default function AppointmentDetailDialog({
  isOpen,
  onClose,
  appointment,
  onUpdated,
  onEdit,
}: AppointmentDetailDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!appointment) return null;

  const handleGoToPatient = () => {
    onClose();
    navigate(`/hasta/${appointment.patient}`);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === appointment.status) return;
    setLoading(true);
    try {
      await updateAppointment(appointment.id, { status: newStatus });
      onUpdated?.();
      onClose();
    } catch {
      // silently fail for now
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteAppointment(appointment.id);
      onUpdated?.();
      onClose();
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setConfirmDelete(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const opt = STATUS_OPTIONS.find((s) => s.value === status);
    if (!opt) return <Badge variant="outline">{status}</Badge>;
    return <Badge className={`${opt.color} border-none`}>{t(opt.labelKey)}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setConfirmDelete(false); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{t('appointments:detail.title')}</span>
            {getStatusBadge(appointment.status)}
          </DialogTitle>
          <DialogDescription>
            {t('appointments:detail.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div className="space-y-1">
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-4 h-4" /> {t('appointments:detail.fields.date')}
              </div>
              <div className="font-medium text-gray-900">
                {formatDate(appointment.date)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-4 h-4" /> {t('appointments:detail.fields.time')}
              </div>
              <div className="font-medium text-gray-900">
                {formatTimeStr(appointment.time)}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500">{t('appointments:detail.fields.patient')}</p>
                <p className="font-medium text-gray-900">{appointment.patient_name}</p>
                <p className="text-sm text-gray-600">{appointment.patient_phone}</p>
              </div>
            </div>

            {appointment.doctor_name && (
              <div className="flex items-start gap-3">
                <Stethoscope className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">{t('appointments:detail.fields.doctor')}</p>
                  <p className="font-medium text-gray-900">{appointment.doctor_name}</p>
                </div>
              </div>
            )}

            {(appointment.treatment_type_name || appointment.notes) && (
              <div className="pt-3 border-t space-y-3">
                {appointment.treatment_type_name && (
                  <div className="flex items-start gap-3">
                    <Activity className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">{t('appointments:detail.fields.treatment')}</p>
                      <p className="text-gray-900">{appointment.treatment_type_name}</p>
                    </div>
                  </div>
                )}
                
                {appointment.notes && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">{t('appointments:detail.fields.notes')}</p>
                      <p className="text-gray-900 text-sm">{appointment.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status Change Buttons */}
          <div className="pt-3 border-t">
            <p className="text-sm text-gray-500 mb-2">{t('appointments:detail.change_status')}</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  disabled={loading || opt.value === appointment.status}
                  onClick={() => handleStatusChange(opt.value)}
                  className={`px-3 py-1.5 rounded-md text-sm border transition-all ${
                    opt.value === appointment.status
                      ? `${opt.color} font-semibold ring-2 ring-offset-1 ring-gray-300`
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  } disabled:opacity-50`}
                >
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-4 border-t">
          <Button
            variant="destructive"
            size="sm"
            className="bg-red-600 hover:bg-red-700 shadow-sm shadow-red-100"
            onClick={() => setConfirmDelete(true)}
            disabled={loading}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            {t('appointments:detail.actions.delete')}
          </Button>
          
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => appointment && onEdit(appointment)}>
              {t('appointments:detail.actions.edit')}
            </Button>
          )}
          
          <Button variant="outline" size="sm" onClick={() => { setConfirmDelete(false); onClose(); }}>{t('appointments:detail.actions.close')}</Button>
          
          <Button size="sm" onClick={handleGoToPatient} className="bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-100 px-1">
            {t('appointments:detail.actions.go_to_patient')}
          </Button>
        </div>
      </DialogContent>

      {/* Silme Onayı Diyaloğu */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('appointments:detail.delete_dialog.title')}</DialogTitle>
            <DialogDescription>
              {t('appointments:detail.delete_dialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>{t('appointments:detail.delete_dialog.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? t('appointments:detail.delete_dialog.deleting') : t('appointments:detail.delete_dialog.confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
