interface EnrichmentButtonProps {
    onClick: () => void;
    isEnriching: boolean;
    disabled: boolean;
}

export default function EnrichmentButton({
    onClick,
    isEnriching,
    disabled,
}: EnrichmentButtonProps) {
    return (
        <div>
            <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md border border-purple-600 bg-white px-3 py-2 text-sm font-medium text-purple-600 transition-colors hover:bg-purple-50 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                data-testid="button-enrich-marker"
            >
                {isEnriching ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg
                            className="h-4 w-4 animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                        Enriching with AI...
                    </span>
                ) : (
                    <span className="flex items-center justify-center gap-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Enrich with AI
                    </span>
                )}
            </button>
            <p className="mt-1 text-xs text-gray-500">
                Use AI to automatically determine the marker type, UNESCO
                status, and add additional information
            </p>
        </div>
    );
}
