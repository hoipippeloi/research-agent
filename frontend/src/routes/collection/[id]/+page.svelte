<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import Icon from "@iconify/svelte";
    import { uiScale } from "$lib/stores/uiScale";
    import type { Collection, SavedResult } from "$lib/db/schema";
    import { toast } from "svelte-sonner";

    // Types for collection items
    interface LinkedSearch {
        id: number;
        query: string;
        engine: string;
        resultsCount: number | null;
        createdAt: Date;
        addedAt: Date;
    }

    interface CollectionItemsResponse {
        collection: Collection;
        items: {
            all: SavedResult[];
            bookmarks: SavedResult[];
            documents: SavedResult[];
            webResults: SavedResult[];
            savedMarkdown: SavedResult[];
        };
        searches: LinkedSearch[];
        stats: {
            totalItems: number;
            bookmarksCount: number;
            documentsCount: number;
            webResultsCount: number;
            savedMarkdownCount: number;
            searchesCount: number;
        };
    }

    type TabType = "all" | "bookmarks" | "documents" | "searches" | "saved";

    // State
    let collection = $state<Collection | null>(null);
    let items = $state<CollectionItemsResponse["items"] | null>(null);
    let searches = $state<LinkedSearch[]>([]);
    let stats = $state<CollectionItemsResponse["stats"] | null>(null);
    let isLoading = $state(true);
    let error = $state<string | null>(null);
    let currentUserEmail = $state<string | null>(null);
    let activeTab = $state<TabType>("all");
    let searchFilter = $state("");
    let isEditing = $state(false);
    let editTopic = $state("");
    let editDescription = $state("");
    let isSaving = $state(false);
    let deletingItemId = $state<number | null>(null);

    const collectionId = $derived($page.params.id);

    // Filtered items based on search
    let filteredItems = $derived(() => {
        if (!items) return [];

        const currentItems =
            activeTab === "all"
                ? items.all
                : activeTab === "bookmarks"
                  ? items.bookmarks
                  : activeTab === "documents"
                    ? items.documents
                    : activeTab === "saved"
                      ? items.savedMarkdown
                      : [];

        if (!searchFilter.trim()) return currentItems;

        const query = searchFilter.toLowerCase();
        return currentItems.filter(
            (item) =>
                item.title?.toLowerCase().includes(query) ||
                item.url?.toLowerCase().includes(query) ||
                item.excerpt?.toLowerCase().includes(query) ||
                item.notes?.toLowerCase().includes(query),
        );
    });

    let filteredSearches = $derived(() => {
        if (activeTab !== "searches") return [];
        if (!searchFilter.trim()) return searches;

        const query = searchFilter.toLowerCase();
        return searches.filter((s) => s.query.toLowerCase().includes(query));
    });

    onMount(async () => {
        const storedEmail = localStorage.getItem("user_email");
        if (!storedEmail) {
            goto("/");
            return;
        }
        currentUserEmail = storedEmail;
        await loadCollectionData();
    });

    async function loadCollectionData() {
        if (!currentUserEmail || !collectionId) return;

        try {
            isLoading = true;
            error = null;

            const response = await fetch(
                `/api/collections/${collectionId}/items?userEmail=${encodeURIComponent(currentUserEmail)}`,
            );

            if (response.ok) {
                const data: CollectionItemsResponse = await response.json();
                collection = data.collection;
                items = data.items;
                searches = data.searches;
                stats = data.stats;
                editTopic = collection?.topic || "";
                editDescription = collection?.description || "";
            } else if (response.status === 404) {
                error = "Collection not found";
            } else {
                error = "Failed to load collection";
            }
        } catch (err) {
            console.error("Error loading collection:", err);
            error = "An unexpected error occurred";
        } finally {
            isLoading = false;
        }
    }

    function handleBack() {
        goto("/?tab=collections");
    }

    async function handleSaveEdit() {
        if (!currentUserEmail || !collectionId || !editTopic.trim()) return;

        try {
            isSaving = true;
            const response = await fetch(`/api/collections/${collectionId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userEmail: currentUserEmail,
                    topic: editTopic.trim(),
                    description: editDescription.trim() || null,
                }),
            });

            if (response.ok) {
                const updated = await response.json();
                collection = updated;
                isEditing = false;
                toast.success("Collection updated");
            } else {
                toast.error("Failed to update collection");
            }
        } catch (err) {
            console.error("Error updating collection:", err);
            toast.error("An error occurred");
        } finally {
            isSaving = false;
        }
    }

    function cancelEdit() {
        editTopic = collection?.topic || "";
        editDescription = collection?.description || "";
        isEditing = false;
    }

    async function handleDeleteItem(itemId: number) {
        if (!currentUserEmail) return;

        try {
            deletingItemId = itemId;

            // Determine the item type to call the right API
            const item = items?.all.find((i) => i.id === itemId);
            if (!item) return;

            let endpoint = "";
            if (item.type === "url") {
                endpoint = `/api/bookmarks?url=${encodeURIComponent(item.url)}&userEmail=${encodeURIComponent(currentUserEmail)}`;
            } else if (item.type === "document") {
                endpoint = `/api/documents/${itemId}?userEmail=${encodeURIComponent(currentUserEmail)}`;
            } else {
                // Generic saved result
                endpoint = `/api/saved-results/${itemId}?userEmail=${encodeURIComponent(currentUserEmail)}`;
            }

            const response = await fetch(endpoint, { method: "DELETE" });

            if (response.ok) {
                await loadCollectionData();
                toast.success("Item removed");
            } else {
                toast.error("Failed to remove item");
            }
        } catch (err) {
            console.error("Error deleting item:", err);
            toast.error("An error occurred");
        } finally {
            deletingItemId = null;
        }
    }

    function getItemIcon(item: SavedResult): string {
        if (item.type === "url") return "mdi:bookmark";
        if (item.type === "document") return "mdi:file-document";
        if (item.type === "image") return "mdi:image";
        if (item.type === "video") return "mdi:video";
        if (item.type === "code") return "mdi:code-braces";
        if (item.type === "academic") return "mdi:school";
        if (item.content) return "mdi:text-box";
        return "mdi:link";
    }

    function getItemTypeLabel(item: SavedResult): string {
        if (item.type === "url") return "Bookmark";
        if (item.type === "document") return "Document";
        if (item.type === "image") return "Image";
        if (item.type === "video") return "Video";
        if (item.type === "code") return "Code";
        if (item.type === "academic") return "Academic";
        if (item.content && !item.type) return "Saved";
        return "Web";
    }

    function getItemTypeBadgeColor(item: SavedResult): string {
        if (item.type === "url") return "text-[#018790] bg-[#00b7b5]/10";
        if (item.type === "document") return "text-[#005461] bg-[#005461]/10";
        if (item.type === "image") return "text-[#00b7b5] bg-[#00b7b5]/10";
        if (item.type === "video") return "text-red-600 bg-red-50";
        if (item.type === "code") return "text-[#005461] bg-[#00b7b5]/10";
        if (item.type === "academic") return "text-[#018790] bg-[#018790]/10";
        if (item.content && !item.type) return "text-[#018790] bg-[#00b7b5]/10";
        return "text-zinc-600 bg-zinc-50";
    }

    function formatDate(date: Date | string | number): string {
        const d = new Date(date);
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }

    function getDomain(url: string): string {
        try {
            if (url.startsWith("document://")) return "Local Document";
            return new URL(url).hostname.replace("www.", "");
        } catch {
            return url;
        }
    }

    function openItem(item: SavedResult) {
        if (item.type === "document") {
            goto(`/document/${item.id}`);
        } else if (!item.url.startsWith("document://")) {
            window.open(item.url, "_blank");
        }
    }
</script>

<svelte:head>
    <title>{collection?.topic || "Collection"} - Research Agent</title>
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
    class="fixed top-0 left-0 right-0 z-50 px-6 py-4"
    style="transform: scale({$uiScale}); transform-origin: top center;"
>
    <nav class="max-w-6xl mx-auto">
        <div
            class="bg-white/70 backdrop-blur-xl rounded-2xl border border-zinc-200/50 px-6 py-3 flex items-center justify-between shadow-sm"
        >
            <!-- Back Button & Title -->
            <div class="flex items-center gap-3">
                <button
                    onclick={handleBack}
                    class="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                    title="Back to collections"
                >
                    <Icon icon="mdi:arrow-left" class="text-zinc-600 text-lg" />
                </button>
                <div class="h-6 w-px bg-zinc-200"></div>
                <div class="flex items-center gap-2">
                    <Icon icon="mdi:folder" class="text-[#018790] text-lg" />
                    <span
                        class="font-medium text-zinc-900 truncate max-w-[200px] sm:max-w-[400px]"
                    >
                        {collection?.topic || "Collection"}
                    </span>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
                <button
                    onclick={() => (isEditing = !isEditing)}
                    class="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                    title="Edit collection"
                >
                    <Icon icon="mdi:pencil" class="text-zinc-600 text-lg" />
                </button>
                <button
                    onclick={loadCollectionData}
                    class="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                    title="Refresh"
                >
                    <Icon icon="mdi:refresh" class="text-zinc-600 text-lg" />
                </button>
            </div>
        </div>
    </nav>
</header>

<!-- Main Content -->
<main class="relative z-10 pt-28 pb-24 px-6">
    <div
        class="max-w-6xl mx-auto"
        style="transform: scale({$uiScale}); transform-origin: top center;"
    >
        {#if isLoading}
            <div class="flex flex-col items-center justify-center py-32">
                <Icon
                    icon="mdi:loading"
                    class="text-4xl text-zinc-400 animate-spin mb-4"
                />
                <p class="text-zinc-500">Loading collection...</p>
            </div>
        {:else if error}
            <div class="flex flex-col items-center justify-center py-32">
                <div
                    class="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4"
                >
                    <Icon
                        icon="mdi:alert-circle"
                        class="text-red-500 text-3xl"
                    />
                </div>
                <h2 class="text-xl font-semibold text-zinc-900 mb-2">
                    {error}
                </h2>
                <p class="text-zinc-500 mb-6">
                    The collection you're looking for doesn't exist or you don't
                    have access.
                </p>
                <button
                    onclick={handleBack}
                    class="px-4 py-2 bg-[#005461] text-white rounded-lg text-sm font-medium hover:bg-[#018790] transition-colors"
                >
                    Back to Collections
                </button>
            </div>
        {:else if collection}
            <!-- Collection Header -->
            <div class="mb-8">
                {#if isEditing}
                    <!-- Edit Mode -->
                    <div
                        class="bg-white/80 backdrop-blur rounded-2xl border border-zinc-200/70 p-6 mb-4"
                    >
                        <div class="space-y-4">
                            <div>
                                <label
                                    for="edit-topic"
                                    class="block text-sm font-medium text-zinc-700 mb-1"
                                >
                                    Collection Name
                                </label>
                                <input
                                    id="edit-topic"
                                    type="text"
                                    bind:value={editTopic}
                                    class="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#00b7b5]/30 focus:border-[#018790] transition-all"
                                    placeholder="Enter collection name"
                                />
                            </div>
                            <div>
                                <label
                                    for="edit-description"
                                    class="block text-sm font-medium text-zinc-700 mb-1"
                                >
                                    Description (optional)
                                </label>
                                <textarea
                                    id="edit-description"
                                    bind:value={editDescription}
                                    rows={3}
                                    class="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#00b7b5]/30 focus:border-[#018790] transition-all resize-none"
                                    placeholder="Add a description for this collection"
                                ></textarea>
                            </div>
                            <div class="flex items-center gap-3">
                                <button
                                    onclick={cancelEdit}
                                    class="px-4 py-2 border border-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onclick={handleSaveEdit}
                                    disabled={isSaving || !editTopic.trim()}
                                    class="px-4 py-2 bg-[#005461] text-white rounded-lg text-sm font-medium hover:bg-[#018790] transition-colors disabled:opacity-50"
                                >
                                    {#if isSaving}
                                        <Icon
                                            icon="mdi:loading"
                                            class="animate-spin inline mr-1"
                                        />
                                    {/if}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                {:else}
                    <!-- View Mode -->
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <h1
                                class="text-3xl font-semibold tracking-tight mb-2"
                            >
                                {collection.topic}
                            </h1>
                            <p class="text-zinc-500">
                                {collection.description || "No description"}
                            </p>
                        </div>
                    </div>
                {/if}

                <!-- Stats Bar -->
                <div
                    class="flex flex-wrap items-center gap-4 py-4 px-6 bg-white/60 backdrop-blur rounded-xl border border-zinc-200/50"
                >
                    <div class="flex items-center gap-2">
                        <Icon
                            icon="mdi:folder-multiple"
                            class="text-[#018790]"
                        />
                        <span class="text-sm font-medium text-zinc-900">
                            {stats?.totalItems || 0}
                        </span>
                        <span class="text-sm text-zinc-500">items</span>
                    </div>
                    <div class="h-4 w-px bg-zinc-200"></div>
                    <div class="flex items-center gap-2">
                        <Icon icon="mdi:bookmark" class="text-[#00b7b5]" />
                        <span class="text-sm text-zinc-600">
                            {stats?.bookmarksCount || 0} bookmarks
                        </span>
                    </div>
                    <div class="h-4 w-px bg-zinc-200"></div>
                    <div class="flex items-center gap-2">
                        <Icon icon="mdi:file-document" class="text-[#018790]" />
                        <span class="text-sm text-zinc-600">
                            {stats?.documentsCount || 0} documents
                        </span>
                    </div>
                    <div class="h-4 w-px bg-zinc-200"></div>
                    <div class="flex items-center gap-2">
                        <Icon icon="mdi:magnify" class="text-[#005461]" />
                        <span class="text-sm text-zinc-600">
                            {stats?.searchesCount || 0} searches
                        </span>
                    </div>
                    <div class="flex-1"></div>
                    <div class="flex items-center gap-2 text-xs text-zinc-400">
                        <Icon icon="mdi:calendar" class="text-sm" />
                        <span>Created {formatDate(collection.createdAt)}</span>
                    </div>
                </div>
            </div>

            <!-- Tabs & Search -->
            <div class="mb-6">
                <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                    <!-- Tabs -->
                    <div
                        class="flex items-center gap-1 bg-white/60 backdrop-blur rounded-xl p-1 border border-zinc-200/50"
                    >
                        <button
                            onclick={() => (activeTab = "all")}
                            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {activeTab ===
                            'all'
                                ? 'bg-white text-[#005461] shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-700'}"
                        >
                            All
                            {#if stats?.totalItems}
                                <span class="ml-1 text-xs opacity-60"
                                    >({stats.totalItems})</span
                                >
                            {/if}
                        </button>
                        <button
                            onclick={() => (activeTab = "bookmarks")}
                            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {activeTab ===
                            'bookmarks'
                                ? 'bg-white text-[#005461] shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-700'}"
                        >
                            <Icon
                                icon="mdi:bookmark"
                                class="inline text-sm mr-1"
                            />
                            Bookmarks
                        </button>
                        <button
                            onclick={() => (activeTab = "documents")}
                            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {activeTab ===
                            'documents'
                                ? 'bg-white text-[#005461] shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-700'}"
                        >
                            <Icon
                                icon="mdi:file-document"
                                class="inline text-sm mr-1"
                            />
                            Documents
                        </button>
                        <button
                            onclick={() => (activeTab = "searches")}
                            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {activeTab ===
                            'searches'
                                ? 'bg-white text-[#005461] shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-700'}"
                        >
                            <Icon
                                icon="mdi:magnify"
                                class="inline text-sm mr-1"
                            />
                            Searches
                        </button>
                        <button
                            onclick={() => (activeTab = "saved")}
                            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {activeTab ===
                            'saved'
                                ? 'bg-white text-[#005461] shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-700'}"
                        >
                            <Icon
                                icon="mdi:text-box"
                                class="inline text-sm mr-1"
                            />
                            Saved
                        </button>
                    </div>

                    <!-- Search -->
                    <div class="flex-1 max-w-md">
                        <div class="relative">
                            <Icon
                                icon="mdi:magnify"
                                class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                            />
                            <input
                                type="text"
                                bind:value={searchFilter}
                                placeholder="Filter items..."
                                class="w-full pl-10 pr-4 py-2 bg-white/60 backdrop-blur rounded-xl border border-zinc-200/50 focus:outline-none focus:ring-2 focus:ring-[#00b7b5]/30 focus:border-[#018790] transition-all text-sm"
                            />
                            {#if searchFilter}
                                <button
                                    onclick={() => (searchFilter = "")}
                                    class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                >
                                    <Icon icon="mdi:close" class="text-sm" />
                                </button>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Content -->
            {#if activeTab === "searches"}
                <!-- Searches Tab - Card Grid -->
                <div
                    class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                    {#if filteredSearches().length === 0}
                        <div
                            class="col-span-full bg-white rounded-2xl border border-zinc-200/70 p-8"
                        >
                            <div
                                class="flex flex-col items-center justify-center py-12"
                            >
                                <div
                                    class="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4"
                                >
                                    <Icon
                                        icon="mdi:magnify"
                                        class="text-zinc-400 text-3xl"
                                    />
                                </div>
                                <h2
                                    class="text-lg font-semibold text-zinc-900 mb-2"
                                >
                                    No searches linked
                                </h2>
                                <p
                                    class="text-zinc-500 text-center max-w-md text-sm"
                                >
                                    Searches you perform for this topic will
                                    appear here.
                                </p>
                            </div>
                        </div>
                    {:else}
                        {#each filteredSearches() as search, i (search.id)}
                            <div
                                class="post-card bg-white rounded-xl p-4 border border-zinc-200/70 shadow-sm hover:shadow-xl relative group cursor-pointer flex flex-col min-h-[140px]"
                                onclick={() =>
                                    goto(
                                        `/?q=${encodeURIComponent(search.query)}`,
                                    )}
                                role="button"
                                tabindex={0}
                                onkeydown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        goto(
                                            `/?q=${encodeURIComponent(search.query)}`,
                                        );
                                    }
                                }}
                            >
                                <div
                                    class="flex items-center justify-between mb-3"
                                >
                                    <span
                                        class="font-mono text-xs text-zinc-300"
                                        >{String(i + 1).padStart(3, "0")}</span
                                    >
                                    <div class="flex items-center gap-1.5">
                                        <span
                                            class="text-[10px] text-[#018790] font-medium bg-[#00b7b5]/10 px-2 py-0.5 rounded-full"
                                        >
                                            {search.engine}
                                        </span>
                                    </div>
                                </div>
                                <div
                                    class="flex items-start gap-1.5 mb-2 flex-grow"
                                >
                                    <h2
                                        class="text-base font-semibold tracking-tight leading-snug line-clamp-2 flex-1"
                                    >
                                        {search.query}
                                    </h2>
                                </div>
                                <p
                                    class="text-zinc-500 text-xs font-light leading-relaxed mb-3"
                                >
                                    {search.resultsCount || 0} results
                                </p>
                                <div
                                    class="flex items-center pt-3 border-t border-zinc-100 mt-auto"
                                >
                                    <span class="text-xs text-zinc-400"
                                        >{formatDate(search.createdAt)}</span
                                    >
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
            {:else}
                <!-- Items Tab (All, Bookmarks, Documents, Saved) - Card Grid -->
                <div
                    class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                    {#if filteredItems().length === 0}
                        <div
                            class="col-span-full bg-white rounded-2xl border border-zinc-200/70 p-8"
                        >
                            <div
                                class="flex flex-col items-center justify-center py-12"
                            >
                                <div
                                    class="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4"
                                >
                                    <Icon
                                        icon={activeTab === "bookmarks"
                                            ? "mdi:bookmark-outline"
                                            : activeTab === "documents"
                                              ? "mdi:file-document-outline"
                                              : activeTab === "saved"
                                                ? "mdi:text-box-outline"
                                                : "mdi:folder-open-outline"}
                                        class="text-zinc-400 text-3xl"
                                    />
                                </div>
                                <h2
                                    class="text-lg font-semibold text-zinc-900 mb-2"
                                >
                                    {#if searchFilter}
                                        No items match your filter
                                    {:else if activeTab === "bookmarks"}
                                        No bookmarks yet
                                    {:else if activeTab === "documents"}
                                        No documents yet
                                    {:else if activeTab === "saved"}
                                        No saved content yet
                                    {:else}
                                        This collection is empty
                                    {/if}
                                </h2>
                                <p
                                    class="text-zinc-500 text-center max-w-md text-sm"
                                >
                                    {#if searchFilter}
                                        Try adjusting your filter or search for
                                        something else.
                                    {:else if activeTab === "bookmarks"}
                                        Save bookmarks to this collection to see
                                        them here.
                                    {:else if activeTab === "documents"}
                                        Create notes and documents to add them
                                        to this collection.
                                    {:else if activeTab === "saved"}
                                        Save markdown content from search
                                        results to see it here.
                                    {:else}
                                        Start adding bookmarks, documents, and
                                        saved content to organize your research.
                                    {/if}
                                </p>
                            </div>
                        </div>
                    {:else}
                        {#each filteredItems() as item, i (item.id)}
                            <div
                                class="post-card bg-white rounded-xl p-4 border border-zinc-200/70 shadow-sm hover:shadow-xl relative group cursor-pointer flex flex-col min-h-[140px]"
                                onclick={() => openItem(item)}
                                role="button"
                                tabindex={0}
                                onkeydown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        openItem(item);
                                    }
                                }}
                            >
                                <!-- Delete Button -->
                                <button
                                    onclick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteItem(item.id);
                                    }}
                                    disabled={deletingItemId === item.id}
                                    class="absolute bottom-2 right-2 p-1.5 bg-white/80 hover:bg-red-50 rounded-lg border border-zinc-200/50 opacity-0 group-hover:opacity-100 transition-all hover:border-red-200 hover:text-red-600 disabled:opacity-50 z-10"
                                    title="Remove from collection"
                                >
                                    {#if deletingItemId === item.id}
                                        <Icon
                                            icon="mdi:loading"
                                            class="text-xs animate-spin"
                                        />
                                    {:else}
                                        <Icon
                                            icon="mdi:trash-can-outline"
                                            class="text-xs"
                                        />
                                    {/if}
                                </button>

                                <div
                                    class="flex items-center justify-between mb-3"
                                >
                                    <span
                                        class="font-mono text-xs text-zinc-300"
                                        >{String(i + 1).padStart(3, "0")}</span
                                    >
                                    <div class="flex items-center gap-1.5">
                                        <span
                                            class="text-[10px] font-medium px-2 py-0.5 rounded-full {getItemTypeBadgeColor(
                                                item,
                                            )}"
                                        >
                                            {getItemTypeLabel(item)}
                                        </span>
                                    </div>
                                </div>
                                <div
                                    class="flex items-start gap-1.5 mb-2 flex-grow"
                                >
                                    <h2
                                        class="text-base font-semibold tracking-tight leading-snug line-clamp-2 flex-1"
                                    >
                                        {item.title || "Untitled"}
                                    </h2>
                                </div>
                                <p
                                    class="text-zinc-500 text-xs font-light leading-relaxed mb-3 line-clamp-2"
                                >
                                    {item.excerpt ||
                                        item.content?.substring(0, 100) ||
                                        getDomain(item.url)}
                                </p>
                                <div
                                    class="flex items-center pt-3 border-t border-zinc-100 mt-auto"
                                >
                                    <span class="text-xs text-zinc-400"
                                        >{formatDate(item.createdAt)}</span
                                    >
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
            {/if}
        {/if}
    </div>
</main>

<!-- Footer -->
<footer
    class="fixed bottom-0 left-0 right-0 z-40 px-6 py-4 bg-gradient-to-t from-white/80 to-transparent backdrop-blur-sm"
    style="transform: scale({$uiScale}); transform-origin: bottom center;"
>
    <div class="max-w-6xl mx-auto flex justify-center items-end">
        <div
            class="flex items-center gap-4 text-zinc-400 hover:text-zinc-600 transition-colors"
        >
            <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                class="p-2 hover:bg-[#00b7b5]/10 rounded-lg text-zinc-400 hover:text-[#005461] transition-colors"
                title="View on GitHub"
            >
                <Icon icon="mdi:github" class="text-lg" />
            </a>
            <a
                href="/docs"
                class="p-2 hover:bg-[#00b7b5]/10 rounded-lg text-zinc-400 hover:text-[#005461] transition-colors"
                title="Documentation"
            >
                <Icon icon="mdi:book-open-outline" class="text-lg" />
            </a>
        </div>
    </div>
</footer>

<style>
    :global(body) {
        background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
    }

    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>
