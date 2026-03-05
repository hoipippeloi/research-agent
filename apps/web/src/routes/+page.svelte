<script lang="ts">
	import type { SearchResult } from '$lib/entities/Research'
	import { SearchController } from '$lib/controllers/SearchController'

	let query = $state('')
	let results = $state<SearchResult[]>([])
	let loading = $state(false)
	let error = $state('')

	async function handleSearch(e: Event) {
		e.preventDefault()
		if (!query.trim()) return

		loading = true
		error = ''
		results = []

		try {
			const research = await SearchController.search(query)
			results = research.results
		} catch (err) {
			error = err instanceof Error ? err.message : 'Search failed'
		} finally {
			loading = false
		}
	}
</script>

<main class="container">
	<h1>Research Agent</h1>
	<p>Search the web using SearXNG</p>

	<form onsubmit={handleSearch}>
		<input
			type="text"
			bind:value={query}
			placeholder="Enter your search query..."
			disabled={loading}
		/>
		<button type="submit" disabled={loading || !query.trim()}>
			{loading ? 'Searching...' : 'Search'}
		</button>
	</form>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	{#if results.length > 0}
		<section class="results">
			<h2>Results ({results.length})</h2>
			{#each results as result}
				<article class="result">
					<a href={result.url} target="_blank" rel="noopener noreferrer">
						<h3>{result.title || 'No title'}</h3>
					</a>
					<p class="url">{result.url}</p>
					<p class="content">{result.content}</p>
					{#if result.engine}
						<span class="engine">{result.engine}</span>
					{/if}
				</article>
			{/each}
		</section>
	{/if}
</main>

<style>
	:global(body) {
		font-family: system-ui, -apple-system, sans-serif;
		margin: 0;
		background: #1a1a2e;
		color: #eee;
	}

	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	h1 {
		margin-bottom: 0.5rem;
	}

	form {
		display: flex;
		gap: 0.5rem;
		margin: 2rem 0;
	}

	input {
		flex: 1;
		padding: 0.75rem 1rem;
		font-size: 1rem;
		border: 1px solid #333;
		border-radius: 4px;
		background: #16213e;
		color: #eee;
	}

	button {
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		background: #0f3460;
		color: #eee;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	button:hover:not(:disabled) {
		background: #1a4a7a;
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error {
		color: #ff6b6b;
	}

	.results {
		margin-top: 2rem;
	}

	.result {
		padding: 1rem;
		margin-bottom: 1rem;
		background: #16213e;
		border-radius: 4px;
	}

	.result h3 {
		margin: 0 0 0.5rem;
	}

	.result a {
		color: #4da6ff;
		text-decoration: none;
	}

	.result a:hover {
		text-decoration: underline;
	}

	.url {
		font-size: 0.85rem;
		color: #888;
		margin: 0.25rem 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.content {
		color: #ccc;
		margin: 0.5rem 0;
		line-height: 1.5;
	}

	.engine {
		font-size: 0.75rem;
		background: #0f3460;
		padding: 0.2rem 0.5rem;
		border-radius: 3px;
	}
</style>
