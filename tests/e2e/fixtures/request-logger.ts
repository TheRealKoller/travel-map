import { Page, test as base } from '@playwright/test';

export type RequestLog = {
    method: string;
    url: string;
    status?: number;
    statusText?: string;
    resourceType?: string;
    timestamp: number;
};

export type FailedRequest = {
    method: string;
    url: string;
    failure: string;
    timestamp: number;
};

export type RequestLoggerFixture = {
    requests: RequestLog[];
    failedRequests: FailedRequest[];
    consoleMessages: string[];
    attachLogs: () => Promise<void>;
};

/**
 * Extended test with automatic request logging
 */
export const test = base.extend<{ requestLogger: RequestLoggerFixture }>({
    requestLogger: async ({ page }, use, testInfo) => {
        const requests: RequestLog[] = [];
        const failedRequests: FailedRequest[] = [];
        const consoleMessages: string[] = [];

        // Capture console messages
        page.on('console', (msg) => {
            const text = `[${msg.type().toUpperCase()}] ${msg.text()}`;
            consoleMessages.push(text);
        });

        // Capture page errors
        page.on('pageerror', (error) => {
            const errorText = `[PAGE ERROR] ${error.message}\n${error.stack}`;
            consoleMessages.push(errorText);
        });

        // Log all requests
        page.on('request', (request) => {
            requests.push({
                method: request.method(),
                url: request.url(),
                resourceType: request.resourceType(),
                timestamp: Date.now(),
            });
        });

        // Log all responses
        page.on('response', async (response) => {
            const request = response.request();
            const status = response.status();
            const statusText = response.statusText();

            // Find the corresponding request and update it
            const reqIndex = requests.findIndex(
                (r) =>
                    r.url === request.url() &&
                    r.method === request.method() &&
                    !r.status,
            );
            if (reqIndex !== -1) {
                requests[reqIndex].status = status;
                requests[reqIndex].statusText = statusText;
            }

            // Log failed responses (4xx, 5xx) to console for immediate visibility
            if (status >= 400) {
                console.error(
                    `❌ HTTP ${status}: ${request.method()} ${request.url()}`,
                );
            }
        });

        // Log request failures
        page.on('requestfailed', (request) => {
            const failure = request.failure();
            const failedReq = {
                method: request.method(),
                url: request.url(),
                failure: failure?.errorText || 'Unknown error',
                timestamp: Date.now(),
            };
            
            failedRequests.push(failedReq);
            
            // Log to console for immediate visibility
            console.error(
                `❌ Request Failed: ${failedReq.method} ${failedReq.url} - ${failedReq.failure}`,
            );
        });

        // Function to attach logs to test report
        const attachLogs = async () => {
            // Create summary
            const summary = {
                testName: testInfo.title,
                totalRequests: requests.length,
                failedRequests: failedRequests.length,
                successfulRequests: requests.filter(
                    (r) => r.status && r.status < 400,
                ).length,
                consoleErrors: consoleMessages.filter((m) =>
                    m.startsWith('[ERROR]'),
                ).length,
                consoleWarnings: consoleMessages.filter((m) =>
                    m.startsWith('[WARNING]'),
                ).length,
            };

            // Group requests by status code
            const requestsByStatus: Record<string, number> = {};
            requests.forEach((req) => {
                if (req.status) {
                    const statusGroup = `${Math.floor(req.status / 100)}xx`;
                    requestsByStatus[statusGroup] =
                        (requestsByStatus[statusGroup] || 0) + 1;
                }
            });

            // Create detailed log
            const detailedLog = {
                summary,
                requestsByStatus,
                failedRequests,
                errorMessages: consoleMessages.filter((m) =>
                    m.startsWith('[ERROR]'),
                ),
                warningMessages: consoleMessages.filter((m) =>
                    m.startsWith('[WARNING]'),
                ),
                allRequests: requests.map((r) => ({
                    method: r.method,
                    url: r.url,
                    status: r.status,
                    statusText: r.statusText,
                    resourceType: r.resourceType,
                })),
            };

            // Attach detailed logs as JSON
            await testInfo.attach('request-logs', {
                body: JSON.stringify(detailedLog, null, 2),
                contentType: 'application/json',
            });

            // Create human-readable summary
            const summaryText = `
═══════════════════════════════════════════════════════════
📊 REQUEST LOG SUMMARY
═══════════════════════════════════════════════════════════
Test: ${testInfo.title}

📈 Statistics:
  • Total Requests: ${summary.totalRequests}
  • Successful (2xx/3xx): ${summary.successfulRequests}
  • Failed Requests: ${summary.failedRequests}
  • Console Errors: ${summary.consoleErrors}
  • Console Warnings: ${summary.consoleWarnings}

📊 Requests by Status:
${Object.entries(requestsByStatus)
    .map(([status, count]) => `  • ${status}: ${count}`)
    .join('\n')}

${failedRequests.length > 0 ? `❌ FAILED REQUESTS:
${failedRequests.map((req) => `  • ${req.method} ${req.url}\n    → ${req.failure}`).join('\n')}` : '✅ No failed requests'}

${summary.consoleErrors > 0 ? `🔴 CONSOLE ERRORS:
${consoleMessages.filter((m) => m.startsWith('[ERROR]')).slice(0, 5).join('\n')}
${summary.consoleErrors > 5 ? `... and ${summary.consoleErrors - 5} more errors` : ''}` : '✅ No console errors'}

${summary.consoleWarnings > 0 ? `⚠️  CONSOLE WARNINGS:
${consoleMessages.filter((m) => m.startsWith('[WARNING]')).slice(0, 3).join('\n')}
${summary.consoleWarnings > 3 ? `... and ${summary.consoleWarnings - 3} more warnings` : ''}` : ''}
═══════════════════════════════════════════════════════════
`;

            // Attach human-readable summary
            await testInfo.attach('request-summary', {
                body: summaryText,
                contentType: 'text/plain',
            });

            // Print summary to console
            console.log(summaryText);
        };

        // Provide fixture
        const fixture: RequestLoggerFixture = {
            requests,
            failedRequests,
            consoleMessages,
            attachLogs,
        };

        await use(fixture);

        // Automatically attach logs after test completes
        // Only attach if test failed or if there were failed requests/errors
        if (
            testInfo.status !== 'passed' ||
            failedRequests.length > 0 ||
            consoleMessages.some((m) => m.startsWith('[ERROR]'))
        ) {
            await attachLogs();
        }
    },
});

export { expect } from '@playwright/test';
