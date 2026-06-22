# Figma MCP Kurulumu (UML diyagramlarını Figma'da oluşturmak için)

> Amaç: Sunumun UML bölümü (Slayt 5) için **sınıf diyagramı + 2 kilit sekans**
> diyagramını Figma içinde oluşturmak, PNG olarak dışa aktarıp `.pptx`'e gömmek.

## Neden ek kurulum gerekiyor?

- **Resmî Figma Dev Mode MCP salt-okunurdur** (`get_design_context`, `get_screenshot`,
  `get_metadata`). Var olan tasarımı *okur*, Figma'da **yeni node oluşturamaz**.
  Kurduğumuz `figma-implement-design` skill'i de bu yönde çalışır (Figma → kod).
- Figma'da diyagram **oluşturmak** için **yazma-yetkili** bir MCP gerekir. Pratikte en
  yaygın olanı topluluk projesi **"Cursor Talk To Figma MCP"**'dir; bir Figma eklentisi
  (plugin) + bir websocket köprüsü üzerinden çalışır.

> ⚠️ **Güvenlik notu:** Aşağıdaki adımlar üçüncü-parti (resmî olmayan) bir paketi
> indirip çalıştırır ve proje tasarım verisini Figma'ya gönderir. Bu yüzden ajan
> bunu senin yerine otomatik kuramaz — kararı ve çalıştırmayı **sen** yapıyorsun.
> Paketi kurmadan önce kaynağına bakmak istersen:
> https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp

---

## Ön koşullar

| Gereksinim | Durum (bu makine) | Komut |
|------------|-------------------|-------|
| Node.js    | ✅ kurulu          | `node -v` |
| Bun        | ❌ yok — kurulması gerek | `npm install -g bun` |
| Figma Desktop | gerekli         | https://www.figma.com/downloads/ |

## Adımlar

### 1) Bun'ı kur
```powershell
npm install -g bun
bun --version   # doğrula
```

### 2) Websocket köprüsünü çalıştır (ayrı bir terminalde açık bırak)
```powershell
bunx cursor-talk-to-figma-socket
```
Bu terminal açık kalmalı; diyagramları oluştururken köprü görevi görür.

### 3) Figma eklentisini kur ve bir dosyaya bağla
- Figma Desktop'ta yeni bir tasarım dosyası aç (ör. "Yaşca UML").
- **Cursor Talk To Figma** eklentisini kur:
  Figma → Menu → Plugins → Development → "Import plugin from manifest…" ile
  repodaki `src/cursor_mcp_plugin/manifest.json` dosyasını seç
  (depoyu klonla: `git clone https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp`).
- Eklentiyi çalıştır → **Connect** → bir **channel** adı verir (ör. `abcd1234`). Bu adı not al.

### 4) MCP sunucusunu Claude Code'a tanıt
Proje kökünde `.mcp.json` oluştur (aşağıdaki içerikle) **veya** şu komutu çalıştır:
```powershell
claude mcp add TalkToFigma -- bunx cursor-talk-to-figma-mcp@latest
```
`.mcp.json` içeriği (alternatif):
```json
{
  "mcpServers": {
    "TalkToFigma": {
      "command": "bunx",
      "args": ["cursor-talk-to-figma-mcp@latest"]
    }
  }
}
```

### 5) Claude Code'u yeniden başlat
MCP sunucuları yalnızca yeniden başlatınca yüklenir. Yeniden başlattıktan sonra
`/mcp` ile `TalkToFigma` sunucusunun ve araçlarının (örn. `create_frame`,
`create_rectangle`, `create_text`, `create_connector`, `join_channel`,
`export_node_as_image`) listelendiğini doğrula.

### 6) Bana haber ver
Yeniden başlattıktan sonra bana **channel adını** (Adım 3) ver:
> "Figma hazır, channel: `abcd1234`"

Ben şunları yapacağım:
1. `join_channel("abcd1234")`
2. `docs/uml/class_diagram_part1_domain.puml`, `docs/uml/seq_auth_login.puml` ve
   `docs/uml/seq_create_appointment_with_conflict_check.puml` tanımlarından
   **sınıf diyagramı + 2 sekans diyagramını** Figma frame'leri olarak oluştururum.
3. Her frame'i `export_node_as_image` ile PNG olarak dışa aktarırım.
4. `scripts/build_presentation.py` Slayt 5'i bu PNG'leri gömecek şekilde güncellerim.

---

## Kurmak istemezsen — yerel alternatif (kurulum gerektirmez)

Aynı sonucu (sunumda gerçek UML görselleri) **Figma olmadan** da elde edebiliriz:
`docs/uml/*.puml` tanımlarından sınıf + 2 sekans diyagramını doğrudan **PowerPoint'te
yüksek kaliteli, düzenlenebilir vektörel şekiller** olarak çizerim (bölmeli sınıf
kutuları, kardinalite etiketli oklar, sekans için lifeline + mesaj okları). Tamamen
yerel, hemen yapılır. İstersen "yerel çiz" de, Slayt 5'i öyle yenileyeyim.
