import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CATEGORY_OPTIONS, type TreatmentCategory } from './TreatmentTypesPage';
import { useTranslation } from 'react-i18next';

// Diş numaraları - FDI Sistemi

// Olgun Dişler (Yetişkin)
const upperTeethAdult = [
  [18, 17, 16, 15, 14, 13, 12, 11], // Üst sağ
  [21, 22, 23, 24, 25, 26, 27, 28], // Üst sol
];

const lowerTeethAdult = [
  [48, 47, 46, 45, 44, 43, 42, 41], // Alt sağ
  [31, 32, 33, 34, 35, 36, 37, 38], // Alt sol
];

// Süt Dişleri (Çocuk)
const upperTeethPrimary = [
  [55, 54, 53, 52, 51], // Üst sağ
  [61, 62, 63, 64, 65], // Üst sol
];

const lowerTeethPrimary = [
  [85, 84, 83, 82, 81], // Alt sağ
  [71, 72, 73, 74, 75], // Alt sol
];

/**
 * ToothStatus directly maps to TreatmentCategory values (plus 'healthy').
 * DentalChart no longer does any string matching — it reads treatment_type_category
 * from the API response directly.
 */
type ToothStatus = 'healthy' | TreatmentCategory;

const statusColors: Record<ToothStatus, string> = {
  healthy:   'bg-white',
  filling:   'bg-blue-200 border-blue-400',
  canal:     'bg-red-200 border-red-400',
  crown:     'bg-yellow-200 border-yellow-400',
  extraction:'bg-gray-300 border-gray-500',
  implant:   'bg-purple-200 border-purple-400',
  detartraj: 'bg-green-200 border-green-400',
  other:     'bg-orange-100 border-orange-300',
};



const STATUS_DISPLAY = (t: any): { status: ToothStatus; label: string }[] => [
  { status: 'healthy',   label: t('treatments:chart.status.healthy') },
  ...CATEGORY_OPTIONS.map((c) => ({ status: c.value as ToothStatus, label: t(c.labelKey) })),
];

interface Treatment {
  id: number;
  teeth?: string[];
  treatment_type_category?: string;
  treatment_name?: string;
  treatment_type_name?: string;
}

interface DentalChartProps {
  /** Called when user clicks "Yeni Tedavi Ekle" for selected teeth or region. */
  onToothSelect?: (toothNumbers: number[], region?: string) => void;
  /** Called when user wants to edit an existing treatment. */
  onEditTreatment?: (treatment: Treatment) => void;
  treatments?: Treatment[];
}

export default function DentalChart({ onToothSelect, onEditTreatment, treatments = [] }: DentalChartProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'adult' | 'primary'>('adult');
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  const toggleTooth = (number: number) => {
    setSelectedRegion(''); // Clear region selection when selecting a tooth
    setSelectedTeeth((prev) =>
      prev.includes(number) ? prev.filter((n) => n !== number) : [...prev, number]
    );
  };

  const handleRegionClick = (region: string) => {
    setSelectedTeeth([]); // Clear teeth selection when selecting a region
    setSelectedRegion(prev => prev === region ? '' : region);
  };

  /**
   * Determine the status of a tooth purely from treatment_type_category.
   */
  const getToothStatus = (toothNumber: number): ToothStatus => {
    const toothTreatments = treatments.filter(
      (t) => t.teeth?.includes(toothNumber.toString())
    );
    if (toothTreatments.length === 0) return 'healthy';

    // API returns newest-first; use the most recent treatment's category.
    const category = toothTreatments[0].treatment_type_category;
    if (category && category in statusColors) return category as ToothStatus;
    return 'healthy';
  };

  const getToothTreatments = (toothNumber: number) => {
    return treatments.filter((t) => t.teeth?.includes(toothNumber.toString()));
  };

  const ToothButton = ({ number, isPrimary = false }: { number: number; isPrimary?: boolean }) => {
    const status = getToothStatus(number);
    const isSelected = selectedTeeth.includes(number);

    return (
      <Button
        variant="outline"
        onClick={() => toggleTooth(number)}
        className={`w-12 h-16 p-1 flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 ${statusColors[status]} ${isPrimary ? 'opacity-90' : ''} ${isSelected ? 'ring-2 ring-blue-600 ring-offset-2 scale-105' : ''}`}
      >
        <span className={`text-xs ${isPrimary ? 'font-semibold text-blue-600' : ''}`}>{number}</span>
        <svg
          viewBox="0 0 24 36"
          className={`${isPrimary ? 'w-5 h-7' : 'w-6 h-9'}`}
          fill="currentColor"
        >
          <path d="M12 0 C6 0 3 4 3 8 L3 24 C3 30 6 36 12 36 C18 36 21 30 21 24 L21 8 C21 4 18 0 12 0 Z M12 2 C17 2 19 5 19 8 L19 24 C19 29 17 34 12 34 C7 34 5 29 5 24 L5 8 C5 5 7 2 12 2 Z" />
        </svg>
      </Button>
    );
  };

  const renderSelectedTeethActions = () => {
    if (selectedTeeth.length === 0 && !selectedRegion) return null;

    const singleToothTreatments = selectedTeeth.length === 1 
      ? treatments.filter(t => t.teeth?.includes(selectedTeeth[0].toString()))
      : selectedRegion 
        ? treatments.filter(t => t.teeth?.includes(selectedRegion))
        : [];

    const regionLabels: Record<string, string> = {
      ust_cene: 'Üst Çene',
      alt_cene: 'Alt Çene',
      sag_ust: 'Sağ Üst',
      sol_ust: 'Sol Üst',
      sag_alt: 'Sağ Alt',
      sol_alt: 'Sol Alt'
    };

    return (
      <div className="mt-6 p-4 border rounded-lg bg-gray-50/50">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="font-medium text-gray-800">
            {selectedRegion ? `${regionLabels[selectedRegion]} seçili` : `${selectedTeeth.length} diş seçili`}
          </div>
          <Button onClick={() => onToothSelect?.(selectedTeeth, selectedRegion)} className="bg-blue-600 hover:bg-blue-700">
            {t('treatments:chart.new', 'Yeni Tedavi Ekle')}
          </Button>
        </div>
        
        {singleToothTreatments.length > 0 && (
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase">Mevcut Tedaviler</p>
            {singleToothTreatments.map(tr => (
              <div key={tr.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                <span className="text-sm font-medium">{tr.treatment_type_name || tr.treatment_name}</span>
                <Button variant="ghost" size="sm" onClick={() => onEditTreatment?.(tr)} className="text-blue-600 hover:bg-blue-100 h-8 px-2">
                  Düzenle
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTeethChart = (
    upperTeeth: number[][],
    lowerTeeth: number[][],
    isPrimary: boolean = false
  ) => (
    <div className="space-y-8">
      {/* Üst Çene */}
      <div className="space-y-4">
        <div className="flex justify-center gap-4">
          <Button variant={selectedRegion === 'sag_ust' ? 'default' : 'outline'} size="sm" onClick={() => handleRegionClick('sag_ust')}>
            Sağ Üst
          </Button>
          <Button variant={selectedRegion === 'ust_cene' ? 'default' : 'outline'} size="sm" onClick={() => handleRegionClick('ust_cene')}>
            Üst Çene
          </Button>
          <Button variant={selectedRegion === 'sol_ust' ? 'default' : 'outline'} size="sm" onClick={() => handleRegionClick('sol_ust')}>
            Sol Üst
          </Button>
        </div>
        <div className="flex justify-center gap-8">
          <div className="flex gap-1">
            {upperTeeth[0].map((tooth) => (
              <ToothButton key={tooth} number={tooth} isPrimary={isPrimary} />
            ))}
          </div>
          <div className="flex gap-1">
            {upperTeeth[1].map((tooth) => (
              <ToothButton key={tooth} number={tooth} isPrimary={isPrimary} />
            ))}
          </div>
        </div>
      </div>

      {/* Alt Çene */}
      <div className="space-y-4">
        <div className="flex justify-center gap-4">
          <Button variant={selectedRegion === 'sag_alt' ? 'default' : 'outline'} size="sm" onClick={() => handleRegionClick('sag_alt')}>
            Sağ Alt
          </Button>
          <Button variant={selectedRegion === 'alt_cene' ? 'default' : 'outline'} size="sm" onClick={() => handleRegionClick('alt_cene')}>
            Alt Çene
          </Button>
          <Button variant={selectedRegion === 'sol_alt' ? 'default' : 'outline'} size="sm" onClick={() => handleRegionClick('sol_alt')}>
            Sol Alt
          </Button>
        </div>
        <div className="flex justify-center gap-8">
          <div className="flex gap-1">
            {lowerTeeth[0].map((tooth) => (
              <ToothButton key={tooth} number={tooth} isPrimary={isPrimary} />
            ))}
          </div>
          <div className="flex gap-1">
            {lowerTeeth[1].map((tooth) => (
              <ToothButton key={tooth} number={tooth} isPrimary={isPrimary} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'adult' | 'primary')}>
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="adult">{t('treatments:chart.adult')}</TabsTrigger>
          <TabsTrigger value="primary">{t('treatments:chart.primary')}</TabsTrigger>
        </TabsList>

        <TabsContent value="adult" className="mt-6">
          {renderTeethChart(upperTeethAdult, lowerTeethAdult, false)}
        </TabsContent>

        <TabsContent value="primary" className="mt-6">
          {renderTeethChart(upperTeethPrimary, lowerTeethPrimary, true)}
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap justify-center gap-4 pt-6 border-t">
        {STATUS_DISPLAY(t).map(({ status, label }) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`w-6 h-6 border-2 rounded ${statusColors[status]}`} />
            <span className="text-xs text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      {renderSelectedTeethActions()}
    </div>
  );
}
