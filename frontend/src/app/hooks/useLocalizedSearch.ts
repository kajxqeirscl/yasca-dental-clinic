import { useTranslation } from 'react-i18next';

export function useLocalizedSearch() {
  const { i18n } = useTranslation();
  
  const getLang = () => i18n.language?.startsWith('tr') ? 'tr-TR' : 'en-US';

  const normalize = (str: string | undefined | null) => {
    if (!str) return '';
    return str.toLocaleLowerCase(getLang());
  };

  const match = (text: string | undefined | null, query: string) => {
    if (!query) return true;
    return normalize(text).includes(normalize(query));
  };

  return { normalize, match, lang: getLang() };
}
