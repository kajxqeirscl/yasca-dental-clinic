import { useState, useEffect } from 'react';
import { useClinicNavigate } from '../hooks/useClinicNavigate';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { SearchInput } from './ui/search-input';
import { Plus, Phone, Calendar, Search, ArrowUp, ArrowDown } from 'lucide-react';
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from './ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export default function PatientSearch() {
  const { t } = useTranslation();
  const navigate = useClinicNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [patients, setPatients] = useState<
    Array<{
      id: number;
      full_name: string;
      phone: string;
      tckn: string;
      tckn: string;
      last_visit: string | null;
      last_visit_date: string | null;
      appointments_count: number;
      total_payments: string;
      total_debt: string;
      created_at: string;
      birth_date: string | null;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const ordering = sortDirection === 'desc' ? `-${sortField}` : sortField;
  const [totalPatients, setTotalPatients] = useState(0);
  const itemsPerPage = 15; // Django PAGE_SIZE

  const loadPatients = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPatients(searchQuery, currentPage, ordering);
      setPatients(data.results);
      setTotalPatients(data.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('patients:search.error_loading'));
      setPatients([]);
      setTotalPatients(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadPatients, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, currentPage, ordering]);

  const totalPages = Math.ceil(totalPatients / itemsPerPage);
  const paginatedPatients = patients;

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
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={t('patients:search.search_placeholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset page on new search
                }}
                className="pl-9 bg-gray-50/50 border-gray-200/60 focus-visible:ring-indigo-500"
              />
            </div>
            <div className="w-full sm:w-[320px] flex gap-2">
              <Select value={sortField} onValueChange={(val) => { setSortField(val); setCurrentPage(1); }}>
                <SelectTrigger className="bg-gray-50/50 border-gray-200/60 flex-1">
                  <SelectValue placeholder="Sıralama" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Kayıt Tarihi</SelectItem>
                  <SelectItem value="first_name">İsim Soyisim</SelectItem>
                  <SelectItem value="appointments_count">Randevu Sayısı</SelectItem>
                  <SelectItem value="last_visit_date">Ziyaret Tarihi</SelectItem>
                  <SelectItem value="total_debt">Toplam Borç</SelectItem>
                  <SelectItem value="total_payments">Toplam Ödeme</SelectItem>
                  <SelectItem value="birth_date">Doğum Tarihi / Yaş</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                  setCurrentPage(1);
                }}
                className="bg-gray-50/50 border-gray-200/60 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
              >
                {sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              </Button>
            </div>
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
                <TableHead>{t('patients:search.columns.name')}</TableHead>
                <TableHead>{t('patients:search.columns.phone')}</TableHead>
                <TableHead>{t('patients:search.columns.last_visit')}</TableHead>
                
                {/* Dynamic Column Header based on Ordering */}
                {sortField === 'appointments_count' && <TableHead>Randevu Sayısı</TableHead>}
                {sortField === 'total_debt' && <TableHead>Toplam Borç</TableHead>}
                {sortField === 'total_payments' && <TableHead>Toplam Ödeme</TableHead>}
                {sortField === 'birth_date' && <TableHead>Doğum Tarihi</TableHead>}
                {sortField === 'created_at' && <TableHead>Kayıt Tarihi</TableHead>}
                {!['appointments_count', 'total_debt', 'total_payments', 'birth_date', 'created_at'].includes(sortField) && (
                  <TableHead>{t('patients:search.columns.tckn')}</TableHead>
                )}

                <TableHead className="text-right">{t('patients:search.columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    {t('common:loading')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPatients.map((patient) => (
                  <TableRow key={patient.id} className="hover:bg-gray-50">
                    <TableCell>
                      <button
                        onClick={() => navigate(`/hasta/${patient.id}`)}
                        className="hover:text-blue-600 hover:underline font-medium text-gray-900"
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
                    <TableCell>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-gray-900 font-medium">
                          {patient.last_visit_date 
                          ? formatDate(patient.last_visit_date)
                          : patient.last_visit
                            ? formatDate(patient.last_visit)
                            : t('patients:search.no_record')}
                        </span>
                      </div>
                    </TableCell>

                    {/* Dynamic Column Cell */}
                    {sortField === 'appointments_count' && (
                      <TableCell className="font-semibold text-gray-900">
                        {patient.appointments_count || 0}
                      </TableCell>
                    )}
                    {sortField === 'total_debt' && (
                      <TableCell className="font-bold text-red-600">
                        {parseFloat(patient.total_debt || '0').toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </TableCell>
                    )}
                    {sortField === 'total_payments' && (
                      <TableCell className="font-bold text-green-600">
                        {parseFloat(patient.total_payments || '0').toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </TableCell>
                    )}
                    {sortField === 'birth_date' && (
                      <TableCell className="text-gray-600">
                        {patient.birth_date ? formatDate(patient.birth_date) : '-'}
                      </TableCell>
                    )}
                    {sortField === 'created_at' && (
                      <TableCell className="text-gray-600">
                        {patient.created_at ? formatDate(patient.created_at) : '-'}
                      </TableCell>
                    )}
                    {!['appointments_count', 'total_debt', 'total_payments', 'birth_date', 'created_at'].includes(sortField) && (
                      <TableCell className="text-gray-600">{patient.tckn || '-'}</TableCell>
                    )}

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
          
          {totalPages > 1 && !loading && (
            <div className="mt-4 pt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                    // Sadece etraftaki sayfaları göster
                    if (
                      pageNum === 1 || 
                      pageNum === totalPages || 
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            isActive={currentPage === pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return (
                        <PaginationItem key={`ellipsis-${pageNum}`}>
                          <span className="px-2">...</span>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}

                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

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
