import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  ArrowLeft,
  Phone,
  IdCard,
  MapPin,
  Calendar,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Badge } from './ui/badge';
import DentalChart from './DentalChart';
import { fetchPatient, fetchTreatments } from '../services/api';

interface Anamnesis {
  medical_history: string;
  allergies: string;
  medications: string;
  chronic_diseases: string;
  surgical_history: string;
  family_history: string;
  smoking: string;
  alcohol: string;
  pregnancy_status: string;
  other_notes: string;
}

interface Treatment {
  id: number;
  date: string;
  treatment_type_name: string;
  treatment_name: string;
  tooth_number: string;
  doctor_name: string;
  notes: string;
}

interface PatientData {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  tckn: string;
  birth_date: string | null;
  address: string;
  notes: string;
  anamnesis?: Anamnesis;
}

const defaultAnamnesis: Anamnesis = {
  medical_history: '',
  allergies: '',
  medications: '',
  chronic_diseases: '',
  surgical_history: '',
  family_history: '',
  smoking: '',
  alcohol: '',
  pregnancy_status: '',
  other_notes: '',
};

export default function PatientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bilgiler');
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    Promise.all([fetchPatient(id), fetchTreatments(id)])
      .then(([p, t]) => {
        setPatient(p);
        setTreatments(t);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Hasta bilgisi yüklenemedi');
        setPatient(null);
        setTreatments([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="icon" onClick={() => navigate('/hastalar')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="p-4 bg-red-50 text-red-700 rounded-md">{error || 'Hasta bulunamadı'}</div>
      </div>
    );
  }

  const anam = patient.anamnesis ?? defaultAnamnesis;
  const treatmentName = (t: Treatment) => t.treatment_type_name || t.treatment_name || '-';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/hastalar')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-2xl text-gray-900">{patient.full_name}</h2>
          <p className="text-gray-500">Hasta ID: #{id}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="bilgiler">Profil Bilgileri</TabsTrigger>
          <TabsTrigger value="anamnez">Anamnez</TabsTrigger>
          <TabsTrigger value="gecmis">Tedavi Geçmişi</TabsTrigger>
          <TabsTrigger value="odontogram">Diş Şeması</TabsTrigger>
        </TabsList>

        <TabsContent value="bilgiler" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kişisel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Telefon</p>
                      <p className="text-gray-900">{patient.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <IdCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">TC Kimlik No</p>
                      <p className="text-gray-900">{patient.tckn || '-'}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Doğum Tarihi</p>
                      <p className="text-gray-900">
                        {patient.birth_date
                          ? new Date(patient.birth_date).toLocaleDateString('tr-TR')
                          : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Adres</p>
                      <p className="text-gray-900">{patient.address || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {patient.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notlar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-900">{patient.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="anamnez" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Hasta Anamnezi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Tıbbi Geçmiş</h4>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {anam.medical_history || '-'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      Alerjiler
                    </h4>
                    <p className="text-gray-900 bg-red-50 p-3 rounded-lg border border-red-200">
                      {anam.allergies || '-'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Kullandığı İlaçlar</h4>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {anam.medications || '-'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Kronik Hastalıklar</h4>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {anam.chronic_diseases || '-'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Geçirdiği Ameliyatlar</h4>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {anam.surgical_history || '-'}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Aile Öyküsü</h4>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {anam.family_history || '-'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Sigara</h4>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {anam.smoking || '-'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Alkol</h4>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {anam.alcohol || '-'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Gebelik Durumu</h4>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {anam.pregnancy_status || '-'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Diğer Notlar</h4>
                    <p className="text-gray-900 bg-blue-50 p-3 rounded-lg border border-blue-200">
                      {anam.other_notes || '-'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full" disabled>
                  <FileText className="w-4 h-4 mr-2" />
                  Anamnezi Düzenle (Yakında)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gecmis">
          <Card>
            <CardHeader>
              <CardTitle>Tedavi Geçmişi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {treatments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Henüz tedavi kaydı bulunmuyor.
                  </div>
                ) : (
                  treatments.map((treatment) => (
                    <div
                      key={treatment.id}
                      className="flex gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg shrink-0">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-gray-900">{treatmentName(treatment)}</h4>
                            <p className="text-sm text-gray-500">
                              {new Date(treatment.date).toLocaleDateString('tr-TR')} •{' '}
                              {treatment.doctor_name}
                            </p>
                          </div>
                          {treatment.tooth_number && (
                            <Badge variant="outline">Diş: {treatment.tooth_number}</Badge>
                          )}
                        </div>
                        {treatment.notes && (
                          <p className="text-sm text-gray-600">{treatment.notes}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="odontogram">
          <Card>
            <CardHeader>
              <CardTitle>Diş Şeması (Odontogram)</CardTitle>
              <p className="text-sm text-gray-500 mt-2">
                Dişlere tıklayarak işlem ekleyebilirsiniz
              </p>
            </CardHeader>
            <CardContent>
              <DentalChart />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
