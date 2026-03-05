/**
 * SearXNG API Client - TypeScript Definitions
 * 
 * Type definitions for the SearXNG search API client.
 */

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

export interface SearXNGClientConfig {
    baseUrl?: string;
    timeout?: number;
}

export declare class SearXNGClient {
    constructor(config?: string | SearXNGClientConfig);
    
    search(query: string, options?: SearchOptions): Promise<SearchResponse>;
    searchCode(query: string): Promise<SearchResponse>;
    searchAcademic(query: string): Promise<SearchResponse>;
    searchGeneral(query: string): Promise<SearchResponse>;
    getSuggestions(query: string): Promise<string[]>;
}
