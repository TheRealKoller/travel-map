import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

interface InvitationStatusBadgeProps {
    accepted_at: string | null;
    is_expired: boolean;
}

export default function InvitationStatusBadge({
    accepted_at,
    is_expired,
}: InvitationStatusBadgeProps) {
    const isAccepted = accepted_at !== null;

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

    if (is_expired) {
        return (
            <Badge
                variant="outline"
                className="border-gray-500/50 bg-gray-500/10 text-gray-700 dark:text-gray-400"
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
