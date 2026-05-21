import { useState, useEffect } from 'react';
import { fetchTreatmentTypes, createTreatmentType, updateTreatmentType, deleteTreatmentType } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { SearchInput } from './ui/search-input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useLocalizedSearch } from '../hooks/useLocalizedSearch';

// Category definitions — must mirror backend TreatmentType.Category choices
export const CATEGORY_OPTIONS = [
  { value: 'filling', labelKey: 'treatments:categories.filling' },
  { value: 'canal', labelKey: 'treatments:categories.canal' },
  { value: 'crown', labelKey: 'treatments:categories.crown' },
  { value: 'extraction', labelKey: 'treatments:categories.extraction' },
  { value: 'implant', labelKey: 'treatments:categories.implant' },
  { value: 'detartraj', labelKey: 'treatments:categories.detartraj' },
  { value: 'other', labelKey: 'treatments:categories.other' },
] as const;

export type TreatmentCategory = typeof CATEGORY_OPTIONS[number]['value'];

export function getCategoryLabel(value: string, t: any) {
  const opt = CATEGORY_OPTIONS.find((c) => c.value === value);
  return opt ? t(opt.labelKey) : t('treatments:page.other');
}

interface TreatmentType {
  id: number;
  name: string;
  category: TreatmentCategory;
  default_price: string;
  is_active: boolean;
}

interface Props {
  userRole: string;
}

export default function TreatmentTypesPage({ userRole }: Props) {
  const { t } = useTranslation();
  const { match } = useLocalizedSearch();
  const [searchQuery, setSearchQuery] = useState('');
  const [types, setTypes] = useState<TreatmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingType, setEditingType] = useState<TreatmentType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'other' as TreatmentCategory,
    default_price: '',
  });

  const canEdit = userRole === 'admin' || userRole === 'doctor';

  const loadData = async () => {
    try {
      const data = await fetchTreatmentTypes();
      setTypes(data);
    } catch {
      toast.error(t('treatments:page.error_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);
  
  const handleOpenDialog = (type?: TreatmentType) => {
    if (type) {
      setEditingType(type);
      setFormData({ name: type.name, category: type.category, default_price: type.default_price });
    } else {
      setEditingType(null);
      setFormData({ name: '', category: 'other', default_price: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingType) {
        await updateTreatmentType(editingType.id, formData);
        toast.success(t('treatments:page.success_update'));
      } else {
        await createTreatmentType(formData);
        toast.success(t('treatments:page.success_add'));
      }
      setIsDialogOpen(false);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('treatments:page.error_save'));
    }
  };

  const confirmDelete = async (id: number) => {
    try {
      await deleteTreatmentType(id);
      toast.success(t('treatments:page.success_delete'));
      setDeletingId(null);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('treatments:page.error_delete'));
      setDeletingId(null);
    }
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
  };

  const filteredTypes = types.filter((type) => {
    const catLabel = getCategoryLabel(type.category, t);
    return match(type.name, searchQuery) || match(catLabel, searchQuery);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl text-gray-900">{t('treatments:page.title')}</h2>
        {canEdit && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            {t('treatments:page.add_new')}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('treatments:page.search_title')}</CardTitle>
          <SearchInput 
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('treatments:page.search_placeholder')}
            className="mt-4"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('treatments:page.table_name')}</TableHead>
                <TableHead>{t('treatments:page.table_category')}</TableHead>
                <TableHead>{t('treatments:page.table_price')}</TableHead>
                {canEdit && <TableHead className="text-right">{t('treatments:page.table_actions')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    {t('treatments:page.loading')}
                  </TableCell>
                </TableRow>
              ) : filteredTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    {searchQuery ? t('treatments:page.no_results') : t('treatments:page.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTypes.map((type) => {
                  const catLabel = getCategoryLabel(type.category, t);
                  return (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <span>{catLabel}</span>
                        </span>
                      </TableCell>
                      <TableCell>{type.default_price} TL</TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(type)}>
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(type.id)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType ? t('treatments:page.dialog_title_edit') : t('treatments:page.dialog_title_add')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('treatments:page.form_name')}</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('treatments:page.form_name_placeholder')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('treatments:page.form_category')}</label>
              <select
                className="w-full h-10 px-3 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as TreatmentCategory })
                }
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                {t('treatments:page.form_category_desc')}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('treatments:page.form_price')}</label>
              <Input
                type="number"
                value={formData.default_price}
                onChange={(e) => setFormData({ ...formData, default_price: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('treatments:page.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!formData.name || !formData.default_price}>
              {t('treatments:page.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modern Pop-up Onay Modalı */}
      <Dialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 font-semibold text-lg">
              <Trash2 className="w-5 h-5 animate-pulse" />
              Tedavi Türünü Sil
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 leading-relaxed">
              Bu tedavi türünü veritabanından tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 active:bg-red-800"
              onClick={() => deletingId !== null && confirmDelete(deletingId)}
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
