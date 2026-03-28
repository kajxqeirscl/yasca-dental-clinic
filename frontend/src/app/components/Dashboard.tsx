import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calendar, Users, Clock, CheckCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { fetchDashboardToday } from '../services/api';
import AppointmentDetailDialog from './AppointmentDetailDialog';

interface TodayAppointment {
  id: number;
  date: string;
  time: string;
  duration: number;
  patient_name: string;
  patient_phone: string;
  patient: number;
  doctor: number;
  treatment_type: string;
  status: string;
  notes?: string;
}

interface DashboardData {
  today_appointments: TodayAppointment[];
  today_total: number;
  today_completed: number;
  total_patients: number;
}

type FilterStatus = 'all' | 'completed' | 'scheduled';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<TodayAppointment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>(() => {
    return (localStorage.getItem('dashboardAppointmentFilter') as FilterStatus) || 'all';
  });

  const handleFilterChange = (newFilter: FilterStatus) => {
    setFilter(newFilter);
    localStorage.setItem('dashboardAppointmentFilter', newFilter);
  };

  const loadData = () => {
    setLoading(true);
    fetchDashboardToday()
      .then(setData)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Veri yüklenemedi');
        setData(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
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
  // Included gelmedi (no_show) and scheduled in waiting list according to user logic 
  const waitingToday = appointments.filter((a) => a.status === 'scheduled' || a.status === 'no_show').length;
  const totalPatients = data?.total_patients ?? 0;

  // Filter logic
  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    return apt.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 border-none">Planlandı</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-none">Tamamlandı</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-none">İptal</Badge>;
      case 'no_show':
        return <Badge className="bg-orange-100 text-orange-800 border-none">Gelmedi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 hover:bg-green-100 border-l-green-400';
      case 'cancelled': return 'bg-red-50 hover:bg-red-100 border-l-red-400';
      case 'no_show': return 'bg-orange-50 hover:bg-orange-100 border-l-orange-400';
      default: return 'bg-blue-50 hover:bg-blue-100 border-l-blue-400';
    }
  };

  const formatTime = (t: string) => (t ? t.slice(0, 5) : '');

  const handleAppointmentClick = (apt: TodayAppointment) => {
    setSelectedAppointment(apt);
    setDetailOpen(true);
  };

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
            <p className="text-xs text-gray-500 mt-1">Bugün için (Planlanan + Gelmedi)</p>
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
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Bugünün Randevuları</CardTitle>
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <Button 
                variant={filter === 'all' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => handleFilterChange('all')}
                className="text-xs px-3 h-8"
              >
                Tümü
              </Button>
              <Button 
                variant={filter === 'completed' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => handleFilterChange('completed')}
                className="text-xs px-3 h-8"
              >
                Tamamlanan
              </Button>
              <Button 
                variant={filter === 'scheduled' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => handleFilterChange('scheduled')}
                className="text-xs px-3 h-8"
              >
                Planlanan
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Filtreye uygun randevu bulunmuyor.
              </div>
            ) : (
              filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className={`flex items-center justify-between p-4 rounded-lg border-l-4 cursor-pointer transition-colors ${getStatusBg(appointment.status)}`}
                  onClick={() => handleAppointmentClick(appointment)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg shadow-sm">
                      <Clock className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{formatTime(appointment.time)}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-900">{appointment.patient_name}</span>
                      </div>
                      {(appointment.treatment_type || appointment.notes) && (
                        <p className="text-sm text-gray-600 mt-0.5 truncate max-w-md">
                          {appointment.treatment_type || appointment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(appointment.status)}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AppointmentDetailDialog
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        appointment={selectedAppointment}
        onUpdated={loadData}
      />
    </div>
  );
}
