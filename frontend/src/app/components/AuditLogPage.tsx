import { useState, useEffect } from 'react';
import { getAuditLogs } from '../services/api';
import { useTranslation } from 'react-i18next';
import { Shield, ChevronLeft, ChevronRight, Search, Filter, Clock, User, FileText } from 'lucide-react';

interface AuditEntry {
  id: number;
  username: string;
  user_email: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  model_name: string;
  object_id: number;
  changes: Record<string, { old: string; new: string }> | null;
  ip_address: string | null;
  created_at: string;
}

const MODEL_LABELS: Record<string, string> = {
  patient: 'Hasta',
  appointment: 'Randevu',
  treatment: 'Tedavi',
  treatmenttype: 'Tedavi Türü',
  payment: 'Ödeme',
  document: 'Doküman',
  customuser: 'Kullanıcı',
  clinicsettings: 'Klinik Ayarları',
  anamnesis: 'Sağlık Geçmişi',
};

const ACTION_CONFIG: Record<string, { labelKey: string; color: string; bg: string }> = {
  CREATE: { labelKey: 'action_create', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  UPDATE: { labelKey: 'action_update', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  DELETE: { labelKey: 'action_delete', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

export default function AuditLogPage() {
  const { t, i18n } = useTranslation('common');
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterAction, setFilterAction] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const pageSize = 50;
  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs(page);
      setLogs(data.results || []);
      setTotalCount(data.count || 0);
    } catch (err) {
      console.error('Audit log load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getModelLabel = (modelName: string) => {
    const key = `model_${modelName.toLowerCase()}`;
    const translation = t(key);
    return translation !== key ? translation : MODEL_LABELS[modelName] || modelName;
  };

  const filteredLogs = logs.filter(log => {
    const matchAction = !filterAction || log.action === filterAction;
    const matchSearch = !searchTerm || 
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getModelLabel(log.model_name).toLowerCase().includes(searchTerm.toLowerCase());
    return matchAction && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('audit_logs')}</h1>
            <p className="text-sm text-gray-500">{t('audit_logs_subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white appearance-none cursor-pointer"
          >
            <option value="">{t('all_actions')}</option>
            <option value="CREATE">{t('action_create')}</option>
            <option value="UPDATE">{t('action_update')}</option>
            <option value="DELETE">{t('action_delete')}</option>
          </select>
        </div>
        <div className="text-sm text-gray-500 flex items-center gap-1 whitespace-nowrap">
          <FileText className="w-4 h-4" />
          {t('total_records')}: <strong className="text-gray-900">{totalCount}</strong> {t('records_label')}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{t('no_audit_logs')}</p>
            <p className="text-sm mt-1">{t('no_audit_logs_subtitle')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-200">
            <table className="w-full text-sm relative border-collapse">
              <thead className="sticky top-0 z-20 bg-gray-50 shadow-[inset_0_-1px_0_rgba(229,231,235,1)]">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider bg-gray-50">{t('th_datetime')}</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider bg-gray-50">{t('th_user')}</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider bg-gray-50">{t('th_action')}</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider bg-gray-50">{t('th_model')}</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider bg-gray-50">{t('th_record_id')}</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider bg-gray-50">{t('th_ip')}</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider bg-gray-50">{t('th_detail')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLogs.map((log) => {
                  const actionCfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.CREATE;
                  const isExpanded = expandedId === log.id;
                  const hasChanges = log.changes && Object.keys(log.changes).length > 0;

                  return (
                    <tr key={log.id} className="contents">
                      <tr
                        className={`hover:bg-gray-50/80 transition-colors ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900">{formatDate(log.created_at)}</div>
                              <div className="text-xs text-gray-400">{formatTime(log.created_at)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-indigo-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{log.username || 'System'}</div>
                              {log.user_email && <div className="text-xs text-gray-400">{log.user_email}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${actionCfg.bg} ${actionCfg.color}`}>
                            {t(actionCfg.labelKey)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap font-medium text-gray-700">
                          {getModelLabel(log.model_name)}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 font-mono text-xs">
                          #{log.object_id}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-gray-400 font-mono text-xs">
                          {log.ip_address || '—'}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {hasChanges ? (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : log.id)}
                              className="text-indigo-600 hover:text-indigo-800 text-xs font-medium hover:underline"
                            >
                              {isExpanded ? t('hide') : t('show')}
                            </button>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && hasChanges && (
                        <tr className="bg-gray-50/50">
                          <td colSpan={7} className="px-5 py-4 bg-gray-50/50">
                            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="bg-gray-50 border-b">
                                    <th className="text-left px-4 py-2 font-semibold text-gray-500">{t('field')}</th>
                                    <th className="text-left px-4 py-2 font-semibold text-gray-500">{t('old_value')}</th>
                                    <th className="text-left px-4 py-2 font-semibold text-gray-500">{t('new_value')}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {Object.entries(log.changes!).map(([field, vals]) => (
                                    <tr key={field} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 font-medium text-gray-700">{field}</td>
                                      <td className="px-4 py-2 text-red-600 font-mono">{vals.old || '—'}</td>
                                      <td className="px-4 py-2 text-emerald-600 font-mono">{vals.new || '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/30">
            <p className="text-sm text-gray-500">
              {t('page')} <strong>{page}</strong> / {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
