import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { sectionColor, sectionLabel } from '@/lib/changelog-ui';
import { type BreadcrumbItem, type ChangelogRelease } from '@/types';
import { Head } from '@inertiajs/react';
import { Sparkles } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Changelog',
        href: '/changelog',
    },
];

interface ChangelogPageProps {
    releases: ChangelogRelease[];
}

export default function ChangelogPage({ releases }: ChangelogPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Changelog" />

            <div className="mx-auto max-w-2xl px-4 py-8">
                <div className="mb-8 flex items-center gap-3">
                    <Sparkles className="size-6 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold">Changelog</h1>
                        <p className="text-sm text-muted-foreground">
                            Alle Änderungen an Travel Map im Überblick
                        </p>
                    </div>
                </div>

                {releases.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Noch keine Einträge vorhanden.
                    </p>
                ) : (
                    <div className="flex flex-col gap-10">
                        {releases.map((release, index) => (
                            <div key={release.version}>
                                {index > 0 && <Separator className="mb-10" />}
                                <div className="mb-4 flex items-baseline gap-3">
                                    <h2 className="text-lg font-semibold">
                                        v{release.version}
                                    </h2>
                                    <span className="text-sm text-muted-foreground">
                                        {release.date}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {Object.entries(release.sections).map(
                                        ([section, items]) =>
                                            items.length > 0 && (
                                                <div key={section}>
                                                    <span
                                                        className={`mb-2 inline-block rounded px-2 py-0.5 text-xs font-medium ${sectionColor(section)}`}
                                                    >
                                                        {sectionLabel(section)}
                                                    </span>
                                                    <ul className="flex flex-col gap-1.5">
                                                        {items.map(
                                                            (item, i) => (
                                                                <li
                                                                    key={i}
                                                                    className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
                                                                >
                                                                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-current" />
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
                )}
            </div>
        </AppLayout>
    );
}
