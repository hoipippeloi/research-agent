<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import Header from "$lib/components/Header.svelte";
    import MarkdownEditor from "$lib/components/MarkdownEditor.svelte";
    import { uiScale } from "$lib/stores/uiScale";
    import Icon from "@iconify/svelte";
    import { toast } from "svelte-sonner";
    import type { Collection, SavedResult } from "$lib/db/schema";

    // State for document
    let documentId = $state<number | null>(null);
    let documentTitle = $state("");
    let documentContent = $state("");
    let isLoading = $state(false);
    let isSaving = $state(false);

    // State for collections
    let collections = $state<Collection[]>([]);
    let isLoadingCollections = $state(false);
    let selectedCollectionId = $state<number | null>(null);
    let showSaveModal = $state(false);
    let fromQuery = $state<string | null>(null);

    // Derived values
    let wordCount = $derived(
        documentContent.trim() ? documentContent.trim().split(/\s+/).length : 0,
    );
    let charCount = $derived(documentContent.length);
    let isNewDocument = $derived(documentId === null);
    let currentCollection = $derived(
        selectedCollectionId
            ? collections.find((c) => c.id === selectedCollectionId)
            : null,
    );

    // Get current user email from localStorage
    let currentUserEmail = $state<string | null>(null);

    // Load user email from localStorage on mount
    onMount(() => {
        const storedEmail = localStorage.getItem("user_email");
        if (storedEmail) {
            currentUserEmail = storedEmail;
        } else {
            // If no email, redirect to home page
            goto("/");
        }
    });

    // Load document if ID is provided in URL params
    $effect(() => {
        const id = $page.url.searchParams.get("id");
        const urlParam = $page.url.searchParams.get("url");
        const fromQueryParam = $page.url.searchParams.get("fromQuery");

        // Store fromQuery for back navigation
        if (fromQueryParam) {
            fromQuery = fromQueryParam;
        }

        if (id) {
            documentId = parseInt(id);
            if (!isNaN(documentId)) {
                loadDocument();
            }
        } else if (urlParam && !documentContent) {
            // If URL parameter exists and no content loaded, fetch markdown from URL
            loadMarkdownFromUrl(urlParam);
        }
    });

    // Load collections on mount
    $effect(() => {
        if (currentUserEmail) {
            loadCollections();
        }
    });

    async function loadMarkdownFromUrl(url: string) {
        if (!currentUserEmail) return;

        try {
            isLoading = true;
            const response = await fetch(
                `/api/fetch-markdown?url=${encodeURIComponent(url)}`,
            );

            if (response.ok) {
                const data = await response.json();
                documentTitle = data.title || "Untitled Document";
                documentContent = data.content || "";
                documentId = null; // Ensure this is treated as a new document
            } else {
                const error = await response.json();
                toast.error("Failed to fetch markdown", {
                    description:
                        error.error || "Could not load content from URL",
                });
            }
        } catch (error) {
            console.error("Error loading markdown from URL:", error);
            toast.error("Failed to fetch markdown", {
                description: "An unexpected error occurred",
            });
        } finally {
            isLoading = false;
        }
    }

    async function loadDocument() {
        if (!documentId || !currentUserEmail) return;

        try {
            isLoading = true;
            const response = await fetch(
                `/api/documents/${documentId}?userEmail=${encodeURIComponent(currentUserEmail)}`,
            );

            if (response.ok) {
                const doc: SavedResult = await response.json();
                documentTitle = doc.title || "";
                documentContent = doc.content || "";
                selectedCollectionId = doc.collectionId;
            } else {
                const error = await response.json();
                toast.error("Failed to load document", {
                    description: error.error || "Could not load document",
                });
                // Navigate back to home if document not found
                goto("/?tab=docs");
            }
        } catch (error) {
            console.error("Error loading document:", error);
            toast.error("Failed to load document", {
                description: "An unexpected error occurred",
            });
        } finally {
            isLoading = false;
        }
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
            }
        } catch (error) {
            console.error("Error loading collections:", error);
            toast.error("Failed to load collections", {
                description: "Could not load collections",
            });
        } finally {
            isLoadingCollections = false;
        }
    }

    function handleSaveClick() {
        if (!documentTitle.trim()) {
            toast.error("Title required", {
                description: "Please enter a title for your document",
            });
            return;
        }
        if (!documentContent.trim()) {
            toast.error("Content required", {
                description: "Please add some content to your document",
            });
            return;
        }
        showSaveModal = true;
    }

    async function handleSaveToCollection() {
        if (!currentUserEmail) {
            toast.error("Not authenticated", {
                description: "Please log in to save documents",
            });
            return;
        }

        try {
            isSaving = true;
            const url = documentId
                ? `/api/documents/${documentId}`
                : "/api/documents";
            const method = documentId ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: documentTitle,
                    content: documentContent,
                    userEmail: currentUserEmail,
                    collectionId: selectedCollectionId,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                toast.success(
                    documentId ? "Document updated!" : "Document saved!",
                    {
                        description: selectedCollectionId
                            ? "Document has been saved to the collection"
                            : "Document has been saved",
                    },
                );

                // Update document ID if it's a new document
                if (!documentId && data.document?.id) {
                    documentId = data.document.id;
                    // Update URL to reflect the document ID
                    goto(`/doc?id=${documentId}`, { replaceState: true });
                }

                showSaveModal = false;
            } else {
                const error = await response.json();
                toast.error("Failed to save document", {
                    description: error.error || "Could not save document",
                });
            }
        } catch (error) {
            console.error("Error saving document:", error);
            toast.error("Failed to save document", {
                description: "An unexpected error occurred",
            });
        } finally {
            isSaving = false;
        }
    }

    function handleClear() {
        documentTitle = "";
        documentContent = "";
        selectedCollectionId = null;
    }

    function handleBack() {
        // If we came from a search modal, go back to it
        if (fromQuery) {
            goto(
                `/?modal=search&query=${encodeURIComponent(fromQuery)}&tab=searches`,
            );
        } else {
            goto("/?tab=docs");
        }
    }

    function formatDate(date: Date): string {
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }).format(date);
    }
</script>

<svelte:head>
    <title
        >{isNewDocument ? "New Document" : documentTitle || "Edit Document"} - Research
        Agent</title
    >
</svelte:head>

<div class="animated-bg">
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>
    <div class="blob blob-3"></div>
</div>
<div class="fixed inset-0 paper-texture pointer-events-none z-0"></div>

<Header />

<main class="relative z-10 pt-28 pb-8 px-6 h-screen">
    <div
        class="max-w-6xl mx-auto h-[calc(100vh-8rem)] ui-scaled"
        style="transform: scale({$uiScale}); transform-origin: top center;"
    >
        <!-- Modal-like Container -->
        <div
            class="bg-white rounded-2xl shadow-2xl w-full h-full overflow-hidden flex flex-col"
        >
            <!-- Header -->
            <div class="sticky top-0 bg-white z-10">
                <!-- Main Header -->
                <div
                    class="border-b border-zinc-200 px-6 py-2 flex items-center justify-between"
                >
                    <div class="flex items-center gap-4">
                        <button
                            onclick={handleBack}
                            class="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                            aria-label="Go back"
                        >
                            <Icon
                                icon="mdi:arrow-left"
                                class="text-xl text-zinc-600"
                            />
                        </button>
                        <div>
                            <h2 class="text-xl font-semibold tracking-tight">
                                {isNewDocument
                                    ? "New Document"
                                    : "Edit document"}
                            </h2>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        {#if !isNewDocument}
                            <span class="text-xs text-zinc-400">
                                Last updated: {formatDate(new Date())}
                            </span>
                        {/if}
                    </div>
                </div>
                <!-- Subheader with Collection Label -->
                {#if !isNewDocument}
                    <div
                        class="border-b border-zinc-200 px-6 py-2 flex items-center"
                    >
                        <span
                            class="text-[10px] font-medium px-2 py-0.5 rounded-full {currentCollection
                                ? 'text-amber-600 bg-amber-50'
                                : 'text-zinc-500 bg-zinc-100'}"
                        >
                            {currentCollection
                                ? currentCollection.topic
                                : "No collection"}
                        </span>
                    </div>
                {/if}
            </div>

            <!-- Title Input -->
            <div class="px-6 py-4 border-b border-zinc-200">
                <label class="text-xs text-zinc-500 font-medium mb-2 block"
                    >Title</label
                >
                <input
                    type="text"
                    bind:value={documentTitle}
                    placeholder="Document title..."
                    class="w-full text-2xl font-semibold tracking-tight border-none outline-none placeholder-zinc-300 text-zinc-800"
                />
            </div>

            <!-- Content Area -->
            {#if isLoading}
                <div class="flex-1 flex items-center justify-center">
                    <div class="text-center">
                        <Icon
                            icon="mdi:loading"
                            class="text-4xl text-zinc-400 animate-spin"
                        />
                        <p class="text-zinc-500 mt-2">Loading document...</p>
                    </div>
                </div>
            {:else}
                <div class="flex-1 overflow-hidden">
                    <MarkdownEditor
                        bind:value={documentContent}
                        placeholder="Start writing your document..."
                    />
                </div>
            {/if}

            <!-- Footer -->
            <div
                class="sticky bottom-0 bg-white border-t border-zinc-200 px-6 py-3 flex items-center justify-between"
            >
                <span class="text-xs text-zinc-400">
                    {wordCount} words • {charCount} characters
                </span>
                <div class="flex items-center gap-2">
                    <button
                        onclick={handleClear}
                        class="px-4 py-2 text-zinc-700 hover:bg-zinc-100 rounded-lg text-sm font-medium transition-colors"
                    >
                        Clear
                    </button>
                    <button
                        onclick={handleSaveClick}
                        class="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2"
                    >
                        <Icon icon="mdi:content-save" class="text-base" />
                        Save Document
                    </button>
                </div>
            </div>
        </div>
    </div>
</main>

<!-- Save Modal -->
{#if showSaveModal}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center"
        onclick={() => (showSaveModal = false)}
        onkeydown={(e) => e.key === "Escape" && (showSaveModal = false)}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
    >
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div
            class="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
        >
            <div class="p-6">
                <!-- Modal Header -->
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-semibold tracking-tight">
                        Save to Collection
                    </h2>
                    <button
                        onclick={() => (showSaveModal = false)}
                        class="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                        aria-label="Close modal"
                    >
                        <Icon icon="mdi:close" class="text-xl text-zinc-500" />
                    </button>
                </div>

                <!-- Collection Selection -->
                <div class="mb-6">
                    <p class="text-sm text-zinc-600 mb-3">
                        Choose a collection to save your document to, or save
                        without a collection.
                    </p>

                    {#if isLoadingCollections}
                        <div class="flex items-center justify-center py-8">
                            <Icon
                                icon="mdi:loading"
                                class="text-2xl text-zinc-400 animate-spin"
                            />
                        </div>
                    {:else if collections.length === 0}
                        <div class="text-center py-8 bg-zinc-50 rounded-lg">
                            <Icon
                                icon="mdi:folder-outline"
                                class="text-3xl text-zinc-300 mb-2"
                            />
                            <p class="text-sm text-zinc-500">
                                No collections yet
                            </p>
                            <p class="text-xs text-zinc-400 mt-1">
                                You can still save your document without a
                                collection
                            </p>
                        </div>
                    {:else}
                        <div class="space-y-2 max-h-64 overflow-y-auto">
                            <button
                                onclick={() => (selectedCollectionId = null)}
                                class="w-full p-3 rounded-lg border-2 text-left transition-all {selectedCollectionId ===
                                null
                                    ? 'border-zinc-900 bg-zinc-50'
                                    : 'border-zinc-200 hover:border-zinc-300'}"
                            >
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center"
                                    >
                                        <Icon
                                            icon="mdi:folder-outline"
                                            class="text-lg text-zinc-600"
                                        />
                                    </div>
                                    <div>
                                        <div class="font-medium text-sm">
                                            No Collection
                                        </div>
                                        <div class="text-xs text-zinc-400">
                                            Save without organizing
                                        </div>
                                    </div>
                                </div>
                            </button>

                            {#each collections as collection (collection.id)}
                                <button
                                    onclick={() =>
                                        (selectedCollectionId = collection.id)}
                                    class="w-full p-3 rounded-lg border-2 text-left transition-all {selectedCollectionId ===
                                    collection.id
                                        ? 'border-zinc-900 bg-zinc-50'
                                        : 'border-zinc-200 hover:border-zinc-300'}"
                                >
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center"
                                        >
                                            <Icon
                                                icon="mdi:folder"
                                                class="text-lg text-indigo-600"
                                            />
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <div class="font-medium text-sm">
                                                {collection.topic}
                                            </div>
                                            {#if collection.description}
                                                <div
                                                    class="text-xs text-zinc-400 truncate"
                                                >
                                                    {collection.description}
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>

                <!-- Actions -->
                <div class="flex gap-3">
                    <button
                        onclick={() => (showSaveModal = false)}
                        class="flex-1 px-4 py-2.5 text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onclick={handleSaveToCollection}
                        disabled={isSaving}
                        class="flex-1 px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {#if isSaving}
                            <Icon
                                icon="mdi:loading"
                                class="text-base animate-spin"
                            />
                            <span>Saving...</span>
                        {:else}
                            <Icon icon="mdi:check" class="text-base" />
                            <span>Save Document</span>
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    /* GitHub Dark Theme for Carta Markdown Editor */
    :global(.carta-theme__github) {
        --background: #0d1117;
        --background-light: #161b22;
        --border: #2b3138;
        --accent: #1f6feb;
    }

    /* Core Editor Styles */
    :global(.carta-theme__github.carta-editor) {
        background-color: #ffffff;
        border: none;
        border-radius: 0;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    :global(.carta-theme__github.carta-editor:focus-within) {
        outline: none;
    }

    :global(.carta-theme__github.carta-editor .carta-wrapper) {
        padding: 1rem;
        flex-grow: 1;
        height: 100%;
        overflow: hidden;
    }

    :global(.carta-theme__github.carta-editor .carta-container) {
        height: 100%;
    }

    :global(.carta-theme__github.carta-editor .carta-input-wrapper) {
        height: 100%;
        overflow: auto;
    }

    :global(.carta-theme__github.carta-editor .carta-input),
    :global(.carta-theme__github.carta-editor .carta-renderer) {
        height: 100%;
        overflow: auto;
    }

    :global(.carta-theme__github.carta-editor .carta-font-code) {
        font-family: var(--font-fira-code);
        caret-color: #24292f;
        font-size: 0.8rem;
    }

    /* Toolbar Styles */
    :global(.carta-theme__github.carta-editor .carta-toolbar) {
        height: 2.5rem;
        background-color: #f6f8fa;
        border-top-left-radius: 0;
        border-top-right-radius: 0;
    }

    :global(.carta-theme__github.carta-editor .carta-toolbar .carta-icon) {
        width: 2rem;
        height: 2rem;
    }

    :global(
        .carta-theme__github.carta-editor .carta-toolbar .carta-icon:hover
    ) {
        color: #24292f;
        background-color: #f3f4f6;
    }

    :global(.carta-theme__github.carta-editor .carta-toolbar-left button),
    :global(.carta-theme__github.carta-editor .carta-toolbar-right),
    :global(.carta-theme__github.carta-editor .carta-filler) {
        border-bottom: none;
    }

    :global(
        .carta-theme__github.carta-editor .carta-toolbar-left > *:first-child
    ) {
        border-top-left-radius: 0;
    }

    :global(.carta-theme__github.carta-editor .carta-toolbar-left > *) {
        padding-left: 1rem;
        padding-right: 1rem;
        font-size: 0.95rem;
    }

    :global(.carta-theme__github.carta-editor .carta-toolbar-left button) {
        height: 100%;
    }

    :global(
        .carta-theme__github.carta-editor .carta-toolbar-left .carta-active
    ) {
        background-color: #ffffff;
        color: #24292f;
        border-right: 1px solid #d0d7de;
        border-bottom: 1px solid #ffffff;
    }

    :global(
        .carta-theme__github.carta-editor
            .carta-toolbar-left
            .carta-active:not(:first-child)
    ) {
        border-left: 1px solid #d0d7de;
    }

    :global(.carta-theme__github.carta-editor .carta-toolbar-right) {
        padding-right: 12px;
    }

    /* Icons Menu */
    :global(.carta-theme__github.carta-editor .carta-icons-menu) {
        padding: 8px;
        border: 1px solid #d0d7de;
        border-radius: 6px;
        min-width: 180px;
        background: #ffffff;
    }

    :global(
        .carta-theme__github.carta-editor .carta-icons-menu .carta-icon-full
    ) {
        padding-left: 6px;
        padding-right: 6px;
        margin-top: 2px;
    }

    :global(
        .carta-theme__github.carta-editor
            .carta-icons-menu
            .carta-icon-full:first-child
    ) {
        margin-top: 0;
    }

    :global(
        .carta-theme__github.carta-editor
            .carta-icons-menu
            .carta-icon-full:hover
    ) {
        color: white;
        background-color: #2b3138;
    }

    :global(
        .carta-theme__github.carta-editor
            .carta-icons-menu
            .carta-icon-full
            span
    ) {
        margin-left: 6px;
        color: white;
        font-size: 0.85rem;
    }

    /* Emoji Plugin */
    :global(.carta-theme__github.carta-emoji) {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-start;
        width: 19rem;
        max-height: 14rem;
        overflow-x: auto;
        overflow-y: auto;
        border-radius: 4px;
        font-family: inherit;
        background-color: #ffffff;
        word-break: break-word;
        scroll-padding: 6px;
    }

    :global(.carta-theme__github.carta-emoji button) {
        background: #f6f8fa;
        cursor: pointer;
        display: inline-block;
        border-radius: 4px;
        border: 0;
        padding: 0;
        margin: 0.175rem;
        min-width: 2rem;
        height: 2rem;
        font-size: 1.2rem;
        line-height: 100%;
        text-align: center;
        white-space: nowrap;
    }

    :global(.carta-theme__github.carta-emoji button:hover),
    :global(.carta-theme__github.carta-emoji button.carta-active) {
        background: #f3f4f6;
    }

    /* Slash Plugin */
    :global(.carta-theme__github.carta-slash) {
        width: 18rem;
        max-height: 14rem;
        overflow-y: scroll;
        border-radius: 4px;
        font-family: inherit;
        background-color: #ffffff;
        padding: 6px;
        scroll-padding: 6px;
    }

    :global(.carta-theme__github.carta-slash span) {
        width: fit-content;
    }

    :global(.carta-theme__github.carta-slash button) {
        background: none;
        width: 100%;
        padding: 10px;
        border: 0;
        border-radius: 4px;
    }

    :global(.carta-theme__github.carta-slash .carta-slash-group) {
        padding: 0 4px 0 4px;
        margin-bottom: 4px;
        font-size: 0.8rem;
    }

    :global(.carta-theme__github.carta-slash button.carta-active),
    :global(.carta-theme__github.carta-slash button:hover) {
        background: #f6f8fa;
        cursor: pointer;
    }

    :global(.carta-theme__github.carta-slash .carta-snippet-title) {
        font-size: 0.85rem;
        font-weight: 600;
    }

    :global(.carta-theme__github.carta-slash .carta-snippet-description) {
        font-size: 0.8rem;
        text-overflow: ellipsis;
    }

    /* Shiki Syntax Highlighting for Dark Mode */
    :global(html.dark .carta-theme__github .shiki),
    :global(html.dark .carta-theme__github .shiki span) {
        color: var(--shiki-dark) !important;
    }
</style>
