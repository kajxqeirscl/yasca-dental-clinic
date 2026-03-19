import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import AppointmentDialog from './AppointmentDialog';

// Mock appointments data
const mockAppointments = [
  { id: 1, date: '2025-12-14', time: '09:00', duration: 60, patient: 'Ahmet Yılmaz', phone: '0532 123 4567' },
  { id: 2, date: '2025-12-14', time: '10:30', duration: 60, patient: 'Ayşe Demir', phone: '0533 234 5678' },
  { id: 3, date: '2025-12-14', time: '14:00', duration: 90, patient: 'Mehmet Kaya', phone: '0534 345 6789' },
  { id: 4, date: '2025-12-15', time: '09:00', duration: 60, patient: 'Fatma Şahin', phone: '0535 456 7890' },
  { id: 5, date: '2025-12-15', time: '11:00', duration: 60, patient: 'Ali Öz', phone: '0536 567 8901' },
  { id: 6, date: '2025-12-16', time: '10:00', duration: 60, patient: 'Zeynep Aydın', phone: '0537 678 9012' },
];

type ViewMode = 'daily' | 'weekly';

export default function AppointmentCalendar() {
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);

  const hours = Array.from({ length: 10 }, (_, i) => i + 9); // 09:00 - 18:00
  
  const getWeekDays = () => {
    const days = [];
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - current.getDay() + 1); // Monday
    
    for (let i = 0; i < 5; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const weekDays = getWeekDays();

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', { 
      day: 'numeric',
      month: 'short',
      weekday: 'short' 
    }).format(date);
  };

  const getAppointmentsForSlot = (date: Date, hour: number) => {
    const dateStr = formatDate(date);
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    return mockAppointments.filter(
      apt => apt.date === dateStr && apt.time === timeStr
    );
  };

  const handleSlotClick = (date: Date, hour: number) => {
    setSelectedSlot({
      date: formatDate(date),
      time: `${hour.toString().padStart(2, '0')}:00`
    });
    setIsDialogOpen(true);
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
              : formatDisplayDate(selectedDate)
            }
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
              Bugün
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
                        {hour.toString().padStart(2, '0')}:00
                      </td>
                      {weekDays.map((day, idx) => {
                        const appointments = getAppointmentsForSlot(day, hour);
                        return (
                          <td
                            key={idx}
                            className="border p-1 h-20 align-top cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleSlotClick(day, hour)}
                          >
                            {appointments.map((apt) => (
                              <div
                                key={apt.id}
                                className="bg-blue-100 border border-blue-300 rounded p-2 mb-1 text-sm hover:bg-blue-200 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="text-blue-900">{apt.patient}</div>
                                <div className="text-xs text-blue-700">{apt.phone}</div>
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
                const appointments = getAppointmentsForSlot(selectedDate, hour);
                return (
                  <div
                    key={hour}
                    className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleSlotClick(selectedDate, hour)}
                  >
                    <div className="w-20 shrink-0 text-gray-600">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                    <div className="flex-1">
                      {appointments.length > 0 ? (
                        appointments.map((apt) => (
                          <div
                            key={apt.id}
                            className="bg-blue-100 border border-blue-300 rounded p-3 mb-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="text-blue-900">{apt.patient}</div>
                            <div className="text-sm text-blue-700">{apt.phone}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 text-sm">Boş</div>
                      )}
                    </div>
                    <Button size="sm" variant="ghost">
                      <Plus className="h-4 w-4" />
                    </Button>
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
      />
    </div>
  );
}
