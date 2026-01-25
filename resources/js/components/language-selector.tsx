import { useLanguage, type Language } from '@/hooks/use-language';
import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageSelector({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { language, updateLanguage } = useLanguage();
    const { t } = useTranslation();

    const languages: { value: Language; label: string }[] = [
        { value: 'de', label: t('settings.language.languages.de') },
        { value: 'en', label: t('settings.language.languages.en') },
    ];

    return (
        <div className={cn('space-y-2', className)} {...props}>
            <label className="text-sm font-medium">
                {t('settings.language.select_label')}
            </label>
            <div className="inline-flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
                {languages.map(({ value, label }) => (
                    <button
                        key={value}
                        data-testid={`language-${value}`}
                        onClick={() => updateLanguage(value)}
                        className={cn(
                            'flex items-center rounded-md px-3.5 py-1.5 transition-colors',
                            language === value
                                ? 'bg-white shadow-xs dark:bg-neutral-700 dark:text-neutral-100'
                                : 'text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60',
                        )}
                    >
                        <span className="text-sm">{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
