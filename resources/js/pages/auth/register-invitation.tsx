import { accept } from '@/routes/register/invitation';
import { Form, Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';

interface RegisterInvitationProps {
    token: string;
    email: string;
}

export default function RegisterInvitation({
    token,
    email,
}: RegisterInvitationProps) {
    const { t } = useTranslation();

    return (
        <AuthLayout
            title={t('auth.register_invitation.title')}
            description={t('auth.register_invitation.description')}
        >
            <Head title={t('auth.register_invitation.page_title')} />

            <Form
                {...accept.form(token)}
                transform={(data) => ({ ...data, email })}
                resetOnSuccess={['password', 'password_confirmation']}
            >
                {({ processing, errors }) => (
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email">
                                {t('auth.register_invitation.email_label')}
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                className="mt-1 block w-full"
                                readOnly
                            />
                            <InputError
                                message={errors.email}
                                className="mt-2"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="name">
                                {t('auth.register_invitation.name_label')}
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                name="name"
                                autoComplete="name"
                                required
                                className="mt-1 block w-full"
                                placeholder={t(
                                    'auth.register_invitation.name_placeholder',
                                )}
                            />
                            <InputError
                                message={errors.name}
                                className="mt-2"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">
                                {t('auth.register_invitation.password_label')}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                autoComplete="new-password"
                                required
                                className="mt-1 block w-full"
                                placeholder={t(
                                    'auth.register_invitation.password_placeholder',
                                )}
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                {t(
                                    'auth.register_invitation.password_confirmation_label',
                                )}
                            </Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                autoComplete="new-password"
                                required
                                className="mt-1 block w-full"
                                placeholder={t(
                                    'auth.register_invitation.password_confirmation_placeholder',
                                )}
                            />
                            <InputError
                                message={errors.password_confirmation}
                                className="mt-2"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="mt-4 w-full"
                            disabled={processing}
                            data-testid="create-account-button"
                        >
                            {processing && <Spinner />}
                            {t('auth.register_invitation.submit_button')}
                        </Button>
                    </div>
                )}
            </Form>
        </AuthLayout>
    );
}
