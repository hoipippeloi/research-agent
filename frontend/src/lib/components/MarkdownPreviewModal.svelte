<script lang="ts">
    import Icon from "@iconify/svelte";
    import MarkdownEditor from "$lib/components/MarkdownEditor.svelte";
    import type { Collection } from "$lib/db/schema";

    interface Props {
        open: boolean;
        url: string;
        onClose: () => void;
        collections: Collection[];
        userEmail: string;
    }

    let { open, url, onClose, collections, userEmail }: Props = $props();

    let title = $state("");
    let markdown = $state("");
    let selectedCollectionId = $state<number | null>(null);
    let isLoading = $state(false);
    let isSaving = $state(false);
    let error = $state("");

    // Derived values
    let selectedCollection = $derived(
        selectedCollectionId
            ? collections.find((c) => c.id === selectedCollectionId)
            : null,
    );

    async function fetchMarkdown() {
        if (!url) return;

        isLoading = true;
        error = "";
        markdown = "";
        title = "";

        try {
            const domain = url.replace(/^https?:\/\//, "");
            const response = await fetch(`https://defuddle.md/${domain}`);

            if (!response.ok) {
                throw new Error("Failed to fetch markdown");
            }

            markdown = await response.text();
            // Extract title from URL or first heading
            title = getDomain(url);

            // Try to extract title from markdown
            const titleMatch = markdown.match(/^#\s+(.+)$/m);
            if (titleMatch) {
                title = titleMatch[1];
            }
        } catch (err) {
            console.error("Error fetching markdown:", err);
            error = "Failed to fetch markdown. Please try again.";
        } finally {
            isLoading = false;
        }
    }

    async function handleSave() {
        if (!title.trim()) {
            error = "Please enter a title";
            return;
        }

        if (!selectedCollectionId) {
            error = "Please select a collection";
            return;
        }

        if (!markdown.trim()) {
            error = "Please enter some content";
            return;
        }

        try {
            isSaving = true;
            error = "";

            const response = await fetch("/api/saved-results", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    markdown: markdown,
                    title: title.trim(),
                    collectionId: selectedCollectionId,
                    url: url,
                    userEmail: userEmail,
                    type: "document",
                }),
            });

            if (response.ok) {
                onClose();
            } else {
                const errorData = await response.json();
                error = errorData.error || "Failed to save document";
            }
        } catch (err) {
            console.error("Error saving:", err);
            error = "Failed to save document. Please try again.";
        } finally {
            isSaving = false;
        }
    }

    function getDomain(url: string): string {
        try {
            return new URL(url).hostname;
        } catch {
            return "document";
        }
    }

    function handleCopy() {
        navigator.clipboard.writeText(markdown);
    }

    function handleDownload() {
        const blob = new Blob([markdown], { type: "text/markdown" });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `${title || "document"}.md`;
        a.click();
        URL.revokeObjectURL(downloadUrl);
    }

    $effect(() => {
        if (open && url) {
            fetchMarkdown();
            // Auto-select collection if there's one matching the domain
            const domain = getDomain(url);
            const matchingCollection = collections.find(
                (c) =>
                    c.topic.toLowerCase().includes(domain.toLowerCase()) ||
                    domain.toLowerCase().includes(c.topic.toLowerCase()),
            );
            if (matchingCollection) {
                selectedCollectionId = matchingCollection.id;
            } else if (collections.length > 0) {
                // Select first collection by default
                selectedCollectionId = collections[0].id;
            }
        }
    });

    // Reset state when modal closes
    $effect(() => {
        if (!open) {
            title = "";
            markdown = "";
            selectedCollectionId = null;
            error = "";
        }
    });
</script>

{#if open}
    <div
        class="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onclick={onClose}
        onkeydown={(e) => e.key === "Escape" && onClose()}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
    >
        <div
            class="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col relative"
            onclick={(e) => e.stopPropagation()}
            role="document"
        >
            <!-- Header -->
            <div class="sticky top-0 bg-white z-10">
                <div
                    class="border-b border-zinc-200 px-6 py-3 flex items-center justify-between"
                >
                    <div class="flex items-center gap-4">
                        <div>
                            <h2 class="text-lg font-semibold tracking-tight">
                                Edit Document
                            </h2>
                            <p class="text-xs text-zinc-500 mt-0.5">
                                {getDomain(url)}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            onclick={handleCopy}
                            disabled={!markdown || isLoading}
                            class="px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                            <Icon icon="mdi:content-copy" class="text-base" />
                            Copy
                        </button>
                        <button
                            onclick={handleDownload}
                            disabled={!markdown || isLoading}
                            class="px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                            <Icon icon="mdi:download" class="text-base" />
                            Download
                        </button>
                        <button
                            onclick={onClose}
                            class="p-2 hover:bg-zinc-100 rounded-lg transition-colors ml-2"
                            aria-label="Close"
                        >
                            <Icon
                                icon="mdi:close"
                                class="text-xl text-zinc-500"
                            />
                        </button>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            {#if isLoading}
                <div class="flex-1 flex items-center justify-center">
                    <div class="text-center">
                        <Icon
                            icon="mdi:loading"
                            class="text-4xl text-zinc-400 animate-spin mb-4"
                        />
                        <p class="text-zinc-500">Fetching markdown...</p>
                    </div>
                </div>
            {:else if error && !markdown}
                <div class="flex-1 flex items-center justify-center">
                    <div class="text-center px-6">
                        <Icon
                            icon="mdi:alert-circle"
                            class="text-4xl text-red-400 mb-4"
                        />
                        <p class="text-zinc-700 font-medium mb-2">
                            Failed to load markdown
                        </p>
                        <p class="text-sm text-zinc-500 mb-4">{error}</p>
                        <button
                            onclick={fetchMarkdown}
                            class="px-4 py-2 bg-[#005461] text-white rounded-lg text-sm font-medium hover:bg-[#018790] transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            {:else}
                <div class="flex-1 overflow-y-auto flex flex-col">
                    <!-- Title Input -->
                    <div class="px-6 py-4 border-b border-zinc-200">
                        <label
                            class="text-xs text-zinc-500 font-medium mb-2 block"
                            >Title</label
                        >
                        <input
                            type="text"
                            bind:value={title}
                            placeholder="Document title..."
                            class="w-full text-xl font-semibold tracking-tight border-none outline-none placeholder-zinc-300 text-zinc-800"
                        />
                    </div>

                    <!-- Collection Selector -->
                    <div class="px-6 py-3 border-b border-zinc-200">
                        <label
                            class="text-xs text-zinc-500 font-medium mb-2 block"
                            >Collection</label
                        >
                        <div class="flex items-center gap-3">
                            <select
                                bind:value={selectedCollectionId}
                                class="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                            >
                                <option value={null}
                                    >Select a collection...</option
                                >
                                {#each collections as collection (collection.id)}
                                    <option value={collection.id}
                                        >{collection.topic}</option
                                    >
                                {/each}
                            </select>
                            {#if selectedCollection}
                                <span
                                    class="text-[10px] text-[#018790] font-medium bg-[#00b7b5]/10 px-2 py-0.5 rounded-full"
                                >
                                    {selectedCollection.topic}
                                </span>
                            {/if}
                        </div>
                    </div>

                    <!-- Error Message -->
                    {#if error}
                        <div
                            class="px-6 py-3 bg-red-50 border-b border-red-200"
                        >
                            <p class="text-sm text-red-700">{error}</p>
                        </div>
                    {/if}

                    <!-- Editor -->
                    <div class="flex-1 overflow-hidden px-6 py-4">
                        <MarkdownEditor
                            bind:value={markdown}
                            placeholder="Start writing your document..."
                        />
                    </div>
                </div>

                <!-- Footer -->
                <div
                    class="border-t border-zinc-200 px-6 py-3 bg-zinc-50 flex items-center justify-between"
                >
                    <div class="text-xs text-zinc-500">
                        {markdown.trim()
                            ? markdown.trim().split(/\s+/).length
                            : 0} words • {markdown.length} characters
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            onclick={onClose}
                            class="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onclick={handleSave}
                            disabled={isSaving ||
                                !title.trim() ||
                                !selectedCollectionId}
                            class="px-4 py-2 text-sm font-medium bg-[#005461] text-white hover:bg-[#018790] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {#if isSaving}
                                <Icon
                                    icon="mdi:loading"
                                    class="text-base animate-spin"
                                />
                                Saving...
                            {:else}
                                <Icon
                                    icon="mdi:content-save"
                                    class="text-base"
                                />
                                Save to Collection
                            {/if}
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    </div>
{/if}
