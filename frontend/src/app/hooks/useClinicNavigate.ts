import { useNavigate as useReactNavigate } from 'react-router-dom';
import { TENANT_SUBDOMAIN } from '../services/api';

/**
 * Canlı ortamda /app/:slug prefix'ini otomatik ekleyen navigate hook'u.
 * Lokal geliştirmede (subdomain modu) prefix eklenmez.
 */
export function useClinicNavigate() {
  const navigate = useReactNavigate();
  
  return (path: string) => {
    navigate(path);
  };
}
