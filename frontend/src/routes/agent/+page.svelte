<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { browser } from "$app/environment";
    import Icon from "@iconify/svelte";
    import Header from "$lib/components/Header.svelte";
    import MarkdownEditor from "$lib/components/MarkdownEditor.svelte";
    import { uiScale } from "$lib/stores/uiScale";
    import { toast } from "svelte-sonner";
    import type { Collection, SavedResult } from "$lib/db/schema";
    import BirdsFlocking from "$lib/components/BirdsFlocking.svelte";

    // ============================================================
    // DOCUMENT STATE
    // ============================================================
    let documentId = $state<number | null>(null);
    let documentTitle = $state("");
    let documentContent = $state("");
    let isLoading = $state(false);
    let isSaving = $state(false);

    // ============================================================
    // COLLECTION STATE
    // ============================================================
    let collections = $state<Collection[]>([]);
    let isLoadingCollections = $state(false);
    let selectedCollectionId = $state<number | null>(null);
    let showSaveModal = $state(false);
    let fromQuery = $state<string | null>(null);

    // ============================================================
    // AGENT STATE
    // ============================================================
    // State for Page Agent (using any to avoid SSR issues with dynamic imports)
    // Agent state
    let showAgentPanel = $state(false);
    let agentLoading = $state(false);
    let agentInput = $state("");
    let agentMessages = $state<Array<{ role: string; content: string }>>([]);
    let agentStreamingContent = $state("");
    let agentStreamingIndex = $state(-1);
    let abortController = $state<AbortController | null>(null);

    // Agent settings
    let agentFormat = $state("blog");
    let agentTone = $state("professional");
    let agentStyle = $state("concise");

    // ============================================================
    // COMPUTED VALUES
    // ============================================================
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

    // ============================================================
    // USER CONTEXT
    // ============================================================
    let currentUserEmail = $state<string | null>(null);

    // ============================================================
    // AGENT INITIALIZATION
    // ============================================================

    /**
     * Clears the agent chat history.
     */
    function clearAgentChat() {
        agentMessages = [];
    }

    /**
     * Sends user input to the LLM gateway with streaming response support.
     */
    async function sendToAgent() {
        if (!agentInput.trim() || agentLoading) return;

        const userMessage = agentInput.trim();
        agentInput = "";
        agentLoading = true;
        agentStreamingContent = "";

        // Create abort controller
        abortController = new AbortController();

        // Add user message to chat
        agentMessages = [
            ...agentMessages,
            { role: "user", content: userMessage },
        ];

        // Add placeholder for assistant response
        const assistantIndex = agentMessages.length;
        agentStreamingIndex = assistantIndex;
        agentMessages = [...agentMessages, { role: "assistant", content: "" }];

        try {
            // Determine system prompt based on whether there's content
            const hasContent = documentContent.trim().length > 0;

            const systemPrompt = hasContent
                ? `You are a helpful writing assistant. The user has existing content that they want help with. Your role is to help them rewrite, repurpose, or improve their content.

Format preference: ${agentFormat}
Tone preference: ${agentTone}
Style preference: ${agentStyle}

Current document title: ${documentTitle || "Untitled"}
Current document content:
${documentContent}

Provide specific, actionable suggestions immediately. When suggesting rewrites, show the before and after clearly.`
                : `You are a helpful writing assistant. The user wants to create new content or get help with writing tasks. Your role is to help them write about topics, summarize text, or generate ideas.

Format preference: ${agentFormat}
Tone preference: ${agentTone}
Style preference: ${agentStyle}

Be creative, helpful, and provide well-structured content immediately.`;

            const messages = [
                { role: "system", content: systemPrompt },
                ...agentMessages.slice(0, -1), // Exclude the empty assistant message
            ];

            const response = await fetch(
                "https://hoi-llm-gateway.up.railway.app/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: "qwen3.5-4b",
                        messages,
                        temperature: 0.7,
                        max_tokens: 2048,
                        stream: true,
                    }),
                    signal: abortController?.signal,
                },
            );

            if (!response.ok) {
                throw new Error(`LLM gateway error: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("No response body");
            }

            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.trim() === "") continue;
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6);
                        if (data === "[DONE]") continue;

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;
                            if (content) {
                                agentStreamingContent += content;
                                // Update the assistant message in real-time
                                agentMessages = agentMessages.map((msg, i) =>
                                    i === assistantIndex
                                        ? {
                                              ...msg,
                                              content: agentStreamingContent,
                                          }
                                        : msg,
                                );
                            }
                        } catch (e) {
                            console.warn("Failed to parse SSE data:", data);
                        }
                    }
                }
            }

            // Ensure final content is set
            if (agentStreamingContent.trim()) {
                agentMessages = agentMessages.map((msg, i) =>
                    i === assistantIndex
                        ? { ...msg, content: agentStreamingContent }
                        : msg,
                );
            } else {
                // Remove empty assistant message if no content was received
                agentMessages = agentMessages.slice(0, -1);
                throw new Error("No content received from the LLM");
            }
        } catch (error) {
            console.error("Agent error:", error);

            // Replace the empty assistant message with error message
            agentMessages = agentMessages.map((msg, i) =>
                i === assistantIndex
                    ? {
                          role: "assistant",
                          content:
                              "Sorry, I encountered an error. Please try again.",
                      }
                    : msg,
            );

            toast.error("Agent error", {
                description:
                    error instanceof Error
                        ? error.message
                        : "Failed to get response from agent",
            });
        } finally {
            agentLoading = false;
            agentStreamingContent = "";
            agentStreamingIndex = -1;
            abortController = null;
        }
    }

    /**
     * Aborts the current agent request.
     */
    function abortAgent() {
        if (abortController) {
            abortController.abort();
            abortController = null;
            agentLoading = false;
            agentStreamingContent = "";
            agentStreamingIndex = -1;

            // Remove the empty assistant message if it exists
            if (
                agentMessages.length > 0 &&
                agentMessages[agentMessages.length - 1]?.content === ""
            ) {
                agentMessages = agentMessages.slice(0, -1);
            }
        }
    }

    /**
     * Inserts agent-generated markdown into the main document editor.
     */
    function insertIntoEditor(content: string) {
        if (documentContent.trim()) {
            documentContent += "\n\n" + content;
        } else {
            documentContent = content;
        }
        toast.success("Content inserted", {
            description: "Agent response has been added to your document",
        });
    }

    /**
     * Toggles the agent panel visibility.
     * The panel provides AI assistance for document editing.
     */
    function toggleAgentPanel() {
        showAgentPanel = !showAgentPanel;
    }

    // ============================================================
    // URL PARAMETERS & ROUTING
    // ============================================================
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

    // ============================================================
    // LIFECYCLE
    // ============================================================
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

    // ============================================================
    // DATA LOADING FUNCTIONS
    // ============================================================
    /**
     * Loads markdown content from a URL parameter.
     * Used when opening documents from external sources.
     */
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

    /**
     * Loads an existing document from the database.
     */
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

    /**
     * Loads available collections for the save modal.
     */
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

    // ============================================================
    // USER ACTIONS
    // ============================================================
    /**
     * Opens the save modal dialog.
     */
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

    /**
     * Saves the document to a collection.
     * Creates new or updates existing document.
     */
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

    /**
     * Clears the document content.
     */
    function handleClear() {
        documentTitle = "";
        documentContent = "";
        selectedCollectionId = null;
    }

    /**
     * Navigates back to the previous page or collections.
     */
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

    /**
     * Formats a date for display.
     */
    function formatDate(date: Date): string {
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }).format(date);
    }
</script>

<svelte:head>
    <title>{documentTitle || "Document Editor"} - Agent</title>
    <meta name="description" content="AI-powered document editor" />
</svelte:head>

<!-- ============================================================
     BACKGROUND EFFECTS LAYER
     Contains animated blobs and paper texture overlay
     ============================================================ -->
<div class="animated-bg" aria-hidden="true">
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>
    <div class="blob blob-3"></div>
</div>
<div
    class="fixed inset-0 paper-texture pointer-events-none z-0"
    aria-hidden="true"
></div>

<!-- ============================================================
     GLOBAL NAVIGATION HEADER
     ============================================================ -->
<Header />

<!-- ============================================================
     CONTENT WRAPPER
     Flex container to enable drawer push layout
     ============================================================ -->
<div class="flex h-screen overflow-hidden">
    <!-- ============================================================
         MAIN CONTENT AREA
         Primary container for the document editor interface
         ============================================================ -->
    <main
        id="main-content"
        class="relative z-10 flex-1 pt-28 pb-8 px-6 overflow-y-auto transition-all duration-300 ease-in-out"
        role="main"
        aria-label="Document Editor"
        data-section="main-content"
    >
        <div
            class="max-w-6xl mx-auto h-[calc(100vh-8rem)] ui-scaled"
            style="transform: scale({$uiScale}); transform-origin: top center;"
            data-section="editor-wrapper"
        >
            <!-- ============================================================
             EDITOR CONTAINER
             The main white card containing all editor components
             ============================================================ -->
            <article
                id="document-editor"
                class="bg-white rounded-2xl shadow-2xl w-full h-full overflow-hidden flex flex-col"
                data-section="editor-container"
                data-component="document-editor"
                aria-label="Document Editor Panel"
            >
                <!-- ============================================================
                 EDITOR HEADER
                 Contains navigation, title display, and metadata
                 ============================================================ -->
                <header
                    class="sticky top-0 bg-white z-10"
                    data-section="editor-header"
                    data-component="editor-header"
                >
                    <!-- Main Header Row: Navigation + Document Title -->
                    <div
                        class="border-b border-zinc-200 px-6 py-2 flex items-center justify-between"
                        data-section="header-main"
                    >
                        <!-- Navigation Group -->
                        <div
                            class="flex items-center gap-4"
                            data-group="navigation"
                        >
                            <button
                                id="btn-back"
                                onclick={handleBack}
                                class="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                                aria-label="Go back to previous page"
                                data-action="navigate-back"
                                data-component="back-button"
                            >
                                <Icon
                                    icon="mdi:arrow-left"
                                    class="text-xl text-zinc-600"
                                    aria-hidden="true"
                                />
                            </button>
                            <div data-component="document-type-indicator">
                                <h2
                                    class="text-xl font-semibold tracking-tight"
                                    data-role="document-type"
                                >
                                    {isNewDocument
                                        ? "New Document"
                                        : "Edit Document"}
                                </h2>
                            </div>
                        </div>

                        <!-- Metadata Group -->
                        <div
                            class="flex items-center gap-3"
                            data-group="metadata"
                        >
                            {#if !isNewDocument}
                                <span
                                    class="text-xs text-zinc-400"
                                    data-component="last-updated"
                                    data-state="existing-document"
                                >
                                    Last updated: {formatDate(new Date())}
                                </span>
                            {/if}
                        </div>
                    </div>

                    <!-- Subheader: Collection Label (existing documents only) -->
                    {#if !isNewDocument}
                        <div
                            class="border-b border-zinc-200 px-6 py-2 flex items-center"
                            data-section="header-subheader"
                            data-component="collection-indicator"
                        >
                            <span
                                id="collection-badge"
                                class="text-[10px] font-medium px-2 py-0.5 rounded-full {currentCollection
                                    ? 'text-[#018790] bg-[#00b7b5]/10'
                                    : 'text-zinc-500 bg-zinc-100'}"
                                data-collection-id={selectedCollectionId}
                                data-collection-name={currentCollection?.topic ||
                                    "none"}
                                aria-label="Document collection: {currentCollection?.topic ||
                                    'No collection'}"
                            >
                                {currentCollection
                                    ? currentCollection.topic
                                    : "No collection"}
                            </span>
                        </div>
                    {/if}
                </header>

                <!-- ============================================================
                 TITLE INPUT SECTION
                 Editable document title
                 ============================================================ -->
                <section
                    id="title-section"
                    class="px-6 py-4 border-b border-zinc-200"
                    data-section="title-input"
                    data-component="title-section"
                    aria-label="Document Title"
                >
                    <label
                        for="document-title"
                        class="text-xs text-zinc-500 font-medium mb-2 block"
                        data-role="field-label"
                    >
                        Title
                    </label>
                    <input
                        id="document-title"
                        type="text"
                        bind:value={documentTitle}
                        placeholder="Document title..."
                        class="w-full text-2xl font-semibold tracking-tight border-none outline-none placeholder-zinc-300 text-zinc-800"
                        data-component="title-input"
                        data-field="document-title"
                        aria-label="Document title"
                        aria-describedby="title-hint"
                    />
                    <span id="title-hint" class="sr-only"
                        >Enter a title for your document</span
                    >
                </section>

                <!-- ============================================================
                 CONTENT EDITOR SECTION
                 Main markdown editing area
                 ============================================================ -->
                <section
                    id="content-section"
                    class="flex-1 overflow-hidden"
                    data-section="content-editor"
                    data-component="markdown-section"
                    aria-label="Document Content"
                >
                    {#if isLoading}
                        <!-- Loading State -->
                        <div
                            class="flex-1 flex items-center justify-center"
                            data-state="loading"
                            data-component="loading-indicator"
                            role="status"
                            aria-live="polite"
                        >
                            <div class="text-center">
                                <Icon
                                    icon="mdi:loading"
                                    class="text-4xl text-zinc-400 animate-spin"
                                    aria-hidden="true"
                                />
                                <p class="text-zinc-500 mt-2">
                                    Loading document...
                                </p>
                            </div>
                        </div>
                    {:else}
                        <!-- Editor Ready State -->
                        <div
                            class="h-full"
                            data-state="ready"
                            data-component="editor-wrapper"
                        >
                            <MarkdownEditor
                                id="markdown-editor"
                                bind:value={documentContent}
                                placeholder="Start writing your document..."
                                data-component="markdown-editor"
                                data-field="document-content"
                                aria-label="Document content editor"
                            />
                        </div>
                    {/if}
                </section>

                <!-- ============================================================
                 FOOTER: STATS & ACTIONS
                 Contains word count, character count, and action buttons
                 ============================================================ -->
                <footer
                    id="editor-footer"
                    class="sticky bottom-0 bg-white border-t border-zinc-200 px-6 py-3 flex items-center justify-between"
                    data-section="editor-footer"
                    data-component="editor-footer"
                >
                    <!-- Document Statistics -->
                    <div
                        id="document-stats"
                        class="text-xs text-zinc-400"
                        data-section="document-stats"
                        data-component="document-stats"
                        aria-label="Document statistics"
                        aria-live="polite"
                    >
                        <span data-stat="word-count">{wordCount}</span>
                        <span aria-hidden="true"> words • </span>
                        <span data-stat="char-count">{charCount}</span>
                        <span aria-hidden="true"> characters</span>
                        <span class="sr-only"
                            >{wordCount} words, {charCount} characters</span
                        >
                    </div>

                    <!-- Action Buttons Group -->
                    <nav
                        class="flex items-center gap-2"
                        data-section="action-buttons"
                        data-component="action-buttons"
                        aria-label="Document actions"
                    >
                        <!-- Clear Content Button -->
                        <button
                            id="btn-clear"
                            onclick={handleClear}
                            class="px-4 py-2 text-zinc-700 hover:bg-zinc-100 rounded-lg text-sm font-medium transition-colors"
                            data-action="clear-content"
                            data-component="clear-button"
                            aria-label="Clear document content"
                        >
                            Clear
                        </button>

                        <!-- AI Agent Toggle Button -->
                        <button
                            id="btn-agent"
                            onclick={toggleAgentPanel}
                            class="px-4 py-2 bg-[#00b7b5] text-white rounded-lg text-sm font-medium hover:bg-[#018790] transition-colors flex items-center gap-2"
                            data-action="toggle-agent"
                            data-component="agent-button"
                            data-state={showAgentPanel ? "open" : "closed"}
                            aria-label="Toggle AI Agent panel"
                            aria-pressed={showAgentPanel}
                        >
                            <Icon
                                icon="mdi:robot"
                                class="text-base"
                                aria-hidden="true"
                            />
                            AI Agent
                        </button>

                        <!-- Save Document Button -->
                        <button
                            id="btn-save"
                            onclick={handleSaveClick}
                            class="px-4 py-2 bg-[#005461] text-white rounded-lg text-sm font-medium hover:bg-[#018790] transition-colors flex items-center gap-2"
                            data-action="save-document"
                            data-component="save-button"
                            aria-label="Save document to collection"
                            aria-haspopup="dialog"
                        >
                            <Icon
                                icon="mdi:content-save"
                                class="text-base"
                                aria-hidden="true"
                            />
                            Save Document
                        </button>
                    </nav>
                </footer>
            </article>
        </div>

        <!-- ============================================================
     AGENT PANEL NOTE
     The AI Agent panel is automatically managed by PageAgent.panel
     Use panel.show() and panel.hide() methods to control visibility
     ============================================================ -->

        <!-- ============================================================
     SAVE MODAL DIALOG
     Allows user to select collection and save document
     ============================================================ -->
        {#if showSaveModal}
            <div
                id="save-modal"
                class="fixed inset-0 z-50 flex items-center justify-center"
                role="dialog"
                aria-modal="true"
                aria-labelledby="save-modal-title"
                data-section="save-modal"
                data-component="save-modal"
                data-state="visible"
            >
                <!-- Backdrop -->
                <div
                    class="fixed inset-0 bg-black/40 backdrop-blur-sm"
                    data-component="modal-backdrop"
                    aria-hidden="true"
                ></div>

                <!-- Modal Content -->
                <div
                    class="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 z-10"
                    data-component="modal-content"
                >
                    <div class="p-6">
                        <!-- Modal Header -->
                        <header
                            class="flex items-center justify-between mb-4"
                            data-section="modal-header"
                        >
                            <h2
                                id="save-modal-title"
                                class="text-lg font-semibold tracking-tight"
                            >
                                Save Document
                            </h2>
                            <button
                                id="btn-close-modal"
                                onclick={() => (showSaveModal = false)}
                                class="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                                data-action="close-modal"
                                data-component="modal-close-button"
                                aria-label="Close save modal"
                            >
                                <Icon
                                    icon="mdi:close"
                                    class="text-xl text-zinc-500"
                                    aria-hidden="true"
                                />
                            </button>
                        </header>

                        <!-- Collection Selection -->
                        <div class="mb-6" data-section="collection-selection">
                            <p
                                class="text-sm text-zinc-600 mb-3"
                                data-role="section-description"
                            >
                                Select a collection to save this document:
                            </p>

                            {#if isLoadingCollections}
                                <!-- Loading Collections State -->
                                <div
                                    class="flex items-center justify-center py-8"
                                    data-state="loading"
                                    data-component="collections-loading"
                                    role="status"
                                >
                                    <Icon
                                        icon="mdi:loading"
                                        class="text-2xl text-zinc-400 animate-spin"
                                        aria-hidden="true"
                                    />
                                </div>
                            {:else if collections.length === 0}
                                <!-- No Collections State -->
                                <div
                                    class="text-center py-8 bg-zinc-50 rounded-lg"
                                    data-state="empty"
                                    data-component="collections-empty"
                                >
                                    <Icon
                                        icon="mdi:folder-off"
                                        class="text-3xl text-zinc-300 mx-auto"
                                        aria-hidden="true"
                                    />
                                    <p class="text-sm text-zinc-500">
                                        No collections found
                                    </p>
                                    <p class="text-xs text-zinc-400 mt-1">
                                        Create a collection first to save
                                        documents
                                    </p>
                                </div>
                            {:else}
                                <!-- Collections List -->
                                <div
                                    class="space-y-2 max-h-64 overflow-y-auto"
                                    data-state="ready"
                                    data-component="collections-list"
                                    role="listbox"
                                    aria-label="Available collections"
                                >
                                    <!-- Current/New Collection Option -->
                                    <button
                                        class="w-full p-3 rounded-lg border-2 transition-all text-left {!selectedCollectionId
                                            ? 'border-[#005461] bg-[#005461]/5'
                                            : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'}"
                                        onclick={() =>
                                            (selectedCollectionId = null)}
                                        role="option"
                                        aria-selected={!selectedCollectionId}
                                        data-collection-id="new"
                                        data-action="select-collection"
                                        data-component="collection-option"
                                        data-selected={!selectedCollectionId}
                                    >
                                        <div class="flex items-center gap-3">
                                            <div
                                                class="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center"
                                            >
                                                <Icon
                                                    icon="mdi:plus"
                                                    class="text-lg text-zinc-500"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                            <div>
                                                <div
                                                    class="font-medium text-sm"
                                                >
                                                    New Collection
                                                </div>
                                                <div
                                                    class="text-xs text-zinc-400"
                                                >
                                                    Create a new collection
                                                </div>
                                            </div>
                                        </div>
                                    </button>

                                    <!-- Existing Collections -->
                                    {#each collections as collection (collection.id)}
                                        <button
                                            class="w-full p-3 rounded-lg border-2 transition-all text-left {selectedCollectionId ===
                                            collection.id
                                                ? 'border-[#005461] bg-[#005461]/5'
                                                : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'}"
                                            onclick={() =>
                                                (selectedCollectionId =
                                                    collection.id)}
                                            role="option"
                                            aria-selected={selectedCollectionId ===
                                                collection.id}
                                            data-collection-id={collection.id}
                                            data-collection-name={collection.topic}
                                            data-action="select-collection"
                                            data-component="collection-option"
                                            data-selected={selectedCollectionId ===
                                                collection.id}
                                        >
                                            <div
                                                class="flex items-center gap-3"
                                            >
                                                <div
                                                    class="w-10 h-10 rounded-lg bg-[#00b7b5]/10 flex items-center justify-center"
                                                >
                                                    <Icon
                                                        icon="mdi:folder"
                                                        class="text-lg text-[#018790]"
                                                        aria-hidden="true"
                                                    />
                                                </div>
                                                <div class="flex-1 min-w-0">
                                                    <div
                                                        class="font-medium text-sm"
                                                    >
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

                        <!-- Modal Actions -->
                        <nav
                            class="flex gap-3"
                            data-section="modal-actions"
                            data-component="modal-actions"
                        >
                            <button
                                id="btn-cancel-save"
                                onclick={() => (showSaveModal = false)}
                                class="flex-1 px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors"
                                data-action="cancel-save"
                                data-component="cancel-button"
                            >
                                Cancel
                            </button>
                            <button
                                id="btn-confirm-save"
                                onclick={handleSaveToCollection}
                                class="flex-1 px-4 py-2 bg-[#005461] text-white rounded-lg text-sm font-medium hover:bg-[#018790] transition-colors flex items-center justify-center gap-2"
                                disabled={!selectedCollectionId || isSaving}
                                data-action="confirm-save"
                                data-component="confirm-button"
                                data-state={isSaving ? "saving" : "ready"}
                            >
                                {#if isSaving}
                                    <Icon
                                        icon="mdi:loading"
                                        class="text-base animate-spin"
                                        aria-hidden="true"
                                    />
                                    <span>Saving...</span>
                                {:else}
                                    <Icon
                                        icon="mdi:check"
                                        class="text-base"
                                        aria-hidden="true"
                                    />
                                    <span>Save</span>
                                {/if}
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        {/if}
    </main>

    <!-- ============================================================
     AGENT DRAWER
     AI assistant panel with settings and chat interface
     ============================================================ -->
    {#if showAgentPanel}
        <aside
            class="w-full max-w-lg bg-white shadow-2xl flex flex-col h-full border-l border-zinc-200 transition-all duration-300 ease-in-out"
            data-component="agent-drawer"
            data-state="open"
            aria-label="AI Writing Assistant"
        >
            <!-- Header -->
            <header
                class="flex items-center justify-between p-4 border-b border-zinc-200 bg-zinc-50"
            >
                <div class="flex items-center gap-3">
                    <Icon icon="mdi:robot" class="text-2xl text-[#00b7b5]" />
                    <div>
                        <h2 class="text-lg font-semibold text-zinc-900">
                            AI Writing Assistant
                        </h2>
                        <p class="text-xs text-zinc-500">
                            {documentContent.trim().length > 0
                                ? "Rewrite & repurpose content"
                                : "Write & summarize"}
                        </p>
                    </div>
                </div>
                <button
                    onclick={toggleAgentPanel}
                    class="p-2 hover:bg-zinc-200 rounded-lg transition-colors"
                    aria-label="Close agent panel"
                >
                    <Icon icon="mdi:close" class="text-xl text-zinc-600" />
                </button>
            </header>

            <!-- Settings Section -->
            <div class="p-4 border-b border-zinc-200 bg-zinc-50 space-y-3">
                <div
                    class="flex items-center gap-2 text-sm font-medium text-zinc-700"
                >
                    <Icon icon="mdi:tune" class="text-base" />
                    <span>Settings</span>
                </div>

                <div class="grid grid-cols-3 gap-3">
                    <!-- Format -->
                    <div>
                        <label
                            for="agent-format"
                            class="block text-xs font-medium text-zinc-600 mb-1"
                        >
                            Format
                        </label>
                        <select
                            id="agent-format"
                            bind:value={agentFormat}
                            class="w-full px-2 py-1.5 text-xs border border-zinc-300 rounded focus:ring-2 focus:ring-[#00b7b5] focus:border-transparent"
                        >
                            <option value="blog">Blog Post</option>
                            <option value="article">Article</option>
                            <option value="social">Social Media</option>
                            <option value="email">Email</option>
                            <option value="essay">Essay</option>
                            <option value="report">Report</option>
                        </select>
                    </div>

                    <!-- Tone -->
                    <div>
                        <label
                            for="agent-tone"
                            class="block text-xs font-medium text-zinc-600 mb-1"
                        >
                            Tone
                        </label>
                        <select
                            id="agent-tone"
                            bind:value={agentTone}
                            class="w-full px-2 py-1.5 text-xs border border-zinc-300 rounded focus:ring-2 focus:ring-[#00b7b5] focus:border-transparent"
                        >
                            <option value="professional">Professional</option>
                            <option value="casual">Casual</option>
                            <option value="friendly">Friendly</option>
                            <option value="formal">Formal</option>
                            <option value="conversational"
                                >Conversational</option
                            >
                        </select>
                    </div>

                    <!-- Style -->
                    <div>
                        <label
                            for="agent-style"
                            class="block text-xs font-medium text-zinc-600 mb-1"
                        >
                            Style
                        </label>
                        <select
                            id="agent-style"
                            bind:value={agentStyle}
                            class="w-full px-2 py-1.5 text-xs border border-zinc-300 rounded focus:ring-2 focus:ring-[#00b7b5] focus:border-transparent"
                        >
                            <option value="concise">Concise</option>
                            <option value="detailed">Detailed</option>
                            <option value="persuasive">Persuasive</option>
                            <option value="informative">Informative</option>
                            <option value="creative">Creative</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Chat Messages -->
            <div class="flex-1 overflow-y-auto p-4 space-y-4">
                {#if agentMessages.length === 0}
                    <div class="text-center py-8">
                        <Icon
                            icon="mdi:message-text-outline"
                            class="text-4xl text-zinc-300 mb-3"
                        />
                        <p class="text-sm text-zinc-500">
                            {documentContent.trim().length > 0
                                ? "Ask me to rewrite, repurpose, or improve your content"
                                : "Ask me to help you write about any topic or summarize text"}
                        </p>
                    </div>
                {:else}
                    {#each agentMessages as message, index}
                        <div
                            class="flex {message.role === 'user'
                                ? 'justify-end'
                                : 'justify-start'}"
                        >
                            <div
                                class="max-w-[80%] {message.role === 'user'
                                    ? ''
                                    : 'space-y-2'}"
                            >
                                <div
                                    class="rounded-lg px-4 py-2.5 {message.role ===
                                    'user'
                                        ? 'bg-[#00b7b5] text-white'
                                        : 'bg-zinc-100 text-zinc-900'}"
                                >
                                    <p class="text-sm whitespace-pre-wrap">
                                        {message.content}
                                    </p>
                                </div>
                                {#if message.role === "assistant" && message.content.trim()}
                                    <button
                                        onclick={() =>
                                            insertIntoEditor(message.content)}
                                        class="text-xs text-[#00b7b5] hover:text-[#018790] transition-colors flex items-center gap-1"
                                        title="Insert into document"
                                    >
                                        <Icon icon="mdi:plus" class="text-sm" />
                                        Insert into document
                                    </button>
                                {/if}
                            </div>
                        </div>
                    {/each}

                    {#if agentLoading}
                        <div class="flex justify-start items-end gap-2">
                            {#if !agentMessages.length || agentMessages[agentMessages.length - 1]?.content === ""}
                                <div
                                    class="bg-zinc-100 rounded-lg px-4 py-2.5 w-32 h-20"
                                >
                                    <BirdsFlocking />
                                </div>
                            {/if}
                            <button
                                onclick={abortAgent}
                                class="px-3 py-1.5 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors flex items-center gap-1"
                                title="Stop generation"
                            >
                                <Icon icon="mdi:stop" class="text-sm" />
                                Stop
                            </button>
                        </div>
                    {/if}
                {/if}
            </div>

            <!-- Input Area -->
            <div class="border-t border-zinc-200 p-4 bg-white">
                <form
                    onsubmit={(e) => {
                        e.preventDefault();
                        sendToAgent();
                    }}
                    class="flex gap-2"
                >
                    <input
                        type="text"
                        bind:value={agentInput}
                        placeholder={documentContent.trim().length > 0
                            ? "How can I improve this content?"
                            : "What would you like to write about?"}
                        disabled={agentLoading}
                        class="flex-1 px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#00b7b5] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    />
                    {#if agentLoading}
                        <button
                            type="button"
                            onclick={abortAgent}
                            class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                        >
                            <Icon icon="mdi:stop" class="text-base" />
                        </button>
                    {:else}
                        <button
                            type="submit"
                            disabled={!agentInput.trim()}
                            class="px-4 py-2 bg-[#00b7b5] text-white rounded-lg hover:bg-[#018790] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Icon icon="mdi:send" class="text-base" />
                        </button>
                    {/if}
                </form>

                {#if agentMessages.length > 0}
                    <button
                        onclick={clearAgentChat}
                        class="mt-2 w-full text-xs text-zinc-500 hover:text-zinc-700 transition-colors py-1"
                    >
                        Clear conversation
                    </button>
                {/if}
            </div>
        </aside>
    {/if}
</div>

<!-- ============================================================
     STYLES
     Custom styling for Carta markdown editor
     ============================================================ -->
<style>
    /* Carta Editor Theme Overrides */
    :global(.carta-theme__github) {
        --carta-bg: #ffffff;
        --carta-border-color: #e4e7eb;
        --carta-color: #1f2328;
        --cartaselection-color: #b6e3ff;
    }

    /* Main Editor Container */
    :global(.carta-theme__github.carta-editor) {
        border: none !important;
        border-radius: 0 !important;
        height: 100% !important;
        display: flex !important;
        flex-direction: column !important;
    }

    /* Focus State */
    :global(.carta-theme__github.carta-editor:focus-within) {
        border: none !important;
        box-shadow: none !important;
    }

    /* Editor Wrapper */
    :global(.carta-theme__github.carta-editor .carta-wrapper) {
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        min-height: 0 !important;
    }

    /* Editor Container */
    :global(.carta-theme__github.carta-editor .carta-container) {
        flex: 1 !important;
        display: flex !important;
        min-height: 0 !important;
    }

    /* Input Wrapper */
    :global(.carta-theme__github.carta-editor .carta-input-wrapper) {
        flex: 1 !important;
        min-height: 0 !important;
    }

    /* Input & Renderer */
    :global(.carta-theme__github.carta-editor .carta-input),
    :global(.carta-theme__github.carta-editor .carta-renderer) {
        padding: 1.5rem !important;
        font-size: 0.9375rem !important;
        line-height: 1.7 !important;
    }

    /* Code Font */
    :global(.carta-theme__github.carta-editor .carta-font-code) {
        font-family:
            "JetBrains Mono", "Fira Code", Consolas, monospace !important;
        font-size: 0.875rem !important;
    }

    /* Toolbar */
    :global(.carta-theme__github.carta-editor .carta-toolbar) {
        border-bottom: 1px solid #e4e7eb !important;
        padding: 0.5rem 1rem !important;
        background: #fafbfc !important;
    }

    /* Toolbar Icons */
    :global(.carta-theme__github.carta-editor .carta-toolbar .carta-icon) {
        width: 32px !important;
        height: 32px !important;
    }

    /* Toolbar Buttons */
    :global(
        .carta-theme__github.carta-editor .carta-toolbar button:not(:disabled)
    ) {
        color: #57606a !important;
    }

    :global(.carta-theme__github.carta-editor .carta-toolbar-left button),
    :global(.carta-theme__github.carta-editor .carta-toolbar-right),
    :global(.carta-theme__github.carta-editor .carta-filler) {
        border-radius: 6px !important;
    }

    /* Toolbar Button Hover */
    :global(
        .carta-theme__github.carta-editor .carta-toolbar-left button:hover
    ) {
        background: #f0f0f0 !important;
    }

    :global(.carta-theme__github.carta-editor .carta-toolbar-left > *) {
        margin-right: 2px !important;
    }

    :global(.carta-theme__github.carta-editor .carta-toolbar-left button) {
        padding: 6px !important;
    }

    /* Active/Hover States */
    :global(
        .carta-theme__github.carta-editor .carta-toolbar-left button.active
    ) {
        background: #ddf4ff !important;
        color: #0969da !important;
    }

    :global(
        .carta-theme__github.carta-editor .carta-toolbar-left button:disabled
    ) {
        color: #8c959f !important;
    }

    /* Toolbar Right */
    :global(.carta-theme__github.carta-editor .carta-toolbar-right) {
        margin-left: auto !important;
    }

    /* Icons Menu */
    :global(.carta-theme__github.carta-editor .carta-icons-menu) {
        padding: 0.75rem !important;
        background: #ffffff !important;
        border: 1px solid #e4e7eb !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
    }

    /* Icon Buttons */
    :global(.carta-theme__github.carta-editor .carta-icons-menu button) {
        padding: 0.5rem !important;
        border-radius: 6px !important;
    }

    /* Icon Button Hover */
    :global(.carta-theme__github.carta-editor .carta-icons-menu button:hover) {
        background: #f6f8fa !important;
    }

    /* Icon Button Active */
    :global(.carta-theme__github.carta-editor .carta-icons-menu button.active) {
        background: #ddf4ff !important;
    }

    /* Button with Icon */
    :global(.carta-theme__github.carta-editor .carta-icons-menu .carta-icon) {
        margin-right: 0.5rem !important;
    }

    /* Emoji Picker */
    :global(.carta-theme__github.carta-emoji) {
        padding: 0.75rem !important;
        background: #ffffff !important;
        border: 1px solid #e4e7eb !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
    }

    /* Emoji Button */
    :global(.carta-theme__github.carta-emoji button) {
        width: 36px !important;
        height: 36px !important;
        padding: 0 !important;
        font-size: 1.25rem !important;
        line-height: 36px !important;
        border-radius: 6px !important;
        transition: all 0.15s ease !important;
    }

    /* Emoji Hover/Active */
    :global(.carta-theme__github.carta-emoji button:hover),
    :global(.carta-theme__github.carta-emoji button.carta-active) {
        background: #f6f8fa !important;
        transform: scale(1.1) !important;
    }

    /* Slash Commands */
    :global(.carta-theme__github.carta-slash) {
        padding: 0.5rem !important;
        background: #ffffff !important;
        border: 1px solid #e4e7eb !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
    }

    /* Slash Command Text */
    :global(.carta-theme__github.carta-slash span) {
        color: #57606a !important;
    }

    /* Slash Command Button */
    :global(.carta-theme__github.carta-slash button) {
        padding: 0.5rem 0.75rem !important;
        border-radius: 6px !important;
        text-align: left !important;
    }

    /* Slash Command Group */
    :global(.carta-theme__github.carta-slash .carta-slash-group) {
        padding: 0.25rem !important;
    }

    /* Slash Command Active/Hover */
    :global(.carta-theme__github.carta-slash button.carta-active),
    :global(.carta-theme__github.carta-slash button:hover) {
        background: #ddf4ff !important;
        color: #0969da !important;
    }

    /* Slash Command Title */
    :global(.carta-theme__github.carta-slash .carta-snippet-title) {
        font-weight: 600 !important;
    }

    /* Slash Command Description */
    :global(.carta-theme__github.carta-slash .carta-snippet-description) {
        color: #8c959f !important;
        font-size: 0.75rem !important;
    }

    /* Dark Mode Support */
    :global(html.dark .carta-theme__github .shiki),
    :global(html.dark .carta-theme__github .shiki span) {
        background-color: transparent !important;
    }
</style>
