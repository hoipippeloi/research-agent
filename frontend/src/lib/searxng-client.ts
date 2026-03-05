import axios from 'axios';

const SEARXNG_API_URL = 'https://searxng-production-b099.up.railway.app';

export interface SearchResult {
	template: string;
	url: string;
	title: string;
	content: string;
	publishedDate: string | null;
	thumbnail: string;
	engine: string;
	parsed_url: string[];
	img_src: string;
	priority: string;
	engines: string[];
	positions: number[];
	score: number;
}

export interface SearchResponse {
	query: string;
	number_of_results: number;
	results: SearchResult[];
}

export interface SearchOptions {
	engines?: string[];
	categories?: string[];
	pageno?: number;
	timeRange?: 'day' | 'week' | 'month' | 'year';
	format?: string;
}

export class SearXNGClient {
	private client;
	private baseUrl: string;

	constructor(baseUrl: string = SEARXNG_API_URL) {
		this.baseUrl = baseUrl.replace(/\/$/, '');
		this.client = axios.create({
			baseURL: this.baseUrl,
			timeout: 30000
		});
	}

	async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
		const { engines = null, categories = null, pageno = 1, timeRange = null, format = 'json' } = options;

		const params: Record<string, string | number> = {
			q: query,
			format,
			pageno
		};

		if (engines) {
			params.engines = engines.join(',');
		}

		if (categories) {
			params.categories = categories.join(',');
		}

		if (timeRange) {
			params.time_range = timeRange;
		}

		const response = await this.client.get('/search', { params });
		return response.data;
	}

	async searchGeneral(query: string): Promise<SearchResponse> {
		return this.search(query, {
			engines: ['brave', 'duckduckgo', 'startpage']
		});
	}

	async searchCode(query: string): Promise<SearchResponse> {
		return this.search(query, {
			engines: ['github', 'stackoverflow']
		});
	}

	async searchAcademic(query: string): Promise<SearchResponse> {
		return this.search(query, {
			engines: ['arxiv', 'semantic scholar']
		});
	}

	async getSuggestions(query: string): Promise<string[]> {
		const response = await this.client.get('/autocompleter', {
			params: { q: query }
		});
		const data = response.data;
		if (Array.isArray(data)) {
			return data;
		}
		return data.suggestions || [];
	}
}

export const searxng = new SearXNGClient();
