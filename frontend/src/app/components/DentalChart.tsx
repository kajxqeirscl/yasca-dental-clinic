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

type ToothStatus = 'healthy' | 'filling' | 'canal' | 'crown' | 'extraction' | 'implant' | 'detartraj';

interface ToothData {
  number: number;
  status: ToothStatus;
  note: string;
}

const statusColors: Record<ToothStatus, string> = {
  healthy: 'bg-white',
  filling: 'bg-blue-200 border-blue-400',
  canal: 'bg-red-200 border-red-400',
  crown: 'bg-yellow-200 border-yellow-400',
  extraction: 'bg-gray-300 border-gray-500',
  implant: 'bg-purple-200 border-purple-400',
  detartraj: 'bg-green-200 border-green-400',
};

const statusLabels: Record<ToothStatus, string> = {
  healthy: 'Sağlıklı',
  filling: 'Dolgu',
  canal: 'Kanal Tedavisi',
  crown: 'Kron',
  extraction: 'Çekildi',
  implant: 'İmplant',
  detartraj: 'Detartraj',
};

interface DentalChartProps {
  onToothSelect?: (toothNumber: number) => void;
}

export default function DentalChart({ onToothSelect }: DentalChartProps) {
  const [teethData, setTeethData] = useState<Record<number, ToothData>>({});
  const [activeTab, setActiveTab] = useState<'adult' | 'primary'>('adult');

  const handleToothClick = (toothNumber: number, status: ToothStatus) => {
    setTeethData((prev) => ({
      ...prev,
      [toothNumber]: {
        number: toothNumber,
        status,
        note: '',
      },
    }));
  };

  const getToothStatus = (toothNumber: number): ToothStatus => {
    return teethData[toothNumber]?.status || 'healthy';
  };

  const ToothButton = ({ number, isPrimary = false }: { number: number; isPrimary?: boolean }) => {
    const status = getToothStatus(number);
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`w-12 h-16 p-1 flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 ${statusColors[status]} ${isPrimary ? 'opacity-90' : ''}`}
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
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuLabel>Diş {number} - İşlem Seç</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onToothSelect?.(number)} className="font-medium text-blue-600 focus:text-blue-700 cursor-pointer">
            + Yeni Tedavi Ekle
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleToothClick(number, 'healthy')}>
            Sağlıklı
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleToothClick(number, 'filling')}>
            Dolgu
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleToothClick(number, 'canal')}>
            Kanal Tedavisi
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleToothClick(number, 'crown')}>
            Kron
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleToothClick(number, 'extraction')}>
            Çekildi
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleToothClick(number, 'implant')}>
            İmplant
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleToothClick(number, 'detartraj')}>
            Detartraj
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
        <h3 className="text-center text-sm text-gray-600">Üst Çene</h3>
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
        <h3 className="text-center text-sm text-gray-600">Alt Çene</h3>
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
          <TabsTrigger value="adult">Olgun Dişler</TabsTrigger>
          <TabsTrigger value="primary">Süt Dişleri</TabsTrigger>
        </TabsList>

        <TabsContent value="adult" className="mt-6">
          {renderTeethChart(upperTeethAdult, lowerTeethAdult, false)}
        </TabsContent>

        <TabsContent value="primary" className="mt-6">
          {renderTeethChart(upperTeethPrimary, lowerTeethPrimary, true)}
        </TabsContent>
      </Tabs>

      {/* Renk Açıklaması */}
      <div className="flex flex-wrap justify-center gap-4 pt-6 border-t">
        {Object.entries(statusLabels).map(([status, label]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`w-6 h-6 border-2 rounded ${statusColors[status as ToothStatus]}`} />
            <span className="text-sm text-gray-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
