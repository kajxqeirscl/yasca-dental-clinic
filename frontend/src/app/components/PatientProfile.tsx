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
  Clock,
  FileText,
  AlertCircle,
  Stethoscope,
  Plus,
  CreditCard,
} from 'lucide-react';
import { Badge } from './ui/badge';
import DentalChart from './DentalChart';
import PatientDialog from './PatientDialog';
import AppointmentDetailDialog from './AppointmentDetailDialog';
import TreatmentAddDialog from './TreatmentAddDialog';
import PaymentDialog from './PaymentDialog';
import { fetchPatient, fetchTreatments, fetchPatientAppointments, fetchPayments, fetchPatientDocuments, uploadDocument, deleteDocument } from '../services/api';

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
  status: string;
}

interface Payment {
  id: number;
  amount: string;
  description: string;
  payment_date: string;
}

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
  notes?: string;
  treatment_type?: string;
}

interface PatientDocument {
  id: number;
  name: string;
  file_url: string;
  file_size: number;
  uploaded_by_name: string;
  created_at: string;
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
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('patientProfileActiveTab') || 'bilgiler';
  });
  const [patient, setPatient] = useState<PatientData | null>(null);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    localStorage.setItem('patientProfileActiveTab', val);
  };
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [isEditPatientOpen, setIsEditPatientOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isTreatmentAddOpen, setIsTreatmentAddOpen] = useState(false);
  const [isPaymentAddOpen, setIsPaymentAddOpen] = useState(false);
  const [selectedToothForTreatment, setSelectedToothForTreatment] = useState<number | ''>('');

  const loadData = () => {
    if (!id) return;
    setLoading(true);
    setError('');
    Promise.all([
      fetchPatient(id),
      fetchTreatments(id),
      fetchPatientAppointments(id),
      fetchPayments(id),
      fetchPatientDocuments(Number(id)),
    ])
      .then(([p, t, a, pay, docs]) => {
        setPatient(p);
        setTreatments(t);
        setAppointments(a);
        setPayments(pay);
        setDocuments(docs);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Hasta bilgisi yüklenemedi');
        setPatient(null);
        setTreatments([]);
        setAppointments([]);
        setPayments([]);
        setDocuments([]);
      })
      .finally(() => setLoading(false));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !id) return;
    const file = e.target.files[0];
    setUploadingDoc(true);
    try {
      await uploadDocument(Number(id), file.name, file);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Dosya yüklenemedi');
    } finally {
      setUploadingDoc(false);
      // Input'u sıfırlamak için
      e.target.value = '';
    }
  };

  const handleFileDelete = async (docId: number) => {
    if (!confirm('Bu dokümanı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteDocument(docId);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Silinemedi');
    }
  };

  useEffect(() => {
    loadData();
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

  const handleAppointmentClick = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/hastalar')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl text-gray-900">{patient.full_name}</h2>
          <p className="text-gray-500">Hasta ID: #{id}</p>
        </div>
        <Button onClick={() => setIsEditPatientOpen(true)}>
          Profili Düzenle
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="bilgiler">Profil Bilgileri</TabsTrigger>
          <TabsTrigger value="anamnez">Anamnez</TabsTrigger>
          <TabsTrigger value="randevular">Randevular</TabsTrigger>
          <TabsTrigger value="gecmis">Tedavi Geçmişi</TabsTrigger>
          <TabsTrigger value="odeme">Ödemeler</TabsTrigger>
          <TabsTrigger value="dokumanlar">Dokümanlar</TabsTrigger>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="randevular" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tüm Randevular</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {appointments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Henüz randevu kaydı bulunmuyor.
                  </div>
                ) : (
                  appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleAppointmentClick(appointment)}
                    >
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg shrink-0">
                        <Clock className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-gray-900 font-semibold">
                                {new Date(appointment.date).toLocaleDateString('tr-TR')}
                              </h4>
                              <span className="text-gray-400">•</span>
                              <span className="text-blue-600 text-sm font-medium">
                                {appointment.time.substring(0, 5)}
                              </span>
                            </div>
                            {(appointment.treatment_type || appointment.notes) && (
                              <p className="text-sm text-gray-500 mt-1 truncate max-w-sm">
                                {appointment.treatment_type || appointment.notes}
                              </p>
                            )}
                          </div>
                          {getStatusBadge(appointment.status)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gecmis">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tedavi Geçmişi</CardTitle>
                <Button size="sm" onClick={() => setIsTreatmentAddOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Tedavi Ekle
                </Button>
              </div>
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
                        <Stethoscope className="w-6 h-6 text-blue-600" />
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
                          <div className="flex items-center gap-2">
                            {treatment.tooth_number && (
                              <Badge variant="outline">Diş: {treatment.tooth_number}</Badge>
                            )}
                            <Badge className={treatment.status === 'completed' ? 'bg-green-100 text-green-800 border-none' : 'bg-yellow-100 text-yellow-800 border-none'}>
                              {treatment.status === 'completed' ? 'Tamamlandı' : 'Yapılacak'}
                            </Badge>
                          </div>
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

        {/* Ödemeler Tab */}
        <TabsContent value="odeme">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ödemeler</CardTitle>
                <Button size="sm" onClick={() => setIsPaymentAddOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Ödeme Ekle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Henüz ödeme kaydı bulunmuyor.
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Toplam */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-sm font-medium text-blue-800">Toplam Ödeme</span>
                    <span className="text-lg font-bold text-blue-900">
                      {payments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </span>
                  </div>
                  {payments.map((pay) => (
                    <div key={pay.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg shrink-0">
                          <CreditCard className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {parseFloat(pay.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                          </p>
                          {pay.description && (
                            <p className="text-sm text-gray-500">{pay.description}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(pay.payment_date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="odontogram">
          <Card>
            <CardHeader>
              <CardTitle>Diş Şeması (Odontogram)</CardTitle>
              <p className="text-sm text-gray-500 mt-2">
                Dişlere tıklayarak kısa yoldan tedavi ekleyebilirsiniz.
              </p>
            </CardHeader>
            <CardContent>
              <DentalChart onToothSelect={(toothNum) => {
                setSelectedToothForTreatment(toothNum);
                setIsTreatmentAddOpen(true);
              }} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dokümanlar Tab */}
        <TabsContent value="dokumanlar">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Hasta Dokümanları</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Röntgen, tahlil vb. dosyalar</p>
                </div>
                <div>
                  <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-1" /> {uploadingDoc ? 'Yükleniyor...' : 'Yeni Dosya Yükle'}
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploadingDoc}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Henüz bir doküman yüklenmemiş.
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-blue-500" />
                        <div>
                          <a href={`http://localhost:8000${doc.file_url}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium text-sm">
                            {doc.name}
                          </a>
                          <div className="text-xs text-gray-500 mt-1">
                            {(doc.file_size / 1024).toFixed(2)} KB • {new Date(doc.created_at).toLocaleDateString()} • Yükleyen: {doc.uploaded_by_name || 'Bilinmiyor'}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleFileDelete(doc.id)} className="text-red-600 border-red-200 hover:bg-red-50">
                        Sil
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <PatientDialog
        isOpen={isEditPatientOpen}
        onClose={() => setIsEditPatientOpen(false)}
        onSuccess={loadData}
        patientId={patient.id}
        initialData={patient}
      />

      <AppointmentDetailDialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        appointment={selectedAppointment}
        onUpdated={loadData}
      />

      <TreatmentAddDialog
        isOpen={isTreatmentAddOpen}
        onClose={() => { setIsTreatmentAddOpen(false); setSelectedToothForTreatment(''); }}
        patientId={patient.id}
        onSuccess={loadData}
        initialToothNumber={selectedToothForTreatment}
      />

      <PaymentDialog
        isOpen={isPaymentAddOpen}
        onClose={() => setIsPaymentAddOpen(false)}
        patientId={patient.id}
        onSuccess={loadData}
      />
    </div>
  );
}
