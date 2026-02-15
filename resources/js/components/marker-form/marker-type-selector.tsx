import { getMarkerTypeOptions } from '@/lib/marker-types';
import { MarkerType } from '@/types/marker';

interface MarkerTypeSelectorProps {
    value: MarkerType;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function MarkerTypeSelector({
    value,
    onChange,
}: MarkerTypeSelectorProps) {
    const options = getMarkerTypeOptions();

    return (
        <div>
            <label
                htmlFor="marker-type"
                className="mb-2 block text-sm font-medium text-gray-700"
            >
                Type
            </label>
            <select
                id="marker-type"
                value={value}
                onChange={onChange}
                className="flex min-h-[44px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
