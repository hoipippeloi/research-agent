/**
 * SearXNG API Client
 * 
 * A JavaScript/TypeScript client for interacting with the SearXNG search API deployed on Railway.
 */

const axios = require('axios');

class SearXNGClient {
    /**
     * Initialize the SearXNG client.
     * 
     * @param {string} baseUrl - The base URL of the SearXNG API
     */
    constructor(baseUrl = 'https://searxng-production-b099.up.railway.app') {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: 30000,
        });
    }

    /**
     * Perform a search query.
     * 
     * @param {string} query - The search query
     * @param {Object} options - Search options
     * @param {string[]} options.engines - List of search engines to use
     * @param {string[]} options.categories - List of categories
     * @param {number} options.pageno - Page number for pagination (starts at 1)
     * @param {string} options.timeRange - Time range filter
     * @param {string} options.format - Response format (default: "json")
     * @returns {Promise<Object>} Search results
     */
    async search(query, options = {}) {
        const {
            engines = null,
            categories = null,
            pageno = 1,
            timeRange = null,
            format = 'json'
        } = options;

        const params = {
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

    /**
     * Search for code-related results using GitHub and StackOverflow.
     * 
     * @param {string} query - The search query
     * @returns {Promise<Object>} Search results
     */
    async searchCode(query) {
        return this.search(query, {
            engines: ['github', 'stackoverflow']
        });
    }

    /**
     * Search for academic papers using arXiv.
     * 
     * @param {string} query - The search query
     * @returns {Promise<Object>} Search results
     */
    async searchAcademic(query) {
        return this.search(query, {
            engines: ['arxiv', 'semantic scholar']
        });
    }

    /**
     * Search using general search engines (Brave, DuckDuckGo, Startpage).
     * 
     * @param {string} query - The search query
     * @returns {Promise<Object>} Search results
     */
    async searchGeneral(query) {
        return this.search(query, {
            engines: ['brave', 'duckduckgo', 'startpage']
        });
    }

    /**
     * Get search suggestions for a query.
     * 
     * @param {string} query - The partial search query
     * @returns {Promise<string[]>} List of suggestion strings
     */
    async getSuggestions(query) {
        const response = await this.client.get('/autocompleter', {
            params: { q: query }
        });
        const data = response.data;
        // Handle both formats: direct list or dict with "suggestions" key
        if (Array.isArray(data)) {
            return data;
        }
        return data.suggestions || [];
    }
}

/**
 * Example usage of the SearXNG client.
 */
async function main() {
    const client = new SearXNGClient();

    console.log('='.repeat(80));
    console.log('SearXNG API Client - Example Usage');
    console.log('='.repeat(80));

    console.log('\n1. General Search Example:');
    console.log('-'.repeat(80));
    try {
        const results = await client.searchGeneral('machine learning frameworks');
        console.log(`Query: ${results.query}`);
        console.log(`Number of results: ${results.results.length}`);
        console.log('\nTop 3 results:');
        results.results.slice(0, 3).forEach((result, i) => {
            console.log(`\n${i + 1}. ${result.title}`);
            console.log(`   URL: ${result.url}`);
            console.log(`   Engine: ${result.engine || 'N/A'}`);
            if (result.content) {
                console.log(`   Content: ${result.content.substring(0, 150)}...`);
            }
        });
    } catch (error) {
        console.error('Error:', error.message);
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n2. Code Search Example:');
    console.log('-'.repeat(80));
    try {
        const results = await client.searchCode('python async await');
        console.log(`Query: ${results.query}`);
        console.log(`Number of results: ${results.results.length}`);
        console.log('\nTop 3 results:');
        results.results.slice(0, 3).forEach((result, i) => {
            console.log(`\n${i + 1}. ${result.title}`);
            console.log(`   URL: ${result.url}`);
            console.log(`   Engine: ${result.engine || 'N/A'}`);
        });
    } catch (error) {
        console.error('Error:', error.message);
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n3. Academic Search Example:');
    console.log('-'.repeat(80));
    try {
        const results = await client.searchAcademic('neural networks attention mechanism');
        console.log(`Query: ${results.query}`);
        console.log(`Number of results: ${results.results.length}`);
        if (results.results.length > 0) {
            console.log('\nTop 3 results:');
            results.results.slice(0, 3).forEach((result, i) => {
                console.log(`\n${i + 1}. ${result.title}`);
                console.log(`   URL: ${result.url}`);
                console.log(`   Engine: ${result.engine || 'N/A'}`);
            });
        }
    } catch (error) {
        console.error('Error:', error.message);
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n4. Search Suggestions Example:');
    console.log('-'.repeat(80));
    try {
        const suggestions = await client.getSuggestions('python');
        console.log(`Suggestions for 'python': ${suggestions.slice(0, 5).join(', ')}`);
    } catch (error) {
        console.error('Error:', error.message);
    }

    console.log('\n' + '='.repeat(80));
    console.log('\nClient is ready to use!');
    console.log(`API Endpoint: ${client.baseUrl}`);
    console.log('='.repeat(80));
}

// Export for use as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SearXNGClient };
}

// Run examples if executed directly
if (require.main === module) {
    main().catch(console.error);
}
