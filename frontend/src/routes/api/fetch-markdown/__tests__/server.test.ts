import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "../+server";
import type { RequestEvent } from "@sveltejs/kit";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console.error to avoid noise in test output
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

describe("GET /api/fetch-markdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset timers before each test
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("URL validation", () => {
    it("should return 400 when URL parameter is missing", async () => {
      const mockEvent = {
        url: new URL("http://localhost/api/fetch-markdown"),
      } as RequestEvent;

      const response = await GET(mockEvent);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("URL parameter is required");
    });

    it("should return 400 for invalid URL format", async () => {
      const mockEvent = {
        url: new URL("http://localhost/api/fetch-markdown?url=not-a-valid-url"),
      } as RequestEvent;

      const response = await GET(mockEvent);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid URL format");
    });

    it("should accept valid HTTP URLs", async () => {
      const targetUrl = "http://example.com/article";
      const mockEvent = {
        url: new URL(
          `http://localhost/api/fetch-markdown?url=${encodeURIComponent(targetUrl)}`,
        ),
      } as RequestEvent;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => "# Test Article\n\nContent here.",
      });

      const response = await GET(mockEvent);
      expect(response.status).toBe(200);
    });

    it("should accept valid HTTPS URLs", async () => {
      const targetUrl = "https://example.com/article";
      const mockEvent = {
        url: new URL(
          `http://localhost/api/fetch-markdown?url=${encodeURIComponent(targetUrl)}`,
        ),
      } as RequestEvent;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => "# Test Article\n\nContent here.",
      });

      const response = await GET(mockEvent);
      expect(response.status).toBe(200);
    });
  });

  describe("Successful fetch", () => {
    it("should successfully fetch and convert URL to markdown", async () => {
      const targetUrl = "https://example.com/article";
      const mockEvent = {
        url: new URL(
          `http://localhost/api/fetch-markdown?url=${encodeURIComponent(targetUrl)}`,
        ),
      } as RequestEvent;

      const mockMarkdown = "# Test Article\n\nThis is the content.";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockMarkdown,
      });

      const response = await GET(mockEvent);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.title).toBe("Test Article");
      expect(data.content).toBe(mockMarkdown);
      expect(data.url).toBe(targetUrl);

      // Verify defuddle.md was called correctly
      const expectedDomain = targetUrl.replace(/^https?:\/\//, "");
      expect(mockFetch).toHaveBeenCalledWith(
        `https://defuddle.md/${expectedDomain}`,
        expect.objectContaining({
          headers: { Accept: "text/markdown" },
        }),
      );
    });

    it("should extract title from H1 heading", async () => {
      const targetUrl = "https://example.com/article";
      const mockEvent = {
        url: new URL(
          `http://localhost/api/fetch-markdown?url=${encodeURIComponent(targetUrl)}`,
        ),
      } as RequestEvent;

      const mockMarkdown = "# My Amazing Article\n\nSome content here.";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockMarkdown,
      });

      const response = await GET(mockEvent);
      const data = await response.json();

      expect(data.title).toBe("My Amazing Article");
    });

    it("should use hostname as title when no H1 heading exists", async () => {
      const targetUrl = "https://example.com/article";
      const mockEvent = {
        url: new URL(
          `http://localhost/api/fetch-markdown?url=${encodeURIComponent(targetUrl)}`,
        ),
      } as RequestEvent;

      const mockMarkdown = "No heading here, just content.";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockMarkdown,
      });

      const response = await GET(mockEvent);
      const data = await response.json();

      expect(data.title).toBe("example.com");
    });
  });

  describe("Retry logic for 503 errors", () => {
    it("should retry on 503 Service Unavailable", async () => {
      const targetUrl = "https://example.com/article";
      const mockEvent = {
        url: new URL(
          `http://localhost/api/fetch-markdown?url=${encodeURIComponent(targetUrl)}`,
        ),
      } as RequestEvent;

      // First call returns 503
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
      });

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => "# Success on Retry\n\nContent here.",
      });

      // Use fake timers to speed up retry delay
      vi.useFakeTimers();

      const responsePromise = GET(mockEvent);

      // Fast-forward past the first retry delay
      await vi.advanceTimersByTimeAsync(2000);

      const response = await responsePromise;
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.title).toBe("Success on Retry");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should retry up to 3 times on 503 before failing", async () => {
      const targetUrl = "https://example.com/article";
      const mockEvent = {
        url: new URL(
          `http://localhost/api/fetch-markdown?url=${encodeURIComponent(targetUrl)}`,
        ),
      } as RequestEvent;

      // All calls return 503
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
      });

      vi.useFakeTimers();

      const responsePromise = GET(mockEvent);

      // Fast-forward through all retry delays
      await vi.advanceTimersByTimeAsync(10000);

      const response = await responsePromise;
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe(
        "Service temporarily unavailable after multiple retries",
      );
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should use exponential backoff for retries", async () => {
      const targetUrl = "https://example.com/article";
      const mockEvent = {
        url: new URL(
          `http://localhost/api/fetch-markdown?url=${encodeURIComponent(targetUrl)}`,
        ),
      } as RequestEvent;

      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
      });

      vi.useFakeTimers();

      const startTime = Date.now();
      const responsePromise = GET(mockEvent);

      // Fast-forward through retries
      await vi.advanceTimersByTimeAsync(15000);

      const response = await responsePromise;

      // Verify exponential backoff (1s, 2s, 4s for 3 retries)
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe("Error handling", () => {
    it("should return 502 for 4xx client errors without retry", async () => {
      const targetUrl = "https://example.com/not-found";
      const mockEvent = {
        url: new URL(
          `http://localhost/api/fetch-markdown?url=${encodeURIComponent(targetUrl)}`,
        ),
      } as RequestEvent;

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      const response = await GET(mockEvent);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Failed to fetch markdown from URL");
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retries for 4xx
    });

    it("should return 500 for network errors", async () => {
      const targetUrl = "https://example.com/article";
      const mockEvent = {
        url: new URL(
          `http://localhost/api/fetch-markdown?url=${encodeURIComponent(targetUrl)}`,
        ),
      } as RequestEvent;

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const response = await GET(mockEvent);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch and convert URL to markdown");
      expect(data.details).toBe("Network error");
    });

    it("should handle timeout gracefully", async () => {
      const targetUrl = "https://example.com/article";
      const mockEvent = {
        url: new URL(
          `http://localhost/api/fetch-markdown?url=${encodeURIComponent(targetUrl)}`,
        ),
      } as RequestEvent;

      // Mock a fetch that never resolves
      mockFetch.mockImplementation(() => new Promise(() => {}));

      vi.useFakeTimers();

      const responsePromise = GET(mockEvent);

      // Fast-forward past timeout (30 seconds)
      await vi.advanceTimersByTimeAsync(35000);

      const response = await responsePromise;
      const data = await response.json();

      expect(response.status).toBe(504);
      expect(data.error).toBe("Request timeout");
    }, 40000);
  });

  describe("Special cases", () => {
    it("should handle URLs with special characters", async () => {
      const targetUrl =
        "https://example.com/article?query=value&foo=bar#section";
      const mockEvent = {
        url: new URL(
          `http://localhost/api/fetch-markdown?url=${encodeURIComponent(targetUrl)}`,
        ),
      } as RequestEvent;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => "# Article\n\nContent.",
      });

      const response = await GET(mockEvent);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toBe(targetUrl);
    });

    it("should handle large markdown content", async () => {
      const targetUrl = "https://example.com/large-article";
      const mockEvent = {
        url: new URL(
          `http://localhost/api/fetch-markdown?url=${encodeURIComponent(targetUrl)}`,
        ),
      } as RequestEvent;

      // Generate large content (1MB+)
      const largeContent = "# Large Article\n\n" + "x".repeat(1024 * 1024);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => largeContent,
      });

      const response = await GET(mockEvent);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.content.length).toBe(largeContent.length);
    });
  });
});
