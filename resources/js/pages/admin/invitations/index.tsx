import InvitationStatusBadge from '@/components/admin/invitation-status-badge';
import SendInvitationForm from '@/components/admin/send-invitation-form';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { destroy } from '@/routes/admin/invitations';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';

interface Inviter {
    id: number;
    name: string;
}

interface Invitation {
    id: number;
    email: string;
    invited_by: number;
    role: string;
    expires_at: string;
    accepted_at: string | null;
    created_at: string;
    is_expired: boolean;
    inviter: Inviter;
}

interface PaginatedInvitations {
    data: Invitation[];
    links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number | null;
        last_page: number;
        path: string;
        per_page: number;
        to: number | null;
        total: number;
    };
}

interface InvitationsIndexProps {
    invitations: PaginatedInvitations;
    filters: {
        status?: string | null;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/invitations',
    },
    {
        title: 'User invitations',
        href: '/admin/invitations',
    },
];

export default function InvitationsIndex({
    invitations,
    filters,
}: InvitationsIndexProps) {
    const currentStatus = filters.status || 'all';

    const handleStatusChange = (status: string) => {
        router.get('/admin/invitations', status === 'all' ? {} : { status }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = (invitationId: number) => {
        if (
            !confirm(
                'Are you sure you want to delete this invitation? This action cannot be undone.',
            )
        ) {
            return;
        }

        router.delete(destroy.url(invitationId), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User invitations" />

            <div className="space-y-6">
                <HeadingSmall
                    title="User invitations"
                    description="Manage user invitations and invite new users to your platform"
                />

                <SendInvitationForm />

                <Tabs
                    value={currentStatus}
                    onValueChange={handleStatusChange}
                    className="w-full"
                >
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="expired">Expired</TabsTrigger>
                        <TabsTrigger value="accepted">Accepted</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="rounded-lg border bg-card shadow-sm">
                    <div className="border-b p-6">
                        <h3 className="text-lg font-semibold">
                            All invitations
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {invitations.meta.total}{' '}
                            {invitations.meta.total === 1
                                ? 'invitation'
                                : 'invitations'}{' '}
                            total
                        </p>
                    </div>

                    {invitations.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-muted-foreground">
                                No invitations yet. Send your first invitation
                                above.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            Invited by
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            Created
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            Expires
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y bg-card">
                                    {invitations.data.map((invitation) => (
                                        <tr
                                            key={invitation.id}
                                            className="transition-colors hover:bg-muted/50"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium">
                                                    {invitation.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <InvitationStatusBadge
                                                    accepted_at={
                                                        invitation.accepted_at
                                                    }
                                                    is_expired={
                                                        invitation.is_expired
                                                    }
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm">
                                                    {invitation.inviter.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-muted-foreground">
                                                {format(
                                                    new Date(
                                                        invitation.created_at,
                                                    ),
                                                    'MMM d, yyyy',
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-muted-foreground">
                                                {format(
                                                    new Date(
                                                        invitation.expires_at,
                                                    ),
                                                    'MMM d, yyyy',
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleDelete(
                                                            invitation.id,
                                                        )
                                                    }
                                                    className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
                                                >
                                                    <Trash2 />
                                                    Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {invitations.meta.last_page > 1 && (
                        <div className="border-t px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Showing {invitations.meta.from ?? 0} to{' '}
                                    {invitations.meta.to ?? 0} of{' '}
                                    {invitations.meta.total} invitations
                                </div>
                                <div className="flex gap-2">
                                    {invitations.links.prev && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                router.visit(
                                                    invitations.links.prev!,
                                                )
                                            }
                                        >
                                            Previous
                                        </Button>
                                    )}
                                    {invitations.links.next && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                router.visit(
                                                    invitations.links.next!,
                                                )
                                            }
                                        >
                                            Next
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
