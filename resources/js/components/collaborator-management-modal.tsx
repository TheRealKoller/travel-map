import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { type Collaborator } from '@/types/trip';
import axios from 'axios';
import { Trash2, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface CollaboratorManagementModalProps {
    tripId: number;
    tripName: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function CollaboratorManagementModal({
    tripId,
    tripName,
    isOpen,
    onClose,
}: CollaboratorManagementModalProps) {
    const [owner, setOwner] = useState<Collaborator | null>(null);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [email, setEmail] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);

    const [removingId, setRemovingId] = useState<number | null>(null);

    const loadCollaborators = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);

        try {
            const response = await axios.get<{
                owner: Collaborator;
                collaborators: Collaborator[];
            }>(`/trips/${tripId}/collaborators`);
            setOwner(response.data.owner);
            setCollaborators(response.data.collaborators);
        } catch {
            setLoadError('Failed to load collaborators. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [tripId]);

    useEffect(() => {
        if (isOpen) {
            void loadCollaborators();
        }
    }, [isOpen, loadCollaborators]);

    const handleAddCollaborator = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsAdding(true);
        setAddError(null);

        try {
            const response = await axios.post<{
                collaborator: Collaborator;
            }>(`/trips/${tripId}/collaborators`, { email: email.trim() });
            setCollaborators((prev) => [...prev, response.data.collaborator]);
            setEmail('');
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.data?.error) {
                setAddError(err.response.data.error as string);
            } else if (
                axios.isAxiosError(err) &&
                err.response?.data?.errors?.email
            ) {
                const emailErrors = err.response.data.errors.email as string[];
                setAddError(emailErrors[0]);
            } else {
                setAddError('Failed to add collaborator. Please try again.');
            }
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveCollaborator = async (userId: number) => {
        setRemovingId(userId);

        try {
            await axios.delete(`/trips/${tripId}/collaborators/${userId}`);
            setCollaborators((prev) => prev.filter((c) => c.id !== userId));
        } catch {
            // Silently handle — keep the collaborator in the list on failure
        } finally {
            setRemovingId(null);
        }
    };

    const handleClose = () => {
        setEmail('');
        setAddError(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="max-w-lg"
                data-testid="collaborator-management-modal"
            >
                <DialogHeader>
                    <DialogTitle>Manage collaborators</DialogTitle>
                    <DialogDescription>
                        Manage who has access to &ldquo;{tripName}&rdquo;. Add
                        collaborators by their email address or remove existing
                        ones.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Current collaborators */}
                    <div>
                        <h3 className="mb-3 text-sm font-medium">
                            Current members
                        </h3>

                        {isLoading && (
                            <div className="flex items-center justify-center py-6">
                                <Spinner className="size-5" />
                            </div>
                        )}

                        {loadError && (
                            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                                {loadError}
                            </div>
                        )}

                        {!isLoading && !loadError && (
                            <ul
                                className="space-y-2"
                                data-testid="collaborator-list"
                            >
                                {owner && (
                                    <li
                                        key={owner.id}
                                        className="flex items-center justify-between gap-3 rounded-lg border border-sidebar-border bg-muted/30 px-3 py-2.5"
                                        data-testid={`collaborator-item-${owner.id}`}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {owner.name}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {owner.email}
                                            </p>
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className="shrink-0 capitalize"
                                        >
                                            Owner
                                        </Badge>
                                    </li>
                                )}

                                {collaborators.map((collaborator) => (
                                    <li
                                        key={collaborator.id}
                                        className="flex items-center justify-between gap-3 rounded-lg border border-sidebar-border px-3 py-2.5"
                                        data-testid={`collaborator-item-${collaborator.id}`}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {collaborator.name}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {collaborator.email}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className="capitalize"
                                            >
                                                {
                                                    collaborator.collaboration_role
                                                }
                                            </Badge>
                                            <Button
                                                data-testid={`remove-collaborator-${collaborator.id}`}
                                                variant="ghost"
                                                size="icon"
                                                className="size-7 text-muted-foreground hover:text-destructive"
                                                onClick={() =>
                                                    handleRemoveCollaborator(
                                                        collaborator.id,
                                                    )
                                                }
                                                disabled={
                                                    removingId ===
                                                    collaborator.id
                                                }
                                                aria-label={`Remove ${collaborator.name}`}
                                            >
                                                {removingId ===
                                                collaborator.id ? (
                                                    <Spinner className="size-3.5" />
                                                ) : (
                                                    <Trash2 className="size-3.5" />
                                                )}
                                            </Button>
                                        </div>
                                    </li>
                                ))}

                                {collaborators.length === 0 && owner && (
                                    <p className="py-2 text-center text-sm text-muted-foreground">
                                        No collaborators yet.
                                    </p>
                                )}
                            </ul>
                        )}
                    </div>

                    <Separator />

                    {/* Add collaborator form */}
                    <div>
                        <h3 className="mb-3 text-sm font-medium">
                            Add collaborator
                        </h3>
                        <form
                            onSubmit={(e) => void handleAddCollaborator(e)}
                            className="space-y-3"
                            data-testid="add-collaborator-form"
                        >
                            <div className="space-y-1.5">
                                <Label htmlFor="collaborator-email">
                                    Email address
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="collaborator-email"
                                        data-testid="collaborator-email-input"
                                        type="email"
                                        placeholder="colleague@example.com"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setAddError(null);
                                        }}
                                        disabled={isAdding}
                                        className="flex-1"
                                    />
                                    <Button
                                        data-testid="add-collaborator-button"
                                        type="submit"
                                        disabled={isAdding || !email.trim()}
                                        className="shrink-0"
                                    >
                                        {isAdding ? (
                                            <Spinner className="mr-2 size-4" />
                                        ) : (
                                            <UserPlus className="mr-2 size-4" />
                                        )}
                                        Add
                                    </Button>
                                </div>
                            </div>

                            {addError && (
                                <p
                                    className="text-sm text-destructive"
                                    data-testid="add-collaborator-error"
                                >
                                    {addError}
                                </p>
                            )}
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
