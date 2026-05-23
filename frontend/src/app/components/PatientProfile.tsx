import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
import { formatDate, formatTimeStr } from '../utils/date';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
  const [defaultPaymentTreatmentId, setDefaultPaymentTreatmentId] = useState<number | undefined>();
  const [defaultPaymentAmount, setDefaultPaymentAmount] = useState<number | undefined>();
  const [defaultAppointmentTreatmentId, setDefaultAppointmentTreatmentId] = useState<number | undefined>();

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
        setError(err instanceof Error ? err.message : t('patients:profile.error_load'));
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
      toast.error(err instanceof Error ? err.message : 'Doküman silinemedi');
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
      setSaveError(err instanceof Error ? err.message : t('patients:profile.error_load'));
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
        <div className="text-gray-500">{t('patients:profile.loading')}</div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="icon" onClick={() => navigate('/hastalar')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="p-4 bg-red-50 text-red-700 rounded-md">{error || t('patients:profile.not_found')}</div>
      </div>
    );
  }

  const anam = patient.anamnesis ?? defaultAnamnesis;
  const treatmentName = (t: Treatment) => t.treatment_type_name || t.treatment_name || '-';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 border-none">{t('patients:profile.appointments.status.scheduled')}</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-none">{t('patients:profile.appointments.status.completed')}</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-none">{t('patients:profile.appointments.status.cancelled')}</Badge>;
      case 'no_show':
        return <Badge className="bg-orange-100 text-orange-800 border-none">{t('patients:profile.appointments.status.no_show')}</Badge>;
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
    setDefaultAppointmentTreatmentId(undefined);
    setIsAppointmentDialogOpen(true);
  };

  const handleNewAppointmentWithTreatment = (trId: number) => {
    setAppointmentToEdit(null);
    setDefaultAppointmentTreatmentId(trId);
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
    setDefaultPaymentTreatmentId(undefined);
    setDefaultPaymentAmount(undefined);
    setIsPaymentAddOpen(true);
  };

  const handleNewPaymentWithDefaults = (trId: number, amount: number) => {
    setPaymentToEdit(null);
    setDefaultPaymentTreatmentId(trId);
    setDefaultPaymentAmount(amount);
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
            {loading ? t('patients:profile.saving') : t('patients:profile.save_changes')}
          </Button>
          <p className="text-[10px] text-center text-gray-400 font-medium">{t('patients:profile.id')}: #{id}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="bilgiler">{t('patients:profile.tabs.info')}</TabsTrigger>
          <TabsTrigger value="anamnez">{t('patients:profile.tabs.anamnesis')}</TabsTrigger>
          <TabsTrigger value="gecmis">{t('patients:profile.tabs.history')}</TabsTrigger>
          <TabsTrigger value="odeme">{t('patients:profile.tabs.payments')}</TabsTrigger>
          <TabsTrigger value="dokumanlar">{t('patients:profile.tabs.documents')}</TabsTrigger>
          <TabsTrigger value="odontogram">{t('patients:profile.tabs.dental_chart')}</TabsTrigger>
        </TabsList>

        <TabsContent value="bilgiler" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('patients:profile.info.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {t('patients:profile.info.phone')}
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
                      <IdCard className="w-3 h-3" /> {t('patients:profile.info.tckn')}
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
                      <Calendar className="w-3 h-3" /> {t('patients:profile.info.birth_date')}
                    </Label>
                    <DatePicker
                      date={editedPatient?.birth_date || undefined}
                      onDateChange={(val) => handleFieldChange('birth_date', val)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {t('patients:profile.info.address')}
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
              <CardTitle>{t('patients:profile.info.general_notes')}</CardTitle>
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
                {t('patients:profile.anamnesis.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">{t('patients:profile.anamnesis.medical_history')}</Label>
                    <Textarea 
                      value={editedPatient?.anamnesis?.medical_history || ''} 
                      onChange={(e) => handleFieldChange('medical_history', e.target.value, true)}
                      placeholder="Kronik hastalıklar, operasyonlar..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" /> {t('patients:profile.anamnesis.allergies')}
                    </Label>
                    <Textarea 
                      value={editedPatient?.anamnesis?.allergies || ''} 
                      onChange={(e) => handleFieldChange('allergies', e.target.value, true)}
                      placeholder="İlaç, gıda vb. alerjiler..."
                      className="bg-red-50 border-red-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">{t('patients:profile.anamnesis.medications')}</Label>
                    <Textarea 
                      value={editedPatient?.anamnesis?.medications || ''} 
                      onChange={(e) => handleFieldChange('medications', e.target.value, true)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">{t('patients:profile.anamnesis.chronic_diseases')}</Label>
                    <Textarea 
                      value={editedPatient?.anamnesis?.chronic_diseases || ''} 
                      onChange={(e) => handleFieldChange('chronic_diseases', e.target.value, true)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">{t('patients:profile.anamnesis.surgical_history')}</Label>
                    <Textarea 
                      value={editedPatient?.anamnesis?.surgical_history || ''} 
                      onChange={(e) => handleFieldChange('surgical_history', e.target.value, true)}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">{t('patients:profile.anamnesis.family_history')}</Label>
                    <Textarea 
                      value={editedPatient?.anamnesis?.family_history || ''} 
                      onChange={(e) => handleFieldChange('family_history', e.target.value, true)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">{t('patients:profile.anamnesis.smoking')}</Label>
                      <Input 
                        value={editedPatient?.anamnesis?.smoking || ''} 
                        onChange={(e) => handleFieldChange('smoking', e.target.value, true)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">{t('patients:profile.anamnesis.alcohol')}</Label>
                      <Input 
                        value={editedPatient?.anamnesis?.alcohol || ''} 
                        onChange={(e) => handleFieldChange('alcohol', e.target.value, true)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">{t('patients:profile.anamnesis.pregnancy_status')}</Label>
                    <Input 
                      value={editedPatient?.anamnesis?.pregnancy_status || ''} 
                      onChange={(e) => handleFieldChange('pregnancy_status', e.target.value, true)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">{t('patients:profile.anamnesis.other_notes')}</Label>
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

        {/* Yeni Birleştirilmiş Geçmiş Tab (Tedaviler ve Randevular) */}
        <TabsContent value="gecmis" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('patients:profile.treatments.title', 'Tedavi Bazlı Geçmiş')}</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setIsTreatmentAddOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" /> {t('patients:profile.treatments.new', 'Yeni Tedavi Ekle')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const activeTreatmentIds = new Set(treatments.map(t => t.id));
                const standaloneAppointments = appointments.filter(a => !a.treatment || !activeTreatmentIds.has(a.treatment));
                
                return (
                  <div className="space-y-6">
                    {treatments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {t('patients:profile.treatments.no_record')}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {treatments.map((tr) => {
                          const trAppointments = appointments.filter(a => a.treatment === tr.id);
                          
                          return (
                            <div key={tr.id} className="border rounded-lg bg-white overflow-hidden shadow-sm">
                              {/* Treatment Header */}
                              <div className="flex items-center justify-between p-4 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleTreatmentEdit(tr)}>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg shrink-0">
                                    <Stethoscope className="w-6 h-6 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-gray-900">
                                        {tr.treatment_type_name || tr.treatment_name}
                                      </h4>
                                      {tr.tooth_number && (
                                        <Badge variant="outline" className="text-[10px]">
                                          {t('patients:profile.treatments.tooth')}: {tr.tooth_number}
                                        </Badge>
                                      )}
                                      <Badge className={`${tr.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} border-none`}>
                                        {tr.status === 'completed' ? t('patients:profile.treatments.status.completed') : t('patients:profile.treatments.status.todo')}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                                      <span className="font-medium text-gray-700">{tr.doctor_name}</span>
                                      <span>•</span>
                                      <span>{formatDate(tr.date)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Appointments List for this Treatment */}
                              <div className="p-4 bg-white">
                                <h5 className="text-sm font-semibold text-gray-700 mb-3 ml-1">{t('patients:profile.tabs.appointments', 'Randevular')}</h5>
                                {trAppointments.length === 0 ? (
                                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
                                    <span className="text-sm text-gray-500 italic ml-2">Bu tedavi için randevu bulunmuyor.</span>
                                    {tr.status !== 'completed' && (
                                      <Button size="sm" onClick={() => handleNewAppointmentWithTreatment(tr.id)} className="bg-blue-600 hover:bg-blue-700">
                                        <Plus className="w-4 h-4 mr-1" /> Randevu Ekle
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {trAppointments.map(appointment => (
                                      <div
                                        key={appointment.id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => handleAppointmentClick(appointment)}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-md shrink-0">
                                            <Clock className="w-4 h-4 text-blue-600" />
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-gray-900 font-medium text-sm">
                                                {formatDate(appointment.date)} • {formatTimeStr(appointment.time)}
                                              </span>
                                            </div>
                                            {appointment.notes && (
                                              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-sm">
                                                {appointment.notes}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          {getStatusBadge(appointment.status)}
                                        </div>
                                      </div>
                                    ))}
                                    <div className="mt-2 flex justify-end">
                                      {tr.status !== 'completed' && (
                                        <Button variant="outline" size="sm" onClick={() => handleNewAppointmentWithTreatment(tr.id)}>
                                          <Plus className="w-4 h-4 mr-1" /> Yeni Randevu Ekle
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Bağımsız Randevular */}
                    {standaloneAppointments.length > 0 && (
                      <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-800 text-lg">{t('patients:profile.appointments.standalone', 'Bağımsız Randevular')}</h3>
                          <Button size="sm" variant="outline" onClick={handleNewAppointment}>
                            <Plus className="w-4 h-4 mr-1" /> Yeni Bağımsız Randevu
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {standaloneAppointments.map(appointment => (
                            <div
                              key={appointment.id}
                              className="flex gap-4 p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => handleAppointmentClick(appointment)}
                            >
                              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg shrink-0">
                                <Clock className="w-6 h-6 text-gray-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-1">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-gray-900 font-semibold">
                                        {formatDate(appointment.date)}
                                      </h4>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-gray-600 text-sm font-medium">
                                        {formatTimeStr(appointment.time)}
                                      </span>
                                    </div>
                                    {appointment.notes && (
                                      <p className="text-sm text-gray-500 mt-1 truncate max-w-sm">
                                        {appointment.notes}
                                      </p>
                                    )}
                                  </div>
                                  {getStatusBadge(appointment.status)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ödemeler Tab */}
        <TabsContent value="odeme">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('patients:profile.payments.title')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <span className="text-sm font-medium text-gray-500">{t('patients:profile.payments.total_treatment')}</span>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {treatments.filter(tr => tr.status === 'completed').reduce((sum, tr) => sum + parseFloat((tr as any).price || '0'), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <span className="text-sm font-medium text-green-700">{t('patients:profile.payments.total_paid')}</span>
                  <p className="text-xl font-bold text-green-800 mt-1">
                    {payments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                  <span className="text-sm font-medium text-red-600">{t('patients:profile.payments.balance')}</span>
                  <p className="text-xl font-bold text-red-700 mt-1">
                    {(
                      treatments.filter(tr => tr.status === 'completed').reduce((sum, tr) => sum + parseFloat((tr as any).price || '0'), 0) -
                      payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
                    ).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </p>
                </div>
              </div>
              {(() => {
                const completedTreatments = treatments.filter(tr => tr.status === 'completed');
                
                // Bağımsız ödemeler: Herhangi bir tedaviye bağlı olmayan ödemeler
                const standalonePayments = payments.filter(p => !p.treatment);

                return (
                  <div className="space-y-6">
                    {/* Tedavi Bazlı Ödemeler */}
                    {completedTreatments.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-gray-800 text-lg">{t('patients:profile.payments.treatment_payments', 'Tedavi Bazlı Ödemeler')}</h3>
                        {completedTreatments.map((tr) => {
                          const trPrice = parseFloat((tr as any).price || '0');
                          const trPayments = payments.filter(p => p.treatment === tr.id);
                          const totalPaidForTr = trPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
                          const remaining = trPrice - totalPaidForTr;
                          const isPaid = remaining <= 0 && trPrice > 0;

                          return (
                            <div key={tr.id} className="border rounded-lg bg-white overflow-hidden shadow-sm">
                              <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg shrink-0">
                                    <Stethoscope className="w-6 h-6 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-gray-900">{tr.treatment_type_name || tr.treatment_name}</h4>
                                      {tr.tooth_number && (
                                        <Badge variant="outline" className="text-[10px]">
                                          {t('patients:profile.treatments.tooth', 'Diş')}: {tr.tooth_number}
                                        </Badge>
                                      )}
                                      {isPaid ? (
                                        <Badge className="bg-green-100 text-green-800 border-none">Ödendi</Badge>
                                      ) : (
                                        <Badge className="bg-yellow-100 text-yellow-800 border-none">Bekliyor</Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                                      <span className="font-medium text-gray-700">{tr.doctor_name}</span>
                                      <span>•</span>
                                      <span>{formatDate(tr.date)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-gray-900">{trPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                                  <div className="text-sm text-gray-500">Toplam Tutar</div>
                                </div>
                              </div>
                              <div className="p-4 flex items-center justify-between">
                                <div className="flex gap-6">
                                  <div>
                                    <div className="text-sm font-medium text-green-700">Ödenen</div>
                                    <div className="font-semibold text-gray-900">{totalPaidForTr.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-red-600">Kalan Borç</div>
                                    <div className="font-semibold text-gray-900">{remaining > 0 ? remaining.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '0,00'} ₺</div>
                                  </div>
                                </div>
                                {remaining > 0 && (
                                  <Button 
                                    size="sm" 
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => {
                                      setPaymentToEdit(null);
                                      setSelectedToothForTreatment(tr.id); // Hack: Using a state or we can just pass it to PaymentDialog directly. Wait, we need new states for defaultTreatmentId and defaultAmount.
                                      // Actually, I can just use handleNewPaymentWithDefaults
                                      handleNewPaymentWithDefaults(tr.id, remaining);
                                    }}
                                  >
                                    <Plus className="w-4 h-4 mr-1" /> Tahsilat Ekle
                                  </Button>
                                )}
                              </div>
                              {/* Bu tedaviye ait alt ödemeler */}
                              {trPayments.length > 0 && (
                                <div className="bg-gray-50/50 p-4 border-t space-y-2">
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Yapılan Ödemeler</p>
                                  {trPayments.map(pay => (
                                    <div key={pay.id} className="flex items-center justify-between bg-white p-2 px-3 rounded border text-sm hover:shadow-sm transition-shadow cursor-pointer" onClick={() => handlePaymentEdit(pay)}>
                                      <div className="flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-green-600" />
                                        <span className="font-medium text-gray-900">{parseFloat(pay.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                        {pay.description && <span className="text-gray-500 text-xs ml-2">- {pay.description}</span>}
                                      </div>
                                      <span className="text-gray-400 text-xs">{formatDate(pay.payment_date)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Bağımsız Ödemeler */}
                    {standalonePayments.length > 0 && (
                      <div className="space-y-3 pt-6 border-t">
                        <h3 className="font-semibold text-gray-800 text-lg">Genel / Bağımsız Ödemeler</h3>
                        {standalonePayments.map((pay) => (
                          <div 
                            key={pay.id} 
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => handlePaymentEdit(pay)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg shrink-0">
                                <CreditCard className="w-5 h-5 text-gray-600" />
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
                              {formatDate(pay.payment_date)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {completedTreatments.length === 0 && standalonePayments.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        {t('patients:profile.payments.no_record')}
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="odontogram">
          <Card>
            <CardHeader>
              <CardTitle>{t('patients:profile.tabs.dental_chart')}</CardTitle>
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
                  <CardTitle>{t('patients:profile.documents.title')}</CardTitle>
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
                    {uploadingDoc ? t('patients:profile.loading') : t('patients:profile.documents.upload')}
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
                    <p className="text-sm font-semibold text-gray-900">{t('patients:profile.documents.no_record')}</p>
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
                                {formatDate(doc.created_at)}
                              </span>
                              <div className="flex items-center gap-1">
                                <a 
                                  href={fileUrl} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                  title={t('patients:profile.documents.download')}
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                                <button 
                                  onClick={() => handleFileDelete(doc.id)}
                                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                  title={t('patients:profile.documents.delete')}
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

      {isAppointmentDialogOpen && (
        <AppointmentDialog 
          isOpen={isAppointmentDialogOpen}
          onClose={() => setIsAppointmentDialogOpen(false)}
          selectedSlot={null}
          appointmentToEdit={appointmentToEdit}
          defaultTreatmentId={defaultAppointmentTreatmentId}
          defaultPatient={patient ? { id: patient.id, full_name: patient.full_name, phone: patient.phone, tckn: patient.tckn } : null}
          onSuccess={loadData}
        />
      )}

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

      {isPaymentAddOpen && (
        <PaymentDialog
          isOpen={isPaymentAddOpen}
          onClose={() => {
            setIsPaymentAddOpen(false);
            setPaymentToEdit(null);
            setDefaultPaymentTreatmentId(undefined);
            setDefaultPaymentAmount(undefined);
          }}
          patientId={Number(patient.id)}
          onSuccess={() => {
            loadData();
            setPaymentToEdit(null);
          }}
          paymentToEdit={paymentToEdit}
          defaultTreatmentId={defaultPaymentTreatmentId}
          defaultAmount={defaultPaymentAmount}
        />
      )}

      {/* Modern Silme Onayı Diyaloğu */}
      <Dialog open={!!isDeletingDoc} onOpenChange={(open) => !open && setIsDeletingDoc(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('patients:profile.documents.delete')}</DialogTitle>
            <DialogDescription>
              {t('patients:profile.documents.delete_confirm')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setIsDeletingDoc(null)}>{t('common:cancel')}</Button>
            <Button variant="destructive" onClick={confirmFileDelete}>{t('common:delete')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
