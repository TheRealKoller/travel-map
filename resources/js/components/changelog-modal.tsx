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
import { type ChangelogRelease } from '@/types';
import { router } from '@inertiajs/react';
import { Sparkles } from 'lucide-react';

interface ChangelogModalProps {
    releases: ChangelogRelease[];
    open: boolean;
    onClose: () => void;
}

const SECTION_LABEL: Record<string, string> = {
    Added: 'Neu',
    Changed: 'Geändert',
    Fixed: 'Behoben',
    Deprecated: 'Veraltet',
    Removed: 'Entfernt',
    Security: 'Sicherheit',
};

function sectionLabel(name: string): string {
    return SECTION_LABEL[name] ?? name;
}

function sectionColor(name: string): string {
    const map: Record<string, string> = {
        Added: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
        Changed:
            'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
        Fixed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
        Deprecated:
            'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
        Removed: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
        Security:
            'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    };
    return map[name] ?? 'bg-muted text-muted-foreground';
}

export function ChangelogModal({
    releases,
    open,
    onClose,
}: ChangelogModalProps) {
    const handleClose = () => {
        router.post(
            acknowledge(),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['changelog'],
                onSuccess: onClose,
                onError: onClose,
            },
        );
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
