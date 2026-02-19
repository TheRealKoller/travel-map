import { login } from '@/routes';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import TextLink from '@/components/text-link';
import AuthLayout from '@/layouts/auth-layout';

interface InvitationInvalidProps {
    reason: 'expired' | 'already_accepted';
}

export default function InvitationInvalid({ reason }: InvitationInvalidProps) {
    const { t } = useTranslation();

    const title =
        reason === 'expired'
            ? t('auth.invitation_invalid.expired_title')
            : t('auth.invitation_invalid.already_accepted_title');

    const description =
        reason === 'expired'
            ? t('auth.invitation_invalid.expired_description')
            : t('auth.invitation_invalid.already_accepted_description');

    return (
        <AuthLayout title={title} description={description}>
            <Head title={t('auth.invitation_invalid.page_title')} />

            <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">{description}</p>

                <TextLink href={login()}>
                    {t('auth.invitation_invalid.back_to_login')}
                </TextLink>
            </div>
        </AuthLayout>
    );
}
