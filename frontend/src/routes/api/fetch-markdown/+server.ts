import { json, type RequestHandler } from "@sveltejs/kit";

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout using AbortController
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 30000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * GET /api/fetch-markdown?url=https://example.com
 * Fetch a URL and convert it to markdown using defuddle.md
 *
 * Features:
 * - Retry logic with exponential backoff for 503 errors (up to 3 attempts)
 * - 30-second timeout to prevent hanging requests
 * - Better error messages for different failure scenarios
 */
export const GET: RequestHandler = async ({ url }) => {
  try {
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return json({ error: "URL parameter is required" }, { status: 400 });
    }

    // Validate URL
    let validUrl: URL;
    try {
      validUrl = new URL(targetUrl);
    } catch (e) {
      return json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Use defuddle.md to fetch and convert to markdown
    // Format: https://defuddle.md/domain.com/path
    const domain = validUrl.toString().replace(/^https?:\/\//, "");
    const defuddleUrl = `https://defuddle.md/${domain}`;

    // Retry configuration
    const maxRetries = 3;
    const baseDelayMs = 1000; // Start with 1 second
    let lastError: Error | null = null;
    let lastResponseStatus = 0;
    let lastResponseStatusText = "";

    // Retry loop with exponential backoff
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Exponential backoff: 1s, 2s, 4s
        if (attempt > 0) {
          const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
          console.log(
            `Retry attempt ${attempt + 1}/${maxRetries} after ${delayMs}ms delay`,
          );
          await sleep(delayMs);
        }

        const response = await fetchWithTimeout(
          defuddleUrl,
          {
            headers: {
              Accept: "text/markdown",
            },
          },
          30000, // 30-second timeout
        );

        // Store response details for error reporting
        lastResponseStatus = response.status;
        lastResponseStatusText = response.statusText;

        if (!response.ok) {
          // Retry only on 503 Service Unavailable or other 5xx errors
          if (response.status >= 500) {
            console.error(
              `defuddle.md failed with status ${response.status} on attempt ${attempt + 1}/${maxRetries}`,
            );
            lastError = new Error(
              `HTTP ${response.status}: ${response.statusText}`,
            );

            // Continue to next retry attempt
            continue;
          } else {
            // For 4xx errors, don't retry - it's a client error
            console.error(
              `defuddle.md failed with client error ${response.status}`,
            );
            return json(
              {
                error: "Failed to fetch markdown from URL",
                details: `HTTP ${response.status}: ${response.statusText}`,
              },
              { status: response.status },
            );
          }
        }

        // Success! Parse the markdown content
        const markdown = await response.text();

        // Extract title from the first heading or use the URL hostname
        let title = validUrl.hostname;
        const titleMatch = markdown.match(/^#\s+(.+)$/m);
        if (titleMatch) {
          title = titleMatch[1].trim();
        }

        return json({
          success: true,
          title,
          content: markdown,
          url: validUrl.toString(),
        });
      } catch (fetchError) {
        // Handle timeout or network errors
        if (fetchError instanceof Error) {
          if (fetchError.name === "AbortError") {
            console.error("Request timeout on attempt", attempt + 1);
            return json(
              {
                error: "Request timeout",
                details: "The request took too long to complete (30 seconds)",
              },
              { status: 504 },
            );
          }

          lastError = fetchError;
          console.error(
            `Fetch error on attempt ${attempt + 1}/${maxRetries}:`,
            fetchError.message,
          );

          // For network errors, retry
          continue;
        }
      }
    }

    // All retries exhausted
    console.error(`All ${maxRetries} retry attempts failed`);

    if (lastError) {
      return json(
        {
          error: "Failed to fetch and convert URL to markdown",
          details: lastError.message,
        },
        { status: 500 },
      );
    }

    // Service returned 5xx on all attempts
    return json(
      {
        error: "Service temporarily unavailable after multiple retries",
        details: `HTTP ${lastResponseStatus}: ${lastResponseStatusText}`,
      },
      { status: lastResponseStatus || 503 },
    );
  } catch (error) {
    console.error("Error fetching markdown:", error);
    return json(
      {
        error: "Failed to fetch and convert URL to markdown",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
};
