import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import axios from 'axios';
import { Check, Copy, Unlink } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type ExpiresIn = '7' | '30' | 'never';

interface InvitationDialogProps {
    tripId: number;
    tripName: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function InvitationDialog({
    tripId,
    tripName,
    isOpen,
    onClose,
}: InvitationDialogProps) {
    const [invitationUrl, setInvitationUrl] = useState<string | null>(null);
    const [invitationRole, setInvitationRole] = useState<'editor' | 'viewer'>(
        'editor',
    );
    const [expiresIn, setExpiresIn] = useState<ExpiresIn>('never');
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRevoking, setIsRevoking] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateInvitationLink = useCallback(
        async (role?: 'editor' | 'viewer', expiry?: ExpiresIn) => {
            setIsLoading(true);
            setError(null);

            const payload: Record<string, string> = {};
            if (role !== undefined) {
                payload.invitation_role = role;
            }
            const effectiveExpiry = expiry ?? expiresIn;
            if (effectiveExpiry !== 'never') {
                payload.expires_in = effectiveExpiry;
            }

            try {
                const response = await axios.post(
                    `/trips/${tripId}/generate-invitation-token`,
                    payload,
                );
                setInvitationUrl(response.data.url);
                if (response.data.invitation_role) {
                    setInvitationRole(response.data.invitation_role);
                }
                setExpiresAt(response.data.invitation_token_expires_at ?? null);
            } catch (err) {
                console.error('Error generating invitation link:', err);
                setError(
                    'Failed to generate invitation link. Please try again.',
                );
            } finally {
                setIsLoading(false);
            }
        },
        [tripId, expiresIn],
    );

    const revokeInvitationLink = async () => {
        setIsRevoking(true);
        setError(null);

        try {
            await axios.delete(`/trips/${tripId}/invitation-token`);
            setInvitationUrl(null);
            setExpiresAt(null);
        } catch (err) {
            console.error('Error revoking invitation link:', err);
            setError('Failed to revoke invitation link. Please try again.');
        } finally {
            setIsRevoking(false);
        }
    };

    useEffect(() => {
        if (isOpen && !invitationUrl) {
            void generateInvitationLink();
        }
    }, [isOpen, invitationUrl, generateInvitationLink]);

    const handleRoleChange = async (role: 'editor' | 'viewer') => {
        setInvitationRole(role);
        await generateInvitationLink(role);
    };

    const handleExpiryChange = async (value: ExpiresIn) => {
        setExpiresIn(value);
        await generateInvitationLink(undefined, value);
    };

    const handleCopyToClipboard = async () => {
        if (!invitationUrl) return;

        try {
            await navigator.clipboard.writeText(invitationUrl);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };

    const handleClose = () => {
        setIsCopied(false);
        setInvitationUrl(null);
        setExpiresAt(null);
        onClose();
    };

    const formatExpiresAt = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent data-testid="invitation-dialog">
                <DialogHeader>
                    <DialogTitle>Invite to trip</DialogTitle>
                    <DialogDescription>
                        Share this link with others to let them join &ldquo;
                        {tripName}&rdquo;. Configure the role they will receive
                        when joining.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {isLoading && (
                        <div className="flex items-center justify-center py-4">
                            <Spinner className="size-6" />
                        </div>
                    )}

                    {error && (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                            {error}
                        </div>
                    )}

                    {!isLoading && (
                        <div className="space-y-2">
                            <Label htmlFor="invitation-role">
                                Role for new collaborators
                            </Label>
                            <Select
                                value={invitationRole}
                                onValueChange={(value) =>
                                    void handleRoleChange(
                                        value as 'editor' | 'viewer',
                                    )
                                }
                            >
                                <SelectTrigger
                                    id="invitation-role"
                                    data-testid="invitation-role-select"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="editor">
                                        Editor — can view and edit
                                    </SelectItem>
                                    <SelectItem value="viewer">
                                        Viewer — can only view
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {!isLoading && (
                        <div className="space-y-2">
                            <Label htmlFor="invitation-expiry">
                                Link expiry
                            </Label>
                            <Select
                                value={expiresIn}
                                onValueChange={(value) =>
                                    void handleExpiryChange(value as ExpiresIn)
                                }
                            >
                                <SelectTrigger
                                    id="invitation-expiry"
                                    data-testid="invitation-expiry-select"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">
                                        Expires in 7 days
                                    </SelectItem>
                                    <SelectItem value="30">
                                        Expires in 30 days
                                    </SelectItem>
                                    <SelectItem value="never">
                                        Never expires
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {invitationUrl && !isLoading && (
                        <div className="space-y-2">
                            <Label htmlFor="invitation-link">
                                Invitation link
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    id="invitation-link"
                                    data-testid="invitation-link-input"
                                    value={invitationUrl}
                                    readOnly
                                    className="flex-1 font-mono text-sm"
                                    onClick={(e) => e.currentTarget.select()}
                                />
                                <Button
                                    data-testid="copy-invitation-link-button"
                                    onClick={handleCopyToClipboard}
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0"
                                >
                                    {isCopied ? (
                                        <Check className="size-4" />
                                    ) : (
                                        <Copy className="size-4" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {expiresAt
                                    ? `This link expires on ${formatExpiresAt(expiresAt)}.`
                                    : 'This link will remain valid as long as the trip exists.'}{' '}
                                Anyone who joins via this link will receive the{' '}
                                <strong>
                                    {invitationRole === 'viewer'
                                        ? 'viewer'
                                        : 'editor'}
                                </strong>{' '}
                                role.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {error && (
                        <Button
                            onClick={() => void generateInvitationLink()}
                            variant="outline"
                        >
                            Try again
                        </Button>
                    )}
                    {invitationUrl && !isLoading && (
                        <Button
                            data-testid="revoke-invitation-link-button"
                            onClick={() => void revokeInvitationLink()}
                            variant="outline"
                            disabled={isRevoking}
                        >
                            {isRevoking ? (
                                <Spinner className="mr-2 size-4" />
                            ) : (
                                <Unlink className="mr-2 size-4" />
                            )}
                            Revoke link
                        </Button>
                    )}
                    <Button onClick={handleClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
