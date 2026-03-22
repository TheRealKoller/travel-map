export const SECTION_LABEL: Record<string, string> = {
    Added: 'Neu',
    Changed: 'Geändert',
    Fixed: 'Behoben',
    Deprecated: 'Veraltet',
    Removed: 'Entfernt',
    Security: 'Sicherheit',
};

export function sectionLabel(name: string): string {
    return SECTION_LABEL[name] ?? name;
}

export function sectionColor(name: string): string {
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
