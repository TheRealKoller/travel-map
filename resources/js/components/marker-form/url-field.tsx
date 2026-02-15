import { Input } from '@/components/ui/input';
import { isValidUrl } from '@/lib/marker-utils';

interface UrlFieldProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onOpen: () => void;
}

export default function UrlField({ value, onChange, onOpen }: UrlFieldProps) {
    return (
        <div>
            <label
                htmlFor="marker-url"
                className="mb-2 block text-sm font-medium text-gray-700"
            >
                URL
            </label>
            <div className="flex gap-2">
                <Input
                    id="marker-url"
                    type="url"
                    value={value}
                    onChange={onChange}
                    placeholder="https://example.com"
                />
                <button
                    type="button"
                    onClick={onOpen}
                    disabled={!value.trim() || !isValidUrl(value)}
                    className="flex min-h-[44px] flex-shrink-0 items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400"
                    aria-label="Open URL in new tab"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
