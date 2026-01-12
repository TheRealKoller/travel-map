import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface LogEntry {
    timestamp: string;
    environment: string;
    level: string;
    message: string;
    stacktrace: string[];
}

interface Props {
    logs: LogEntry[];
    totalLines: number;
    message?: string;
}

export default function LogsIndex({ logs, totalLines, message }: Props) {
    return (
        <AppLayout>
            <Head title="Application Logs" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Application Logs</CardTitle>
                            <CardDescription>
                                {message
                                    ? message
                                    : `Showing latest ${totalLines} log entries from storage/logs/laravel.log`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {logs.length === 0 ? (
                                <p className="py-8 text-center text-muted-foreground">
                                    No log entries found.
                                </p>
                            ) : (
                                <ScrollArea className="h-[600px] w-full rounded-md border">
                                    <div className="space-y-2 p-4">
                                        {logs.map((log, index) => (
                                            <LogEntryItem
                                                key={index}
                                                log={log}
                                            />
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

function LogEntryItem({ log }: { log: LogEntry }) {
    const [isOpen, setIsOpen] = useState(false);

    const getLevelColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'error':
                return 'destructive';
            case 'warning':
                return 'warning';
            case 'info':
                return 'default';
            case 'debug':
                return 'secondary';
            default:
                return 'outline';
        }
    };

    const hasStacktrace = log.stacktrace && log.stacktrace.length > 0;

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="rounded-lg border bg-card p-3 text-card-foreground shadow-sm">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                            <Badge variant={getLevelColor(log.level)}>
                                {log.level.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                {log.timestamp}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                [{log.environment}]
                            </span>
                        </div>
                        <p className="font-mono text-sm break-all">
                            {log.message}
                        </p>
                    </div>
                    {hasStacktrace && (
                        <CollapsibleTrigger asChild>
                            <button
                                type="button"
                                className="rounded-md p-1 hover:bg-muted"
                                data-testid="toggle-stacktrace"
                            >
                                <ChevronDown
                                    className={`h-4 w-4 transition-transform ${
                                        isOpen ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>
                        </CollapsibleTrigger>
                    )}
                </div>
                {hasStacktrace && (
                    <CollapsibleContent>
                        <div className="mt-3 rounded-md bg-muted p-3">
                            <p className="mb-2 text-xs font-semibold">
                                Stack Trace:
                            </p>
                            <pre className="font-mono text-xs break-all whitespace-pre-wrap">
                                {log.stacktrace.join('\n')}
                            </pre>
                        </div>
                    </CollapsibleContent>
                )}
            </div>
        </Collapsible>
    );
}
