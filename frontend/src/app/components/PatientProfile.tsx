import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
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
  Download,
  Trash2,
} from 'lucide-react';
import { Badge } from './ui/badge';
import DentalChart from './DentalChart';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  fetchPatient,
  updatePatient,
  fetchTreatments,
  fetchPatientAppointments,
  fetchPayments,
  fetchPatientDocuments,
  uploadDocument,
  deleteDocument,
} from '../services/api';
import AppointmentDetailDialog from './AppointmentDetailDialog';
import AppointmentDialog from './AppointmentDialog';
import TreatmentAddDialog from './TreatmentAddDialog';
import PaymentDialog from './PaymentDialog';
import { DatePicker } from './ui/date-picker';
import { formatDateDDMMYYYY } from '../utils/date';

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
  const [editedPatient, setEditedPatient] = useState<PatientData | null>(null);
  const [isDirty, setIsDirty] = useState(false);

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
  const [saveError, setSaveError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
  const [isTreatmentAddOpen, setIsTreatmentAddOpen] = useState(false);
  const [isPaymentAddOpen, setIsPaymentAddOpen] = useState(false);
  const [selectedToothForTreatment, setSelectedToothForTreatment] = useState<number | ''>('');
  const [selectedCategory, setSelectedCategory] = useState<import('./TreatmentTypesPage').TreatmentCategory | undefined>(undefined);
  const [treatmentToEdit, setTreatmentToEdit] = useState<any>(null);
  const [paymentToEdit, setPaymentToEdit] = useState<any>(null);

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
        setEditedPatient(JSON.parse(JSON.stringify(p)));
        setIsDirty(false);
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

  const [isDeletingDoc, setIsDeletingDoc] = useState<number | null>(null);

  const handleFileDelete = async (docId: number) => {
    setIsDeletingDoc(docId);
  };

  const confirmFileDelete = async () => {
    if (!isDeletingDoc) return;
    try {
      await deleteDocument(isDeletingDoc);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Silinemedi');
    } finally {
      setIsDeletingDoc(null);
    }
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && id) {
      const file = e.dataTransfer.files[0];
      setUploadingDoc(true);
      try {
        await uploadDocument(Number(id), file.name, file);
        loadData();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Dosya yüklenemedi');
      } finally {
        setUploadingDoc(false);
      }
    }
  };

  const handleFieldChange = (field: string, value: any, isAnamnesis = false) => {
    if (!editedPatient) return;
    const newData = JSON.parse(JSON.stringify(editedPatient));
    if (isAnamnesis) {
      if (!newData.anamnesis) newData.anamnesis = { ...defaultAnamnesis };
      newData.anamnesis[field] = value;
    } else {
      newData[field] = value;
    }
    setEditedPatient(newData);
    setIsDirty(true);
  };

  const validateData = () => {
    const errors: string[] = [];
    setSaveError('');
    
    if (!editedPatient) return false;

    // TCKN Validation (11 digits, numeric)
    if (editedPatient.tckn && !/^[0-9]{11}$/.test(editedPatient.tckn)) {
      errors.push('tckn');
      setSaveError('TC Kimlik No 11 haneli ve sadece rakamlardan oluşmalıdır.');
    }

    // Phone Validation (Turkish format: 05xx...)
    if (editedPatient.phone && !/^05[0-9]{9}$/.test(editedPatient.phone.replace(/\s/g, ''))) {
      errors.push('phone');
      if (!saveError) setSaveError('Telefon numarası 05xx xxx xx xx formatında olmalıdır.');
    }

    if (!editedPatient.first_name || !editedPatient.last_name) {
      if (!editedPatient.first_name) errors.push('first_name');
      if (!editedPatient.last_name) errors.push('last_name');
      if (!saveError) setSaveError('Ad ve soyad alanları boş bırakılamaz.');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSaveChanges = async () => {
    if (!editedPatient || !id) return;
    if (!validateData()) return;

    setLoading(true);
    setSaveError('');
    try {
      await updatePatient(id, {
        first_name: editedPatient.first_name,
        last_name: editedPatient.last_name,
        phone: editedPatient.phone,
        tckn: editedPatient.tckn,
        birth_date: editedPatient.birth_date || undefined,
        address: editedPatient.address,
        notes: editedPatient.notes,
        anamnesis: editedPatient.anamnesis as any
      });
      setIsDirty(false);
      setValidationErrors([]);
      loadData();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Güncellenemedi');
    } finally {
      setLoading(false);
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

  const handleEditAppointment = (apt: Appointment) => {
    setAppointmentToEdit(apt);
    setIsDetailOpen(false);
    setIsAppointmentDialogOpen(true);
  };

  const handleNewAppointment = () => {
    setAppointmentToEdit(null);
    setIsAppointmentDialogOpen(true);
  };

  const handleTreatmentEdit = (treatment: any) => {
    setTreatmentToEdit(treatment);
    setIsTreatmentAddOpen(true);
  };

  const handlePaymentEdit = (payment: any) => {
    setPaymentToEdit(payment);
    setIsPaymentAddOpen(true);
  };

  const handleNewPayment = () => {
    setPaymentToEdit(null);
    setIsPaymentAddOpen(true);
  };

  return (
    <div className="space-y-6">
      {saveError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 shadow-md animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 font-semibold">{saveError}</p>
          </div>
        </div>
      )}

      <div className="flex items-end gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <Button variant="outline" size="icon" onClick={() => navigate('/hastalar')} className="mb-1">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold ml-1">Hasta Adı</Label>
            <Input 
              value={editedPatient?.first_name || ''} 
              onChange={(e) => handleFieldChange('first_name', e.target.value)}
              className={`text-xl font-semibold h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-all ${
                validationErrors.includes('first_name') ? 'border-red-500 ring-red-100' : ''
              }`}
              placeholder="Adı girin"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold ml-1">Hasta Soyadı</Label>
            <Input 
              value={editedPatient?.last_name || ''} 
              onChange={(e) => handleFieldChange('last_name', e.target.value)}
              className={`text-xl font-semibold h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-all ${
                validationErrors.includes('last_name') ? 'border-red-500 ring-red-100' : ''
              }`}
              placeholder="Soyadı girin"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-[180px]">
          <Button 
            onClick={handleSaveChanges} 
            disabled={!isDirty || loading}
            className={`h-11 font-bold transition-all ${
              isDirty 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200' 
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </Button>
          <p className="text-[10px] text-center text-gray-400 font-medium">Hasta ID: #{id}</p>
        </div>
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
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Telefon
                    </Label>
                    <Input 
                      value={editedPatient?.phone || ''} 
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      placeholder="05xx xxx xx xx"
                      className={validationErrors.includes('phone') ? 'border-red-500 ring-red-500' : ''}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 flex items-center gap-1">
                      <IdCard className="w-3 h-3" /> TC Kimlik No
                    </Label>
                    <Input 
                      value={editedPatient?.tckn || ''} 
                      onChange={(e) => handleFieldChange('tckn', e.target.value)}
                      placeholder="11 Haneli TC No"
                      className={validationErrors.includes('tckn') ? 'border-red-500 ring-red-500' : ''}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Doğum Tarihi
                    </Label>
                    <DatePicker
                      date={editedPatient?.birth_date || undefined}
                      onDateChange={(val) => handleFieldChange('birth_date', val)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Adres
                    </Label>
                    <Textarea 
                      value={editedPatient?.address || ''} 
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Genel Notlar</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={editedPatient?.notes || ''} 
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                placeholder="Hasta hakkında genel notlar..."
                className="bg-yellow-50 border-yellow-200 text-yellow-900"
                rows={3}
              />
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
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Tıbbi Geçmiş</Label>
                    <Textarea 
                      value={editedPatient?.anamnesis?.medical_history || ''} 
                      onChange={(e) => handleFieldChange('medical_history', e.target.value, true)}
                      placeholder="Kronik hastalıklar, operasyonlar..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" /> Alerjiler
                    </Label>
                    <Textarea 
                      value={editedPatient?.anamnesis?.allergies || ''} 
                      onChange={(e) => handleFieldChange('allergies', e.target.value, true)}
                      placeholder="İlaç, gıda vb. alerjiler..."
                      className="bg-red-50 border-red-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Kullandığı İlaçlar</Label>
                    <Textarea 
                      value={editedPatient?.anamnesis?.medications || ''} 
                      onChange={(e) => handleFieldChange('medications', e.target.value, true)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Kronik Hastalıklar</Label>
                    <Textarea 
                      value={editedPatient?.anamnesis?.chronic_diseases || ''} 
                      onChange={(e) => handleFieldChange('chronic_diseases', e.target.value, true)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Geçirdiği Ameliyatlar</Label>
                    <Textarea 
                      value={editedPatient?.anamnesis?.surgical_history || ''} 
                      onChange={(e) => handleFieldChange('surgical_history', e.target.value, true)}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Aile Öyküsü</Label>
                    <Textarea 
                      value={editedPatient?.anamnesis?.family_history || ''} 
                      onChange={(e) => handleFieldChange('family_history', e.target.value, true)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Sigara</Label>
                      <Input 
                        value={editedPatient?.anamnesis?.smoking || ''} 
                        onChange={(e) => handleFieldChange('smoking', e.target.value, true)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Alkol</Label>
                      <Input 
                        value={editedPatient?.anamnesis?.alcohol || ''} 
                        onChange={(e) => handleFieldChange('alcohol', e.target.value, true)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Gebelik Durumu</Label>
                    <Input 
                      value={editedPatient?.anamnesis?.pregnancy_status || ''} 
                      onChange={(e) => handleFieldChange('pregnancy_status', e.target.value, true)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Diğer Notlar</Label>
                    <Textarea 
                      value={editedPatient?.anamnesis?.other_notes || ''} 
                      onChange={(e) => handleFieldChange('other_notes', e.target.value, true)}
                      className="bg-blue-50 border-blue-200"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="randevular" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tüm Randevular</CardTitle>
                <Button size="sm" onClick={handleNewAppointment}>
                  <Plus className="w-4 h-4 mr-1" /> Yeni Randevu
                </Button>
              </div>
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
                                {formatDateDDMMYYYY(appointment.date)}
                              </h4>
                              <span className="text-gray-400">•</span>
                              <span className="text-blue-600 text-sm font-medium">
                                {appointment.time.substring(0, 5)}
                              </span>
                            </div>
                            {(appointment.treatment_type_name || appointment.notes) && (
                              <p className="text-sm text-gray-500 mt-1 truncate max-w-sm">
                                {appointment.treatment_type_name || appointment.notes}
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
                  treatments.map((t) => (
                    <div 
                      key={t.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleTreatmentEdit(t)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg shrink-0">
                          <Stethoscope className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">
                              {t.treatment_type_name || t.treatment_name}
                            </h4>
                            {t.tooth_number && (
                              <Badge variant="outline" className="text-[10px]">
                                Diş: {t.tooth_number}
                              </Badge>
                            )}
                            <Badge className={`${t.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} border-none`}>
                              {t.status === 'completed' ? 'Tamamlandı' : 'Yapılacak'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                            <span className="font-medium text-gray-700">{t.doctor_name}</span>
                            <span>•</span>
                            <span>{formatDateDDMMYYYY(t.date)}</span>
                          </div>
                        </div>
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
                <Button size="sm" onClick={handleNewPayment}>
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
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <span className="text-sm font-medium text-gray-500">Toplam Tedavi Tutarı</span>
                      <p className="text-xl font-bold text-gray-900 mt-1">
                        {treatments.reduce((sum, t) => sum + parseFloat(t.price || '0'), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                      <span className="text-sm font-medium text-green-700">Toplam Ödenen</span>
                      <p className="text-xl font-bold text-green-800 mt-1">
                        {payments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <span className="text-sm font-medium text-blue-700">Kalan Bakiye</span>
                      <p className="text-xl font-bold text-blue-800 mt-1">
                        {(
                          treatments.reduce((sum, t) => sum + parseFloat(t.price || '0'), 0) -
                          payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
                        ).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </p>
                    </div>
                  </div>
                  {payments.map((pay) => (
                    <div 
                      key={pay.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handlePaymentEdit(pay)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg shrink-0">
                          <CreditCard className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {parseFloat(pay.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                          </p>
                          {pay.treatment && (
                            <p className="text-sm text-blue-600 font-medium">
                              İlgili Tedavi: {treatments.find((t) => t.id === pay.treatment)?.treatment_type_name || 'Tedavi'}
                            </p>
                          )}
                          {pay.description && (
                            <p className="text-sm text-gray-500">{pay.description}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-400">
                        {formatDateDDMMYYYY(pay.payment_date)}
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
              <DentalChart 
                treatments={treatments}
                onToothSelect={(toothNum, category) => {
                  setSelectedToothForTreatment(toothNum);
                  setSelectedCategory(category);
                  setIsTreatmentAddOpen(true);
                }} 
              />
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
                  <p className="text-sm text-gray-500 mt-1">Röntgen, tahlil ve diğer ek dosyalar</p>
                </div>
                <div>
                  <label 
                    htmlFor="file-upload" 
                    className={`cursor-pointer inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium transition-all rounded-lg shadow-sm ${
                      uploadingDoc 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                    }`}
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    {uploadingDoc ? 'Yükleniyor...' : 'Yeni Doküman Yükle'}
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
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`transition-all duration-200 rounded-xl ${isDragging ? 'bg-blue-50/50 ring-2 ring-blue-400 ring-dashed' : ''}`}
              >
                {documents.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center py-16 text-gray-400 border-2 border-dashed rounded-xl transition-colors ${isDragging ? 'border-blue-400 bg-blue-50/20' : 'border-gray-200 bg-gray-50/50'}`}>
                    <div className={`w-16 h-16 mb-4 flex items-center justify-center rounded-full transition-transform ${isDragging ? 'scale-110 bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                      <Download className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">Dosyaları Buraya Sürükleyin</p>
                    <p className="text-xs mt-1">veya "Yeni Doküman Yükle" butonunu kullanın</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => {
                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.file_url || '');
                      const isPdf = /\.(pdf)$/i.test(doc.file_url || '');
                      const fileUrl = doc.file_url?.startsWith('http') 
                        ? doc.file_url 
                        : `http://localhost:8000${doc.file_url}`;

                      return (
                        <div key={doc.id} className="group relative flex flex-col border rounded-xl overflow-hidden bg-white hover:shadow-md transition-all border-gray-100">
                          <div className="h-32 bg-gray-50 flex items-center justify-center border-b border-gray-50 relative overflow-hidden">
                            {isImage ? (
                              <img src={fileUrl} alt={doc.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center">
                                {isPdf ? (
                                  <FileText className="w-10 h-10 text-red-500" />
                                ) : (
                                  <FileText className="w-10 h-10 text-blue-500" />
                                )}
                                <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase">
                                  {doc.file_url?.split('.').pop()}
                                </span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                          </div>
                          
                          <div className="p-3">
                            <h4 className="font-semibold text-sm text-gray-900 truncate" title={doc.name}>
                              {doc.name}
                            </h4>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-gray-400 font-medium">
                                {formatDateDDMMYYYY(doc.created_at)}
                              </span>
                              <div className="flex items-center gap-1">
                                <a 
                                  href={fileUrl} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                  title="Görüntüle / İndir"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                                <button 
                                  onClick={() => handleFileDelete(doc.id)}
                                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                  title="Sil"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      


      <AppointmentDetailDialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        appointment={selectedAppointment}
        onUpdated={loadData}
        onEdit={handleEditAppointment}
      />

      <AppointmentDialog 
        isOpen={isAppointmentDialogOpen}
        onClose={() => {
          setIsAppointmentDialogOpen(false);
          setAppointmentToEdit(null);
        }}
        onSuccess={loadData}
        appointmentToEdit={appointmentToEdit}
        selectedSlot={appointmentToEdit ? null : { date: new Date().toLocaleDateString('en-CA'), time: '09:00' }}
      />

      <TreatmentAddDialog
        isOpen={isTreatmentAddOpen}
        onClose={() => { 
          setIsTreatmentAddOpen(false); 
          setSelectedToothForTreatment('');
          setSelectedCategory(undefined);
          setTreatmentToEdit(null);
        }}
        patientId={Number(patient.id)}
        onSuccess={() => {
          loadData();
          setSelectedCategory(undefined);
          setTreatmentToEdit(null);
        }}
        initialToothNumber={selectedToothForTreatment}
        initialCategory={selectedCategory}
        treatmentToEdit={treatmentToEdit}
      />

      <PaymentDialog
        isOpen={isPaymentAddOpen}
        onClose={() => {
          setIsPaymentAddOpen(false);
          setPaymentToEdit(null);
        }}
        patientId={Number(patient.id)}
        onSuccess={() => {
          loadData();
          setPaymentToEdit(null);
        }}
        paymentToEdit={paymentToEdit}
      />

      {/* Modern Silme Onayı Diyaloğu */}
      <Dialog open={!!isDeletingDoc} onOpenChange={(open) => !open && setIsDeletingDoc(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Dokümanı Sil</DialogTitle>
            <DialogDescription>
              Bu dosyayı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setIsDeletingDoc(null)}>Vazgeç</Button>
            <Button variant="destructive" onClick={confirmFileDelete}>Evet, Sil</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
