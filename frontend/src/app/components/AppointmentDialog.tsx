import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface AppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: { date: string; time: string } | null;
}

export default function AppointmentDialog({
  isOpen,
  onClose,
  selectedSlot,
}: AppointmentDialogProps) {
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    // Save appointment logic here
    console.log('Saving appointment:', {
      date: selectedSlot?.date,
      time: selectedSlot?.time,
      patientName,
      patientPhone,
      treatment,
      notes,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Randevu Ekle</DialogTitle>
          <DialogDescription>
            Randevu bilgilerini girin ve kaydedin.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tarih</Label>
              <Input
                value={selectedSlot?.date || ''}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label>Saat</Label>
              <Input
                value={selectedSlot?.time || ''}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="patientName">Hasta Adı Soyadı</Label>
            <Input
              id="patientName"
              placeholder="Örn: Ahmet Yılmaz"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="patientPhone">Telefon</Label>
            <Input
              id="patientPhone"
              type="tel"
              placeholder="0532 123 4567"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="treatment">İşlem</Label>
            <Input
              id="treatment"
              placeholder="Örn: Dolgu, Kanal Tedavisi"
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              placeholder="Ek bilgiler..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button onClick={handleSave}>
            Kaydet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}