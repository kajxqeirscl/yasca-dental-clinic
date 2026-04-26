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
import { Calendar, Clock, User, Stethoscope, FileText, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { updateAppointment, deleteAppointment } from '../services/api';

interface Appointment {
  id: number;
  date: string;
  time: string;
  patient_name: string;
  patient_phone: string;
  patient: number;
  doctor: number;
  status: string;
  notes?: string;
  treatment_type?: string;
}

interface AppointmentDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onUpdated?: () => void;
}

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Planlandı', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'completed', label: 'Tamamlandı', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'cancelled', label: 'İptal', color: 'bg-red-100 text-red-800 border-red-300' },
  { value: 'no_show', label: 'Gelmedi', color: 'bg-orange-100 text-orange-800 border-orange-300' },
];

export default function AppointmentDetailDialog({
  isOpen,
  onClose,
  appointment,
  onUpdated,
}: AppointmentDetailDialogProps) {
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
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
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
    return <Badge className={`${opt.color} border-none`}>{opt.label}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setConfirmDelete(false); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Randevu Detayı</span>
            {getStatusBadge(appointment.status)}
          </DialogTitle>
          <DialogDescription>
            Randevu bilgilerini inceleyebilir, durumunu değiştirebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div className="space-y-1">
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Tarih
              </div>
              <div className="font-medium text-gray-900">
                {new Date(appointment.date).toLocaleDateString('tr-TR')}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-4 h-4" /> Saat
              </div>
              <div className="font-medium text-gray-900">
                {appointment.time.substring(0, 5)}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Hasta</p>
                <p className="font-medium text-gray-900">{appointment.patient_name}</p>
                <p className="text-sm text-gray-600">{appointment.patient_phone}</p>
              </div>
            </div>

            {(appointment.treatment_type || appointment.notes) && (
              <div className="pt-3 border-t space-y-3">
                {appointment.treatment_type && (
                  <div className="flex items-start gap-3">
                    <Stethoscope className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">İşlem</p>
                      <p className="text-gray-900">{appointment.treatment_type}</p>
                    </div>
                  </div>
                )}
                
                {appointment.notes && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Notlar</p>
                      <p className="text-gray-900 text-sm">{appointment.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status Change Buttons */}
          <div className="pt-3 border-t">
            <p className="text-sm text-gray-500 mb-2">Durumu Değiştir</p>
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
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${confirmDelete ? 'bg-red-50' : ''}`}
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            {confirmDelete ? 'Emin misiniz?' : 'Sil'}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setConfirmDelete(false); onClose(); }}>Kapat</Button>
            <Button onClick={handleGoToPatient} className="bg-blue-600 hover:bg-blue-700">
              Hasta Profili
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
