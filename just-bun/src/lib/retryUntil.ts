/**
 * Retries a function until it succeeds or max time is reached
 * @param fn The function to retry
 * @param maxTime Maximum time to retry in milliseconds
 * @param delay Delay between retries in milliseconds
 * @returns Promise that resolves with the function result or rejects with the last error
 */
export async function retryUntil<T>(
    fn: () => Promise<T>,
    maxTime: number = 2000,
    delay: number = 500
): Promise<T> {
    const startTime = Date.now();
    let lastError: Error;

    while (Date.now() - startTime < maxTime) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            // If we still have time, wait before retrying
            if (Date.now() - startTime + delay < maxTime) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError!;
} 