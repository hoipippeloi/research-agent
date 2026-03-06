import { json, type RequestHandler } from '@sveltejs/kit';

/**
 * GET /api/fetch-markdown?url=https://example.com
 * Fetch a URL and convert it to markdown using Jina.ai Reader API
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const targetUrl = url.searchParams.get('url');

		if (!targetUrl) {
			return json({ error: 'URL parameter is required' }, { status: 400 });
		}

		// Validate URL
		let validUrl: URL;
		try {
			validUrl = new URL(targetUrl);
		} catch (e) {
			return json({ error: 'Invalid URL format' }, { status: 400 });
		}

		// Use Jina.ai Reader API to fetch and convert to markdown
		// This is a free service that converts any URL to clean markdown
		const jinaReaderUrl = `https://r.jina.ai/${validUrl.toString()}`;

		const response = await fetch(jinaReaderUrl, {
			headers: {
				'Accept': 'text/markdown',
			},
		});

		if (!response.ok) {
			console.error(`Jina.ai Reader failed with status ${response.status}`);
			return json({
				error: 'Failed to fetch markdown from URL',
				details: `HTTP ${response.status}: ${response.statusText}`
			}, { status: response.status });
		}

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
	} catch (error) {
		console.error('Error fetching markdown:', error);
		return json({
			error: 'Failed to fetch and convert URL to markdown',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};
