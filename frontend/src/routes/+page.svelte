<script lang="ts">
    import { onMount } from "svelte";
    import Icon from "@iconify/svelte";
    import type { SearchHistory } from "$lib/redis-client";
    import BirdsFlocking from "$lib/components/BirdsFlocking.svelte";
    import { uiScale } from "$lib/stores/uiScale";
    import Modal from "$lib/components/Modal.svelte";

    interface AggregatedSearchHistory {
        query: string;
        count: number;
        latestTimestamp: number;
        engines: string[];
        totalResults: number;
        searches: SearchHistory[];
    }

    let searchQuery = $state("");
    let isSearching = $state(false);
    let searchHistory = $state<SearchHistory[]>([]);
    let aggregatedHistory = $state<AggregatedSearchHistory[]>([]);
    let error = $state("");
    let selectedSearch = $state<AggregatedSearchHistory | null>(null);
    let searchResults = $state<any>(null);
    let isLoadingResults = $state(false);
    let isFromCache = $state(false);
    let cachedAt = $state<number | null>(null);
    let deletingQuery = $state<string | null>(null);
    let isModalOpen = $state(false);
    let selectedSearchForModal = $state<AggregatedSearchHistory | null>(null);

    onMount(async () => {
        await loadSearchHistory();
    });

    function handleOpenOptions(search: AggregatedSearchHistory, e: MouseEvent) {
        e.stopPropagation();
        selectedSearchForModal = search;
        isModalOpen = true;
    }

    function closeModal() {
        isModalOpen = false;
        selectedSearchForModal = null;
    }

    async function loadSearchHistory() {
        try {
            const response = await fetch("/api/history?limit=20");
            if (response.ok) {
                searchHistory = await response.json();
                await aggregateSearchHistory();
            }
        } catch (err) {
            console.error("Failed to load search history:", err);
        }
    }

    async function aggregateSearchHistory() {
        const aggregated = new Map<string, AggregatedSearchHistory>();

        for (const search of searchHistory) {
            const existing = aggregated.get(search.query);

            if (existing) {
                existing.count++;
                existing.latestTimestamp = Math.max(
                    existing.latestTimestamp,
                    search.timestamp,
                );
                if (!existing.engines.includes(search.engine)) {
                    existing.engines.push(search.engine);
                }
                existing.searches.push(search);
            } else {
                aggregated.set(search.query, {
                    query: search.query,
                    count: 1,
                    latestTimestamp: search.timestamp,
                    engines: [search.engine],
                    totalResults: search.resultsCount,
                    searches: [search],
                });
            }
        }

        // Convert to array and sort by latest timestamp
        const sorted = Array.from(aggregated.values())
            .sort((a, b) => b.latestTimestamp - a.latestTimestamp)
            .slice(0, 6);

        // Update totalResults from cache for each aggregated search
        aggregatedHistory = await Promise.all(
            sorted.map(async (search) => {
                try {
                    // Determine the engine type
                    const engine = search.engines[0].split(",")[0].trim();
                    const engineType =
                        engine === "github" || engine === "stackoverflow"
                            ? "code"
                            : engine === "arxiv" ||
                                engine === "semantic scholar"
                              ? "academic"
                              : "general";

                    // Fetch cached results to get the unique count
                    const cacheResponse = await fetch(
                        `/api/search?query=${encodeURIComponent(search.query)}&engine=${engineType}&cacheOnly=true`,
                    );

                    if (cacheResponse.ok) {
                        const cachedData = await cacheResponse.json();
                        search.totalResults =
                            cachedData.results?.length || search.totalResults;
                    }
                } catch (err) {
                    // Keep the original count if cache fetch fails
                    console.error("Error fetching cached count:", err);
                }
                return search;
            }),
        );
    }

    async function handleSearch(e: Event) {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        isSearching = true;
        error = "";

        try {
            const response = await fetch("/api/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: searchQuery,
                    engine: "general",
                }),
            });

            if (response.ok) {
                const results = await response.json();
                console.log("Search results:", results);

                // Set results and open modal
                searchResults = results;
                isFromCache = results.cached || false;
                cachedAt = results.cachedAt || null;

                // Create aggregated search object for modal
                selectedSearch = {
                    query: searchQuery,
                    count: 1,
                    latestTimestamp: Date.now(),
                    engines: ["brave", "duckduckgo", "startpage"],
                    totalResults: results.results?.length || 0,
                    searches: [],
                };

                await loadSearchHistory();
            } else {
                const data = await response.json();
                error = data.error || "Search failed";
            }
        } catch (err) {
            console.error("Search error:", err);
            error = "Failed to perform search. Please try again.";
        } finally {
            isSearching = false;
        }
    }

    function formatDate(timestamp: number): string {
        return new Date(timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }

    async function handleDelete(query: string, e: Event) {
        e.stopPropagation();
        e.preventDefault();

        deletingQuery = query;

        try {
            // Delete all searches with this query
            const searchesToDelete = searchHistory.filter(
                (s) => s.query === query,
            );

            for (const search of searchesToDelete) {
                const response = await fetch(
                    `/api/history?id=${encodeURIComponent(search.id)}`,
                    {
                        method: "DELETE",
                    },
                );

                if (!response.ok) {
                    console.error("Failed to delete search:", search.id);
                }
            }

            // Update local state
            searchHistory = searchHistory.filter((s) => s.query !== query);
            aggregateSearchHistory();
        } catch (err) {
            console.error("Delete error:", err);
        } finally {
            deletingQuery = null;
        }
    }

    async function handleViewResults(search: AggregatedSearchHistory) {
        selectedSearch = search;
        isLoadingResults = true;
        searchResults = null;
        isFromCache = false;
        cachedAt = null;

        try {
            // Use the most recent search's engine
            const latestSearch = search.searches.reduce((a, b) =>
                a.timestamp > b.timestamp ? a : b,
            );
            const engine = latestSearch.engine.split(",")[0].trim();

            const response = await fetch("/api/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: search.query,
                    engine:
                        engine === "github" || engine === "stackoverflow"
                            ? "code"
                            : engine === "arxiv" ||
                                engine === "semantic scholar"
                              ? "academic"
                              : "general",
                }),
            });

            if (response.ok) {
                const data = await response.json();
                searchResults = data;
                isFromCache = data.cached || false;
                cachedAt = data.cachedAt || null;
            } else {
                console.error("Failed to load results");
            }
        } catch (err) {
            console.error("Error loading results:", err);
        } finally {
            isLoadingResults = false;
        }
    }

    function closeResults() {
        selectedSearch = null;
        searchResults = null;
        isFromCache = false;
        cachedAt = null;
    }

    function getDomain(url: string): string {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    }

    function formatCacheTime(timestamp: number): string {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);

        if (minutes < 1) return "just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return new Date(timestamp).toLocaleDateString();
    }
</script>

<svelte:head>
    <title>Search Archive - Privacy-First Search</title>
    <meta
        name="description"
        content="A privacy-respecting search engine powered by SearXNG"
    />
</svelte:head>

<!-- Animated Background -->
<div class="animated-bg">
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>
    <div class="blob blob-3"></div>
</div>
<div class="fixed inset-0 paper-texture pointer-events-none z-0"></div>

<!-- Header Navigation -->
<header
    class="fixed top-0 left-0 right-0 z-50 px-6 py-4 ui-scaled-header"
    style="transform: scale({$uiScale}); transform-origin: top center;"
>
    <nav class="max-w-6xl mx-auto">
        <div
            class="bg-white/70 backdrop-blur-xl rounded-2xl border border-zinc-200/50 px-6 py-3 flex items-center justify-between shadow-sm"
        >
            <!-- Logo -->
            <a href="/" class="flex items-center gap-3 group">
                <div
                    class="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300"
                >
                    <Icon icon="mdi:magnify" class="text-white text-lg" />
                </div>
                <span class="font-semibold tracking-tight hidden sm:block"
                    >search archive</span
                >
            </a>

            <!-- Nav Links -->
            <div class="flex items-center gap-2 sm:gap-6">
                <!-- Zoom Controls -->
                <div class="flex items-center gap-1">
                    <button
                        onclick={() => uiScale.zoomOut()}
                        class="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                        title="Zoom out"
                        aria-label="Zoom out"
                    >
                        <Icon icon="mdi:minus" class="text-zinc-600 text-lg" />
                    </button>
                    <span
                        class="text-xs text-zinc-400 min-w-[3rem] text-center"
                    >
                        {Math.round($uiScale * 100)}%
                    </span>
                    <button
                        onclick={() => uiScale.zoomIn()}
                        class="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                        title="Zoom in"
                        aria-label="Zoom in"
                    >
                        <Icon icon="mdi:plus" class="text-zinc-600 text-lg" />
                    </button>
                </div>

                <a
                    href="/"
                    class="text-sm font-medium px-3 py-1.5 bg-zinc-900 text-white rounded-lg"
                >
                    Search
                </a>
                <a
                    href="https://railway.com/project/cd9a0bf3-1ada-4187-968f-ccd9f971ff8e"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm text-zinc-500 hover:text-zinc-900 transition-colors hidden sm:block"
                >
                    Railway
                </a>
            </div>
        </div>
    </nav>
</header>

<!-- Main Content -->
<main class="relative z-10 pt-28 pb-24 px-6">
    <div
        class="max-w-6xl mx-auto relative min-h-[600px] ui-scaled"
        style="transform: scale({$uiScale}); transform-origin: top center;"
    >
        <!-- Search Section -->
        <div class="mb-16 relative z-20">
            <h1
                class="text-4xl md:text-5xl font-semibold tracking-tight mb-6 text-center"
            >
                Research the web
            </h1>

            <!-- Search Bar -->
            <form onsubmit={handleSearch} class="max-w-3xl mx-auto mb-4">
                <div
                    class="bg-white/80 backdrop-blur-xl rounded-2xl border border-zinc-200/70 shadow-lg p-2 flex items-center gap-3"
                >
                    <div class="flex-1 flex items-center gap-3 px-4">
                        <Icon
                            icon="mdi:magnify"
                            class="text-zinc-400 text-2xl shrink-0"
                        />
                        <input
                            type="text"
                            bind:value={searchQuery}
                            placeholder="Research anything..."
                            class="flex-1 bg-transparent outline-none text-base"
                            disabled={isSearching}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSearching || !searchQuery.trim()}
                        class="px-6 py-3 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {#if isSearching}
                            <Icon
                                icon="mdi:loading"
                                class="text-lg animate-spin"
                            />
                            <span>Searching...</span>
                        {:else}
                            <Icon icon="mdi:arrow-right" class="text-lg" />
                            <span>Search</span>
                        {/if}
                    </button>
                </div>
            </form>

            {#if error}
                <div class="max-w-3xl mx-auto">
                    <div
                        class="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm"
                    >
                        {error}
                    </div>
                </div>
            {/if}
        </div>

        <!-- Recent Searches -->
        {#if isSearching}
            <div class="absolute inset-0 z-0">
                <BirdsFlocking />
            </div>
        {/if}

        {#if isSearching}
            <div class="relative z-10 flex items-center justify-center py-8">
                <div
                    class="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur rounded-full border border-zinc-200/50 text-xs font-medium text-zinc-500"
                >
                    <span class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
                    ></span>
                    Searching...
                </div>
            </div>
        {:else if searchHistory.length > 0}
            <div class="mb-8">
                <div class="flex items-center gap-3 mb-6">
                    <div
                        class="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur rounded-full border border-zinc-200/50 text-xs font-medium text-zinc-500"
                    >
                        <span
                            class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"
                        ></span>
                        Recent searches
                    </div>
                    <span class="text-xs text-zinc-400"
                        >{aggregatedHistory.length} unique queries</span
                    >
                </div>

                <!-- Search History Cards -->
                <div
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
                >
                    {#each aggregatedHistory as search, i (search.query)}
                        <div
                            class="post-card bg-white rounded-2xl p-6 border border-zinc-200/70 shadow-sm cursor-pointer hover:shadow-xl relative group"
                            onclick={() => handleViewResults(search)}
                            role="button"
                            tabindex={0}
                            onkeydown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    handleViewResults(search);
                                }
                            }}
                        >
                            <!-- Delete Button -->
                            <button
                                onclick={(e) => handleDelete(search.query, e)}
                                disabled={deletingQuery === search.query}
                                class="absolute bottom-3 right-3 p-2 bg-white/80 hover:bg-red-50 rounded-lg border border-zinc-200/50 opacity-0 group-hover:opacity-100 transition-all hover:border-red-200 hover:text-red-600 disabled:opacity-50 z-10"
                                title="Delete all visits with this query"
                            >
                                {#if deletingQuery === search.query}
                                    <Icon
                                        icon="mdi:loading"
                                        class="text-sm animate-spin"
                                    />
                                {:else}
                                    <Icon
                                        icon="mdi:trash-can-outline"
                                        class="text-sm"
                                    />
                                {/if}
                            </button>

                            <div class="flex items-center justify-between mb-4">
                                <span class="font-mono text-xs text-zinc-300"
                                    >{String(i + 1).padStart(3, "0")}</span
                                >
                                <div class="flex items-center gap-2">
                                    {#if search.count > 1}
                                        <span
                                            class="text-[10px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full"
                                        >
                                            {search.count}x
                                        </span>
                                    {/if}
                                    <button
                                        onclick={(e) =>
                                            handleOpenOptions(search, e)}
                                        class="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors"
                                        title="Options"
                                    >
                                        <Icon
                                            icon="mdi:dots-horizontal"
                                            class="text-sm text-zinc-400"
                                        />
                                    </button>
                                </div>
                            </div>
                            <h2
                                class="text-lg font-semibold tracking-tight mb-3 leading-snug line-clamp-2"
                            >
                                {search.query}
                            </h2>
                            <p
                                class="text-zinc-500 text-sm font-light leading-relaxed"
                            >
                                {search.totalResults} unique results
                                {#if search.count > 1}
                                    <span class="text-zinc-400"
                                        >• {search.count} visits</span
                                    >
                                {/if}
                            </p>
                            <div
                                class="flex items-center pt-4 mt-4 border-t border-zinc-100"
                            >
                                <span class="text-xs text-zinc-400"
                                    >{formatDate(search.latestTimestamp)}</span
                                >
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {:else}
            <!-- Empty State -->
            <div class="text-center py-16">
                <div
                    class="inline-flex items-center justify-center w-16 h-16 bg-white/60 backdrop-blur rounded-2xl border border-zinc-200/50 mb-4"
                >
                    <Icon icon="mdi:history" class="text-zinc-400 text-3xl" />
                </div>
                <p class="text-zinc-500 text-sm">
                    No recent searches yet. Try searching for something!
                </p>
            </div>
        {/if}
    </div>
</main>

<!-- Results Modal -->
{#if selectedSearch}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_click_events_have_key_events -->
    <div
        class="fixed inset-0 z-60 flex items-start justify-center pt-20 pb-8 px-4 overflow-y-auto"
        onclick={closeResults}
        onkeydown={(e) => e.key === "Escape" && closeResults()}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
    >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm"></div>

        <!-- Modal Content -->
        <div
            class="relative bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[80vh] overflow-hidden flex flex-col"
            onclick={(e) => e.stopPropagation()}
            role="document"
        >
            <!-- Header -->
            <div
                class="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between z-10"
            >
                <div>
                    <h2 class="text-xl font-semibold tracking-tight">
                        {selectedSearch.query}
                    </h2>
                    <p class="text-sm text-zinc-500 mt-1">
                        {selectedSearch.totalResults} total results • {selectedSearch.engines.join(
                            ", ",
                        )}
                        {#if selectedSearch.count > 1}
                            <span class="text-zinc-400"
                                >• {selectedSearch.count} visits</span
                            >
                        {/if}
                        {#if isFromCache && cachedAt}
                            <span class="text-emerald-600 ml-2">
                                • Cached {formatCacheTime(cachedAt)}
                            </span>
                        {/if}
                    </p>
                </div>
                <button
                    onclick={closeResults}
                    class="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                    aria-label="Close"
                >
                    <Icon icon="mdi:close" class="text-xl text-zinc-500" />
                </button>
            </div>

            <!-- Results Content -->
            <div class="flex-1 overflow-y-auto px-6 py-4">
                {#if isLoadingResults}
                    <div
                        class="flex flex-col items-center justify-center py-16"
                    >
                        <Icon
                            icon="mdi:loading"
                            class="text-4xl text-zinc-400 animate-spin mb-4"
                        />
                        <p class="text-zinc-500">Loading results...</p>
                    </div>
                {:else if searchResults?.results?.length > 0}
                    <div class="space-y-4">
                        {#each searchResults.results as result, i (result.url || i)}
                            <a
                                href={result.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="group flex items-start gap-3 bg-zinc-50 hover:bg-zinc-100 rounded-xl p-4 border border-zinc-200 transition-colors"
                            >
                                <div
                                    class="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 border border-zinc-200"
                                >
                                    <Icon
                                        icon="mdi:web"
                                        class="text-zinc-400 text-lg"
                                    />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div
                                        class="text-xs text-emerald-600 font-medium mb-1 truncate"
                                    >
                                        {getDomain(result.url)}
                                    </div>
                                    <h3
                                        class="text-base font-semibold text-zinc-900 mb-1 line-clamp-2"
                                    >
                                        {result.title || "Untitled"}
                                    </h3>
                                    <p
                                        class="text-sm text-zinc-600 line-clamp-2"
                                    >
                                        {result.content ||
                                            result.snippet ||
                                            "No description available"}
                                    </p>
                                </div>
                                <!-- Options: Reserved space, show on hover -->
                                <div
                                    class="flex flex-col gap-1 w-6 ml-auto -mr-[6px] opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <div class="relative group/icon">
                                        <Icon
                                            icon="mdi:lightning-bolt"
                                            class="text-zinc-400 hover:text-blue-600 text-lg cursor-pointer transition-colors"
                                        />
                                        <div
                                            class="absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
                                        >
                                            <div
                                                class="bg-zinc-900 text-white text-xs px-2 py-1 rounded shadow-lg"
                                            >
                                                Quick Action
                                            </div>
                                        </div>
                                    </div>
                                    <div class="relative group/icon">
                                        <Icon
                                            icon="mdi:star"
                                            class="text-zinc-400 hover:text-purple-600 text-lg cursor-pointer transition-colors"
                                        />
                                        <div
                                            class="absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
                                        >
                                            <div
                                                class="bg-zinc-900 text-white text-xs px-2 py-1 rounded shadow-lg"
                                            >
                                                Save Result
                                            </div>
                                        </div>
                                    </div>
                                    <div class="relative group/icon">
                                        <Icon
                                            icon="mdi:bookmark"
                                            class="text-zinc-400 hover:text-amber-600 text-lg cursor-pointer transition-colors"
                                        />
                                        <div
                                            class="absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
                                        >
                                            <div
                                                class="bg-zinc-900 text-white text-xs px-2 py-1 rounded shadow-lg"
                                            >
                                                Add Bookmark
                                            </div>
                                        </div>
                                    </div>
                                    <div class="relative group/icon">
                                        <Icon
                                            icon="mdi:tag"
                                            class="text-zinc-400 hover:text-emerald-600 text-lg cursor-pointer transition-colors"
                                        />
                                        <div
                                            class="absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
                                        >
                                            <div
                                                class="bg-zinc-900 text-white text-xs px-2 py-1 rounded shadow-lg"
                                            >
                                                Add Tag
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        {/each}
                    </div>
                {:else}
                    <div
                        class="flex flex-col items-center justify-center py-16"
                    >
                        <Icon
                            icon="mdi:search-off"
                            class="text-4xl text-zinc-300 mb-4"
                        />
                        <p class="text-zinc-500">No results found</p>
                    </div>
                {/if}
            </div>

            <!-- Footer -->
            <div
                class="sticky bottom-0 bg-white border-t border-zinc-200 px-6 py-3 flex items-center justify-between"
            >
                <span class="text-xs text-zinc-400">
                    Click on a result to open in new tab
                </span>
                <button
                    onclick={closeResults}
                    class="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Options Modal -->
<Modal
    open={isModalOpen}
    onClose={closeModal}
    title={selectedSearchForModal?.query || ""}
/>

<!-- Floating Footer -->
<footer
    class="fixed bottom-6 left-6 right-6 z-40 pointer-events-none ui-scaled-footer"
    style="transform: scale({$uiScale}); transform-origin: bottom center;"
>
    <div class="max-w-6xl mx-auto flex justify-between items-end">
        <div
            class="pointer-events-auto bg-white/70 backdrop-blur-xl rounded-xl border border-zinc-200/50 px-4 py-2 shadow-sm"
        >
            <span class="text-xs text-zinc-400">© 2024 Search Archive</span>
        </div>
        <div
            class="pointer-events-auto flex items-center gap-2 bg-white/70 backdrop-blur-xl rounded-xl border border-zinc-200/50 p-2 shadow-sm"
        >
            <a
                href="https://github.com/searxng/searxng"
                target="_blank"
                rel="noopener noreferrer"
                class="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-900 transition-colors"
            >
                <Icon icon="mdi:github" class="text-lg" />
            </a>
            <a
                href="https://docs.searxng.org/"
                target="_blank"
                rel="noopener noreferrer"
                class="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-900 transition-colors"
            >
                <Icon icon="mdi:book-open-outline" class="text-lg" />
            </a>
        </div>
    </div>
</footer>

<style>
    .ui-scaled,
    .ui-scaled-header,
    .ui-scaled-footer {
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
</style>
