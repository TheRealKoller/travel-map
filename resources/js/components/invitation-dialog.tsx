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
import { Check, Copy } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

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
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateInvitationLink = useCallback(
        async (role?: 'editor' | 'viewer') => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await axios.post(
                    `/trips/${tripId}/generate-invitation-token`,
                    role !== undefined ? { invitation_role: role } : {},
                );
                setInvitationUrl(response.data.url);
                if (response.data.invitation_role) {
                    setInvitationRole(response.data.invitation_role);
                }
            } catch (err) {
                console.error('Error generating invitation link:', err);
                setError(
                    'Failed to generate invitation link. Please try again.',
                );
            } finally {
                setIsLoading(false);
            }
        },
        [tripId],
    );

    useEffect(() => {
        if (isOpen && !invitationUrl) {
            void generateInvitationLink();
        }
    }, [isOpen, invitationUrl, generateInvitationLink]);

    const handleRoleChange = async (role: 'editor' | 'viewer') => {
        setInvitationRole(role);
        await generateInvitationLink(role);
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
        onClose();
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
                                This link will remain valid as long as the trip
                                exists. Anyone who joins via this link will
                                receive the{' '}
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
                    <Button onClick={handleClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
