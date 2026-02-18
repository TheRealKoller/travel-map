import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

interface InvitationStatusBadgeProps {
    accepted_at: string | null;
    expires_at: string;
}

export default function InvitationStatusBadge({
    accepted_at,
    expires_at,
}: InvitationStatusBadgeProps) {
    const isAccepted = accepted_at !== null;
    const isExpired = new Date(expires_at) < new Date();

    if (isAccepted) {
        return (
            <Badge
                variant="outline"
                className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
            >
                <CheckCircle2 className="size-3" />
                Accepted
            </Badge>
        );
    }

    if (isExpired) {
        return (
            <Badge
                variant="outline"
                className="border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400"
            >
                <XCircle className="size-3" />
                Expired
            </Badge>
        );
    }

    return (
        <Badge
            variant="outline"
            className="border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
        >
            <Clock className="size-3" />
            Pending
        </Badge>
    );
}
