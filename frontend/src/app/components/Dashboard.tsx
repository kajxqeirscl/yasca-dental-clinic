import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calendar, Users, Clock, CheckCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { fetchDashboardToday } from '../services/api';

interface TodayAppointment {
  id: number;
  time: string;
  patient_name: string;
  patient_phone: string;
  treatment_type: string;
  status: string;
}

interface DashboardData {
  today_appointments: TodayAppointment[];
  today_total: number;
  today_completed: number;
  total_patients: number;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardToday()
      .then(setData)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Veri yüklenemedi');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl text-gray-900">Hoş Geldiniz</h2>
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl text-gray-900">Hoş Geldiniz</h2>
        <div className="p-4 bg-red-50 text-red-700 rounded-md">{error}</div>
      </div>
    );
  }

  const appointments = data?.today_appointments ?? [];
  const completedToday = data?.today_completed ?? 0;
  const waitingToday = appointments.filter((a) => a.status !== 'completed').length;
  const totalPatients = data?.total_patients ?? 0;

  const getStatusLabel = (status: string) => {
    if (status === 'completed') return 'Tamamlandı';
    return 'Bekliyor';
  };

  const formatTime = (t: string) => (t ? t.slice(0, 5) : ''); // "09:00:00" -> "09:00"

  return (
    <div className="space-y-6">
      <h2 className="text-2xl text-gray-900">Hoş Geldiniz</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Bugünkü Randevular</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900">{appointments.length}</div>
            <p className="text-xs text-gray-500 mt-1">{completedToday} tamamlandı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Bekleyen Hastalar</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900">{waitingToday}</div>
            <p className="text-xs text-gray-500 mt-1">Bugün için</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Toplam Hasta</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900">{totalPatients}</div>
            <p className="text-xs text-gray-500 mt-1">Aktif kayıtlar</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bugünün Randevuları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Bugün için randevu bulunmuyor.
              </div>
            ) : (
              appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600">{formatTime(appointment.time)}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-900">{appointment.patient_name}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {appointment.treatment_type || 'Kontrol'}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      appointment.status === 'completed' ? 'default' : 'secondary'
                    }
                    className={
                      appointment.status === 'completed'
                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                        : 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                    }
                  >
                    {getStatusLabel(appointment.status)}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
