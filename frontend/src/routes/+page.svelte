<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import Icon from "@iconify/svelte";
    import type { SearchHistory } from "$lib/redis-client";
    import type { Collection, SavedResult } from "$lib/db/schema";
    import BirdsFlocking from "$lib/components/BirdsFlocking.svelte";
    import { uiScale } from "$lib/stores/uiScale";
    import Modal from "$lib/components/Modal.svelte";
    import {
        getModalFromUrl,
        openModal,
        closeModal as closeModalUrl,
        openMarkdownPreview,
        closeMarkdownPreview,
        type ModalType,
    } from "$lib/modal-url";
    import MarkdownPreviewModal from "$lib/components/MarkdownPreviewModal.svelte";
    import EmailModal from "$lib/components/EmailModal.svelte";
    import { toast } from "svelte-sonner";

    interface AggregatedSearchHistory {
        query: string;
        count: number;
        latestTimestamp: number;
        engines: string[];
        totalResults: number;
        searches: SearchHistory[];
    }

    type TabType = "searches" | "collections" | "docs" | "bookmarks";

    let currentUserEmail = $state<string | null>(null);
    let showEmailModal = $state(false);
    let searchQuery = $state("");
    let isSearching = $state(false);
    let searchHistory = $state<SearchHistory[]>([]);
    let aggregatedHistory = $state<AggregatedSearchHistory[]>([]);
    let error = $state("");
    let searchResults = $state<any>(null);
    let isLoadingResults = $state(false);
    let isFromCache = $state(false);
    let cachedAt = $state<number | null>(null);
    let deletingQuery = $state<string | null>(null);
    let isInitialLoad = $state(true);
    let activeTab = $derived<TabType>(
        ($page.url.searchParams.get("tab") as TabType) || "searches",
    );

    function setActiveTab(tab: TabType) {
        const url = new URL($page.url);
        url.searchParams.set("tab", tab);
        goto(url.search, { replaceState: true });
    }
    let collections = $state<Collection[]>([]);
    let isLoadingCollections = $state(false);
    let isCreatingCollection = $state(false);
    let deletingCollectionId = $state<number | null>(null);
    let showCreateCollectionModal = $state(false);
    let newCollectionName = $state("");
    let isCreatingNewCollection = $state(false);

    let notes = $state<any[]>([]);
    let isLoadingNotes = $state(false);
    let showCreateNoteModal = $state(false);
    let editingNote = $state<any | null>(null);
    let newNoteTitle = $state("");
    let newNoteContent = $state("");
    let isSavingNote = $state(false);
    let deletingNoteId = $state<number | null>(null);
    let bookmarks = $state<any[]>([]);
    let isLoadingBookmarks = $state(false);
    let deletingBookmarkId = $state<number | null>(null);
    let showAddBookmarkModal = $state(false);
    let newBookmarkUrl = $state("");
    let newBookmarkTitle = $state("");
    let newBookmarkExcerpt = $state("");
    let newBookmarkCollectionId = $state<number | null>(null);
    let collectionSearchQuery = $state("");
    let showCollectionDropdown = $state(false);
    let showExcerptField = $state(false);
    let isAddingBookmark = $state(false);

    let filteredCollections = $derived(
        collectionSearchQuery.trim()
            ? collections.filter((c) =>
                  c.topic
                      .toLowerCase()
                      .includes(collectionSearchQuery.toLowerCase()),
              )
            : collections,
    );

    let currentModal = $state<{
        type: ModalType;
        query?: string;
        markdownUrl?: string;
    }>({ type: null });
    let loadedResultsQuery = $state<string | null>(null);
    let isFetchingResults = $state(false);
    let selectedSearchForModal = $derived(
        currentModal.query && aggregatedHistory.length > 0
            ? aggregatedHistory.find((s) => s.query === currentModal.query) ||
                  null
            : null,
    );
    let hasCollectionForQuery = $derived(
        selectedSearchForModal
            ? collections.some((c) => c.topic === selectedSearchForModal.query)
            : false,
    );

    function loadFromLocalStorage() {
        try {
            const cachedSearches = localStorage.getItem(
                "cached_search_history",
            );
            const cachedCollections =
                localStorage.getItem("cached_collections");
            const cachedNotes = localStorage.getItem("cached_notes");

            if (cachedSearches) {
                searchHistory = JSON.parse(cachedSearches);
                aggregateSearchHistory();
            }
            if (cachedCollections) {
                collections = JSON.parse(cachedCollections);
            }
            if (cachedNotes) {
                notes = JSON.parse(cachedNotes);
            }
        } catch (err) {
            console.error("Error loading from localStorage:", err);
        }
    }

    function saveToLocalStorage() {
        try {
            localStorage.setItem(
                "cached_search_history",
                JSON.stringify(searchHistory),
            );
            localStorage.setItem(
                "cached_collections",
                JSON.stringify(collections),
            );
            localStorage.setItem("cached_notes", JSON.stringify(notes));
            localStorage.setItem("cached_bookmarks", JSON.stringify(bookmarks));
        } catch (err) {
            console.error("Error saving to localStorage:", err);
        }
    }

    onMount(async () => {
        const storedEmail = localStorage.getItem("user_email");

        if (!storedEmail) {
            showEmailModal = true;
            isInitialLoad = false;
            return;
        }

        currentUserEmail = storedEmail;

        loadFromLocalStorage();
        isInitialLoad = false;

        await Promise.all([
            loadSearchHistory(),
            loadCollections(),
            loadNotes(),
            loadBookmarks(),
        ]);

        saveToLocalStorage();
    });

    async function handleEmailSubmit(email: string) {
        localStorage.setItem("user_email", email);
        currentUserEmail = email;
        showEmailModal = false;

        try {
            await fetch("/api/notify-new-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newUserEmail: email }),
            });
        } catch (e) {
            console.error("Failed to send notification:", e);
        }

        await Promise.all([
            loadSearchHistory(),
            loadCollections(),
            loadNotes(),
            loadBookmarks(),
        ]);
    }

    $effect(() => {
        // Always set currentModal from URL, regardless of aggregatedHistory state
        const modalState = getModalFromUrl($page.url);
        currentModal = modalState;

        // Only fetch results if aggregatedHistory has items and other conditions are met
        if (
            aggregatedHistory.length > 0 &&
            modalState.type === "search" &&
            modalState.query &&
            modalState.query !== loadedResultsQuery &&
            !isFetchingResults
        ) {
            const search = aggregatedHistory.find(
                (s) => s.query === modalState.query,
            );
            if (search) {
                fetchResults(search);
            }
        }
    });

    function handleOpenOptions(search: AggregatedSearchHistory, e: MouseEvent) {
        e.stopPropagation();
        openModal(goto, "options", search.query);
    }

    function closeModal() {
        closeModalUrl(goto);
    }

    function handleOpenMarkdownPreview(url: string, e: MouseEvent) {
        e.stopPropagation();
        e.preventDefault();
        const searchQuery = currentModal.query || selectedSearchForModal?.query;
        if (searchQuery) {
            goto(
                `/doc?url=${encodeURIComponent(url)}&fromQuery=${encodeURIComponent(searchQuery)}`,
            );
        } else {
            goto(`/doc?url=${encodeURIComponent(url)}`);
        }
    }

    function handleCloseMarkdownPreview() {
        closeMarkdownPreview(goto);
    }

    function handleAddBookmark(title: string, url: string, excerpt: string) {
        if (!currentUserEmail) {
            toast.error("Cannot add bookmark", {
                description: "Please sign in to save bookmarks",
            });
            return;
        }

        // Pre-populate the modal fields and open it
        newBookmarkTitle = title;
        newBookmarkUrl = url;
        newBookmarkExcerpt = excerpt;
        newBookmarkCollectionId = null;
        collectionSearchQuery = "";
        showExcerptField = !!excerpt; // Show excerpt field if there's content
        showAddBookmarkModal = true;
    }

    async function handleSaveMarkdown(markdown: string, sourceUrl: string) {
        if (
            !currentUserEmail ||
            !selectedSearchForModal ||
            !hasCollectionForQuery
        ) {
            toast.error("Cannot save markdown", {
                description: "No collection found for this search query",
            });
            return;
        }

        const collection = collections.find(
            (c) => c.topic === selectedSearchForModal.query,
        );
        if (!collection) {
            toast.error("Cannot save markdown", {
                description: "Collection not found in database",
            });
            return;
        }

        try {
            const response = await fetch("/api/saved-results", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    markdown,
                    title: selectedSearchForModal.query,
                    collectionId: collection.id,
                    url: sourceUrl,
                    userEmail: currentUserEmail,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                toast.success("Markdown saved", {
                    description: `Successfully saved to collection "${selectedSearchForModal.query}"`,
                });
                handleCloseMarkdownPreview();
            } else {
                const errorData = await response.json();
                toast.error("Failed to save markdown", {
                    description:
                        errorData.error ||
                        "An error occurred while saving markdown",
                });
            }
        } catch (error) {
            toast.error("Failed to save markdown", {
                description: "An unexpected error occurred",
            });
        }
    }

    async function fetchResults(search: AggregatedSearchHistory) {
        if (isFetchingResults || !currentUserEmail) return;

        isFetchingResults = true;
        isLoadingResults = true;
        searchResults = null;
        isFromCache = false;
        cachedAt = null;

        try {
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
                    userEmail: currentUserEmail,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                searchResults = data;
                loadedResultsQuery = search.query;
                isFromCache = data.cached || false;
                cachedAt = data.cachedAt || null;
            } else {
                toast.error("Failed to load results", {
                    description: "Could not retrieve search results from cache",
                });
            }
        } catch (err) {
            console.error("Error loading results:", err);
            toast.error("Failed to load results", {
                description: "An unexpected error occurred",
            });
        } finally {
            isLoadingResults = false;
            isFetchingResults = false;
        }
    }

    async function handleViewResults(search: AggregatedSearchHistory) {
        await openModal(goto, "search", search.query);
    }

    async function loadCollections() {
        if (!currentUserEmail) return;

        try {
            isLoadingCollections = true;
            const response = await fetch(
                `/api/collections?userEmail=${encodeURIComponent(currentUserEmail)}`,
            );
            if (response.ok) {
                collections = await response.json();
                saveToLocalStorage();
            } else {
                toast.error("Failed to load collections", {
                    description: "Could not retrieve collections from database",
                });
            }
        } catch (err) {
            console.error("Failed to load collections:", err);
            toast.error("Failed to load collections", {
                description: "An unexpected error occurred",
            });
        } finally {
            isLoadingCollections = false;
        }
    }

    async function handleCreateCollection(search: AggregatedSearchHistory) {
        if (!currentUserEmail) return;

        try {
            isCreatingCollection = true;
            const response = await fetch("/api/collections", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    topic: search.query,
                    userEmail: currentUserEmail,
                }),
            });

            if (response.ok) {
                await loadCollections();
                closeModal();
                setActiveTab("collections");
                toast.success("Collection created", {
                    description: `Collection for "${search.query}" created successfully`,
                });
            } else {
                const data = await response.json();
                toast.error("Failed to create collection", {
                    description:
                        data.error ||
                        "An error occurred while creating the collection",
                });
            }
        } catch (err) {
            toast.error("Failed to create collection", {
                description: "An unexpected error occurred",
            });
        } finally {
            isCreatingCollection = false;
        }
    }

    async function handleCreateNewCollection() {
        if (!currentUserEmail || !newCollectionName.trim()) return;

        try {
            isCreatingNewCollection = true;
            const response = await fetch("/api/collections", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    topic: newCollectionName.trim(),
                    userEmail: currentUserEmail,
                }),
            });

            if (response.ok) {
                await loadCollections();
                showCreateCollectionModal = false;
                newCollectionName = "";
                toast.success("Collection created", {
                    description: `Collection "${newCollectionName.trim()}" created successfully`,
                });
            } else {
                const data = await response.json();
                toast.error("Failed to create collection", {
                    description:
                        data.error ||
                        "An error occurred while creating the collection",
                });
            }
        } catch (err) {
            toast.error("Failed to create collection", {
                description: "An unexpected error occurred",
            });
        } finally {
            isCreatingNewCollection = false;
        }
    }

    async function handleAddBookmarkFromModal() {
        if (!currentUserEmail || !newBookmarkUrl.trim()) return;

        try {
            isAddingBookmark = true;
            const response = await fetch("/api/bookmarks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: newBookmarkTitle.trim() || newBookmarkUrl.trim(),
                    url: newBookmarkUrl.trim(),
                    excerpt: newBookmarkExcerpt.trim() || "",
                    collectionId: newBookmarkCollectionId,
                    userEmail: currentUserEmail,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                toast.success("Bookmark added", {
                    description: `Saved "${newBookmarkTitle.trim() || newBookmarkUrl.trim()}"`,
                });
                await loadBookmarks();
                showAddBookmarkModal = false;
                newBookmarkUrl = "";
                newBookmarkTitle = "";
                newBookmarkExcerpt = "";
                newBookmarkCollectionId = null;
                collectionSearchQuery = "";
                showExcerptField = false;
            } else {
                const errorData = await response.json();
                toast.error("Failed to add bookmark", {
                    description: errorData.error || "An error occurred",
                });
            }
        } catch (error) {
            toast.error("Failed to add bookmark", {
                description: "An unexpected error occurred",
            });
        } finally {
            isAddingBookmark = false;
        }
    }

    async function handleDeleteBookmark(id: number, e: MouseEvent) {
        if (!currentUserEmail) return;

        e.stopPropagation();
        try {
            deletingBookmarkId = id;
            const bookmark = bookmarks.find((b) => b.id === id);
            if (!bookmark) return;

            const response = await fetch(
                `/api/bookmarks?url=${encodeURIComponent(bookmark.url)}&userEmail=${encodeURIComponent(currentUserEmail)}`,
                {
                    method: "DELETE",
                },
            );

            if (response.ok) {
                bookmarks = bookmarks.filter((b) => b.id !== id);
                toast.success("Bookmark deleted", {
                    description: "Bookmark has been removed successfully",
                });
            } else {
                const data = await response.json();
                toast.error("Failed to delete bookmark", {
                    description:
                        data.error ||
                        "An error occurred while deleting the bookmark",
                });
            }
        } catch (err) {
            toast.error("Failed to delete bookmark", {
                description: "An unexpected error occurred",
            });
        } finally {
            deletingBookmarkId = null;
        }
    }

    async function handleDeleteCollection(id: number, e: MouseEvent) {
        if (!currentUserEmail) return;

        e.stopPropagation();
        try {
            deletingCollectionId = id;
            const response = await fetch(
                `/api/collections?id=${id}&userEmail=${encodeURIComponent(currentUserEmail)}`,
                {
                    method: "DELETE",
                },
            );

            if (response.ok) {
                collections = collections.filter((c) => c.id !== id);
                toast.success("Collection deleted", {
                    description: "Collection has been removed successfully",
                });
            } else {
                const data = await response.json();
                toast.error("Failed to delete collection", {
                    description:
                        data.error ||
                        "An error occurred while deleting the collection",
                });
            }
        } catch (err) {
            toast.error("Failed to delete collection", {
                description: "An unexpected error occurred",
            });
        } finally {
            deletingCollectionId = null;
        }
    }

    async function loadNotes() {
        if (!currentUserEmail) return;

        try {
            isLoadingNotes = true;
            const response = await fetch(
                `/api/documents?userEmail=${encodeURIComponent(currentUserEmail)}`,
            );
            if (response.ok) {
                notes = await response.json();
                saveToLocalStorage();
            } else {
                toast.error("Failed to load documents", {
                    description: "Could not retrieve documents from database",
                });
            }
        } catch (err) {
            console.error("Failed to load documents:", err);
            toast.error("Failed to load documents", {
                description: "An unexpected error occurred",
            });
        } finally {
            isLoadingNotes = false;
        }
    }

    async function loadBookmarks() {
        if (!currentUserEmail) return;

        try {
            isLoadingBookmarks = true;
            const response = await fetch(
                `/api/bookmarks?userEmail=${encodeURIComponent(currentUserEmail)}`,
            );
            if (response.ok) {
                const data = await response.json();
                bookmarks = data.bookmarks || [];
                saveToLocalStorage();
            } else {
                toast.error("Failed to load bookmarks", {
                    description: "Could not retrieve bookmarks from database",
                });
            }
        } catch (err) {
            console.error("Failed to load bookmarks:", err);
            toast.error("Failed to load bookmarks", {
                description: "An unexpected error occurred",
            });
        } finally {
            isLoadingBookmarks = false;
        }
    }

    async function handleCreateNote() {
        if (!currentUserEmail || !newNoteTitle.trim() || !newNoteContent.trim())
            return;

        try {
            isSavingNote = true;
            const response = await fetch("/api/notes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: newNoteTitle.trim(),
                    content: newNoteContent.trim(),
                    userEmail: currentUserEmail,
                }),
            });

            if (response.ok) {
                await loadNotes();
                showCreateNoteModal = false;
                newNoteTitle = "";
                newNoteContent = "";
                toast.success("Note created", {
                    description: "Your note has been created successfully",
                });
            } else {
                const data = await response.json();
                toast.error("Failed to create note", {
                    description:
                        data.error ||
                        "An error occurred while creating the note",
                });
            }
        } catch (err) {
            toast.error("Failed to create note", {
                description: "An unexpected error occurred",
            });
        } finally {
            isSavingNote = false;
        }
    }

    async function handleUpdateNote() {
        if (
            !currentUserEmail ||
            !editingNote ||
            !newNoteTitle.trim() ||
            !newNoteContent.trim()
        )
            return;

        try {
            isSavingNote = true;
            const response = await fetch(`/api/notes?id=${editingNote.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: newNoteTitle.trim(),
                    content: newNoteContent.trim(),
                }),
            });

            if (response.ok) {
                await loadNotes();
                editingNote = null;
                newNoteTitle = "";
                newNoteContent = "";
                toast.success("Note updated", {
                    description: "Your note has been updated successfully",
                });
            } else {
                const data = await response.json();
                toast.error("Failed to update note", {
                    description:
                        data.error ||
                        "An error occurred while updating the note",
                });
            }
        } catch (err) {
            toast.error("Failed to update note", {
                description: "An unexpected error occurred",
            });
        } finally {
            isSavingNote = false;
        }
    }

    async function handleDeleteNote(id: number, e: MouseEvent) {
        if (!currentUserEmail) return;

        e.stopPropagation();
        try {
            deletingNoteId = id;
            const response = await fetch(
                `/api/notes?id=${id}&userEmail=${encodeURIComponent(currentUserEmail)}`,
                {
                    method: "DELETE",
                },
            );

            if (response.ok) {
                notes = notes.filter((n) => n.id !== id);
                toast.success("Note deleted", {
                    description: "Note has been removed successfully",
                });
            } else {
                const data = await response.json();
                toast.error("Failed to delete note", {
                    description:
                        data.error ||
                        "An error occurred while deleting the note",
                });
            }
        } catch (err) {
            toast.error("Failed to delete note", {
                description: "An unexpected error occurred",
            });
        } finally {
            deletingNoteId = null;
        }
    }

    function openEditNoteModal(note: any) {
        editingNote = note;
        newNoteTitle = note.title || "";
        newNoteContent = note.content || "";
    }

    async function loadSearchHistory() {
        if (!currentUserEmail) return;

        try {
            const response = await fetch(
                `/api/history?userEmail=${encodeURIComponent(currentUserEmail)}&limit=20`,
            );
            if (response.ok) {
                searchHistory = await response.json();
                await aggregateSearchHistory();
                saveToLocalStorage();
            } else {
                toast.error("Failed to load search history", {
                    description:
                        "Could not retrieve search history from database",
                });
            }
        } catch (err) {
            console.error("Failed to load search history:", err);
            toast.error("Failed to load search history", {
                description: "An unexpected error occurred",
            });
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
                        `/api/search?query=${encodeURIComponent(search.query)}&engine=${engineType}&cacheOnly=true&userEmail=${encodeURIComponent(currentUserEmail!)}`,
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
        if (!searchQuery.trim() || !currentUserEmail) return;

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
                    userEmail: currentUserEmail,
                }),
            });

            if (response.ok) {
                const results = await response.json();
                console.log("Search results:", results);

                searchResults = results;
                isFromCache = results.cached || false;
                cachedAt = results.cachedAt || null;

                await loadSearchHistory();
                loadedResultsQuery = searchQuery;
                openModal(goto, "search", searchQuery);

                if (results.cached) {
                    toast.success("Search completed", {
                        description: "Results loaded from cache",
                    });
                }
            } else {
                const data = await response.json();
                error = data.error || "Search failed";
                toast.error("Search failed", {
                    description: error,
                });
            }
        } catch (err) {
            console.error("Search error:", err);
            error = "Failed to perform search. Please try again.";
            toast.error("Search failed", {
                description: "An unexpected error occurred. Please try again.",
            });
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

            let successCount = 0;
            let failCount = 0;

            for (const search of searchesToDelete) {
                const response = await fetch(
                    `/api/history?id=${encodeURIComponent(search.id)}&userEmail=${encodeURIComponent(currentUserEmail!)}`,
                    {
                        method: "DELETE",
                    },
                );

                if (response.ok) {
                    successCount++;
                } else {
                    failCount++;
                    console.error("Failed to delete search:", search.id);
                }
            }

            // Update local state
            searchHistory = searchHistory.filter((s) => s.query !== query);
            await aggregateSearchHistory();

            if (failCount === 0) {
                toast.success("Search history deleted", {
                    description: `Deleted ${successCount} search${successCount > 1 ? "es" : ""} for "${query}"`,
                });
            } else {
                toast.warning("Partial deletion", {
                    description: `${successCount} deleted, ${failCount} failed`,
                });
            }
        } catch (err) {
            toast.error("Failed to delete search", {
                description: "An unexpected error occurred",
            });
        } finally {
            deletingQuery = null;
        }
    }

    function closeResults() {
        closeModalUrl(goto);
        searchResults = null;
        loadedResultsQuery = null;
        isFetchingResults = false;
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

<!-- Email Modal -->
{#if showEmailModal}
    <EmailModal
        onsubmit={handleEmailSubmit}
        onclose={() => {
            showEmailModal = false;
        }}
    />
{/if}

<!-- Main Content - Only show if user has provided email -->
{#if currentUserEmail}
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
                <a href="/" class="flex items-center gap-3 group -ml-2">
                    <div
                        class="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300"
                    >
                        <Icon icon="mdi:magnify" class="text-white text-lg" />
                    </div>
                </a>

                <!-- Nav Links -->
                <div class="flex items-center gap-2 sm:gap-6 -mr-2">
                    <!-- Zoom Controls -->
                    <div class="flex items-center gap-1">
                        <button
                            onclick={() => uiScale.zoomOut()}
                            class="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                            title="Zoom out"
                            aria-label="Zoom out"
                        >
                            <Icon
                                icon="mdi:minus"
                                class="text-zinc-600 text-lg"
                            />
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
                            <Icon
                                icon="mdi:plus"
                                class="text-zinc-600 text-lg"
                            />
                        </button>
                    </div>
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
                    class="text-3xl md:text-4xl font-semibold tracking-tight mb-6 text-center"
                >
                    Research, collect and share
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
                                id="search-input"
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
                            class="px-4 py-2 bg-zinc-900 text-white rounded-xl font-medium text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {#if isSearching}
                                <Icon
                                    icon="mdi:loading"
                                    class="text-base animate-spin"
                                />
                                <span>Searching...</span>
                            {:else}
                                <Icon
                                    icon="mdi:arrow-right"
                                    class="text-base"
                                />
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
                <div
                    class="relative z-10 flex items-center justify-center py-8"
                >
                    <div
                        class="flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 text-base font-semibold text-zinc-700 shadow-lg"
                    >
                        <span
                            class="w-3 h-3 bg-blue-500 rounded-full animate-pulse"
                        ></span>
                        Searching...
                    </div>
                </div>
            {:else if searchHistory.length > 0}
                <div class="mb-8">
                    <!-- Tabs UI -->
                    <div class="flex items-center gap-3 mb-6">
                        <div
                            class="flex items-center gap-1 p-1 bg-white/60 backdrop-blur rounded-full border border-zinc-200/50"
                        >
                            <button
                                onclick={() => setActiveTab("searches")}
                                class="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all {activeTab ===
                                'searches'
                                    ? 'bg-white text-zinc-900 shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-700'}"
                            >
                                <Icon icon="mdi:history" class="text-sm" />
                                Searches
                                <span
                                    class="text-[10px] {activeTab === 'searches'
                                        ? 'text-zinc-400'
                                        : 'text-zinc-400'}"
                                >
                                    {aggregatedHistory.length}
                                </span>
                            </button>
                            <button
                                onclick={() => setActiveTab("collections")}
                                class="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all {activeTab ===
                                'collections'
                                    ? 'bg-white text-zinc-900 shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-700'}"
                            >
                                <Icon
                                    icon="mdi:folder-outline"
                                    class="text-sm"
                                />
                                Collections
                                <span
                                    class="text-[10px] {activeTab ===
                                    'collections'
                                        ? 'text-zinc-400'
                                        : 'text-zinc-400'}"
                                >
                                    {collections.length}
                                </span>
                            </button>
                            <button
                                onclick={() => setActiveTab("docs")}
                                class="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all {activeTab ===
                                'docs'
                                    ? 'bg-white text-zinc-900 shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-700'}"
                            >
                                <Icon
                                    icon="mdi:file-document-outline"
                                    class="text-sm"
                                />
                                Docs
                                <span
                                    class="text-[10px] {activeTab === 'docs'
                                        ? 'text-zinc-400'
                                        : 'text-zinc-400'}"
                                >
                                    {notes.length}
                                </span>
                            </button>
                            <button
                                onclick={() => setActiveTab("bookmarks")}
                                class="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all {activeTab ===
                                'bookmarks'
                                    ? 'bg-white text-zinc-900 shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-700'}"
                            >
                                <Icon
                                    icon="mdi:bookmark-outline"
                                    class="text-sm"
                                />
                                Bookmarks
                                <span
                                    class="text-[10px] {activeTab ===
                                    'bookmarks'
                                        ? 'text-zinc-400'
                                        : 'text-zinc-400'}"
                                >
                                    {bookmarks.length}
                                </span>
                            </button>
                        </div>
                    </div>

                    {#if activeTab === "searches"}
                        <!-- Search History Cards -->
                        <div
                            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                        >
                            <!-- New Search Card - Always First -->
                            <div
                                class="post-card bg-white rounded-xl p-4 border-2 border-dashed border-zinc-300 shadow-sm hover:shadow-xl hover:border-zinc-400 cursor-pointer group transition-all"
                                onclick={() =>
                                    document
                                        .getElementById("search-input")
                                        ?.focus()}
                                role="button"
                                tabindex={0}
                                onkeydown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        document
                                            .getElementById("search-input")
                                            ?.focus();
                                    }
                                }}
                            >
                                <div
                                    class="flex items-center justify-between mb-3"
                                >
                                    <span
                                        class="font-mono text-xs text-zinc-300"
                                        >NEW</span
                                    >
                                </div>
                                <div
                                    class="flex flex-col items-center justify-center py-4"
                                >
                                    <div
                                        class="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-3 group-hover:bg-zinc-200 transition-colors"
                                    >
                                        <Icon
                                            icon="mdi:plus"
                                            class="text-xl text-zinc-400 group-hover:text-zinc-600 transition-colors"
                                        />
                                    </div>
                                    <h2
                                        class="text-sm font-semibold tracking-tight text-zinc-600 group-hover:text-zinc-900 transition-colors"
                                    >
                                        New Search
                                    </h2>
                                    <p class="text-xs text-zinc-400 mt-1">
                                        Research something new
                                    </p>
                                </div>
                            </div>

                            {#each aggregatedHistory as search, i (search.query)}
                                <div
                                    class="post-card bg-white rounded-xl p-4 border border-zinc-200/70 shadow-sm cursor-pointer hover:shadow-xl relative group flex flex-col min-h-[140px]"
                                    onclick={() => handleViewResults(search)}
                                    role="button"
                                    tabindex={0}
                                    onkeydown={(e) => {
                                        if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                        ) {
                                            handleViewResults(search);
                                        }
                                    }}
                                >
                                    <!-- Delete Button -->
                                    <button
                                        onclick={(e) =>
                                            handleDelete(search.query, e)}
                                        disabled={deletingQuery ===
                                            search.query}
                                        class="absolute bottom-2 right-2 p-1.5 bg-white/80 hover:bg-red-50 rounded-lg border border-zinc-200/50 opacity-0 group-hover:opacity-100 transition-all hover:border-red-200 hover:text-red-600 disabled:opacity-50 z-10"
                                        title="Delete all visits with this query"
                                    >
                                        {#if deletingQuery === search.query}
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
                                            >{String(i + 1).padStart(
                                                3,
                                                "0",
                                            )}</span
                                        >
                                        <div class="flex items-center gap-1.5">
                                            {#if search.count > 1}
                                                <span
                                                    class="text-[10px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full"
                                                >
                                                    {search.count}x
                                                </span>
                                            {/if}
                                            <button
                                                onclick={(e) =>
                                                    handleOpenOptions(
                                                        search,
                                                        e,
                                                    )}
                                                class="p-1 hover:bg-zinc-100 rounded-lg transition-colors"
                                                title="Options"
                                            >
                                                <Icon
                                                    icon="mdi:dots-horizontal"
                                                    class="text-xs text-zinc-400"
                                                />
                                            </button>
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
                                        {#if !collections.some((c) => c.topic === search.query)}
                                            <button
                                                onclick={(e) => {
                                                    e.stopPropagation();
                                                    handleCreateCollection(
                                                        search,
                                                    );
                                                }}
                                                class="p-1 hover:bg-blue-50 rounded-lg transition-colors shrink-0 group/folder"
                                                title="Create collection"
                                            >
                                                <Icon
                                                    icon="mdi:folder-plus-outline"
                                                    class="text-sm text-zinc-400 group-hover/folder:text-blue-600 transition-colors"
                                                />
                                            </button>
                                        {/if}
                                    </div>
                                    <p
                                        class="text-zinc-500 text-xs font-light leading-relaxed mb-3"
                                    >
                                        {search.totalResults} unique results
                                        {#if search.count > 1}
                                            <span class="text-zinc-400"
                                                >• {search.count} visits</span
                                            >
                                        {/if}
                                    </p>
                                    <div
                                        class="flex items-center pt-3 border-t border-zinc-100 mt-auto"
                                    >
                                        <span class="text-xs text-zinc-400"
                                            >{formatDate(
                                                search.latestTimestamp,
                                            )}</span
                                        >
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {:else if activeTab === "collections"}
                        <!-- Collections Cards -->
                        <div
                            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                        >
                            {#if isLoadingCollections}
                                <div
                                    class="col-span-full flex items-center justify-center py-12"
                                >
                                    <Icon
                                        icon="mdi:loading"
                                        class="text-2xl text-zinc-400 animate-spin"
                                    />
                                </div>
                            {:else}
                                <!-- Create Collection Card - Always First -->
                                <div
                                    class="post-card bg-white rounded-xl p-4 border-2 border-dashed border-zinc-300 shadow-sm hover:shadow-xl hover:border-zinc-400 cursor-pointer group transition-all"
                                    onclick={() =>
                                        (showCreateCollectionModal = true)}
                                    role="button"
                                    tabindex={0}
                                    onkeydown={(e) => {
                                        if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                        ) {
                                            showCreateCollectionModal = true;
                                        }
                                    }}
                                >
                                    <div
                                        class="flex items-center justify-between mb-3"
                                    >
                                        <span
                                            class="font-mono text-xs text-zinc-300"
                                            >NEW</span
                                        >
                                    </div>
                                    <div
                                        class="flex flex-col items-center justify-center py-4"
                                    >
                                        <div
                                            class="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-3 group-hover:bg-zinc-200 transition-colors"
                                        >
                                            <Icon
                                                icon="mdi:plus"
                                                class="text-xl text-zinc-400 group-hover:text-zinc-600 transition-colors"
                                            />
                                        </div>
                                        <h2
                                            class="text-sm font-semibold tracking-tight text-zinc-600 group-hover:text-zinc-900 transition-colors"
                                        >
                                            Create Collection
                                        </h2>
                                        <p class="text-xs text-zinc-400 mt-1">
                                            Organize your research
                                        </p>
                                    </div>
                                </div>

                                {#each collections as collection, i (collection.id)}
                                    <div
                                        class="post-card bg-white rounded-xl p-4 border border-zinc-200/70 shadow-sm hover:shadow-xl relative group cursor-pointer flex flex-col min-h-[140px]"
                                        onclick={() =>
                                            goto(
                                                `/collection/${collection.id}`,
                                            )}
                                        role="button"
                                        tabindex={0}
                                        onkeydown={(e) => {
                                            if (
                                                e.key === "Enter" ||
                                                e.key === " "
                                            ) {
                                                goto(
                                                    `/collection/${collection.id}`,
                                                );
                                            }
                                        }}
                                    >
                                        <!-- Delete Button -->
                                        <button
                                            onclick={(e) =>
                                                handleDeleteCollection(
                                                    collection.id,
                                                    e,
                                                )}
                                            disabled={deletingCollectionId ===
                                                collection.id}
                                            class="absolute bottom-2 right-2 p-1.5 bg-white/80 hover:bg-red-50 rounded-lg border border-zinc-200/50 opacity-0 group-hover:opacity-100 transition-all hover:border-red-200 hover:text-red-600 disabled:opacity-50 z-10"
                                            title="Delete collection"
                                        >
                                            {#if deletingCollectionId === collection.id}
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
                                                >{String(i + 1).padStart(
                                                    3,
                                                    "0",
                                                )}</span
                                            >
                                            <div
                                                class="flex items-center gap-1.5"
                                            >
                                                <span
                                                    class="text-[10px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full"
                                                >
                                                    Collection
                                                </span>
                                            </div>
                                        </div>
                                        <h2
                                            class="text-base font-semibold tracking-tight mb-2 leading-snug line-clamp-2"
                                        >
                                            {collection.topic}
                                        </h2>
                                        <p
                                            class="text-zinc-500 text-xs font-light leading-relaxed mb-3"
                                        >
                                            {collection.metadata
                                                ?.totalResults || 0} unique items
                                            {#if (collection.searchCount ?? 0) > 1}
                                                <span class="text-zinc-400"
                                                    >• {collection.searchCount ??
                                                        0} saves</span
                                                >
                                            {/if}
                                        </p>
                                        <div
                                            class="flex items-center pt-3 border-t border-zinc-100 mt-auto"
                                        >
                                            <span class="text-xs text-zinc-400"
                                                >{formatDate(
                                                    new Date(
                                                        collection.updatedAt,
                                                    ).getTime(),
                                                )}</span
                                            >
                                        </div>
                                    </div>
                                {/each}
                            {/if}
                        </div>
                    {:else if activeTab === "docs"}
                        <div
                            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                        >
                            <!-- New Doc Card - Always First -->
                            <div
                                class="post-card bg-white rounded-xl p-4 border-2 border-dashed border-zinc-300 shadow-sm hover:shadow-xl hover:border-zinc-400 cursor-pointer group transition-all"
                                onclick={() => goto("/doc")}
                                role="button"
                                tabindex={0}
                                onkeydown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        goto("/doc");
                                    }
                                }}
                            >
                                <div
                                    class="flex items-center justify-between mb-3"
                                >
                                    <span
                                        class="font-mono text-xs text-zinc-300"
                                        >NEW</span
                                    >
                                </div>
                                <div
                                    class="flex flex-col items-center justify-center py-4"
                                >
                                    <div
                                        class="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-3 group-hover:bg-zinc-200 transition-colors"
                                    >
                                        <Icon
                                            icon="mdi:plus"
                                            class="text-xl text-zinc-400 group-hover:text-zinc-600 transition-colors"
                                        />
                                    </div>
                                    <h2
                                        class="text-sm font-semibold tracking-tight text-zinc-600 group-hover:text-zinc-900 transition-colors"
                                    >
                                        New Doc
                                    </h2>
                                    <p class="text-xs text-zinc-400 mt-1">
                                        Coming soon
                                    </p>
                                </div>
                            </div>

                            {#if isLoadingNotes}
                                <div
                                    class="col-span-full flex items-center justify-center py-12"
                                >
                                    <Icon
                                        icon="mdi:loading"
                                        class="text-2xl text-zinc-400 animate-spin"
                                    />
                                </div>
                            {:else if notes.length === 0}
                                <div
                                    class="col-span-full md:col-span-1 lg:col-span-1"
                                ></div>
                            {:else}
                                {#each notes as note, i (note.id)}
                                    <div
                                        class="post-card bg-white rounded-xl p-4 border border-zinc-200/70 shadow-sm hover:shadow-xl relative group cursor-pointer flex flex-col min-h-[140px]"
                                        onclick={() =>
                                            goto(`/doc?id=${note.id}`)}
                                        role="button"
                                        tabindex={0}
                                        onkeydown={(e) => {
                                            if (
                                                e.key === "Enter" ||
                                                e.key === " "
                                            ) {
                                                goto(`/doc?id=${note.id}`);
                                            }
                                        }}
                                    >
                                        <div
                                            class="flex items-center justify-between mb-3"
                                        >
                                            <span
                                                class="font-mono text-xs text-zinc-300"
                                                >{String(i + 1).padStart(
                                                    3,
                                                    "0",
                                                )}</span
                                            >
                                            <div
                                                class="flex items-center gap-1.5"
                                            >
                                                <span
                                                    class="text-[10px] text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-full"
                                                >
                                                    Doc
                                                </span>
                                            </div>
                                        </div>
                                        <h2
                                            class="text-base font-semibold tracking-tight mb-2 leading-snug line-clamp-2"
                                        >
                                            {note.title || "Untitled"}
                                        </h2>
                                        <p
                                            class="text-zinc-500 text-xs font-light leading-relaxed line-clamp-3 mb-3"
                                        >
                                            {note.content || "No content"}
                                        </p>
                                        <div
                                            class="flex items-center pt-3 border-t border-zinc-100 mt-auto"
                                        >
                                            <span class="text-xs text-zinc-400"
                                                >{formatDate(
                                                    new Date(
                                                        note.createdAt,
                                                    ).getTime(),
                                                )}</span
                                            >
                                        </div>
                                    </div>
                                {/each}
                            {/if}
                        </div>
                    {:else if activeTab === "bookmarks"}
                        <div
                            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                        >
                            {#if isLoadingBookmarks}
                                <div
                                    class="col-span-full flex items-center justify-center py-12"
                                >
                                    <Icon
                                        icon="mdi:loading"
                                        class="text-2xl text-zinc-400 animate-spin"
                                    />
                                </div>
                            {:else}
                                <!-- Add Bookmark Card - Always First -->
                                <div
                                    class="post-card bg-white rounded-xl p-4 border-2 border-dashed border-zinc-300 shadow-sm hover:shadow-xl hover:border-zinc-400 cursor-pointer group transition-all"
                                    onclick={() =>
                                        (showAddBookmarkModal = true)}
                                    role="button"
                                    tabindex={0}
                                    onkeydown={(e) => {
                                        if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                        ) {
                                            showAddBookmarkModal = true;
                                        }
                                    }}
                                >
                                    <div
                                        class="flex items-center justify-between mb-3"
                                    >
                                        <span
                                            class="font-mono text-xs text-zinc-300"
                                            >NEW</span
                                        >
                                    </div>
                                    <div
                                        class="flex flex-col items-center justify-center py-4"
                                    >
                                        <div
                                            class="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-3 group-hover:bg-zinc-200 transition-colors"
                                        >
                                            <Icon
                                                icon="mdi:plus"
                                                class="text-xl text-zinc-400 group-hover:text-zinc-600 transition-colors"
                                            />
                                        </div>
                                        <h2
                                            class="text-sm font-semibold tracking-tight text-zinc-600 group-hover:text-zinc-900 transition-colors"
                                        >
                                            Add Bookmark
                                        </h2>
                                        <p class="text-xs text-zinc-400 mt-1">
                                            Save a URL for later
                                        </p>
                                    </div>
                                </div>

                                {#each bookmarks as bookmark, i (bookmark.id)}
                                    <a
                                        href={bookmark.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="post-card bg-white rounded-xl p-4 border border-zinc-200/70 shadow-sm cursor-pointer hover:shadow-xl relative group flex flex-col min-h-[140px]"
                                    >
                                        <!-- Delete Button -->
                                        <button
                                            onclick={(e) =>
                                                handleDeleteBookmark(
                                                    bookmark.id,
                                                    e,
                                                )}
                                            disabled={deletingBookmarkId ===
                                                bookmark.id}
                                            class="absolute bottom-2 right-2 p-1.5 bg-white/80 hover:bg-red-50 rounded-lg border border-zinc-200/50 opacity-0 group-hover:opacity-100 transition-all hover:border-red-200 hover:text-red-600 disabled:opacity-50 z-10"
                                            title="Delete bookmark"
                                        >
                                            {#if deletingBookmarkId === bookmark.id}
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
                                                >{String(i + 1).padStart(
                                                    3,
                                                    "0",
                                                )}</span
                                            >
                                            <div
                                                class="flex items-center gap-1.5"
                                            >
                                                <span
                                                    class="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full"
                                                >
                                                    Bookmark
                                                </span>
                                            </div>
                                        </div>
                                        <div
                                            class="flex items-start gap-1.5 mb-2 flex-grow"
                                        >
                                            <h2
                                                class="text-base font-semibold tracking-tight leading-snug line-clamp-2 flex-1"
                                            >
                                                {bookmark.title || "Untitled"}
                                            </h2>
                                        </div>
                                        <p
                                            class="text-zinc-500 text-xs font-light leading-relaxed mb-3 line-clamp-2"
                                        >
                                            {bookmark.excerpt ||
                                                bookmark.url
                                                    .replace(/^https?:\/\//, "")
                                                    .split("/")[0]}
                                        </p>
                                        <div
                                            class="flex items-center pt-3 border-t border-zinc-100 mt-auto"
                                        >
                                            <span class="text-xs text-zinc-400"
                                                >{formatDate(
                                                    new Date(
                                                        bookmark.createdAt,
                                                    ).getTime(),
                                                )}</span
                                            >
                                        </div>
                                    </a>
                                {/each}
                            {/if}
                        </div>
                    {/if}
                </div>
            {:else if isInitialLoad}
                <div class="text-center py-16">
                    <div
                        class="inline-flex items-center justify-center w-16 h-16 bg-white/60 backdrop-blur rounded-2xl border border-zinc-200/50 mb-4"
                    >
                        <Icon
                            icon="mdi:loading"
                            class="text-zinc-400 text-3xl animate-spin"
                        />
                    </div>
                    <p class="text-zinc-500 text-sm">Loading...</p>
                </div>
            {:else}
                <!-- Empty State -->
                <div class="text-center py-16">
                    <div
                        class="inline-flex items-center justify-center w-16 h-16 bg-white/60 backdrop-blur rounded-2xl border border-zinc-200/50 mb-4"
                    >
                        <Icon
                            icon="mdi:history"
                            class="text-zinc-400 text-3xl"
                        />
                    </div>
                    <p class="text-zinc-500 text-sm">
                        No recent searches yet. Try searching for something!
                    </p>
                </div>
            {/if}
        </div>
    </main>

    <!-- Results Modal -->
    {#if currentModal.type === "search" && selectedSearchForModal}
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
                            {selectedSearchForModal.query}
                        </h2>
                        <p class="text-sm text-zinc-500 mt-1">
                            {selectedSearchForModal.totalResults} total results •
                            {selectedSearchForModal.engines.join(", ")}
                            {#if selectedSearchForModal.count > 1}
                                <span class="text-zinc-400"
                                    >• {selectedSearchForModal.count} visits</span
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
                                                icon="mdi:bookmark-plus"
                                                onclick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleAddBookmark(
                                                        result.title ||
                                                            "Untitled",
                                                        result.url,
                                                        result.content ||
                                                            result.snippet ||
                                                            "",
                                                    );
                                                }}
                                                class="text-zinc-400 hover:text-emerald-600 text-lg cursor-pointer transition-colors"
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
                                                icon="mdi:file-document-outline"
                                                onclick={(e) =>
                                                    handleOpenMarkdownPreview(
                                                        result.url,
                                                        e,
                                                    )}
                                                class="text-zinc-400 hover:text-blue-600 text-lg cursor-pointer transition-colors"
                                            />
                                            <div
                                                class="absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
                                            >
                                                <div
                                                    class="bg-zinc-900 text-white text-xs px-2 py-1 rounded shadow-lg"
                                                >
                                                    Create Doc
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
        open={currentModal.type === "options"}
        onClose={closeModal}
        title={selectedSearchForModal?.query || ""}
    >
        <div class="space-y-3">
            <p class="text-sm text-zinc-500 mb-4">
                What would you like to do with this search?
            </p>
            {#if !hasCollectionForQuery}
                <button
                    onclick={() =>
                        selectedSearchForModal &&
                        handleCreateCollection(selectedSearchForModal)}
                    disabled={isCreatingCollection}
                    class="w-full flex items-center gap-3 p-3 rounded-xl border border-zinc-200 hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                    <div
                        class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"
                    >
                        {#if isCreatingCollection}
                            <Icon
                                icon="mdi:loading"
                                class="text-blue-600 text-lg animate-spin"
                            />
                        {:else}
                            <Icon
                                icon="mdi:folder-plus-outline"
                                class="text-blue-600 text-lg"
                            />
                        {/if}
                    </div>
                    <div class="text-left">
                        <div class="font-medium text-sm">Create Collection</div>
                        <div class="text-xs text-zinc-400">
                            Save this topic for future reference
                        </div>
                    </div>
                </button>
            {/if}
            <button
                onclick={() => {
                    if (selectedSearchForModal) {
                        closeModal();
                        handleViewResults(selectedSearchForModal);
                    }
                }}
                class="w-full flex items-center gap-3 p-3 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
            >
                <div
                    class="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center"
                >
                    <Icon
                        icon="mdi:eye-outline"
                        class="text-zinc-600 text-lg"
                    />
                </div>
                <div class="text-left">
                    <div class="font-medium text-sm">View Results</div>
                    <div class="text-xs text-zinc-400">
                        See all cached results
                    </div>
                </div>
            </button>
            <button
                onclick={() => {
                    if (selectedSearchForModal) {
                        searchQuery = selectedSearchForModal.query;
                        closeModal();
                    }
                }}
                class="w-full flex items-center gap-3 p-3 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
            >
                <div
                    class="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center"
                >
                    <Icon icon="mdi:refresh" class="text-zinc-600 text-lg" />
                </div>
                <div class="text-left">
                    <div class="font-medium text-sm">Search Again</div>
                    <div class="text-xs text-zinc-400">
                        Run this search query again
                    </div>
                </div>
            </button>
        </div>
    </Modal>

    <!-- Create Collection Modal -->
    {#if showCreateCollectionModal}
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_click_events_have_key_events -->
        <div
            class="fixed inset-0 z-60 flex items-center justify-center px-4"
            onclick={() => {
                showCreateCollectionModal = false;
                newCollectionName = "";
            }}
            onkeydown={(e) =>
                e.key === "Escape" &&
                ((showCreateCollectionModal = false), (newCollectionName = ""))}
            role="dialog"
            aria-modal="true"
            tabindex="-1"
        >
            <div class="fixed inset-0 bg-black/40 backdrop-blur-sm"></div>
            <div
                class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onclick={(e) => e.stopPropagation()}
                role="document"
            >
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-semibold tracking-tight">
                            Create Collection
                        </h2>
                        <button
                            onclick={() => {
                                showCreateCollectionModal = false;
                                newCollectionName = "";
                            }}
                            class="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                            aria-label="Close"
                        >
                            <Icon
                                icon="mdi:close"
                                class="text-xl text-zinc-500"
                            />
                        </button>
                    </div>
                    <form
                        onsubmit={(e) => {
                            e.preventDefault();
                            handleCreateNewCollection();
                        }}
                    >
                        <div class="mb-4">
                            <label
                                for="collection-name"
                                class="block text-sm font-medium text-zinc-700 mb-2"
                            >
                                Collection Name
                            </label>
                            <input
                                type="text"
                                id="collection-name"
                                bind:value={newCollectionName}
                                placeholder="e.g., AI Research, Project Ideas..."
                                class="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
                                disabled={isCreatingNewCollection}
                                autofocus
                            />
                        </div>
                        <div class="flex gap-3">
                            <button
                                type="button"
                                onclick={() => {
                                    showCreateCollectionModal = false;
                                    newCollectionName = "";
                                }}
                                class="flex-1 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors"
                                disabled={isCreatingNewCollection}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!newCollectionName.trim() ||
                                    isCreatingNewCollection}
                                class="flex-1 px-4 py-3 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {#if isCreatingNewCollection}
                                    <Icon
                                        icon="mdi:loading"
                                        class="animate-spin"
                                    />
                                    Creating...
                                {:else}
                                    Create
                                {/if}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    {/if}

    <!-- Floating Footer -->
    <footer
        class="fixed bottom-6 left-6 right-6 z-40 pointer-events-none ui-scaled-footer"
        style="transform: scale({$uiScale}); transform-origin: bottom center;"
    >
        <div class="max-w-6xl mx-auto flex justify-center items-end">
            <div
                class="pointer-events-auto flex items-center gap-2 bg-white/70 backdrop-blur-xl rounded-xl border border-zinc-200/50 p-2 shadow-sm"
            >
                <a
                    href="https://github.com/hoipippeloi/research-agent"
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
{/if}

<!-- Add Bookmark Modal -->
{#if showAddBookmarkModal}
    <div
        class="fixed inset-0 z-[70] flex items-center justify-center p-4"
        onclick={() => (showAddBookmarkModal = false)}
        onkeydown={(e) => e.key === "Escape" && (showAddBookmarkModal = false)}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
    >
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div
            class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onclick={(e) => e.stopPropagation()}
            role="document"
        >
            <div class="p-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-semibold tracking-tight">
                        Add Bookmark
                    </h2>
                    <button
                        onclick={() => {
                            showAddBookmarkModal = false;
                            newBookmarkUrl = "";
                            newBookmarkTitle = "";
                            newBookmarkExcerpt = "";
                            newBookmarkCollectionId = null;
                            collectionSearchQuery = "";
                            showExcerptField = false;
                        }}
                        class="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                    >
                        <Icon icon="mdi:close" class="text-lg text-zinc-500" />
                    </button>
                </div>
                <form
                    onsubmit={(e) => {
                        e.preventDefault();
                        handleAddBookmarkFromModal();
                    }}
                >
                    <div class="mb-4">
                        <label
                            for="bookmark-url"
                            class="block text-sm font-medium text-zinc-700 mb-1"
                        >
                            URL <span class="text-red-500">*</span>
                        </label>
                        <input
                            id="bookmark-url"
                            type="url"
                            bind:value={newBookmarkUrl}
                            placeholder="https://example.com"
                            class="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                            autofocus
                        />
                    </div>
                    <div class="mb-4">
                        <label
                            for="bookmark-title"
                            class="block text-sm font-medium text-zinc-700 mb-1"
                        >
                            Title (optional)
                        </label>
                        <input
                            id="bookmark-title"
                            type="text"
                            bind:value={newBookmarkTitle}
                            placeholder="My bookmark"
                            class="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <!-- Excerpt Accordion -->
                    <div class="mb-4">
                        <button
                            type="button"
                            onclick={() =>
                                (showExcerptField = !showExcerptField)}
                            class="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
                        >
                            <Icon
                                icon={showExcerptField
                                    ? "mdi:chevron-down"
                                    : "mdi:chevron-right"}
                                class="text-base"
                            />
                            <span>Excerpt (optional)</span>
                            {#if newBookmarkExcerpt.trim()}
                                <span
                                    class="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded"
                                >
                                    has content
                                </span>
                            {/if}
                        </button>
                        {#if showExcerptField}
                            <div class="mt-2">
                                <textarea
                                    id="bookmark-excerpt"
                                    bind:value={newBookmarkExcerpt}
                                    placeholder="Add a description or excerpt..."
                                    rows="3"
                                    class="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                                ></textarea>
                            </div>
                        {/if}
                    </div>
                    <div class="mb-6">
                        <label
                            for="bookmark-collection"
                            class="block text-sm font-medium text-zinc-700 mb-1"
                        >
                            Collection (optional)
                        </label>
                        <div class="relative">
                            <div class="relative">
                                <Icon
                                    icon="mdi:folder-outline"
                                    class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                                />
                                <input
                                    id="bookmark-collection"
                                    type="text"
                                    bind:value={collectionSearchQuery}
                                    onfocus={() =>
                                        (showCollectionDropdown = true)}
                                    onblur={() =>
                                        setTimeout(
                                            () =>
                                                (showCollectionDropdown = false),
                                            200,
                                        )}
                                    placeholder={newBookmarkCollectionId
                                        ? collections.find(
                                              (c) =>
                                                  c.id ===
                                                  newBookmarkCollectionId,
                                          )?.topic || "Select collection"
                                        : "Search collections..."}
                                    class="w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {#if newBookmarkCollectionId}
                                    <button
                                        type="button"
                                        onclick={() => {
                                            newBookmarkCollectionId = null;
                                            collectionSearchQuery = "";
                                        }}
                                        class="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 rounded"
                                    >
                                        <Icon
                                            icon="mdi:close"
                                            class="text-zinc-400 text-sm"
                                        />
                                    </button>
                                {/if}
                            </div>
                            {#if showCollectionDropdown && filteredCollections.length > 0}
                                <div
                                    class="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                                >
                                    {#each filteredCollections as collection (collection.id)}
                                        <button
                                            type="button"
                                            onclick={() => {
                                                newBookmarkCollectionId =
                                                    collection.id;
                                                collectionSearchQuery = "";
                                                showCollectionDropdown = false;
                                            }}
                                            class="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 flex items-center gap-2 {newBookmarkCollectionId ===
                                            collection.id
                                                ? 'bg-blue-50 text-blue-700'
                                                : ''}"
                                        >
                                            <Icon
                                                icon="mdi:folder"
                                                class="text-zinc-400 {newBookmarkCollectionId ===
                                                collection.id
                                                    ? 'text-blue-500'
                                                    : ''}"
                                            />
                                            <span class="truncate"
                                                >{collection.topic}</span
                                            >
                                            {#if newBookmarkCollectionId === collection.id}
                                                <Icon
                                                    icon="mdi:check"
                                                    class="ml-auto text-blue-600"
                                                />
                                            {/if}
                                        </button>
                                    {/each}
                                </div>
                            {:else if showCollectionDropdown && collectionSearchQuery && filteredCollections.length === 0}
                                <div
                                    class="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg p-3 text-sm text-zinc-500"
                                >
                                    No collections found
                                </div>
                            {/if}
                        </div>
                        {#if newBookmarkCollectionId}
                            <div
                                class="mt-2 flex items-center gap-1 text-xs text-blue-600"
                            >
                                <Icon icon="mdi:folder" class="text-sm" />
                                <span
                                    >Will be saved to: {collections.find(
                                        (c) => c.id === newBookmarkCollectionId,
                                    )?.topic}</span
                                >
                            </div>
                        {/if}
                    </div>
                    <div class="flex gap-3">
                        <button
                            type="button"
                            onclick={() => {
                                showAddBookmarkModal = false;
                                newBookmarkUrl = "";
                                newBookmarkTitle = "";
                                newBookmarkExcerpt = "";
                                newBookmarkCollectionId = null;
                                collectionSearchQuery = "";
                                showExcerptField = false;
                            }}
                            class="flex-1 px-4 py-2 border border-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!newBookmarkUrl.trim() ||
                                isAddingBookmark}
                            class="flex-1 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {#if isAddingBookmark}
                                <Icon icon="mdi:loading" class="animate-spin" />
                                Adding...
                            {:else}
                                Add Bookmark
                            {/if}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
{/if}

<style>
    .ui-scaled,
    .ui-scaled-header,
    .ui-scaled-footer {
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
</style>
