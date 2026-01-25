import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type Language = 'de' | 'en';

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

export function useLanguage() {
    const { i18n } = useTranslation();
    const [language, setLanguage] = useState<Language>('de');

    const updateLanguage = useCallback(
        (lang: Language) => {
            setLanguage(lang);

            // Update i18next language
            i18n.changeLanguage(lang);

            // Store in localStorage for client-side persistence
            localStorage.setItem('language', lang);

            // Store in cookie for SSR
            setCookie('language', lang);
        },
        [i18n],
    );

    useEffect(() => {
        const savedLanguage =
            (localStorage.getItem('language') as Language) || 'de';

        // eslint-disable-next-line react-hooks/set-state-in-effect
        updateLanguage(savedLanguage);
    }, [updateLanguage]);

    return { language, updateLanguage } as const;
}
