# Yasca Dental — Localization Audit & Strategy Report

## 1. The Immediate Bug: Turkish Case Sensitivity

### Root Cause

The patient search sends the query to the Django backend, which uses `icontains`:

```python
# backend/api/views.py:92-98
qs = qs.filter(
    Q(first_name__icontains=search)
    | Q(last_name__icontains=search)
    | Q(phone__icontains=search)
    | Q(tckn__icontains=search)
)
```

> [!CAUTION]
> **SQLite's `LIKE` operator uses ASCII case folding, NOT Unicode-aware folding.** This means:
> - `İ` (Turkish capital I with dot) does **not** match `i` (Latin lowercase i)
> - `I` (Latin capital I) does **not** match `ı` (Turkish dotless lowercase i)
> - Searching "ibrahim" will NOT find "İbrahim", and vice versa.
>
> This is a **database-level** problem. Django's `icontains` delegates to the database engine, and SQLite simply cannot handle Turkish case rules.

### The Four-Character Problem

| Input | Expected Match | SQLite `LIKE` Result |
|-------|---------------|---------------------|
| `i` → `İ` | Yes | **No** |
| `İ` → `i` | Yes | **No** |
| `ı` → `I` | Yes | **No** |
| `I` → `ı` | Yes | **No** |
| `ş` → `Ş` | Yes | **No** |
| `ç` → `Ç` | Yes | **No** |
| `ö` → `Ö` | Yes | **No** |
| `ü` → `Ü` | Yes | **No** |
| `ğ` → `Ğ` | Yes | **No** |

### Fix Options

#### Option A: Migrate to PostgreSQL (Recommended for production)
PostgreSQL has full ICU collation support. Setting `LC_COLLATE = 'tr_TR.UTF-8'` on the database makes `ILIKE` Turkish-aware out of the box.

#### Option B: Application-level normalization (Quick fix for SQLite)
Create a custom lookup or normalize the search input and stored data:

```python
# In views.py — replace icontains with a custom approach
def turkish_normalize(text: str) -> str:
    """Normalize Turkish-specific characters for case-insensitive search."""
    table = str.maketrans('İIıi', 'iiii')  # Flatten all I-variants
    return text.translate(table).casefold()
```

Then either:
1. Store a `search_name` denormalized field, or
2. Use `Q()` with both variants: search for both `casefold()` and the Turkish-swapped version.

#### Option C: Django `Lookup` override
Register a custom `tr_icontains` lookup that applies Python-level `casefold()` with Turkish rules. This is clean but adds query overhead on large datasets.

> [!IMPORTANT]
> **Recommendation:** Option B as an immediate fix, Option A as the production target. SQLite is unsuitable for a Turkish-language production app.

---

## 2. Full Hardcoded String Inventory

### 2.1 Frontend — Component-by-Component Audit

The application has **zero i18n infrastructure**. Every user-facing string is hardcoded in Turkish directly in JSX. No translation framework, no string extraction, no language context.

| Component | Hardcoded String Categories | Estimated Translatable Strings |
|-----------|---------------------------|-------------------------------|
| [PatientProfile.tsx](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/frontend/src/app/components/PatientProfile.tsx) | Labels, tabs, headers, errors, placeholders, tooltips | ~120 |
| [AppointmentDialog.tsx](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/frontend/src/app/components/AppointmentDialog.tsx) | Form labels, validation messages, select options | ~45 |
| [TreatmentAddDialog.tsx](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/frontend/src/app/components/TreatmentAddDialog.tsx) | Form labels, status options, error messages | ~40 |
| [AppointmentCalendar.tsx](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/frontend/src/app/components/AppointmentCalendar.tsx) | Navigation labels, view modes, date formatting | ~30 |
| [Dashboard.tsx](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/frontend/src/app/components/Dashboard.tsx) | Card titles, filter labels, status badges | ~25 |
| [AppointmentDetailDialog.tsx](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/frontend/src/app/components/AppointmentDetailDialog.tsx) | Detail labels, status options, action buttons | ~25 |
| [TreatmentTypesPage.tsx](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/frontend/src/app/components/TreatmentTypesPage.tsx) | Table headers, form labels, toasts, category labels | ~25 |
| [PaymentDialog.tsx](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/frontend/src/app/components/PaymentDialog.tsx) | Form labels, validation, currency labels | ~20 |
| [PatientDialog.tsx](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/frontend/src/app/components/PatientDialog.tsx) | Form labels, placeholders, validation | ~20 |
| [ClinicSettingsPage.tsx](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/frontend/src/app/components/ClinicSettingsPage.tsx) | Day names, time labels, settings titles | ~20 |
| [DentalChart.tsx](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/frontend/src/app/components/DentalChart.tsx) | Tooth status labels, tab labels, legend | ~15 |
| [PatientSearch.tsx](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/frontend/src/app/components/PatientSearch.tsx) | Headers, placeholders, table headers, empty states | ~15 |
| [Layout.tsx](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/frontend/src/app/components/Layout.tsx) | Navigation labels, clinic title, logout | ~10 |
| [LoginPage.tsx](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/frontend/src/app/components/LoginPage.tsx) | Form labels, errors, title | ~10 |

**Total estimated frontend translatable strings: ~420**

### 2.2 Backend — Hardcoded Turkish Strings

| Location | Type | Count |
|----------|------|-------|
| [models.py](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/backend/api/models.py) `verbose_name` / `verbose_name_plural` | Admin display names | ~30 |
| [models.py](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/backend/api/models.py) `choices` tuples | Category labels, status labels | ~15 |
| [serializers.py](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/backend/api/serializers.py) `ValidationError` messages | User-facing validation errors | ~6 |
| [seed_demo_data.py](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/backend/api/management/commands/seed_demo_data.py) | Demo data names | ~10 |

**Total estimated backend translatable strings: ~60**

### 2.3 Shared Constants (Require Sync)

These constants are defined in both frontend and backend and must stay aligned:

| Constant | Frontend Location | Backend Location |
|----------|------------------|-----------------|
| Treatment categories | `TreatmentTypesPage.tsx` → `CATEGORY_OPTIONS` | `models.py` → `TreatmentType.Category` |
| Appointment statuses | `AppointmentDetailDialog.tsx` → `STATUS_OPTIONS` | `models.py` → `Appointment.Status` |
| Day names | `ClinicSettingsPage.tsx` → `DAYS` | Backend stores as integers |

---

## 3. Formatting & Locale Issues

### 3.1 Date Formatting

| Status | Detail |
|--------|--------|
| Mostly fixed | `formatDateDDMMYYYY()` utility + `DatePicker` component now enforces DD.MM.YYYY |
| Remaining | `index.html` has `lang="en"` instead of `lang="tr"` |
| Arabic concern | Arabic uses different date formats (DD/MM/YYYY with Arabic-Indic numerals potentially) |

### 3.2 Currency / Number Formatting

Currently hardcoded to Turkish Lira:

```tsx
// PatientProfile.tsx — 4 instances
.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺'

// TreatmentTypesPage.tsx, TreatmentAddDialog.tsx, PaymentDialog.tsx
"TL" suffix hardcoded in labels
```

For localization, currency symbol, decimal separator (`,` vs `.`), and thousands separator need to be configurable.

### 3.3 Calendar / Time

- `date-fns` locale is hardcoded to `tr` in `DatePicker`
- `Intl.DateTimeFormat('tr-TR')` in `AppointmentCalendar.tsx`
- `localeCompare('tr')` for sorting in `AppointmentDialog.tsx` and `TreatmentAddDialog.tsx`

---

## 4. Arabic Localization — Special Considerations

### 4.1 Right-to-Left (RTL) Layout

> [!WARNING]
> The current UI has **zero RTL support**. Arabic requires a complete layout mirror.

**What needs to change for RTL:**

| Area | Current | Required for Arabic |
|------|---------|-------------------|
| `<html>` tag | `dir="ltr"` (implicit) | `dir="rtl"` |
| Flexbox layouts | `flex-row` everywhere | Needs logical properties (`start`/`end` vs `left`/`right`) |
| Margins/padding | `ml-*`, `mr-*`, `pl-*`, `pr-*` | Must use `ms-*`, `me-*`, `ps-*`, `pe-*` (logical) |
| Text alignment | `text-left`, `text-right` | Must swap dynamically |
| Icons with direction | `ChevronLeft`/`ChevronRight` for navigation | Must swap in RTL context |
| Border sides | `border-l-4` (appointment cards) | Must become `border-r-4` in RTL |
| Dental chart | Left-to-right tooth numbering | FDI numbering stays the same, but visual layout mirrors |

**Impact assessment:** Nearly every component uses directional CSS utilities. A mechanical find-and-replace won't work; we need CSS logical properties or a RTL-aware utility layer.

### 4.2 Font & Typography

- Arabic requires a different font stack (e.g., Noto Sans Arabic, Amiri, or Cairo)
- Line heights differ for Arabic script
- Form input fields need proper Arabic text shaping support

### 4.3 Arabic-Specific Content

- Patient names in Arabic script
- Address fields with Arabic formatting
- Phone number formats may differ
- No TCKN equivalent (national ID format varies by country)

---

## 5. Recommended Architecture

### 5.1 Frontend: `react-i18next`

**Why `react-i18next`:**
- De facto standard for React i18n
- Lazy-loading of language bundles
- Pluralization rules built-in (important for Arabic, which has 6 plural forms)
- ICU MessageFormat support
- Namespace separation (group by feature)

**Proposed structure:**
```
frontend/src/
  locales/
    tr/
      common.json      # Shared: buttons, labels, status names
      patients.json     # Patient-related strings
      appointments.json # Appointment-related strings  
      treatments.json   # Treatment-related strings
      payments.json     # Payment-related strings
      settings.json     # Settings page
      dental.json       # Dental chart
    en/
      common.json
      patients.json
      ...
    ar/
      common.json
      patients.json
      ...
  app/
    utils/
      i18n.ts           # i18next configuration
      date.ts           # Already exists, extend with locale param
```

### 5.2 Backend: Django `gettext`

Django already has `USE_I18N = True` but no `LocaleMiddleware` and no `.po` files.

**Proposed changes:**
1. Add `django.middleware.locale.LocaleMiddleware` to `MIDDLEWARE`
2. Wrap all user-facing strings with `gettext_lazy()` / `_()` 
3. Accept `Accept-Language` header from frontend
4. Return localized validation error messages

### 5.3 Locale-Aware Search

Regardless of i18n framework, the Turkish search bug needs a dedicated fix:

```python
# Option: Custom Manager method
class PatientManager(models.Manager):
    @staticmethod
    def turkish_casefold(text: str) -> str:
        return text.replace('İ', 'i').replace('I', 'ı').lower()
    
    def search(self, query: str):
        normalized = self.turkish_casefold(query)
        # Use annotation + custom lookup or Python-level filtering
```

---

## 6. Phased Implementation Plan

### Phase 1: Fix Bugs (No i18n framework needed)
**Effort: 1-2 days**

1. Fix Turkish case-insensitive search (application-level normalization)
2. Fix `index.html` `lang="en"` → `lang="tr"`  
3. Ensure all `localeCompare` and sorting calls use `'tr'` locale

### Phase 2: Extract Strings & Add i18n Infrastructure
**Effort: 3-5 days**

1. Install and configure `react-i18next`
2. Create Turkish locale files by extracting all hardcoded strings
3. Replace all hardcoded strings with `t()` calls component by component
4. Add language switcher to `Layout.tsx` (settings or header)
5. Wrap backend strings with `gettext_lazy()`

### Phase 3: English Translation
**Effort: 2-3 days**

1. Create English locale files
2. Translate all strings
3. Verify formatting (dates, currency, numbers) adapt to locale
4. Test full flow in English

### Phase 4: Arabic Translation + RTL
**Effort: 5-8 days**

1. Convert all directional CSS to logical properties
2. Add `dir="rtl"` toggling based on locale
3. Add Arabic font stack
4. Create Arabic locale files
5. Handle Arabic plural forms (6 forms in Arabic vs 2 in Turkish/English)
6. Mirror dental chart layout
7. Test full RTL flow

---

## 7. Open Questions

> [!IMPORTANT]
> **Database migration:** Is there a plan to migrate from SQLite to PostgreSQL for production? This would resolve the Turkish search issue at the database level and is strongly recommended regardless of localization.

> [!IMPORTANT]
> **Scope of Arabic support:** Should Arabic support cover just the UI language, or also data entry (Arabic patient names, Arabic addresses)? The latter has implications for search, sorting, and validation.

> [!IMPORTANT]
> **Currency:** Should the app support multiple currencies (e.g., USD, SAR for Arabic-speaking clinics), or is TL the only currency with just the label translated?

> [!IMPORTANT]
> **National ID:** TCKN is Turkey-specific (11-digit). Should this field be made configurable per locale, or is the app only intended for Turkish clinics with multi-language UI?
