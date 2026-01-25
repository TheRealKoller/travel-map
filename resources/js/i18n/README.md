# Internationalization (i18n)

This directory contains the internationalization setup for the Travel Map application using `react-i18next`.

## Available Languages

- **German (de)** - Default language
- **English (en)** - Alternative language

## Translation Files

- `locales/de.json` - German translations
- `locales/en.json` - English translations
- `config.ts` - i18next configuration

## Usage in Components

### Import and Setup

```tsx
import { useTranslation } from 'react-i18next';

export default function MyComponent() {
    const { t } = useTranslation();

    return (
        <div>
            <h1>{t('auth.login.title')}</h1>
            <button>{t('common.save')}</button>
        </div>
    );
}
```

### Translation Key Structure

Translations are organized by feature/page:

```
auth.*                  - Authentication pages
  .login.*             - Login page
  .register.*          - Registration page
  .forgot_password.*   - Forgot password page
  .reset_password.*    - Reset password page
  .verify_email.*      - Email verification page
  .confirm_password.*  - Password confirmation page
  .two_factor_challenge.* - Two-factor authentication

navigation.*           - Navigation elements
dashboard.*            - Dashboard page
trips.*                - Trip management
  .create_modal.*      - Create trip modal
  .rename_modal.*      - Rename trip modal
  .delete_dialog.*     - Delete trip dialog
  .notes_modal.*       - Trip notes modal
  .invite_modal.*      - Invite modal

tours.*                - Tour management
  .create_modal.*      - Create tour modal
  .actions.*           - Tour action buttons
  .delete_dialog.*     - Delete tour dialog
  .sort.*              - Tour sorting messages

markers.*              - Marker management
  .types.*             - Marker types
  .delete_dialog.*     - Delete marker dialog

routes.*               - Route management
settings.*             - Settings pages
  .language.*          - Language settings
  .profile.*           - Profile settings
  .password.*          - Password settings
  .two_factor.*        - Two-factor authentication settings
  .appearance.*        - Appearance settings

common.*               - Common UI terms (save, cancel, delete, etc.)
```

## Currently Implemented Components

The following components have been updated to use translations:

### Authentication Pages ✅

- `pages/auth/login.tsx`
- `pages/auth/register.tsx`
- `pages/auth/forgot-password.tsx`
- `pages/auth/reset-password.tsx`
- `pages/auth/verify-email.tsx`
- `pages/auth/confirm-password.tsx`
- `pages/auth/two-factor-challenge.tsx`

### Main Pages ✅

- `pages/dashboard.tsx`
- `pages/map.tsx`
- `pages/settings/language.tsx`

### Components ✅

- `components/create-trip-modal.tsx`
- `components/language-selector.tsx`

## Adding Translations to Other Components

All translation keys are already defined in the JSON files. To add translations to a component:

1. Import the hook: `import { useTranslation } from 'react-i18next';`
2. Use the hook in your component: `const { t } = useTranslation();`
3. Replace hardcoded strings with translation keys: `{t('key.path')}`
4. Reference the JSON files to find the correct key for your text

## Language Switching

Users can switch languages in the Settings > Language page. The selected language is stored in:

- LocalStorage (`language` key)
- Cookie (`language` key)

The app automatically detects the user's preferred language on first visit using browser settings, with German as the fallback.

## Adding New Translations

1. Add the English text to `locales/en.json`
2. Add the German translation to `locales/de.json`
3. Use the same key structure in both files
4. Update components to use the new keys

Example:

```json
// en.json
{
  "my_feature": {
    "my_text": "Hello World"
  }
}

// de.json
{
  "my_feature": {
    "my_text": "Hallo Welt"
  }
}
```

```tsx
// Component
const { t } = useTranslation();
return <h1>{t('my_feature.my_text')}</h1>;
```
