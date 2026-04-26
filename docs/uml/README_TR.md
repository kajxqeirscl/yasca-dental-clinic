# PlantUML Diyagramlarini Goruntuleme ve Cikti Alma

Bu klasorde bulunan `.puml` dosyalari:

- `seq_auth_login.puml`
- `seq_patient_registration_update.puml`
- `seq_create_appointment_with_conflict_check.puml`
- `seq_add_treatment_and_payment.puml`
- `seq_update_clinic_settings.puml`
- `seq_dashboard_today.puml`
- `class_diagram_overall.puml`
- `class_diagram_part1_domain.puml`
- `class_diagram_part2_application.puml`

## 1) Hızlı goruntuleme (online)

1. [PlantUML Online Server](https://www.plantuml.com/plantuml/uml/) adresine girin.
2. Ilgili `.puml` dosyasinin icerigini kopyalayip editore yapistirin.
3. Diyagram otomatik olusur.
4. PNG/SVG olarak indirebilirsiniz.

## 2) VS Code / Cursor icinde goruntuleme

1. `PlantUML` eklentisini kurun.
2. Herhangi bir `.puml` dosyasini acin.
3. Komut paletinden `PlantUML: Preview Current Diagram` calistirin.
4. `PlantUML: Export Current Diagram` ile PNG/SVG/PDF disa aktarabilirsiniz (eklentinin kurulumuna gore).

## 3) Terminalden toplu export (onerilen)

### Gereksinimler
- Java (JRE/JDK)
- PlantUML jar veya plantuml komutu
- (PDF icin) Graphviz kurulu olmasi faydali

### Ornek komutlar (PowerShell)

`docs/uml` klasorunde calistirin:

```powershell
plantuml -tpng *.puml
```

```powershell
plantuml -tsvg *.puml
```

```powershell
plantuml -tpdf *.puml
```

Bu komutlar her diyagram icin ayni isimde `.png`, `.svg`, `.pdf` ciktilari uretir.

## 4) Rapor PDF teslimi icin pratik oneriler

1. Sekans diyagramlarinin PNG/SVG ciktilarini alin.
2. Word/Docs dosyasina 12 punto Times New Roman ve 1.5 satir araligi ile aciklamalarinizi ekleyin.
3. Diyagram gorsellerini ilgili basliklar altina yerlestirin.
4. Belgeyi `Grup_ID_Proje_Adım1.pdf` ismiyle PDF'e cevirin.
