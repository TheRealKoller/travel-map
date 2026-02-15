import { Icon } from '@/components/ui/icon';
import { getMarkerTypeIcon, UnescoIcon } from '@/lib/marker-icons';
import { getMarkerTypeLabel } from '@/lib/marker-types';
import { MarkerType } from '@/types/marker';

interface MarkerFormHeaderProps {
    type: MarkerType;
    isUnesco: boolean;
    aiEnriched: boolean;
    onClose: () => void;
}

export default function MarkerFormHeader({
    type,
    isUnesco,
    aiEnriched,
    onClose,
}: MarkerFormHeaderProps) {
    return (
        <>
            <button
                onClick={onClose}
                className="absolute top-2 right-2 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
                data-testid="button-close-marker-form"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>
            <h2 className="mb-4 flex items-center gap-2 pr-8 text-xl font-semibold">
                <span>Marker Details</span>
                <span title={getMarkerTypeLabel(type)}>
                    <Icon
                        iconNode={getMarkerTypeIcon(type)}
                        className="h-5 w-5 text-gray-600"
                    />
                </span>
                {isUnesco && (
                    <span title="UNESCO World Heritage Site">
                        <Icon
                            iconNode={UnescoIcon}
                            className="h-5 w-5 text-blue-600"
                        />
                    </span>
                )}
                {aiEnriched && (
                    <span
                        className="inline-flex items-center gap-1 rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700"
                        title="This marker has been enriched with AI"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                                clipRule="evenodd"
                            />
                        </svg>
                        AI enriched
                    </span>
                )}
            </h2>
        </>
    );
}
