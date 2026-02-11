export default function HeadingSmall({
    title,
    description,
}: {
    title: string;
    description?: string;
}) {
    return (
        <header>
            <h3 className="mb-0.5 text-sm font-medium sm:text-base">{title}</h3>
            {description && (
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm sm:leading-normal">
                    {description}
                </p>
            )}
        </header>
    );
}
