import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Settings, Clock, Calendar, CheckCircle } from 'lucide-react';
import { fetchClinicSettings, updateClinicSettings } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const DAYS = [
  { value: 1, label: 'Pazartesi', short: 'Pzt' },
  { value: 2, label: 'Salı', short: 'Sal' },
  { value: 3, label: 'Çarşamba', short: 'Çar' },
  { value: 4, label: 'Perşembe', short: 'Per' },
  { value: 5, label: 'Cuma', short: 'Cum' },
  { value: 6, label: 'Cumartesi', short: 'Cmt' },
  { value: 0, label: 'Pazar', short: 'Paz' },
];

interface ClinicSettingsData {
  work_start_time: string;
  work_end_time: string;
  work_days: number[];
}

export default function ClinicSettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [settings, setSettings] = useState<ClinicSettingsData>({
    work_start_time: '09:00',
    work_end_time: '18:00',
    work_days: [1, 2, 3, 4, 5, 6],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchClinicSettings()
      .then((data: ClinicSettingsData) => {
        setSettings({
          work_start_time: data.work_start_time?.substring(0, 5) || '09:00',
          work_end_time: data.work_end_time?.substring(0, 5) || '18:00',
          work_days: data.work_days?.map(Number) || [1, 2, 3, 4, 5, 6],
        });
      })
      .catch(() => setError('Ayarlar yüklenemedi'))
      .finally(() => setLoading(false));
  }, []);

  const toggleDay = (day: number) => {
    if (!isAdmin) return;
    setSettings((prev) => ({
      ...prev,
      work_days: prev.work_days.includes(day)
        ? prev.work_days.filter((d) => d !== day)
        : [...prev.work_days, day].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b)),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const data = await updateClinicSettings({
        work_start_time: settings.work_start_time + ':00',
        work_end_time: settings.work_end_time + ':00',
        work_days: settings.work_days,
      });
      setSettings({
        work_start_time: data.work_start_time?.substring(0, 5) || settings.work_start_time,
        work_end_time: data.work_end_time?.substring(0, 5) || settings.work_end_time,
        work_days: data.work_days?.map(Number) || settings.work_days,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ayarlar kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl text-gray-900">Klinik Ayarları</h2>
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-gray-600" />
        <h2 className="text-2xl text-gray-900">Klinik Ayarları</h2>
        {!isAdmin && (
          <Badge variant="outline" className="text-orange-600 border-orange-300">
            Sadece görüntüleme
          </Badge>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Ayarlar başarıyla kaydedildi.
        </div>
      )}

      {/* Çalışma Saatleri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4" /> Çalışma Saatleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="start-time">Açılış Saati</Label>
              <input
                id="start-time"
                type="time"
                className="w-full h-10 px-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                value={settings.work_start_time}
                disabled={!isAdmin}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, work_start_time: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">Kapanış Saati</Label>
              <input
                id="end-time"
                type="time"
                className="w-full h-10 px-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                value={settings.work_end_time}
                disabled={!isAdmin}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, work_end_time: e.target.value }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Çalışma Günleri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-4 h-4" /> Çalışma Günleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const active = settings.work_days.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => toggleDay(day.value)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all
                    ${active
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                    }
                    ${!isAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Seçili günler takvimde çalışma günü olarak gösterilir.
          </p>
        </CardContent>
      </Card>

      {/* Özet */}
      <Card className="bg-gray-50">
        <CardContent className="pt-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Çalışma özeti:</span>{' '}
            {settings.work_start_time} – {settings.work_end_time} arası,{' '}
            {DAYS.filter((d) => settings.work_days.includes(d.value))
              .map((d) => d.short)
              .join(', ')}{' '}
            günleri
          </p>
        </CardContent>
      </Card>

      {isAdmin && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="px-8">
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      )}
    </div>
  );
}
