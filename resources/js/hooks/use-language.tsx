import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type Language = 'de' | 'en';

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    const secure = window.location.protocol === 'https:' ? ';Secure' : '';
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax${secure}`;
};

export function useLanguage() {
    const { i18n } = useTranslation();
    const [language, setLanguage] = useState<Language>(
        (i18n.language as Language) || 'de',
    );

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
        // Listen for i18next language changes
        const handleLanguageChange = (lng: string) => {
            setLanguage((lng as Language) || 'de');
        };

        i18n.on('languageChanged', handleLanguageChange);

        return () => {
            i18n.off('languageChanged', handleLanguageChange);
        };
    }, [i18n]);

    return { language, updateLanguage } as const;
}
