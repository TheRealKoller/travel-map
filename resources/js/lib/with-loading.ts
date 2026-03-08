type SetState<T> = (value: T | ((prev: T) => T)) => void;

interface WithLoadingOptions {
    /**
     * Fallback message used when a non-Error value is thrown.
     * Defaults to the thrown value coerced to a string via String().
     */
    fallbackMessage?: string;

    /**
     * Whether to rethrow the error after storing it via setError.
     * Set to false for "fire-and-forget" load operations called from useEffect,
     * where an unhandled promise rejection would otherwise be surfaced.
     * Defaults to true.
     */
    rethrow?: boolean;
}

/**
 * Wraps an async operation with loading and error state management.
 * Sets isLoading to true before the operation and false after (regardless of outcome).
 * On error, normalises the thrown value to an Error and stores it via setError.
 */
export async function withLoading<T>(
    setIsLoading: SetState<boolean>,
    setError: SetState<Error | null>,
    fn: () => Promise<T>,
    { fallbackMessage, rethrow = true }: WithLoadingOptions = {},
): Promise<T | undefined> {
    setIsLoading(true);
    setError(null);

    try {
        return await fn();
    } catch (err) {
        const message =
            err instanceof Error
                ? err.message
                : (fallbackMessage ?? String(err));
        const error = err instanceof Error ? err : new Error(message);
        setError(error);

        if (rethrow) {
            throw error;
        }
    } finally {
        setIsLoading(false);
    }
}
