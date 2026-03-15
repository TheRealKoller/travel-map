import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';

interface InvitationInvalidProps {
    reason: 'expired' | 'revoked';
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Invitation invalid',
        href: '#',
    },
];

export default function TripInvitationInvalid({
    reason,
}: InvitationInvalidProps) {
    const isExpired = reason === 'expired';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Invitation invalid" />
            <div className="flex h-full flex-1 flex-col items-center justify-center gap-6 p-6">
                <div className="flex max-w-md flex-col items-center gap-4 text-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
                        <AlertTriangle className="size-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h1 className="text-2xl font-semibold">
                        {isExpired
                            ? 'Invitation link expired'
                            : 'Invitation link revoked'}
                    </h1>
                    <p className="text-muted-foreground">
                        {isExpired
                            ? 'This invitation link has expired. Please ask the trip owner to generate a new invitation link.'
                            : 'This invitation link has been revoked by the trip owner. Please ask them for a new invitation link.'}
                    </p>
                    <Button asChild variant="outline">
                        <Link href="/trips">Go to my trips</Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
