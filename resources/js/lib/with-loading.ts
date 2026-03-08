type SetState<T> = (value: T | ((prev: T) => T)) => void;

/**
 * Wraps an async operation with loading and error state management.
 * Sets isLoading to true before the operation and false after (regardless of outcome).
 * On error, normalises the thrown value to an Error and stores it via setError.
 */
export async function withLoading<T>(
    setIsLoading: SetState<boolean>,
    setError: SetState<Error | null>,
    fn: () => Promise<T>,
): Promise<T> {
    setIsLoading(true);
    setError(null);

    try {
        return await fn();
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
    } finally {
        setIsLoading(false);
    }
}
