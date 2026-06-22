import { useNavigate as useReactNavigate } from 'react-router-dom';
import { TENANT_SUBDOMAIN } from '../services/api';

/**
 * Canlı ortamda /app/:slug prefix'ini otomatik ekleyen navigate hook'u.
 * Lokal geliştirmede (subdomain modu) prefix eklenmez.
 */
export function useClinicNavigate() {
  const navigate = useReactNavigate();
  const basePath = TENANT_SUBDOMAIN ? `/app/${TENANT_SUBDOMAIN}` : '';
  
  return (path: string) => {
    // Mutlak path ise basePath ekle, değilse olduğu gibi bırak
    if (path.startsWith('/')) {
      navigate(`${basePath}${path}`);
    } else {
      navigate(path);
    }
  };
}
