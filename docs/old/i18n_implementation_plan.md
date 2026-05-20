# Localization (i18n) Implementation Plan

This plan outlines the steps to move the Yasca Dental React frontend from hardcoded Turkish strings to a proper internationalized (i18n) setup.

## Background

The application currently has roughly 420 hardcoded user-facing strings across all components. As requested, we will use a standard i18n approach with local JSON files rather than massive language packs or external translator APIs.

## User Review Required

> [!IMPORTANT]
> **Default Language:** I am assuming the default/fallback language will remain Turkish (`tr`), with English (`en`) as the first target translation. Please confirm if this is correct.
> 
> **Translation Scope:** Should I go ahead and translate all 420 strings into English as part of this implementation, or would you prefer me to just set up the infrastructure and translate a few key components as a proof-of-concept for you to finish later?
> 
> **RTL (Arabic) Support:** The report mentions Arabic. Should Arabic (and its required Right-to-Left CSS layout changes) be included in this immediate implementation phase, or deferred to a later phase?

## Proposed Changes

### 1. Infrastructure Setup

#### [NEW] `frontend/src/app/utils/i18n.ts`
We will install `i18next` and `react-i18next`. This file will configure the i18next instance, setting Turkish as the default language and loading translations from local JSON objects.

#### [MODIFY] `frontend/src/main.tsx`
Wrap the application in `I18nextProvider` (or simply import the `i18n.ts` file so it initializes before React renders).

### 2. Translation Files

We will create JSON dictionaries grouped by feature area to keep files manageable.

#### [NEW] `frontend/src/locales/tr/common.json` (and `en/common.json`)
For shared strings like "Kaydet" (Save), "İptal" (Cancel), "Sil" (Delete).

#### [NEW] `frontend/src/locales/tr/patients.json` (and `en/patients.json`)
For patient-specific strings (e.g., "Hasta Profili", "TCKN").

#### [NEW] `frontend/src/locales/tr/appointments.json` (and `en/appointments.json`)
For calendar and scheduling strings.

### 3. Component Updates

#### [MODIFY] `frontend/src/app/components/*.tsx` (All UI Components)
We will refactor components to use the `useTranslation` hook. 
*Example:*
```tsx
// Before
<Button>Yeni Hasta Ekle</Button>

// After
const { t } = useTranslation('patients');
<Button>{t('add_new_patient')}</Button>
```

### 4. Language Switcher

#### [MODIFY] `frontend/src/app/components/Layout.tsx`
Add a simple dropdown in the header or sidebar allowing the user to toggle between `Türkçe` and `English`. This will call `i18n.changeLanguage()`.

### 5. Formatting

#### [MODIFY] `frontend/src/app/utils/date.ts`
Update date formatting utilities to respect the active i18n locale (e.g., using `date-fns` locales dynamically).

#### [MODIFY] Currency Displays
Replace hardcoded `+ ' ₺'` and `TL` with `Intl.NumberFormat` localized currency strings based on the selected language.

---

## Verification Plan

### Manual Verification
1. Open the application and verify the default language remains Turkish and looks visually identical to the current state.
2. Toggle the language switcher to English.
3. Verify that the UI instantly updates without a page reload.
4. Check edge cases: Date pickers, currency formats in the PaymentDialog, and table headers in the PatientSearch.
