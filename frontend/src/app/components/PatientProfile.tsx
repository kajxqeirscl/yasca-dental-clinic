import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowLeft, Phone, IdCard, MapPin, Calendar, FileText, AlertCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import DentalChart from './DentalChart';

// Mock patient data
const patientData = {
  id: 1,
  name: 'Ahmet Yılmaz',
  phone: '0532 123 4567',
  tckn: '12345678901',
  address: 'Atatürk Mah. Cumhuriyet Cad. No:45 Daire:3 Ankara',
  birthDate: '1985-05-15',
  notes: 'Penisilin alerjisi var',
  anamnesis: {
    medicalHistory: 'Hipertansiyon tedavisi görüyor',
    allergies: 'Penisilin',
    medications: 'Ramipril 5mg (günde 1 kez)',
    chronicDiseases: 'Hipertansiyon',
    surgicalHistory: 'Apandisit (2010)',
    familyHistory: 'Annede diyabet',
    smoking: 'Evet, günde 10 adet',
    alcohol: 'Hayır',
    pregnancyStatus: 'Uygulanmaz',
    otherNotes: 'Dental anksiyetesi var, işlemler öncesi bilgilendirme yapılmalı',
  },
  treatments: [
    { id: 1, date: '2025-12-10', treatment: 'Dolgu', tooth: '16', doctor: 'Dr. Ayşe Kaya', notes: 'Kompozit dolgu yapıldı' },
    { id: 2, date: '2025-11-20', treatment: 'Kanal Tedavisi', tooth: '26', doctor: 'Dr. Mehmet Demir', notes: 'İlk seans tamamlandı' },
    { id: 3, date: '2025-10-15', treatment: 'Diş Temizliği', tooth: '-', doctor: 'Dr. Ayşe Kaya', notes: 'Yıllık kontrol' },
    { id: 4, date: '2025-09-05', treatment: 'Dolgu', tooth: '36', doctor: 'Dr. Ayşe Kaya', notes: 'Amalgam dolgu yapıldı' },
  ],
};

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bilgiler');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/hastalar')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl text-gray-900">{patientData.name}</h2>
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
                      <p className="text-gray-900">{patientData.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <IdCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">TC Kimlik No</p>
                      <p className="text-gray-900">{patientData.tckn}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Doğum Tarihi</p>
                      <p className="text-gray-900">
                        {new Date(patientData.birthDate).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Adres</p>
                      <p className="text-gray-900">{patientData.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-900">{patientData.notes}</p>
              </div>
            </CardContent>
          </Card>
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
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{patientData.anamnesis.medicalHistory}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      Alerjiler
                    </h4>
                    <p className="text-gray-900 bg-red-50 p-3 rounded-lg border border-red-200">{patientData.anamnesis.allergies}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Kullandığı İlaçlar</h4>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{patientData.anamnesis.medications}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Kronik Hastalıklar</h4>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{patientData.anamnesis.chronicDiseases}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Geçirdiği Ameliyatlar</h4>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{patientData.anamnesis.surgicalHistory}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Aile Öyküsü</h4>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{patientData.anamnesis.familyHistory}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Sigara Kullanımı</h4>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{patientData.anamnesis.smoking}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Alkol Kullanımı</h4>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{patientData.anamnesis.alcohol}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Gebelik Durumu</h4>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{patientData.anamnesis.pregnancyStatus}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Diğer Notlar</h4>
                    <p className="text-gray-900 bg-blue-50 p-3 rounded-lg border border-blue-200">{patientData.anamnesis.otherNotes}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Anamnezi Düzenle
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
                {patientData.treatments.map((treatment) => (
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
                          <h4 className="text-gray-900">{treatment.treatment}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(treatment.date).toLocaleDateString('tr-TR')} • {treatment.doctor}
                          </p>
                        </div>
                        {treatment.tooth !== '-' && (
                          <Badge variant="outline">Diş: {treatment.tooth}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{treatment.notes}</p>
                    </div>
                  </div>
                ))}
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