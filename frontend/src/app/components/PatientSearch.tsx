import { useState } from 'react';
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

// Mock data
const mockPatients = [
  { id: 1, name: 'Ahmet Yılmaz', phone: '0532 123 4567', lastVisit: '2025-12-10', tckn: '12345678901' },
  { id: 2, name: 'Ayşe Demir', phone: '0533 234 5678', lastVisit: '2025-12-08', tckn: '23456789012' },
  { id: 3, name: 'Mehmet Kaya', phone: '0534 345 6789', lastVisit: '2025-12-05', tckn: '34567890123' },
  { id: 4, name: 'Fatma Şahin', phone: '0535 456 7890', lastVisit: '2025-12-12', tckn: '45678901234' },
  { id: 5, name: 'Ali Öz', phone: '0536 567 8901', lastVisit: '2025-12-11', tckn: '56789012345' },
  { id: 6, name: 'Zeynep Aydın', phone: '0537 678 9012', lastVisit: '2025-12-09', tckn: '67890123456' },
  { id: 7, name: 'Hasan Çelik', phone: '0538 789 0123', lastVisit: '2025-12-07', tckn: '78901234567' },
  { id: 8, name: 'Elif Kara', phone: '0539 890 1234', lastVisit: '2025-12-13', tckn: '89012345678' },
];

export default function PatientSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredPatients = mockPatients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery)
  );

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
              {filteredPatients.map((patient) => (
                <TableRow key={patient.id} className="hover:bg-gray-50">
                  <TableCell>
                    <button
                      onClick={() => navigate(`/hasta/${patient.id}`)}
                      className="hover:text-blue-600 hover:underline"
                    >
                      {patient.name}
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
                      {new Date(patient.lastVisit).toLocaleDateString('tr-TR')}
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
              ))}
            </TableBody>
          </Table>
          {filteredPatients.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Hasta bulunamadı
            </div>
          )}
        </CardContent>
      </Card>

      <PatientDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  );
}