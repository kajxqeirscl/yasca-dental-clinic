import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { SearchInput } from './ui/search-input';
import { Plus, Phone, Calendar } from 'lucide-react';
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
import { formatDate } from '../utils/date';
import { useTranslation } from 'react-i18next';

export default function PatientSearch() {
  const { t } = useTranslation();
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
      setError(err instanceof Error ? err.message : t('patients:search.error_loading'));
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
        <h2 className="text-2xl text-gray-900">{t('patients:search.title')}</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('patients:search.add_new')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('patients:search.search_title')}</CardTitle>
          <SearchInput 
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('patients:search.search_placeholder')}
            className="mt-4"
          />
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
                <TableHead>{t('patients:search.columns.name')}</TableHead>
                <TableHead>{t('patients:search.columns.phone')}</TableHead>
                <TableHead>{t('patients:search.columns.tckn')}</TableHead>
                <TableHead>{t('patients:search.columns.last_visit')}</TableHead>
                <TableHead className="text-right">{t('patients:search.columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    {t('common:loading')}
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
                        <span className="text-gray-900 font-medium">
                          {patient.last_visit 
                          ? formatDate(patient.last_visit)
                          : t('patients:search.no_record')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/hasta/${patient.id}`)}
                      >
                        {t('patients:search.detail')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {!loading && patients.length === 0 && !error && (
            <div className="text-center py-8 text-gray-500">
              {t('patients:search.not_found')}
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
