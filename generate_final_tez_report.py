# -*- coding: utf-8 -*-
"""
Yasca Dental Clinic - Bitirme Projesi Final Raporu
Ders: Python Projelerinde Yapay Zeka Kullanimi
ISTUN Muhendislik ve Doga Bilimleri Fakultesi
"""

from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import os

BASE = r"c:\Users\Ali\yasca-dental-clinic"
SS = r"C:\Users\Ali\.gemini\antigravity-ide\brain\574ceb4e-bc73-4dce-b3e0-c86fd8757753"
DIAG = os.path.join(BASE, "docs", "diagrams")
OUT = os.path.join(BASE, "Grup4_Yasca_Bitirme_Projesi_Raporu.docx")

def shading(cell, color):
    s = OxmlElement('w:shd')
    s.set(qn('w:fill'), color)
    s.set(qn('w:val'), 'clear')
    cell._tc.get_or_add_tcPr().append(s)

def p(doc, text, sz=12, bold=False, align=None, sa=6, sb=0, indent=None, color=None, italic=False):
    para = doc.add_paragraph()
    r = para.add_run(text)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(sz)
    if bold: r.bold = True
    if italic: r.italic = True
    if color: r.font.color.rgb = RGBColor(*color)
    if align is not None: para.alignment = align
    pf = para.paragraph_format
    pf.space_after = Pt(sa)
    pf.space_before = Pt(sb)
    if indent: pf.first_line_indent = Cm(indent)
    return para

def h(doc, text, level=1, sb=12, sa=6):
    hd = doc.add_heading(text, level=level)
    for r in hd.runs:
        r.font.name = 'Times New Roman'
        r.font.color.rgb = RGBColor(0, 0, 0)
    hd.paragraph_format.space_before = Pt(sb)
    hd.paragraph_format.space_after = Pt(sa)
    return hd

def tbl(doc, headers, rows, widths=None):
    t = doc.add_table(rows=1+len(rows), cols=len(headers))
    t.style = 'Table Grid'
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, hdr in enumerate(headers):
        c = t.rows[0].cells[i]
        c.text = hdr
        for pp in c.paragraphs:
            pp.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for rr in pp.runs:
                rr.bold = True
                rr.font.name = 'Times New Roman'
                rr.font.size = Pt(10)
        shading(c, 'D9E2F3')
    for ri, rd in enumerate(rows):
        for ci, ct in enumerate(rd):
            c = t.rows[ri+1].cells[ci]
            c.text = str(ct)
            for pp in c.paragraphs:
                for rr in pp.runs:
                    rr.font.name = 'Times New Roman'
                    rr.font.size = Pt(10)
    if widths:
        for i, w in enumerate(widths):
            for row in t.rows:
                row.cells[i].width = Cm(w)
    return t

def img(doc, path, w=5.5, cap=None):
    if not os.path.exists(path):
        p(doc, f"[Resim bulunamadi: {os.path.basename(path)}]", sz=10, color=(255,0,0))
        return
    try:
        doc.add_picture(path, width=Inches(w))
        doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
        if cap:
            p(doc, cap, sz=10, align=WD_ALIGN_PARAGRAPH.CENTER, sa=12, bold=True)
    except Exception as e:
        p(doc, f"[Resim hatasi: {e}]", sz=10, color=(255,0,0))

def code(doc, text):
    para = doc.add_paragraph()
    r = para.add_run(text)
    r.font.name = 'Consolas'
    r.font.size = Pt(9)
    para.paragraph_format.space_before = Pt(6)
    para.paragraph_format.space_after = Pt(6)
    s = OxmlElement('w:shd')
    s.set(qn('w:fill'), 'F5F5F5')
    s.set(qn('w:val'), 'clear')
    para._element.get_or_add_pPr().append(s)

def bullet(doc, text, sz=11):
    p(doc, text, sz=sz, sa=3)

# ============================================================================
doc = Document()
for sec in doc.sections:
    sec.top_margin = Cm(2.5)
    sec.bottom_margin = Cm(2.5)
    sec.left_margin = Cm(2.5)
    sec.right_margin = Cm(2.5)
style = doc.styles['Normal']
style.font.name = 'Times New Roman'
style.font.size = Pt(12)

# ==================== KAPAK ====================
p(doc, "T.C.", sz=14, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sb=36)
p(doc, "ISTANBUL SAGLIK VE TEKNOLOJI UNIVERSITESI", sz=14, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)
p(doc, "MUHENDISLIK VE DOGA BILIMLERI FAKULTESI", sz=14, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sa=24)
p(doc, "LISANS BITIRME PROJESI", sz=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sa=12)
p(doc, "Ders: Python Projelerinde Yapay Zeka Kullanimi", sz=13, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sa=36)
p(doc, "YASCA: COKLU KIRACILI DIS KLINIGI", sz=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sa=3)
p(doc, "YONETIM SaaS PLATFORMU", sz=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sa=48)

for name in ["Yaman Halloum", "Ali Ure", "Cihan Kurtbey", "Sukru Yesilmen"]:
    p(doc, name, sz=12, align=WD_ALIGN_PARAGRAPH.CENTER, sa=3)
p(doc, "", sz=12, sa=24)
p(doc, "Danismani: Ogr. Gor. Oguz Oztoprak", sz=12, align=WD_ALIGN_PARAGRAPH.CENTER)
p(doc, "Yazilim Muhendisligi Bolumu", sz=12, align=WD_ALIGN_PARAGRAPH.CENTER, sa=48)
p(doc, "ISTANBUL - 2025", sz=14, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)
doc.add_page_break()

# ==================== ONAY ====================
p(doc, "T.C.", sz=12, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sb=24)
p(doc, "ISTANBUL SAGLIK VE TEKNOLOJI UNIVERSITESI", sz=12, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)
p(doc, "MUHENDISLIK VE DOGA BILIMLERI FAKULTESI", sz=12, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sa=18)
p(doc, "BITIRME PROJESI ONAYI", sz=14, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sa=18)
p(doc, "Hazirlayan: Yaman Halloum, Ali Ure, Cihan Kurtbey, Sukru Yesilmen", sz=12)
p(doc, "Proje Basligi: Yasca - Coklu Kiracili Dis Klinigi Yonetim SaaS Platformu", sz=12)
p(doc, "Sinav Tarihi: ......./......./2025", sz=12, sa=24)
p(doc, "Danismani ve Bitirme projesi sinav jurisi degerlendirmesi sonucu ogrenci ... bulunmustur.", sz=12, sa=18)
t = doc.add_table(rows=4, cols=3)
t.style = 'Table Grid'
for i, hdr in enumerate(["Unvan, Ad Soyad", "Gorev", "Imza"]):
    t.rows[0].cells[i].text = hdr
    for pp in t.rows[0].cells[i].paragraphs:
        for rr in pp.runs: rr.bold = True; rr.font.name = 'Times New Roman'; rr.font.size = Pt(11)
    shading(t.rows[0].cells[i], 'D9E2F3')
for ri, (n, g) in enumerate([("Ogr. Gor. Oguz Oztoprak","Danismani"),("","Juri Uyesi"),("","Juri Uyesi")]):
    t.rows[ri+1].cells[0].text = n
    t.rows[ri+1].cells[1].text = g
doc.add_page_break()

# ==================== BEYAN ====================
p(doc, "BEYAN", sz=14, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sb=24, sa=18)
p(doc, "Bu projenin bize ait oldugunu, tum asamalarinda etik disi davranisimizin olmadigini, icinde yer alan butun bilgileri akademik ve etik kurallar icinde elde ettigimizi, kullanmis oldugumuz butun bilgilere kaynak gosterdigimizi, bu projenin Istanbul Saglik ve Teknoloji Universitesi Muhendislik ve Doga Bilimleri Fakultesi Bitirme Projesi Yonergesine uygun olarak hazirlandigini beyan ederiz.", sz=12, indent=1.25, sa=36)
for name in ["Yaman Halloum", "Ali Ure", "Cihan Kurtbey", "Sukru Yesilmen"]:
    p(doc, f"{name} .......................", sz=12, sa=6)
doc.add_page_break()

# ==================== ONSOZ ====================
p(doc, "ONSOZ", sz=14, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sb=24, sa=18)
p(doc, "Bu bitirme projesi kapsaminda, dis klinikleri icin modern ve olceklenebilir bir SaaS yonetim platformu olan Yasca'yi gelistirdik. Proje suresince yazilim muhendisliginin temel prensiplerini uygulama firsati bulduk ve yapay zeka araclarini gelistirme sureclerimize entegre ederek verimlilik ve kalite konusunda onemli kazanimlar elde ettik.", sz=12, indent=1.25)
p(doc, "Projemizin her asamasinda bize rehberlik eden danismanmiz Ogr. Gor. Oguz Oztoprak'a, bilgi ve deneyimlerini paylasan hocalarimiza ve destek veren ailelerimize tesekkur ederiz.", sz=12, indent=1.25)
p(doc, "Haziran 2025, Istanbul", sz=12, align=WD_ALIGN_PARAGRAPH.RIGHT, sb=18)
p(doc, "Grup 4", sz=12, align=WD_ALIGN_PARAGRAPH.RIGHT)
doc.add_page_break()

# ==================== OZET ====================
p(doc, "OZET", sz=14, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sb=24, sa=12)
p(doc, "YASCA: COKLU KIRACILI DIS KLINIGI YONETIM SaaS PLATFORMU", sz=12, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sa=12)
p(doc, "Bu proje, dis kliniklerinin operasyonel is akislarini dijitallestirmek, veri guvenligini saglamak ve klinik verimliligini artirmak amaciyla gelistirilen acik kaynakli, coklu kiracili (multi-tenant) bir SaaS uygulamasidir. Yasca, Django REST Framework tabanli backend ve React.js tabanli frontend ile gelistirilmis olup, django-tenants kutuphanesi kullanilarak her klinik icin izole PostgreSQL sema yapisi sunmaktadir. Sistem; hasta, randevu, tedavi, odeme yonetimi, dental sema (FDI), rol bazli erisim kontrolu (RBAC), islem gecmisi (Audit Log) ve coklu dil destegi gibi kapsamli ozellikler icermektedir. Proje suresince yapay zeka araclari (GitHub Copilot, ChatGPT, Cursor AI, Claude Code) aktif olarak kullanilmis; kod uretimi, test yazimi, hata ayiklama ve dokumantasyon sureclerinde onemli verimlilik artislari saglanmistir. 403 adet test ile %78 backend ve %57 frontend coverage degerlerine ulasilmistir.", sz=12, indent=1.25)
p(doc, "Anahtar Kelimeler: Multi-tenant SaaS, Django REST Framework, React.js, Yapay Zeka, Dis Klinigi Yonetimi", sz=12, sb=12, bold=True)
doc.add_page_break()

# ==================== ABSTRACT ====================
p(doc, "ABSTRACT", sz=14, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sb=24, sa=12)
p(doc, "YASCA: MULTI-TENANT DENTAL CLINIC MANAGEMENT SaaS PLATFORM", sz=12, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sa=12)
p(doc, "This project is an open-source, multi-tenant SaaS application developed to digitize the operational workflows of dental clinics, ensure data security, and increase clinical efficiency. Yasca is built with a Django REST Framework backend and React.js frontend, utilizing the django-tenants library to provide isolated PostgreSQL schema structures for each clinic. The system includes comprehensive features such as patient, appointment, treatment, and payment management, dental charting (FDI), role-based access control (RBAC), audit logging, and multilingual support. Throughout the development process, AI tools (GitHub Copilot, ChatGPT, Cursor AI, Claude Code) were actively employed, yielding significant productivity gains in code generation, test writing, debugging, and documentation. A total of 403 tests were created with 78% backend and 57% frontend code coverage.", sz=12, indent=1.25)
p(doc, "Keywords: Multi-tenant SaaS, Django REST Framework, React.js, Artificial Intelligence, Dental Clinic Management", sz=12, sb=12, bold=True)
doc.add_page_break()

# ==================== ICINDEKILER (placeholder) ====================
p(doc, "I C I N D E K I L E R", sz=14, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sb=24, sa=24)
p(doc, "[Bu bolum Word'de otomatik olusturulacaktir - Referanslar > Icindekiler Tablosu]", sz=11, align=WD_ALIGN_PARAGRAPH.CENTER, color=(128,128,128))
doc.add_page_break()

# ==================== KISALTMALAR ====================
p(doc, "SIMGELER VE KISALTMALAR", sz=14, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sb=24, sa=18)
tbl(doc, ["Kisaltma", "Aciklama"], [
    ["SaaS", "Software as a Service"], ["API", "Application Programming Interface"],
    ["REST", "Representational State Transfer"], ["DRF", "Django REST Framework"],
    ["JWT", "JSON Web Token"], ["RBAC", "Role-Based Access Control"],
    ["CRUD", "Create, Read, Update, Delete"], ["CI/CD", "Continuous Integration / Continuous Delivery"],
    ["E2E", "End-to-End Test"], ["A11y", "Accessibility (Erisilebilirlik)"],
    ["WCAG", "Web Content Accessibility Guidelines"], ["FDI", "Uluslararasi Dis Numaralandirma Sistemi"],
    ["KVKK", "Kisisel Verilerin Korunmasi Kanunu"], ["ORM", "Object-Relational Mapping"],
    ["MSW", "Mock Service Worker"], ["UI/UX", "User Interface / User Experience"],
    ["PR", "Pull Request"], ["ADR", "Architecture Decision Record"],
], widths=[3, 13])
doc.add_page_break()

# ====================================================================
# BOLUM 1 - GIRIS-TANIM
# ====================================================================
h(doc, "1. GIRIS VE TANIM", level=1)
p(doc, "Bu proje, 'Python Projelerinde Yapay Zeka Kullanimi' dersi kapsaminda hazirlanan bir bitirme projesidir. Proje, dis kliniklerinin gunluk operasyonlarini dijital ortama tasiyarak klinik verimliligini artiran, veri guvenligini saglayan ve olceklenebilir bir yapida hizmet sunan modern bir SaaS (Software as a Service) platformu gelistirmeyi amaclamaktadir.", sz=12, indent=1.25)
p(doc, "Yasca adi verilen bu platform, coklu kiracili (multi-tenant) mimarisi sayesinde tek bir yazilim kurulumu uzerinden birden fazla dis klinigine es zamanli olarak hizmet verebilmektedir. Her klinik icin fiziksel duzey veri izolasyonu saglayan PostgreSQL schema-based yaklasim kullanilmaktadir.", sz=12, indent=1.25)
p(doc, "Projenin kapsami; hasta kaydi ve anamnez yonetimi, randevu planlama ve cakisma kontrolu, tedavi ve odeme takibi, dental sema (FDI dis numaralandirma) sistemi, dokuman yonetimi, rol bazli erisim kontrolu (RBAC), islem gecmisi (Audit Log) kayitlari, klinik ayarlari yonetimi ve cok dilli destek (Turkce/Ingilizce) gibi temel is sureclerini kapsamaktadir.", sz=12, indent=1.25)
p(doc, "Ek olarak, proje gelistirme surecinde yapay zeka araclarinin (GitHub Copilot, ChatGPT, Cursor AI, Claude Code, Gemini) etkin kullaniminin yazilim gelistirme sureclerine etkisi de calismada detayli olarak ele alinmistir.", sz=12, indent=1.25)
doc.add_page_break()

# ====================================================================
# BOLUM 2 - PROJE YAKLASIMI VE MIMARI BAGLAM
# ====================================================================
h(doc, "2. PROJE YAKLASIMI VE MIMARI BAGLAM", level=1)
p(doc, "Yasca projesi, API-First monolitik mimari yaklasimini benimsemistir. Backend tarafinda Django monoliti tek bir servis olarak calismakta, frontend ise ayri bir React SPA (Single Page Application) olarak backend API'larini tuketmektedir. Bu yaklasim, kucuk-orta olcekli takimlar icin hizli gelistirme dongusu saglamakta ve operasyonel karmasikligi azaltmaktadir.", sz=12, indent=1.25)

h(doc, "2.1 Mimari Yaklasimi", level=2)
p(doc, "Proje monolitik (monolithic) bir yaklasim benimsemistir. Mikro-servis mimarisi yerine monolitin tercih edilme sebepleri:", sz=12, indent=1.25)
for item in [
    "4 kisilik kucuk takim icin operasyonel karmasikligin dusuk tutulmasi",
    "Tek deployment birimi ile bakim kolayligi",
    "Django-tenants kutuphanesinin monolitik yapiyla uyumu",
    "Gelistirme hizi: Tek repo (monorepo) ile hizli iterasyon",
    "API-First yaklasim: Frontend ve backend arasinda acik REST kontrati",
]:
    bullet(doc, f"- {item}")

p(doc, "Multi-tenant yapi, django-tenants kutuphanesi araciligiyla PostgreSQL'in schema-based isolation mekanizmasi uzerine insa edilmistir. Her yeni klinik kaydedildiginde otomatik olarak izole bir veritabani semasi olusturulmaktadir. Bu yaklasim, farkli veritabani kullanma (database-per-tenant) veya ayristirici alan ekleme (discriminator column) alternatiflerine kiyasla hem performans hem guvenlik acisindan ustundur.", sz=12, indent=1.25)
doc.add_page_break()

# ====================================================================
# BOLUM 3 - ANA TEKNOLOJILER
# ====================================================================
h(doc, "3. KULLANILACAK ANA TEKNOLOJILER", level=1)

h(doc, "3.1 Django ve Django REST Framework", level=2)
p(doc, "Django 5.2, Python tabanli yuksek seviyeli bir web framework'udur. ORM (Object-Relational Mapping) katmani, veritabani islemlerini Python siniflari uzerinden yonetmeyi saglar. Django REST Framework (DRF) ise RESTful API gelistirmeyi kolaylastiran, serializer, viewset ve permission siniflari sunan guclu bir eklentidir.", sz=12, indent=1.25)
p(doc, "Projede ek olarak kullanilan backend kutuphaneleri: django-tenants (multi-tenant), djangorestframework-simplejwt (JWT kimlik dogrulama), drf-spectacular (OpenAPI/Swagger dokumantasyonu), django-cors-headers (CORS), django-anymail[resend] (e-posta), Pillow (resim isleme) ve gunicorn (production WSGI server).", sz=12, indent=1.25)

h(doc, "3.2 React ve Ekosistemi", level=2)
p(doc, "Frontend tarafinda React 18, TypeScript ile birlikte kullanilmistir. Build araci olarak Vite tercih edilmis, stilizasyon icin Tailwind CSS v4 kullanilmistir. UI bilesen kutuphanesi olarak Radix UI primitifleri (30+ bilesen), ikon seti olarak Lucide React, animasyonlar icin Motion (Framer Motion), form yonetimi icin React Hook Form, grafik ve dashboard gorsellestirmesi icin Recharts kullanilmistir. Cok dilli destek i18next ile saglanmistir. Routing icin react-router-dom v7 kullanilmaktadir.", sz=12, indent=1.25)

h(doc, "3.3 Veritabani", level=2)
p(doc, "Veritabani olarak PostgreSQL 15 kullanilmistir. django-tenants kutuphanesi, PostgreSQL'in CREATE SCHEMA ozelligini kullanarak her kiraciya izole bir sema olusturur. Paylasilan veriler (Client, Domain) 'public' semasinda, kiraciya ozel veriler (Patient, Appointment, Treatment, Payment vb.) ilgili kiracinin semasinda tutulur.", sz=12, indent=1.25)

p(doc, "Cizelge 3.1: Projede Kullanilan Teknoloji Yigini", sz=10, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sb=12)
tbl(doc, ["Katman", "Teknoloji", "Surum", "Kullanim Amaci"], [
    ["Backend", "Python", "3.12", "Ana programlama dili"],
    ["Backend", "Django", "5.2+", "Web framework"],
    ["Backend", "DRF", "3.14+", "REST API"],
    ["Backend", "django-tenants", "3.7+", "Multi-tenant izolasyon"],
    ["Backend", "SimpleJWT", "5.3+", "JWT kimlik dogrulama"],
    ["Backend", "drf-spectacular", "0.27+", "OpenAPI/Swagger"],
    ["Frontend", "React", "18.3", "UI framework"],
    ["Frontend", "TypeScript", "6.0+", "Tip guvenligi"],
    ["Frontend", "Vite", "6.3", "Build araci"],
    ["Frontend", "Tailwind CSS", "4.1", "CSS framework"],
    ["Frontend", "Radix UI", "Cesitli", "UI primitifleri"],
    ["Veritabani", "PostgreSQL", "15", "Iliskisel veritabani"],
    ["Test", "pytest / Vitest / Playwright", "-", "Test motorlari"],
    ["DevOps", "Docker + GitHub Actions", "-", "CI/CD"],
    ["Deploy", "Vercel + Render", "-", "Hosting"],
], widths=[2.5, 3.5, 2, 5.5])
doc.add_page_break()

# ====================================================================
# BOLUM 4 - EKIP YAPISI
# ====================================================================
h(doc, "4. EKIP YAPISI VE GOREV DAGILIMI", level=1)

p(doc, "Cizelge 4.1: Ekip Uyeleri ve Sorumluluk Alanlari", sz=10, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sb=12)
tbl(doc, ["Uye", "Ana Sorumluluk", "Detay"], [
    ["Yaman Halloum", "Proje Yonetimi & Backend", "Multi-tenant mimari, API tasarimi, Django modelleri, deployment"],
    ["Ali Ure", "Frontend & UI/UX", "React bilesenleri, kullanici arayuzu, Figma tasarimlari, responsive tasarim"],
    ["Cihan Kurtbey", "Test & Kalite Guvencesi", "Test stratejisi, pytest/Vitest/Playwright, A11y, CI/CD pipeline"],
    ["Sukru Yesilmen", "Veritabani & Entegrasyon", "PostgreSQL sema tasarimi, veri modelleme, API entegrasyonu"],
], widths=[3.5, 4, 8])
doc.add_page_break()

# ====================================================================
# BOLUM 5 - YAZILIM GELISTIRME SURECI
# ====================================================================
h(doc, "5. YAZILIM GELISTIRME SURECI", level=1)
p(doc, "Proje, Scrum'dan esinlenen cevik (Agile) bir gelistirme sureci ile yurutulmustur. Gelistirme dongusu: Planlama > Gelistirme > Test > Code Review > Merge > Deploy seklinde yapilandirilmistir.", sz=12, indent=1.25)
for item in [
    "Haftalik Sprint Planning: Her hafta basinda gorev belirleme ve onceliklendirme",
    "GitHub Issues: Gorev takibi, bug raporlama ve ozellik istekleri",
    "GitHub Projects (Kanban): Gorsel is akisi takibi (To Do > In Progress > Review > Done)",
    "Pull Request (PR) bazli code review: Her PR en az 1 onay gerektirir",
    "Conventional Commits formati: feat:, fix:, test:, docs:, refactor:, chore:",
    "Pre-commit hook'lari (Husky): ESLint, Prettier, TypeScript type-check otomatik kontrol",
]:
    bullet(doc, f"- {item}")
doc.add_page_break()

# ====================================================================
# BOLUM 6 - TEKNIK DOKUMANTASYON YONETIMI
# ====================================================================
h(doc, "6. TEKNIK DOKUMANTASYON YONETIMI", level=1)
p(doc, "Proje dokumantasyonu, kodla birlikte yasayan (living documentation) yaklasimi ile yonetilmistir. Tum dokumantasyon dosyalari proje reposundaki docs/ dizininde tutulmaktadir:", sz=12, indent=1.25)
for name, desc in [
    ("README.md", "Proje tanitimi, kurulum, calistirma talimatlari"),
    ("docs/TESTING.md", "Kapsamli test rehberi - 5 dakikada test calistirma kilavuzu"),
    ("docs/CONTRIBUTING.md", "PR sureci, code review kontrol listesi"),
    ("docs/TEST_PYRAMID.md", "Test piramidi hedefi ve gerekceleri"),
    ("docs/TEST_METRICS.md", "Otomatik guncellenen test metrikleri"),
    ("docs/adr/0001-test-strategy.md", "Test stratejisi mimari karar kaydi"),
    ("docs/adr/0002-multi-tenant-isolation.md", "Multi-tenant izolasyon karari"),
    ("docs/adr/0003-a11y-zero-tolerance.md", "A11y sifir tolerans politikasi"),
    (".github/PULL_REQUEST_TEMPLATE.md", "PR kontrol listesi sablonu"),
    (".github/CODEOWNERS", "Kritik dosyalar icin otomatik reviewer atama"),
]:
    bullet(doc, f"- {name}: {desc}")

p(doc, "ADR (Architecture Decision Record) yaklasimi ile mimari kararlar gerekceleri ile birlikte kalici olarak belgelenmistir. Ornegini: 'Neden Jest degil Vitest?' sorusunun cevabi ADR-0001'de dokumante edilmistir.", sz=12, indent=1.25, sb=6)
doc.add_page_break()

# ====================================================================
# BOLUM 7 - TEKNOLOJI VE URUN YAPILARI
# ====================================================================
h(doc, "7. TEKNOLOJI VE URUN YAPILARI", level=1)

h(doc, "7.1 Frontend Yapisi", level=2)
p(doc, "Frontend uygulamasi React.js ve TypeScript ile gelistirilmis olup Vite build araci kullanilmaktadir. Uygulama mimarisi bilesen bazli (component-based) olarak yapilandirilmistir:", sz=12, indent=1.25)
code(doc, """frontend/src/
+-- app/
|   +-- App.tsx              # Ana yonlendirici (SaaS landing vs klinik paneli)
|   +-- ClinicApp.tsx        # Klinik yonetim paneli
|   +-- components/          # 32+ UI bileseni
|   |   +-- Dashboard.tsx    # Ana sayfa dashboard
|   |   +-- PatientSearch.tsx  # Hasta arama
|   |   +-- PatientProfile.tsx # Hasta profil detay (59KB)
|   |   +-- AppointmentCalendar.tsx  # Randevu takvimi
|   |   +-- LoginPage.tsx    # Giris sayfasi
|   |   +-- AuditLogPage.tsx # Islem gecmisi
|   |   +-- DentalChart.tsx  # Dental sema (FDI)
|   |   +-- TreatmentTypesPage.tsx # Tedavi turleri
|   |   +-- UserManagement.tsx # Kullanici yonetimi
|   |   +-- ClinicSettingsPage.tsx # Klinik ayarlari
|   |   +-- ui/              # Radix UI primitifleri (30+ bilesen)
|   +-- contexts/            # React Context (Auth, Theme)
|   +-- hooks/               # Custom React hooks
|   +-- services/            # API servis katmani (api.ts)
|   +-- utils/               # Yardimci fonksiyonlar
+-- locales/                 # i18n ceviri dosyalari (TR/EN)
+-- mocks/                   # MSW mock handlers
+-- test/                    # Test yardimcilari (factories, renderWithProviders)""")

h(doc, "7.2 Backend, Veritabani ve Guvenlik Yapisi", level=2)
p(doc, "Backend uygulamasi Django 5.2 ve Django REST Framework ile gelistirilmistir. Katmanli mimari (Model > Serializer > ViewSet > URL) kullanilmistir:", sz=12, indent=1.25)
code(doc, """backend/
+-- api/                     # Ana uygulama modulu
|   +-- models.py            # 9 veri modeli (344 satir)
|   +-- serializers.py       # 12 serializer (358 satir)
|   +-- views.py             # 15 view/viewset (550 satir)
|   +-- middleware.py        # 3 middleware (183 satir)
|   +-- permissions.py       # 2 RBAC sinifi
|   +-- mixins.py            # AuditLog mixin (90 satir)
|   +-- signals.py           # Django sinyalleri
|   +-- tests/               # 148+ backend test
+-- core/                    # Django ayarlari
|   +-- settings.py          # Production ayarlari (314 satir)
|   +-- settings_test.py     # Test ortami ayarlari
+-- customers/               # Tenant yonetimi
|   +-- models.py            # Client, Domain modelleri
|   +-- views.py             # Klinik kayit ve domain kontrol API'si""")

p(doc, "Guvenlik Onlemleri:", sz=12, bold=True, sb=12)
for item in [
    "JWT tabanli kimlik dogrulama (Access 60dk + Refresh 7gun token yapisi)",
    "Rol bazli erisim kontrolu: Admin, Doktor, Asistan",
    "Schema-based veri izolasyonu: Her klinik ayri PostgreSQL semasinda",
    "AuditLog ile tum CRUD islemlerinin kayit altina alinmasi (KVKK uyumlulugu)",
    "Hassas veri maskeleme: Sifre, TCKN gibi alanlar loglanmaz (sanitize_changes)",
    "Tenant-aware log formati: [Tenant: X] [User: Y] [Path: Z] ile guvenlik izleme",
    "CORS yapilandirmasi ve X-Tenant header kontrolu",
    "Basarisiz giris denemelerinin AuditLog'a kaydedilmesi",
    "Soft delete: Kayitlar fiziksel silinmez, is_active=False yapilir",
    "Islem bagliligi kontrolleri: Aktif randevusu olan hasta silinemez",
]:
    bullet(doc, f"- {item}")
doc.add_page_break()

# ====================================================================
# BOLUM 8 - ISIMLENDIRME STANDARTLARI
# ====================================================================
h(doc, "8. ISIMLENDIRME STANDARTLARI - PEP 257", level=1)
p(doc, "Projede Python tarafinda PEP 8 (stil) ve PEP 257 (docstring) standartlari takip edilmektedir. Her model ve viewset sinifi docstring ile belgelenmistir. Frontend tarafinda ESLint kurallari ve TypeScript tip denetimi zorunlu tutulmustur.", sz=12, indent=1.25)

p(doc, "Cizelge 8.1: Isimlendirme Standartlari", sz=10, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sb=12)
tbl(doc, ["Oge", "Kural", "Ornek"], [
    ["Python Sinif", "PascalCase", "PatientViewSet, CustomUser, AuditLogMixin"],
    ["Python Fonksiyon", "snake_case", "get_queryset, perform_create, get_client_ip"],
    ["Python Degisken", "snake_case", "patient_id, treatment_type, old_data"],
    ["React Bilesen", "PascalCase", "AppointmentDialog, PatientSearch"],
    ["React Hook", "camelCase (use prefix)", "useAuth, useFetch"],
    ["API Endpoint", "kebab-case", "/api/treatment-types/, /api/audit-logs/"],
    ["Commit Mesaji", "Conventional Commits", "feat(auth): JWT refresh eklendi"],
    ["Test Dosyasi (BE)", "test_*.py", "test_views.py, test_serializers.py"],
    ["Test Dosyasi (FE)", "*.test.tsx", "Dashboard.test.tsx, PatientDialog.test.tsx"],
], widths=[3.5, 4, 7])

h(doc, "8.1 API Isimlendirme Standartlari", level=2)
p(doc, "Cizelge 8.2: API Endpoint Listesi", sz=10, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sb=12)
tbl(doc, ["HTTP", "Endpoint", "Aciklama", "Yetki"], [
    ["POST", "/api/auth/token/", "JWT token alma (login)", "Acik"],
    ["POST", "/api/auth/token/refresh/", "Token yenileme", "Acik"],
    ["GET", "/api/auth/me/", "Mevcut kullanici bilgisi", "Auth"],
    ["POST", "/api/auth/logout/", "Cikis ve audit log", "Auth"],
    ["POST", "/api/auth/password-reset/", "Sifre sifirlama talebi", "Acik"],
    ["GET/POST", "/api/patients/", "Hasta listesi / olustur", "Auth"],
    ["GET/PUT/DEL", "/api/patients/{id}/", "Hasta detay/guncelle/sil", "Auth"],
    ["GET/POST", "/api/appointments/", "Randevu listele / olustur", "Auth"],
    ["GET/POST", "/api/treatments/", "Tedavi listele / olustur", "Auth"],
    ["GET/POST", "/api/payments/", "Odeme listele / olustur", "Auth"],
    ["GET/POST", "/api/treatment-types/", "Tedavi turleri", "Auth+Rol"],
    ["GET/POST", "/api/documents/", "Hasta dokumanlari", "Auth"],
    ["GET", "/api/dashboard/today/", "Gunluk ozet", "Auth"],
    ["GET", "/api/doctors/", "Hekim listesi", "Auth"],
    ["GET/PUT", "/api/settings/clinic/", "Klinik ayarlari", "Admin"],
    ["GET", "/api/audit-logs/", "Islem gecmisi", "Admin"],
    ["CRUD", "/api/users/", "Kullanici yonetimi", "Admin"],
    ["GET", "/api/public/clinic-info/", "Klinik adi (login oncesi)", "Acik"],
    ["POST", "/api/public/register/", "Yeni klinik kaydi", "Acik"],
    ["GET", "/api/public/check-domain/", "Domain musaitlik kontrolu", "Acik"],
], widths=[2, 4, 4, 2.5])
doc.add_page_break()

# ====================================================================
# BOLUM 9 - TEST DATASI URETIM SURECI
# ====================================================================
h(doc, "9. TEST DATASI URETIM SURECI", level=1)
p(doc, "Projede test verisi uretimi uc katmanda yonetilmektedir:", sz=12, indent=1.25)

p(doc, "Backend (factory-boy + Faker):", sz=12, bold=True, sb=6)
p(doc, "factory-boy kutuphanesi ile her model icin fabrika (factory) siniflari tanimlanmistir. Faker kutuphanesi tr_TR locale ile gercekci Turkce isimler, telefon numaralari ve adresler uretmektedir. Ornek kullanim:", sz=12, indent=1.25)
code(doc, """patient = PatientFactory()                 # Tum alanlar otomatik dolu
patient = PatientFactory(first_name="Ali") # Override
patients = PatientFactory.create_batch(5)  # 5 hasta birden
doctor = DoctorUserFactory()               # Doktor rolu ile kullanici""")

p(doc, "Frontend (Factory fonksiyonlari):", sz=12, bold=True, sb=6)
p(doc, "frontend/src/test/factories.ts dosyasinda makePatient(), makeAppointment() gibi fabrika fonksiyonlari tanimlanmistir.", sz=12, indent=1.25)

p(doc, "Demo Veri Seeding:", sz=12, bold=True, sb=6)
p(doc, "run-demo.ps1 scripti ile canli demo ortami otomatik olusturulabilmektedir. Bu script; public tenant olusturma, iki izole klinik tenant'i olusturma (Premium ve Standard), her klinige personel/hasta/tedavi/odeme verisi seeding islemlerini otomatik gerceklestirmektedir. Universal demo sifresi: demo123!", sz=12, indent=1.25)
doc.add_page_break()

# ====================================================================
# BOLUM 10 - OLCUMLEME VE SUREC METRIKLERI
# ====================================================================
h(doc, "10. OLCUMLEME VE SUREC METRIKLERI", level=1)

p(doc, "Cizelge 10.1: Test Istatistikleri", sz=10, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sb=12)
tbl(doc, ["Metrik", "Baslangic", "Son Durum", "Degisim"], [
    ["Backend Test Sayisi", "0 calisan (77 kirik)", "169", "+169"],
    ["Frontend Unit Test", "23", "151", "+128"],
    ["Frontend E2E Test", "67", "83", "+16"],
    ["A11y Unit Test", "0", "10", "+10"],
    ["A11y E2E Test", "0", "4", "+4"],
    ["Tenant Izolasyon Testi", "0", "21", "+21"],
    ["TOPLAM TEST", "~90", "403", "+313"],
    ["Backend Coverage", "%55", "%78", "+23 puan"],
    ["Frontend Lines Coverage", "%5", "%57", "+52 puan"],
    ["Frontend Branches Coverage", "%3", "%46", "+43 puan"],
    ["WCAG 2.1 AA Ihlali", "Bilinmiyor", "0", "Sifir tolerans"],
    ["CI Required Checks", "0", "7", "+7"],
], widths=[4.5, 3, 3, 3])

p(doc, "scripts/test-metrics.py scripti her main push'tan sonra otomatik calisarak test sayilarini ve piramit sagligini olcer, docs/TEST_METRICS.md dosyasini gunceller.", sz=12, indent=1.25, sb=12)
doc.add_page_break()

# ====================================================================
# BOLUM 11 - ISBIRLIGINE DAYALI GELISTIRME
# ====================================================================
h(doc, "11. IS BIRLIGINE DAYALI GELISTIRME", level=1)
p(doc, "Proje gelistirme surecinde isbirligi asagidaki mekanizmalarla saglanmistir:", sz=12, indent=1.25)
for item in [
    "GitHub Issues ve Projects: Gorev takibi ve Kanban board ile is akisi yonetimi",
    "Pull Request Review: Her PR en az 1 takim uyesi onayi gerektirir",
    "CODEOWNERS: Kritik dosyalar (middleware.py, settings.py) icin otomatik reviewer atama",
    "Branch stratejisi: main (production), develop, feat/*, fix/*, test/* branch yapisi",
    "Pair Programming: Karmasik ozellikler (multi-tenant, auth) icin esli programlama",
    "Code Review Checklist: Test, A11y, guvenlik, lint, TypeScript kontrolleri",
    "Haftalik Standup: Ilerleme paylasimi ve engellerin tartisilmasi",
    "AI-Assisted Development: AI araclari ile pair programming yaklasimi",
]:
    bullet(doc, f"- {item}")
doc.add_page_break()

# ====================================================================
# BOLUM 12 - MIMARI CIZIM VE KATMANLI YAPI
# ====================================================================
h(doc, "12. MIMARI CIZIM VE KATMANLI YAPI", level=1)
p(doc, "Projenin katmanli mimarisi asagidaki sekilde ozetlenebilir:", sz=12, indent=1.25)

code(doc, """
+--------------------------------------------------------------+
|                    KULLANICI (Browser)                         |
|                   React.js + TypeScript                       |
|          Radix UI | Tailwind CSS | Recharts | i18next         |
+--------------------------------------------------------------+
|                    API KATMANI (REST)                          |
|              Django REST Framework + JWT                       |
|           ViewSet > Serializer > Model                        |
+--------------------------------------------------------------+
|               TENANT MIDDLEWARE KATMANI                        |
|          HeaderTenantMiddleware (X-Tenant / Host)              |
|    ThreadLocalMiddleware | RequestLoggingMiddleware            |
+--------------------------------------------------------------+
|              VERITABANI KATMANI (PostgreSQL)                   |
|     +----------+  +----------+  +----------+                  |
|     | public   |  | klinik1  |  | klinik2  | <- Schema/tenant |
|     | (SaaS)   |  | (izole)  |  | (izole)  |                  |
|     +----------+  +----------+  +----------+                  |
+--------------------------------------------------------------+
""")

# Diyagramlar
h(doc, "12.1 UML Diyagramlari", level=2)
diagram_files = sorted([f for f in os.listdir(DIAG) if f.endswith('.jpeg')])
captions = [
    "Sekil 12.1: Tedavi ve Odeme Girisi Sekans Diyagrami",
    "Sekil 12.2: Kullanici Girisi ve Oturum Dogrulama Sekans Diyagrami",
    "Sekil 12.3: Kullanici Girisi Sekans Diyagrami (Alternatif)",
    "Sekil 12.4: Randevu Olusturma ve Cakisma Kontrolu Sekans Diyagrami",
    "Sekil 12.5: Dashboard Gunluk Ozet Sekans Diyagrami",
    "Sekil 12.6: Hasta Kayit ve Guncelleme Sekans Diyagrami",
    "Sekil 12.7: Klinik Ayarlari Guncelleme Sekans Diyagrami",
    "Sekil 12.8: Genel Mimari Diyagram",
    "Sekil 12.9: Sistem Bilesen Diyagrami",
]
for i, f in enumerate(diagram_files):
    cap = captions[i] if i < len(captions) else f"Sekil 12.{i+1}: {f}"
    img(doc, os.path.join(DIAG, f), w=6.0, cap=cap)

doc.add_page_break()

# ====================================================================
# BOLUM 13 - VERI MODELI
# ====================================================================
h(doc, "13. VERI MODELI", level=1)
p(doc, "Yasca veritabani iki ana bolumden olusmaktadir: Shared Schema (Public) ve Tenant Schema (Klinik bazli). Asagida temel varliklar ve iliskileri sunulmustur:", sz=12, indent=1.25)

p(doc, "Cizelge 13.1: Veritabani Varliklari", sz=10, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sb=12)
tbl(doc, ["Model", "Tip", "Temel Alanlar", "Iliskiler"], [
    ["Client", "Shared", "schema_name, name, is_active, created_on", "1:N Domain"],
    ["Domain", "Shared", "domain, is_primary", "N:1 Client"],
    ["CustomUser", "Tenant", "username, email, role", "1:N Appointment, Treatment"],
    ["Patient", "Tenant", "first_name, last_name, phone, tckn, birth_date", "1:1 Anamnesis, 1:N Treatment"],
    ["Anamnesis", "Tenant", "medical_history, allergies, medications, chronic_diseases", "1:1 Patient"],
    ["Appointment", "Tenant", "patient, doctor, date, time, status", "N:1 Patient, N:1 Doctor"],
    ["Treatment", "Tenant", "patient, doctor, treatment_type, tooth_number, price", "N:1 Patient, N:1 TreatmentType"],
    ["TreatmentType", "Tenant", "name, category, default_price, doctor", "1:N Treatment"],
    ["Payment", "Tenant", "patient, treatment, amount, payment_date", "N:1 Patient, N:1 Treatment"],
    ["Document", "Tenant", "patient, name, file, uploaded_by", "N:1 Patient"],
    ["AuditLog", "Tenant", "user, action, content_type, object_id, changes, ip", "N:1 User"],
    ["ClinicSettings", "Tenant", "work_start_time, work_end_time, work_days", "Singleton"],
], widths=[2.5, 1.5, 6, 4])
doc.add_page_break()

# ====================================================================
# BOLUM 14 - TEST VE DEPLOYMENT
# ====================================================================
h(doc, "14. TEST VE DEPLOYMENT SURECLERI", level=1)

h(doc, "14.1 Test Sureci ve Uygulamalari", level=2)
p(doc, "Proje, test piramidi prensibine uygun sekilde katmanli bir test stratejisi uygulamistir. Dual-mode (SQLite + PostgreSQL) yaklasimi ile hem hizli gelistirme dongusu hem de production fidelity saglanmistir.", sz=12, indent=1.25)

code(doc, """Test Piramidi:
            /\\
           /E2E\\         %10  - Playwright (gercek tarayici + backend)
          /------\\
         /Integ.  \\      %20  - APIClient/vitest+MSW
        /----------\\
       /   Unit     \\    %70  - pytest unit / vitest component (izole)
      /______________\\""")

p(doc, "Cizelge 14.1: Test Katmanlari ve Araclari", sz=10, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sb=12)
tbl(doc, ["Katman", "Arac", "Sayi", "Amac"], [
    ["Backend Unit", "pytest + factory-boy", "148", "Model, serializer, view birim testleri"],
    ["Backend PG-only", "pytest + FastTenantTestCase", "21", "Schema izolasyon, cross-tenant guvenlik"],
    ["Frontend Unit", "Vitest + Testing Library + MSW", "151", "Bilesen, hook, servis testleri"],
    ["Frontend A11y", "vitest-axe", "10", "WCAG 2.1 AA erisilebilirlik taramasi"],
    ["E2E", "Playwright", "83", "Uctan uca kullanici akislari"],
    ["E2E A11y", "@axe-core/playwright", "4", "Gercek tarayicide erisilebilirlik"],
    ["Mutation", "mutmut / Stryker", "-", "Test kalitesinin dogrulanmasi"],
], widths=[3, 4, 1.5, 6])

h(doc, "14.2 Deployment Sureci", level=2)
p(doc, "Frontend uygulamasi Vercel platformuna, backend ise Docker konteyner icinde Render platformuna deploy edilmektedir. CI/CD pipeline'i GitHub Actions ile otomatize edilmistir.", sz=12, indent=1.25)
code(doc, """CI/CD Pipeline:
+-----------------------------------------------+
| Backend Matrix                                 |
|   SQLite modu (hizli, 148 test)                |
|   PostgreSQL modu (gercekci, +21 izolasyon)    |
+-----------------------------------------------+
| Frontend Tests (vitest + coverage esigi)       |
+-----------------------------------------------+
| A11y Tests (WCAG 2.1 AA - sifir tolerans)      |
+-----------------------------------------------+
| E2E Tests (Playwright, gercek DB + UI)         |
+-----------------------------------------------+
HEPSI YESIL OLMADAN MERGE YOK""")

p(doc, "Canli uygulama adresleri:", sz=12, bold=True, sb=6)
bullet(doc, "- Frontend: https://yasca-dental-clinic.vercel.app/")
bullet(doc, "- Backend API: https://yasca-dental-clinic.onrender.com/")
bullet(doc, "- Klinik giris: https://yasca-dental-clinic.vercel.app/app/{klinik-adi}")
doc.add_page_break()

# ====================================================================
# BOLUM 15 - UYGULAMA PLANI
# ====================================================================
h(doc, "15. UYGULAMA PLANI", level=1)
p(doc, "Proje asagidaki fazlar halinde gelistirilmistir:", sz=12, indent=1.25)

p(doc, "Cizelge 15.1: Uygulama Plani", sz=10, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sb=12)
tbl(doc, ["Faz", "Icerik", "Durum"], [
    ["Faz 1", "Proje altyapisi: Django + React + PostgreSQL + Docker kurulumu", "Tamamlandi"],
    ["Faz 2", "Multi-tenant mimari: django-tenants, schema izolasyonu", "Tamamlandi"],
    ["Faz 3", "Hasta, Randevu, Tedavi, Odeme CRUD API'lari", "Tamamlandi"],
    ["Faz 4", "Frontend bilesenleri: Dashboard, PatientProfile, AppointmentCalendar", "Tamamlandi"],
    ["Faz 5", "Auth + RBAC: JWT, rol bazli erisim, login/logout", "Tamamlandi"],
    ["Faz 6", "Backend test suite: 148 pytest + 21 PG izolasyon testi", "Tamamlandi"],
    ["Faz 7", "Frontend test suite: 151 vitest + 83 Playwright E2E", "Tamamlandi"],
    ["Faz 8", "A11y: WCAG 2.1 AA zero-tolerance, axe taramalari", "Tamamlandi"],
    ["Faz 9", "Deployment: Vercel + Render + CI/CD pipeline", "Tamamlandi"],
    ["Faz 10", "Dokumantasyon: TESTING.md, ADR'ler, rapor", "Tamamlandi"],
], widths=[1.5, 9, 3])
doc.add_page_break()

# ====================================================================
# BOLUM 16 - KALITE PRATIKLERI
# ====================================================================
h(doc, "16. KALITE PRATIKLERI", level=1)
for item in [
    "Coverage Threshold: Backend %78, Frontend lines %54, branches %45 - asla dusurulmez",
    "A11y Zero-Tolerance: Tek WCAG 2.1 AA ihlali bile CI'i kirar",
    "Pre-commit Hooks (Husky): ESLint, Prettier, TypeScript type-check otomatik kontrol",
    "Conventional Commits: Standart commit mesaj formati zorunlu",
    "Code Review: Her PR en az 1 onay gerektirir",
    "PR Template: Test, a11y, guvenlik kontrol listesi zorunlu",
    "Flaky Test Politikasi: 1 haftada duzeltilmezse karantina, 2 haftada silinir",
    "Slow Test Budget: Unit <= 200ms, Integration <= 2s, E2E <= 30s",
    "Mutation Testing: mutmut (backend) + Stryker (frontend) ile test kalitesi dogrulama",
    "Ban Listesi: git commit --no-verify, coverage dusurme, console.log, TypeScript any YASAK",
]:
    bullet(doc, f"- {item}")
doc.add_page_break()

# ====================================================================
# VERSIYON YONETIMI
# ====================================================================
h(doc, "VERSIYON YONETIMI", level=1)
p(doc, "Proje Git versiyon kontrol sistemi ile yonetilmekte olup GitHub uzerinde barindirilmaktadir. Branch stratejisi:", sz=12, indent=1.25)
for item in [
    "main: Production branch - sadece onaylanmis PR'lar merge edilir",
    "develop: Gelistirme branch'i - ozellikler buraya merge edilir",
    "feat/*: Yeni ozellik branch'leri (feat/appointment-calendar)",
    "fix/*: Hata duzeltme branch'leri (fix/auth-refresh-bug)",
    "test/*: Test eklemeleri (test/dialog-coverage)",
    "docs/*: Dokumantasyon guncellemeleri",
]:
    bullet(doc, f"- {item}")
p(doc, "Squash & Merge stratejisi ile temiz commit gecmisi korunmaktadir. Her merge Conventional Commits formatinda olmalidir.", sz=12, indent=1.25, sb=6)
doc.add_page_break()

# ====================================================================
# DEVELOPMENT ORTAMI VE IDE
# ====================================================================
h(doc, "DEVELOPMENT ORTAMI VE IDE", level=1)
p(doc, "Cizelge D.1: Gelistirme Araclari", sz=10, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sb=12)
tbl(doc, ["Arac", "Kullanim Amaci"], [
    ["VS Code / Cursor AI", "Ana IDE - yapay zeka destekli kod tamamlama"],
    ["Docker Desktop", "PostgreSQL ve backend konteynerizasyonu"],
    ["Node.js v18+", "Frontend calistirma ortami"],
    ["Python 3.12", "Backend calistirma ortami"],
    ["Git + GitHub", "Versiyon kontrol ve isbirligi"],
    ["Postman / Thunder Client", "API test ve debug"],
    ["Chrome DevTools", "Frontend debug ve performans"],
    ["Figma", "UI/UX tasarim"],
    ["GitHub Copilot", "AI destekli kod tamamlama"],
    ["Playwright Inspector", "E2E test debug (--debug modu)"],
], widths=[4, 10])
doc.add_page_break()

# ====================================================================
# UYGULAMA ONYZULERI - EKRAN GORUNTULERI
# ====================================================================
h(doc, "UYGULAMA ONYZULERI VE KULLANIM KILAVUZU", level=1)
p(doc, "Asagida Yasca uygulamasinin tum sayfalarina ait ekran goruntuleri sunulmustur. Canli uygulama adresi: https://yasca-dental-clinic.vercel.app/", sz=12, indent=1.25)

screenshots = [
    ("saas_landing_page_1780686868207.png", "Sekil U.1: SaaS Tanitim Sayfasi (Landing Page)"),
    ("login_page_1780686889822.png", "Sekil U.2: Klinik Giris Sayfasi"),
    ("dashboard_page_1780686924336.png", "Sekil U.3: Dashboard - Ana Sayfa"),
    ("patients_page_1780686936903.png", "Sekil U.4: Hasta Listesi ve Arama"),
    ("patient_profile_1780688783250.png", "Sekil U.5: Hasta Profil Detay Sayfasi"),
    ("appointments_page_1780686949382.png", "Sekil U.6: Randevu Takvimi"),
    ("treatment_types_1780688796324.png", "Sekil U.7: Tedavi Turleri Yonetimi"),
    ("settings_page_1780686962621.png", "Sekil U.8: Klinik Ayarlari"),
    ("user_management_1780688847510.png", "Sekil U.9: Personel Yonetimi"),
    ("audit_log_1780688821145.png", "Sekil U.10: Islem Gecmisi (Audit Log)"),
]
for fname, cap in screenshots:
    fpath = os.path.join(SS, fname)
    img(doc, fpath, w=5.8, cap=cap)
doc.add_page_break()

# ====================================================================
# USE CASES - UML DOKUMANTASYONU
# ====================================================================
h(doc, "USE CASE'LER - UML DOKUMANTASYONU", level=1)
p(doc, "Projede tanimlanan temel kullanim senaryolari (Use Case) asagida ozetlenmistir:", sz=12, indent=1.25)

p(doc, "Cizelge UC.1: Temel Use Case Listesi", sz=10, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sb=12)
tbl(doc, ["UC No", "Use Case", "Aktor", "Aciklama"], [
    ["UC-01", "Sisteme Giris", "Tum Roller", "JWT ile kimlik dogrulama, rol bazli yonlendirme"],
    ["UC-02", "Sifre Sifirlama", "Tum Roller", "E-posta ile sifre sifirlama linki gonderimi"],
    ["UC-03", "Hasta Kaydi", "Doktor, Asistan", "Ad, soyad, telefon (zorunlu), TCKN, dogum tarihi (opsiyonel)"],
    ["UC-04", "Hasta Arama", "Tum Roller", "Ad, soyad, telefon, TCKN ile arama"],
    ["UC-05", "Anamnez Girisi", "Doktor", "Hasta tibbi gecmisi, alerjiler, ilaclar, kronik hastaliklar"],
    ["UC-06", "Randevu Olusturma", "Asistan, Admin", "Tarih, saat, hekim secimi, cakisma kontrolu"],
    ["UC-07", "Randevu Guncelleme", "Asistan, Admin", "Durum degisikligi: Planlandi/Tamamlandi/Iptal/Gelmedi"],
    ["UC-08", "Tedavi Kaydi", "Doktor", "Tedavi turu, dis no (FDI), fiyat, notlar"],
    ["UC-09", "Odeme Kaydi", "Asistan, Admin", "Tutar, aciklama, tedaviye baglama"],
    ["UC-10", "Dashboard Goruntuleme", "Tum Roller", "Gunun randevulari, istatistikler, hizli erisim"],
    ["UC-11", "Klinik Ayarlari", "Admin", "Calisma saatleri, gunler, telefon formati"],
    ["UC-12", "Kullanici Yonetimi", "Admin", "Yeni personel ekleme, rol atama, sifre belirleme"],
    ["UC-13", "Islem Gecmisi", "Admin", "Tum CRUD islemlerinin audit log kayitlari"],
    ["UC-14", "Yeni Klinik Kaydi", "Misafir", "SaaS kayit formu ile yeni tenant olusturma"],
    ["UC-15", "Dokuman Yukleme", "Doktor, Asistan", "Hasta dosyasina belge ekleme"],
], widths=[1.5, 3, 3, 6])

p(doc, "Detayli UML sekans diyagramlari Bolum 12'de sunulmustur.", sz=12, indent=1.25, sb=12)
doc.add_page_break()

# ====================================================================
# PROJE YONETIM PRATIKLERI
# ====================================================================
h(doc, "PROJE YONETIM PRATIKLERI", level=1)
for item in [
    "Agile/Scrum: Haftalik sprint'ler ile iteratif gelistirme",
    "GitHub Issues: Her is birimi issue olarak takip edilir",
    "Kanban Board: To Do > In Progress > Review > Done asamalari",
    "Sprint Retrospective: Her sprint sonunda ne iyi gitti, ne iyilestirilebilir",
    "Definition of Done: Kod yazildi + Test yazildi + PR onaylandi + CI yesil + Merge edildi",
    "CODEOWNERS: Kritik dosyalar icin otomatik reviewer atama",
    "Branch Protection Rules: main branch'e dogrudan push YASAK",
    "Milestone Tracking: Her faz icin milestone tanimlama ve izleme",
]:
    bullet(doc, f"- {item}")
doc.add_page_break()

# ====================================================================
# NELER OGRENDIK
# ====================================================================
h(doc, "NELER OGRENDIK - BASARILI VE BASARISIZ ONERILER", level=1)

p(doc, "Basarili Uygulamalar:", sz=12, bold=True, sb=6)
for s in [
    "Dual-mode test stratejisi hem hiz hem dogruluk sagladi",
    "Factory pattern test kodunu ~%70 kisaltti ve bakim maliyetini dusurdu",
    "A11y'yi bastan entegre etmek, sonradan eklemeye gore cok daha ucuz ve etkili oldu",
    "Pre-commit hook'lari bozuk kodun CI'a ulasmadan yakalanmasini sagladi",
    "AI araclari ozellikle boilerplate ve tekrarlayan kod uretiminde buyuk zaman kazandirdi",
    "Schema-based multi-tenancy veri izolasyonunu fiziksel duzeyde garanti etti",
    "Living documentation (kod ile birlikte yasayan dokumantasyon) her zaman guncel kaldi",
    "Conventional Commits ile tutarli ve okunakilir commit gecmisi olusturuldu",
]:
    bullet(doc, f"[+] {s}")

p(doc, "Zorluklar ve Dersler:", sz=12, bold=True, sb=12)
for c in [
    "Coverage rakami yalan soyleyebilir - %80 coverage olsa bile mutation score dusukse testler zayif",
    "SQLite ile PostgreSQL arasindaki davranis farklari (schema destegi yok) baslangicta sorun cikartti",
    "Devraldigimiz test suite'inde 77 kirik test vardi - once mevcut testleri ayaga kaldirmak gerekti",
    "E2E testler flaky (kararsiz) olabilir - strict timeout ve retry politikasi gerekti",
    "AI urettigi kodda bazen guvenlik aciklari olabilir - mutlaka insan review gerekli",
    "Multi-tenant test yazmanin kendi basina bir disiplin gerektirdigi ogrenildi",
]:
    bullet(doc, f"[!] {c}")
doc.add_page_break()

# ====================================================================
# TAKIM DEGERLENDIRME RAPORU
# ====================================================================
h(doc, "TAKIM UYELERININ PROJE DEGERLENDIRME RAPORU", level=1)

for name, role, ev in [
    ("Yaman Halloum", "Proje Yoneticisi & Backend Gelistirici",
     "Multi-tenant mimarinin kurulumu ve API tasarimi surecinde onemli deneyimler kazandim. Django-tenants ile schema-based izolasyon kurmak projede en zorlu ama en ogretici kisim oldu. Yapay zeka araclari ozellikle API endpoint'lerinin hizli prototiplenmesinde buyuk katki sagladi."),
    ("Ali Ure", "Frontend Gelistirici & UI/UX Tasarimci",
     "React ve TypeScript ile modern bir SPA gelistirme deneyimi kazandim. Radix UI primitifleri ile erisilebilir bilesenler olusturmak onemli bir ogrenme sureciydi. Cursor AI ve Copilot ile bilesen gelistirme hizim onemli olcude artti."),
    ("Cihan Kurtbey", "Test & Kalite Guvence Muhendisi",
     "Test stratejisi tasarimi ve uygulamasi konusunda derinlemesine bilgi edindim. Dual-mode test stratejisi, mutation testing ve A11y zero-tolerance politikasi gibi endustriyel pratikleri uygulama firsati buldum. 403 testten olusan bir suite kurmak gurur verici bir basariydi."),
    ("Sukru Yesilmen", "Veritabani & Entegrasyon Muhendisi",
     "PostgreSQL schema-based multi-tenancy mimarisini ogrenmek veritabani bilgimi onemli olcude gelistirdi. Veri modelleme, ER diyagram tasarimi ve API entegrasyonu konularinda pratik deneyim kazandim."),
]:
    p(doc, f"{name} - {role}", sz=12, bold=True, sb=12)
    p(doc, ev, sz=12, indent=1.25)
doc.add_page_break()

# ====================================================================
# YAPAY ZEKA KULLANIM PRATIKLERI
# ====================================================================
h(doc, "YAPAY ZEKA KULLANIM PRATIKLERI", level=1)
p(doc, "Proje suresince cesitli yapay zeka araclari aktif olarak kullanilmistir. Bu araclar, gelistirme surecinin her asamasinda (kodlama, test, debug, dokumantasyon) onemli verimlilik kazanimlari saglamistir:", sz=12, indent=1.25)

p(doc, "Cizelge AI.1: Yapay Zeka Araclari ve Kullanim Alanlari", sz=10, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, sb=12)
tbl(doc, ["AI Araci", "Kullanim Alani", "Somut Katki"], [
    ["GitHub Copilot", "Kod tamamlama, boilerplate uretimi", "Tekrarlayan kod bloklarinin otomatik uretimi, serializer ve factory siniflari"],
    ["ChatGPT (GPT-4)", "Mimari tasarim, problem cozme", "Multi-tenant strateji kararlari, hata analizi, best practice onerileri"],
    ["Cursor AI", "IDE entegreli AI kodlama", "Komponent gelistirme, refactoring, bilesen tasarimi"],
    ["Claude Code", "Kapsamli kod uretimi, analiz", "Test suite olusturma, dokumantasyon, rapor otomasyonu"],
    ["Gemini", "Kod analizi, rapor uretimi", "Proje analizi, kapsamli dokumantasyon, ekran goruntusu toplama"],
], widths=[3, 3.5, 7.5])

p(doc, "Yapay Zeka Kullaniminda Dikkat Edilen Noktalar:", sz=12, bold=True, sb=12)
for note in [
    "AI urettigi kod her zaman insan review'dan gecirilmistir - koru korune kabul edilmemistir",
    "Guvenlik kritik bolumlerde (auth, permission, tenant isolation) AI onerileri ekstra dikkatle incelenmistir",
    "AI araclari test yazimini hizlandirmis, ancak test senaryolarinin tasarimi ekip tarafindan yapilmistir",
    "Dokumantasyon surecinde AI, taslak olusturma ve formatlama konusunda buyuk zaman kazandirmistir",
    "Hata ayiklama sureclerinde AI, kok neden analizi icin degerli oneriler sunmustur",
    "AI ile pair programming yaklasimi benimsenmis, AI bir takim uyesi gibi degerlendirilmistir",
    "Prompt muhendisligi: Daha spesifik ve baglamli prompt'lar daha iyi sonuclar vermistir",
    "AI ciktilari her zaman proje standartlarina (PEP 8, ESLint, Conventional Commits) uygun hale getirilmistir",
]:
    bullet(doc, f"- {note}")
doc.add_page_break()

# ====================================================================
# KAYNAKLAR
# ====================================================================
h(doc, "KAYNAKLAR", level=1)
for ref in [
    "[1] Django Software Foundation, Django Documentation, https://docs.djangoproject.com/en/5.2/",
    "[2] Django REST Framework, API Guide, https://www.django-rest-framework.org/",
    "[3] django-tenants Documentation, https://django-tenants.readthedocs.io/",
    "[4] React Documentation, https://react.dev/",
    "[5] TypeScript Handbook, https://www.typescriptlang.org/docs/",
    "[6] Vite Build Tool, https://vitejs.dev/",
    "[7] Tailwind CSS Documentation, https://tailwindcss.com/docs",
    "[8] PostgreSQL Documentation, https://www.postgresql.org/docs/15/",
    "[9] pytest Documentation, https://docs.pytest.org/",
    "[10] Vitest Documentation, https://vitest.dev/",
    "[11] Playwright Documentation, https://playwright.dev/",
    "[12] WCAG 2.1 Guidelines, W3C, https://www.w3.org/TR/WCAG21/",
    "[13] OpenAI, ChatGPT, https://chat.openai.com/",
    "[14] GitHub Copilot, https://github.com/features/copilot",
    "[15] Anthropic, Claude, https://claude.ai/",
    "[16] Cursor AI IDE, https://cursor.sh/",
    "[17] Radix UI Primitives, https://www.radix-ui.com/",
    "[18] Mock Service Worker (MSW), https://mswjs.io/",
    "[19] Martin Fowler, Test Pyramid, https://martinfowler.com/articles/practical-test-pyramid.html",
    "[20] PEP 8, Style Guide for Python Code, https://peps.python.org/pep-0008/",
    "[21] PEP 257, Docstring Conventions, https://peps.python.org/pep-0257/",
]:
    p(doc, ref, sz=11, sa=6)
doc.add_page_break()

# ====================================================================
# EKLER
# ====================================================================
h(doc, "EKLER", level=1)

h(doc, "EK-1: Proje Kaynak Kodu Yapisi", level=2)
code(doc, """yasca-dental-clinic/
+-- backend/                    # Django Backend
|   +-- api/                    # Ana API uygulamasi
|   |   +-- models.py           # 9 veri modeli (344 satir)
|   |   +-- serializers.py      # 12 serializer (358 satir)
|   |   +-- views.py            # 15 view/viewset (550 satir)
|   |   +-- middleware.py       # 3 middleware (183 satir)
|   |   +-- permissions.py      # 2 RBAC sinifi
|   |   +-- mixins.py           # AuditLog mixin (90 satir)
|   |   +-- tests/              # 148+ backend test
|   +-- customers/              # Tenant yonetimi
|   +-- core/                   # Django ayarlari
|   +-- docker-compose.yml      # PostgreSQL + Backend
+-- frontend/                   # React Frontend
|   +-- src/app/components/     # 32+ React bileseni
|   +-- e2e/                    # 83 Playwright E2E test
+-- docs/                       # Dokumantasyon
|   +-- TESTING.md, CONTRIBUTING.md, adr/, diagrams/
+-- .github/                    # CI/CD ve PR template""")

h(doc, "EK-2: Swagger API Dokumantasyonu", level=2)
sw = os.path.join(BASE, "swagger_screenshot.png")
if os.path.exists(sw):
    img(doc, sw, w=5.5, cap="Sekil EK-2.1: Swagger UI - API Dokumantasyonu")

doc.add_page_break()

# ====================================================================
# OZGECMIS
# ====================================================================
h(doc, "OZGECMIS", level=1)
for name in ["Yaman Halloum", "Ali Ure", "Cihan Kurtbey", "Sukru Yesilmen"]:
    p(doc, name, sz=12, bold=True, sb=12)
    p(doc, "Istanbul Saglik ve Teknoloji Universitesi, Yazilim Muhendisligi Bolumu, Lisans Ogrencisi", sz=12)

# ====================================================================
# KAYDET
# ====================================================================
doc.save(OUT)
print(f"[OK] Rapor olusturuldu: {OUT}")
print(f"   Paragraf: {len(doc.paragraphs)}")
print(f"   Tablo: {len(doc.tables)}")
