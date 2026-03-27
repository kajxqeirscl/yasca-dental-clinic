import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AppointmentDialog from './AppointmentDialog';
import { fetchAppointments } from '../services/api';

type ViewMode = 'daily' | 'weekly';

interface Appointment {
  id: number;
  date: string;
  time: string;
  duration: number;
  patient_name: string;
  patient_phone: string;
  patient: number;
  doctor: number;
  status: string;
}

export default function AppointmentCalendar() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hours = Array.from({ length: 10 }, (_, i) => i + 9);

  const getWeekDays = () => {
    const days = [];
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - current.getDay() + 1);
    for (let i = 0; i < 5; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const weekDays = getWeekDays();

  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const formatTime = (hour: number) => `${hour.toString().padStart(2, '0')}:00`;

  const formatDisplayDate = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'short',
      weekday: 'short',
    }).format(date);
  };

  const loadAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const start = viewMode === 'weekly' ? weekDays[0] : selectedDate;
      const end = viewMode === 'weekly' ? weekDays[4] : selectedDate;
      const all: Appointment[] = [];
      const current = new Date(start);
      while (current <= end) {
        const data = await fetchAppointments(formatDate(current));
        all.push(...data);
        current.setDate(current.getDate() + 1);
      }
      setAppointments(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Randevular yüklenemedi');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [selectedDate, viewMode]);

  const getAppointmentsForSlot = (date: Date, hour: number) => {
    const dateStr = formatDate(date);
    const timeStr = formatTime(hour);
    return appointments.filter(
      (apt) => apt.date === dateStr && apt.time.startsWith(timeStr)
    );
  };

  const handleSlotClick = (date: Date, hour: number) => {
    setSelectedSlot({
      date: formatDate(date),
      time: formatTime(hour),
    });
    setIsDialogOpen(true);
  };

  const handleAppointmentClick = (apt: Appointment) => {
    navigate(`/hasta/${apt.patient}`);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(newDate);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl text-gray-900">Randevu Takvimi</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'daily' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('daily')}
            >
              Günlük
            </Button>
            <Button
              variant={viewMode === 'weekly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('weekly')}
            >
              Haftalık
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>
            {viewMode === 'weekly'
              ? `${formatDisplayDate(weekDays[0])} - ${formatDisplayDate(weekDays[4])}`
              : formatDisplayDate(selectedDate)}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
            >
              Bugün
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          {viewMode === 'weekly' ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 bg-gray-50 w-20 sticky left-0 z-10">Saat</th>
                    {weekDays.map((day, idx) => (
                      <th key={idx} className="border p-2 bg-gray-50 min-w-36">
                        {formatDisplayDate(day)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hours.map((hour) => (
                    <tr key={hour}>
                      <td className="border p-2 bg-gray-50 text-center text-sm sticky left-0 z-10">
                        {formatTime(hour)}
                      </td>
                      {weekDays.map((day, idx) => {
                        const slotAppointments = getAppointmentsForSlot(day, hour);
                        return (
                          <td
                            key={idx}
                            className="border p-1 h-20 align-top cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleSlotClick(day, hour)}
                          >
                            {slotAppointments.map((apt) => (
                              <div
                                key={apt.id}
                                className="bg-blue-100 border border-blue-300 rounded p-2 mb-1 text-sm hover:bg-blue-200 transition-colors cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAppointmentClick(apt);
                                }}
                              >
                                <div className="text-blue-900">{apt.patient_name}</div>
                                <div className="text-xs text-blue-700">{apt.patient_phone}</div>
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-2">
              {hours.map((hour) => {
                const slotAppointments = getAppointmentsForSlot(selectedDate, hour);
                return (
                  <div
                    key={hour}
                    className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleSlotClick(selectedDate, hour)}
                  >
                    <div className="w-20 shrink-0 text-gray-600">{formatTime(hour)}</div>
                    <div className="flex-1">
                      {slotAppointments.length > 0 ? (
                        slotAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            className="bg-blue-100 border border-blue-300 rounded p-3 mb-2 cursor-pointer hover:bg-blue-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAppointmentClick(apt);
                            }}
                          >
                            <div className="text-blue-900">{apt.patient_name}</div>
                            <div className="text-sm text-blue-700">{apt.patient_phone}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 text-sm">Boş</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AppointmentDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        selectedSlot={selectedSlot}
        onSuccess={loadAppointments}
      />
    </div>
  );
}
