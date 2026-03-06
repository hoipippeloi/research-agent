<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import Icon from "@iconify/svelte";
    import { uiScale } from "$lib/stores/uiScale";
    import type { Collection } from "$lib/db/schema";

    let collection = $state<Collection | null>(null);
    let isLoading = $state(true);
    let error = $state<string | null>(null);
    let currentUserEmail = $state<string | null>(null);

    const collectionId = $derived($page.params.id);

    onMount(async () => {
        const storedEmail = localStorage.getItem("user_email");
        if (!storedEmail) {
            goto("/");
            return;
        }
        currentUserEmail = storedEmail;
        await loadCollection();
    });

    async function loadCollection() {
        if (!currentUserEmail || !collectionId) return;

        try {
            isLoading = true;
            const response = await fetch(
                `/api/collections/${collectionId}?userEmail=${encodeURIComponent(currentUserEmail)}`,
            );

            if (response.ok) {
                collection = await response.json();
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
</script>

<svelte:head>
    <title>{collection?.topic || "Collection"} - Search Archive</title>
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
                    <Icon icon="mdi:folder" class="text-amber-500 text-lg" />
                    <span class="font-medium text-zinc-900 truncate max-w-[200px] sm:max-w-[400px]">
                        {collection?.topic || "Collection"}
                    </span>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
                <button
                    class="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                    title="Search in collection"
                >
                    <Icon icon="mdi:magnify" class="text-zinc-600 text-lg" />
                </button>
                <button
                    class="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                    title="Collection settings"
                >
                    <Icon icon="mdi:cog-outline" class="text-zinc-600 text-lg" />
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
                    <Icon icon="mdi:alert-circle" class="text-red-500 text-3xl" />
                </div>
                <h2 class="text-xl font-semibold text-zinc-900 mb-2">{error}</h2>
                <p class="text-zinc-500 mb-6">
                    The collection you're looking for doesn't exist or you don't have access.
                </p>
                <button
                    onclick={handleBack}
                    class="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
                >
                    Back to Collections
                </button>
            </div>
        {:else if collection}
            <!-- Collection Header -->
            <div class="mb-8">
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h1 class="text-3xl font-semibold tracking-tight mb-2">
                            {collection.topic}
                        </h1>
                        <p class="text-zinc-500">
                            {collection.description || "No description"}
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <span
                            class="text-xs text-amber-600 font-medium bg-amber-50 px-3 py-1 rounded-full"
                        >
                            {collection.searchCount || 0} items
                        </span>
                    </div>
                </div>

                <!-- Stats Bar -->
                <div
                    class="flex items-center gap-6 py-4 px-6 bg-white/60 backdrop-blur rounded-xl border border-zinc-200/50"
                >
                    <div class="flex items-center gap-2">
                        <Icon icon="mdi:calendar" class="text-zinc-400" />
                        <span class="text-sm text-zinc-600">
                            Created {new Date(collection.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <div class="h-4 w-px bg-zinc-200"></div>
                    <div class="flex items-center gap-2">
                        <Icon icon="mdi:update" class="text-zinc-400" />
                        <span class="text-sm text-zinc-600">
                            Updated {new Date(collection.updatedAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Placeholder Content -->
            <div class="bg-white rounded-2xl border border-zinc-200/70 p-8">
                <div class="flex flex-col items-center justify-center py-16">
                    <div
                        class="w-20 h-20 bg-zinc-100 rounded-2xl flex items-center justify-center mb-6"
                    >
                        <Icon
                            icon="mdi:folder-open-outline"
                            class="text-zinc-400 text-4xl"
                        />
                    </div>
                    <h2 class="text-xl font-semibold text-zinc-900 mb-2">
                        Collection View Coming Soon
                    </h2>
                    <p class="text-zinc-500 text-center max-w-md mb-6">
                        This page will display all saved results, documents, and bookmarks
                        associated with this collection.
                    </p>
                    <div class="flex items-center gap-3">
                        <button
                            onclick={handleBack}
                            class="px-4 py-2 border border-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors"
                        >
                            Back to Collections
                        </button>
                        <button
                            onclick={() => goto(`/?tab=searches`)}
                            class="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
                        >
                            Search Something
                        </button>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</main>

<style>
    :global(body) {
        background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
    }
</style>
