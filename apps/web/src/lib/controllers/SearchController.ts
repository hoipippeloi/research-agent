import { BackendMethod, remult } from 'remult'
import type { SearchResult } from '../entities/Research'
import { Research } from '../entities/Research'

const SEARXNG_URL = process.env.SEARXNG_URL || 'http://localhost:8080'

async function doSearch(query: string): Promise<SearchResult[]> {
	const url = `${SEARXNG_URL}/search?q=${encodeURIComponent(query)}&format=json`
	
	try {
		const response = await fetch(url)
		if (!response.ok) {
			throw new Error(`SearXNG error: ${response.status}`)
		}
		
		const data = await response.json()
		
		return (data.results || []).map((result: any) => ({
			title: result.title || '',
			url: result.url || '',
			content: result.content || '',
			engine: result.engine || ''
		}))
	} catch (error) {
		console.error('SearXNG search error:', error)
		return []
	}
}

export class SearchController {
	@BackendMethod({ allowed: true })
	static async search(query: string) {
		const results = await doSearch(query)
		const research = remult.repo(Research).create({
			query,
			results
		})
		await remult.repo(Research).insert(research)
		return research
	}
}
