export default function Heading({
    title,
    description,
}: {
    title: string;
    description?: string;
}) {
    return (
        <div className="mb-4 space-y-1 sm:mb-6 md:mb-8 md:space-y-1">
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
                {title}
            </h2>
            {description && (
                <p className="text-sm leading-relaxed text-muted-foreground md:leading-normal">
                    {description}
                </p>
            )}
        </div>
    );
}
