import { login } from '@/routes';
// import { store } from '@/routes/register'; // Disabled: public registration removed
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import TextLink from '@/components/text-link';
import AuthLayout from '@/layouts/auth-layout';

export default function Register() {
    const { t } = useTranslation();

    return (
        <AuthLayout
            title={t('auth.register.title')}
            description={t('auth.register.description')}
        >
            <Head title={t('auth.register.page_title')} />
            <div className="text-center text-muted-foreground">
                <p>
                    {t(
                        'auth.register.disabled_message',
                        'Public registration is disabled. Please contact an administrator for an invitation.',
                    )}
                </p>
                <div className="mt-4">
                    <TextLink href={login()}>
                        {t('auth.register.back_to_login', 'Back to Login')}
                    </TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}
