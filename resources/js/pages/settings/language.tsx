import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import HeadingSmall from '@/components/heading-small';
import LanguageSelector from '@/components/language-selector';
import { type BreadcrumbItem } from '@/types';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit as editLanguage } from '@/routes/language';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Language settings',
        href: editLanguage().url,
    },
];

export default function Language() {
    const { t } = useTranslation();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Language settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title={t('settings.language.title')}
                        description={t('settings.language.description')}
                    />
                    <LanguageSelector />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
