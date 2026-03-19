import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calendar, Users, Clock, CheckCircle } from 'lucide-react';
import { Badge } from './ui/badge';

// Mock data
const todayAppointments = [
  { id: 1, time: '09:00', patient: 'Ahmet Yılmaz', treatment: 'Kontrol', status: 'tamamlandı' },
  { id: 2, time: '10:00', patient: 'Ayşe Demir', treatment: 'Dolgu', status: 'bekliyor' },
  { id: 3, time: '11:30', patient: 'Mehmet Kaya', treatment: 'Kanal Tedavisi', status: 'bekliyor' },
  { id: 4, time: '14:00', patient: 'Fatma Şahin', treatment: 'Diş Temizliği', status: 'bekliyor' },
  { id: 5, time: '15:30', patient: 'Ali Öz', treatment: 'Dolgu', status: 'bekliyor' },
];

export default function Dashboard() {
  const completedToday = todayAppointments.filter(a => a.status === 'tamamlandı').length;
  const waitingToday = todayAppointments.filter(a => a.status === 'bekliyor').length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl text-gray-900">Hoş Geldiniz</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Bugünkü Randevular</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900">{todayAppointments.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {completedToday} tamamlandı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Bekleyen Hastalar</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900">{waitingToday}</div>
            <p className="text-xs text-gray-500 mt-1">
              Bugün için
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Toplam Hasta</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900">247</div>
            <p className="text-xs text-gray-500 mt-1">
              Aktif kayıtlar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Bugünün Randevuları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todayAppointments.map((appointment) => (
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
                      <span className="text-blue-600">{appointment.time}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-900">{appointment.patient}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{appointment.treatment}</p>
                  </div>
                </div>
                <Badge
                  variant={appointment.status === 'tamamlandı' ? 'default' : 'secondary'}
                  className={
                    appointment.status === 'tamamlandı'
                      ? 'bg-green-100 text-green-700 hover:bg-green-100'
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                  }
                >
                  {appointment.status === 'tamamlandı' ? 'Tamamlandı' : 'Bekliyor'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
