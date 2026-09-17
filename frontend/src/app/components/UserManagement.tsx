import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Users, UserPlus, Trash2, Edit2, X } from 'lucide-react';
import { fetchUsers, createUser, updateUser, deleteUser } from '../services/api';
import { useTranslation } from 'react-i18next';

export default function UserManagement() {
  const { t } = useTranslation(['settings', 'common']);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'assistant'
  });
  const [error, setError] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err: any) {
      setError(t('settings:users.load_error', 'Kullanıcılar yüklenemedi') + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (user: any) => {
    setEditingId(user.id);
    setFormData({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      password: '', // Boş bırak, sadece güncellenmek istenirse dolsun
      role: user.role
    });
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('settings:users.delete_confirm', 'Bu kullanıcıyı silmek istediğinize emin misiniz?'))) return;
    try {
      await deleteUser(id);
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload: any = { ...formData };
      if (!payload.password) {
        delete payload.password; // Eğer şifre girilmediyse, güncelleme esnasında şifreyi değiştirme
      }

      if (editingId) {
        await updateUser(editingId, payload);
      } else {
        await createUser(payload);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ username: '', email: '', first_name: '', last_name: '', password: '', role: 'assistant' });
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="p-4 text-gray-500">{t('common:loading', 'Yükleniyor...')}</div>;
  }

  return (
    <div className="space-y-6">
      {!showForm ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-gray-600" /> {t('settings:users.title', 'Personel Listesi')}
            </CardTitle>
            <Button onClick={() => setShowForm(true)} className="flex items-center gap-1" size="sm">
              <UserPlus className="w-4 h-4" /> {t('settings:users.add_new', 'Yeni Personel')}
            </Button>
          </CardHeader>
          <CardContent>
            {error && <div className="p-3 bg-red-50 text-red-600 mb-4 rounded text-sm">{error}</div>}
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">{t('settings:users.th_name', 'Ad Soyad')}</th>
                    <th className="px-4 py-3">{t('settings:users.th_username', 'Kullanıcı Adı')}</th>
                    <th className="px-4 py-3">{t('settings:users.th_role', 'Rol')}</th>
                    <th className="px-4 py-3 text-right">{t('settings:users.th_actions', 'İşlem')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{user.first_name} {user.last_name}</td>
                      <td className="px-4 py-3">{user.username}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'doctor' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role === 'admin' ? t('settings:users.role_admin', 'Yönetici') : user.role === 'doctor' ? t('settings:users.role_doctor', 'Hekim') : t('settings:users.role_assistant', 'Asistan')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleEdit(user)} className="text-indigo-600 hover:text-indigo-900 p-1"><Edit2 className="w-4 h-4"/></button>
                        {user.role !== 'admin' && (
                          <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900 p-1 ml-2"><Trash2 className="w-4 h-4"/></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{editingId ? t('settings:users.edit_title', 'Personeli Düzenle') : t('settings:users.create_title', 'Yeni Personel Ekle')}</CardTitle>
            <button onClick={() => { setShowForm(false); setEditingId(null); setError(''); }} className="text-gray-500 hover:text-gray-800"><X className="w-5 h-5"/></button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded text-sm">{error}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('settings:users.field_first_name', 'Ad')}</Label>
                  <Input name="first_name" value={formData.first_name} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>{t('settings:users.field_last_name', 'Soyad')}</Label>
                  <Input name="last_name" value={formData.last_name} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>{t('settings:users.field_username', 'Kullanıcı Adı (E-posta)')}</Label>
                  <Input name="username" type="email" value={formData.username} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>{t('settings:users.field_password', 'Şifre')} {editingId && <span className="text-xs text-gray-400">{t('settings:users.password_hint', '(Değiştirmek istemiyorsanız boş bırakın)')}</span>}</Label>
                  <Input name="password" type="password" value={formData.password} onChange={handleChange} required={!editingId} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>{t('settings:users.field_role', 'Rol')}</Label>
                  <select name="role" value={formData.role} onChange={handleChange} className="w-full h-10 px-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="assistant">{t('settings:users.role_assistant', 'Asistan')}</option>
                    <option value="doctor">{t('settings:users.role_doctor', 'Hekim')}</option>
                    <option value="admin">{t('settings:users.role_admin', 'Yönetici')}</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setError(''); }} className="mr-2">
                  {t('settings:users.btn_cancel', 'İptal')}
                </Button>
                <Button type="submit">
                  {editingId ? t('settings:users.btn_update', 'Güncelle') : t('settings:users.btn_save', 'Kaydet')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
