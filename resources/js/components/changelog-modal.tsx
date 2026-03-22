import { acknowledge } from '@/actions/App/Http/Controllers/ChangelogController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { sectionColor, sectionLabel } from '@/lib/changelog-ui';
import { type ChangelogRelease } from '@/types';
import { usePage } from '@inertiajs/react';
import { Sparkles } from 'lucide-react';

interface ChangelogModalProps {
    releases: ChangelogRelease[];
    open: boolean;
    onClose: () => void;
}

export function ChangelogModal({
    releases,
    open,
    onClose,
}: ChangelogModalProps) {
    const { csrf_token } = usePage<{ csrf_token: string }>().props;

    const handleClose = () => {
        // Close optimistically so the UI responds immediately.
        onClose();

        // Fire-and-forget: record the current version as seen.
        fetch(acknowledge.url(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrf_token,
            },
        }).catch(() => {
            // Silently ignore — the modal won't reappear until the next page
            // load anyway because open state is managed in memory.
        });
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="size-5 text-primary" />
                        Was ist neu seit deinem letzten Besuch
                    </DialogTitle>
                    <DialogDescription>
                        {releases.length === 1
                            ? `Version ${releases[0].version} vom ${releases[0].date}`
                            : `${releases.length} neue Releases seit deinem letzten Login`}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-96 pr-3">
                    <div className="flex flex-col gap-6">
                        {releases.map((release, index) => (
                            <div key={release.version}>
                                {index > 0 && <Separator className="mb-4" />}
                                <div className="mb-3 flex items-baseline gap-2">
                                    <span className="text-sm font-semibold">
                                        v{release.version}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {release.date}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {Object.entries(release.sections).map(
                                        ([section, items]) =>
                                            items.length > 0 && (
                                                <div key={section}>
                                                    <span
                                                        className={`mb-1.5 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${sectionColor(section)}`}
                                                    >
                                                        {sectionLabel(section)}
                                                    </span>
                                                    <ul className="flex flex-col gap-1">
                                                        {items.map(
                                                            (item, i) => (
                                                                <li
                                                                    key={i}
                                                                    className="flex gap-2 text-sm leading-snug text-muted-foreground"
                                                                >
                                                                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-current" />
                                                                    {item}
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                </div>
                                            ),
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <Button onClick={handleClose}>Alles klar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
