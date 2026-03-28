import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AppointmentDialog from './AppointmentDialog';
import AppointmentDetailDialog from './AppointmentDetailDialog';
import { fetchAppointments, fetchClinicSettings } from '../services/api';

type ViewMode = 'daily' | 'weekly';

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

interface ClinicSettings {
  work_start_time: string;
  work_end_time: string;
  work_days: string[];
}

export default function AppointmentCalendar() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('calendarViewMode') as ViewMode) || 'weekly';
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Clinic settings driven hours
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(18);
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);

  // Load clinic settings once
  useEffect(() => {
    fetchClinicSettings()
      .then((settings: ClinicSettings) => {
        if (settings.work_start_time) {
          setStartHour(parseInt(settings.work_start_time.split(':')[0], 10));
        }
        if (settings.work_end_time) {
          setEndHour(parseInt(settings.work_end_time.split(':')[0], 10));
        }
        if (settings.work_days && settings.work_days.length > 0) {
          setWorkDays(settings.work_days.map(Number));
        }
      })
      .catch(() => {
        // Fallback defaults already set
      });
  }, []);

  const hours = Array.from({ length: endHour - startHour }, (_, i) => i + startHour);

  const getWeekDays = () => {
    const days: Date[] = [];
    const current = new Date(selectedDate);
    // Go to Monday of this week
    const dayOfWeek = current.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    current.setDate(current.getDate() + diff);
    for (let i = 0; i < 7; i++) {
      const d = new Date(current);
      // JS getDay: 0=Sun, 1=Mon... our workDays: 1=Mon,...6=Sat, 0=Sun
      const jsDay = d.getDay();
      const mapped = jsDay === 0 ? 0 : jsDay; // 0=Sun, 1=Mon match
      if (workDays.includes(mapped)) {
        days.push(d);
      }
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
      const daysToFetch = viewMode === 'weekly' ? weekDays : [selectedDate];
      const all: Appointment[] = [];
      for (const day of daysToFetch) {
        const data = await fetchAppointments(formatDate(day));
        all.push(...data);
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
  }, [selectedDate, viewMode, startHour, endHour]);

  // Group appointments by the hour they fall under
  const getAppointmentsForSlot = (date: Date, hour: number) => {
    const dateStr = formatDate(date);
    return appointments.filter((apt) => {
      if (apt.date !== dateStr) return false;
      const aptHour = parseInt(apt.time.split(':')[0], 10);
      return aptHour === hour;
    });
  };

  const handleSlotClick = (date: Date, hour: number) => {
    setSelectedSlot({
      date: formatDate(date),
      time: formatTime(hour),
    });
    setIsDialogOpen(true);
  };

  const handleAppointmentClick = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setDetailDialogOpen(true);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    const amount = viewMode === 'daily' ? 1 : 7;
    newDate.setDate(newDate.getDate() + (direction === 'next' ? amount : -amount));
    setSelectedDate(newDate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 border-green-300 text-green-900';
      case 'cancelled': return 'bg-red-100 border-red-300 text-red-900';
      case 'no_show': return 'bg-orange-100 border-orange-300 text-orange-900';
      default: return 'bg-blue-100 border-blue-300 text-blue-900';
    }
  };

  const renderAppointmentCard = (apt: Appointment, compact: boolean = false) => (
    <div
      key={apt.id}
      className={`${getStatusColor(apt.status)} border rounded p-1.5 mb-1 text-xs hover:opacity-80 transition-opacity cursor-pointer`}
      onClick={(e) => {
        e.stopPropagation();
        handleAppointmentClick(apt);
      }}
    >
      <div className="font-medium truncate">{apt.patient_name}</div>
      {!compact && (
        <div className="text-[11px] opacity-75">{apt.time.substring(0, 5)}</div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl text-gray-900">Randevu Takvimi</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'daily' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { setViewMode('daily'); localStorage.setItem('calendarViewMode', 'daily'); }}
            >
              Günlük
            </Button>
            <Button
              variant={viewMode === 'weekly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { setViewMode('weekly'); localStorage.setItem('calendarViewMode', 'weekly'); }}
            >
              Haftalık
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>
            {viewMode === 'weekly' && weekDays.length >= 2
              ? `${formatDisplayDate(weekDays[0])} - ${formatDisplayDate(weekDays[weekDays.length - 1])}`
              : formatDisplayDate(selectedDate)}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
            >
              Bugün
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-4 text-gray-500 text-sm">Yükleniyor...</div>
          )}
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
                  {hours.map((hour) => {
                    // Find max appointments in any cell this row for dynamic height
                    const maxInRow = Math.max(
                      1,
                      ...weekDays.map((day) => getAppointmentsForSlot(day, hour).length)
                    );
                    const rowMinHeight = Math.max(56, maxInRow * 40 + 8);

                    return (
                      <tr key={hour}>
                        <td
                          className="border p-2 bg-gray-50 text-center text-sm sticky left-0 z-10"
                          style={{ minHeight: `${rowMinHeight}px` }}
                        >
                          {formatTime(hour)}
                        </td>
                        {weekDays.map((day, idx) => {
                          const slotAppointments = getAppointmentsForSlot(day, hour);
                          return (
                            <td
                              key={idx}
                              className="border p-1 align-top cursor-pointer hover:bg-gray-50 transition-colors"
                              style={{ minHeight: `${rowMinHeight}px`, height: `${rowMinHeight}px` }}
                              onClick={() => handleSlotClick(day, hour)}
                            >
                              {slotAppointments.map((apt) => renderAppointmentCard(apt, slotAppointments.length > 2))}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
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
                    style={{ minHeight: slotAppointments.length > 1 ? `${slotAppointments.length * 52 + 16}px` : undefined }}
                    onClick={() => handleSlotClick(selectedDate, hour)}
                  >
                    <div className="w-20 shrink-0 text-gray-600">{formatTime(hour)}</div>
                    <div className="flex-1">
                      {slotAppointments.length > 0 ? (
                        slotAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            className={`${getStatusColor(apt.status)} border rounded p-3 mb-2 cursor-pointer hover:opacity-80`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAppointmentClick(apt);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{apt.patient_name}</span>
                              <span className="text-sm opacity-75">{apt.time.substring(0, 5)}</span>
                            </div>
                             <div className="text-sm opacity-75">{apt.patient_phone}</div>
                             {(apt.treatment_type || apt.notes) && (
                               <div className="text-xs mt-1 opacity-60 truncate max-w-lg italic">
                                 {apt.treatment_type || apt.notes}
                               </div>
                             )}
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
      
      <AppointmentDetailDialog
        isOpen={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        appointment={selectedAppointment}
        onUpdated={loadAppointments}
      />
    </div>
  );
}
