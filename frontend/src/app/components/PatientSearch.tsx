import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, Plus, Phone, Calendar } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import PatientDialog from './PatientDialog';
import { fetchPatients } from '../services/api';

export default function PatientSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [patients, setPatients] = useState<
    Array<{
      id: number;
      full_name: string;
      phone: string;
      tckn: string;
      last_visit: string | null;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadPatients = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPatients(searchQuery);
      setPatients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hastalar yüklenemedi');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadPatients, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePatientCreated = () => {
    setIsDialogOpen(false);
    loadPatients();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl text-gray-900">Hasta Yönetimi</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Hasta Ekle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hasta Ara</CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Ad, soyad veya telefon ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>TC Kimlik No</TableHead>
                <TableHead>Son Ziyaret</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <TableRow key={patient.id} className="hover:bg-gray-50">
                    <TableCell>
                      <button
                        onClick={() => navigate(`/hasta/${patient.id}`)}
                        className="hover:text-blue-600 hover:underline"
                      >
                        {patient.full_name}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        {patient.phone}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{patient.tckn}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {patient.last_visit
                          ? new Date(patient.last_visit).toLocaleDateString('tr-TR')
                          : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/hasta/${patient.id}`)}
                      >
                        Detay
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {!loading && patients.length === 0 && !error && (
            <div className="text-center py-8 text-gray-500">
              Hasta bulunamadı
            </div>
          )}
        </CardContent>
      </Card>

      <PatientDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={handlePatientCreated}
      />
    </div>
  );
}
