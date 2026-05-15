import { useState, useEffect } from 'react';
import { fetchTreatmentTypes, createTreatmentType, updateTreatmentType, deleteTreatmentType } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface TreatmentType {
  id: number;
  name: string;
  default_price: string;
  is_active: boolean;
}

interface Props {
  userRole: string;
}

export default function TreatmentTypesPage({ userRole }: Props) {
  const [types, setTypes] = useState<TreatmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<TreatmentType | null>(null);
  const [formData, setFormData] = useState({ name: '', default_price: '' });

  const canEdit = userRole === 'admin' || userRole === 'doctor';

  const loadData = async () => {
    try {
      const data = await fetchTreatmentTypes();
      setTypes(data);
    } catch (err) {
      toast.error('Tedavi türleri yüklenirken hata oluştu.');
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
      setFormData({ name: type.name, default_price: type.default_price });
    } else {
      setEditingType(null);
      setFormData({ name: '', default_price: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingType) {
        await updateTreatmentType(editingType.id, formData);
        toast.success('Tedavi türü güncellendi');
      } else {
        await createTreatmentType(formData);
        toast.success('Tedavi türü eklendi');
      }
      setIsDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Kaydetme işlemi başarısız');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu tedavi türünü devre dışı bırakmak istediğinize emin misiniz?')) return;
    try {
      await deleteTreatmentType(id);
      toast.success('Tedavi türü devre dışı bırakıldı');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Silme işlemi başarısız');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tedavi Türleri</h2>
          <p className="text-muted-foreground">Klinikte uygulanan tedavi türlerini ve fiyatlarını yönetin.</p>
        </div>
        {canEdit && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Tedavi Ekle
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tedavi Adı</TableHead>
                <TableHead>Varsayılan Fiyat</TableHead>
                <TableHead>Durum</TableHead>
                {canEdit && <TableHead className="text-right">İşlemler</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center">Yükleniyor...</TableCell></TableRow>
              ) : types.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center">Henüz tedavi türü eklenmemiş.</TableCell></TableRow>
              ) : (
                types.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>{type.default_price} TL</TableCell>
                    <TableCell>
                      <Badge variant={type.is_active ? 'default' : 'secondary'}>
                        {type.is_active ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </TableCell>
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingType ? 'Tedavi Türünü Düzenle' : 'Yeni Tedavi Türü Ekle'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tedavi Adı</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Örn: Kanal Tedavisi"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Varsayılan Fiyat (TL)</label>
              <Input
                type="number"
                value={formData.default_price}
                onChange={(e) => setFormData({ ...formData, default_price: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={!formData.name || !formData.default_price}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
