<script lang="ts">
    import Icon from "@iconify/svelte";

    interface Props {
        open: boolean;
        url: string;
        onClose: () => void;
        onSave?: (markdown: string, url: string) => void;
    }

    let { open, url, onClose, onSave }: Props = $props();
    let markdown = $state("");
    let isLoading = $state(false);
    let error = $state("");
    let hasYamlFrontmatter = $derived(markdown.startsWith("---\n"));

    async function fetchMarkdown() {
        if (!url) return;

        isLoading = true;
        error = "";
        markdown = "";

        try {
            const domain = url.replace(/^https?:\/\//, "");
            const response = await fetch(`https://defuddle.md/${domain}`);

            if (!response.ok) {
                throw new Error("Failed to fetch markdown");
            }

            markdown = await response.text();
        } catch (err) {
            console.error("Error fetching markdown:", err);
            error = "Failed to fetch markdown. Please try again.";
        } finally {
            isLoading = false;
        }
    }

    function handleCopy() {
        navigator.clipboard.writeText(markdown);
    }

    function handleDownload() {
        const blob = new Blob([markdown], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${getDomain(url)}.md`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function handleSave() {
        if (onSave) {
            onSave(markdown, url);
        }
    }

    function getDomain(url: string): string {
        try {
            return new URL(url).hostname;
        } catch {
            return "document";
        }
    }

    function parseYamlFrontmatter(md: string): { metadata: Record<string, string>; content: string } {
        if (!md.startsWith("---\n")) {
            return { metadata: {}, content: md };
        }

        const endIndex = md.indexOf("\n---\n", 4);
        if (endIndex === -1) {
            return { metadata: {}, content: md };
        }

        const yamlStr = md.slice(4, endIndex);
        const content = md.slice(endIndex + 5);

        const metadata: Record<string, string> = {};
        yamlStr.split("\n").forEach(line => {
            const colonIndex = line.indexOf(":");
            if (colonIndex > 0) {
                const key = line.slice(0, colonIndex).trim();
                const value = line.slice(colonIndex + 1).trim();
                metadata[key] = value;
            }
        });

        return { metadata, content };
    }

    function renderMarkdown(md: string): string {
        const { metadata, content } = parseYamlFrontmatter(md);
        
        let html = content
            .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-2 text-zinc-900">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-8 mb-3 text-zinc-900">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4 text-zinc-900">$1</h1>')
            .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-zinc-300 pl-4 italic my-4 text-zinc-700">$1</blockquote>')
            .replace(/\*\*(.*)\*\*/gim, '<strong class="font-semibold">$1</strong>')
            .replace(/\*(.*)\*/gim, '<em class="italic">$1</em>')
            .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img src="$2" alt="$1" class="my-4 rounded-lg max-w-full" />')
            .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
            .replace(/`([^`]+)`/gim, '<code class="bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
            .replace(/```([\s\S]*?)```/gim, '<pre class="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm font-mono">$1</code></pre>')
            .replace(/^\- (.*$)/gim, '<li class="ml-6 list-disc text-zinc-700">$1</li>')
            .replace(/^\d+\. (.*$)/gim, '<li class="ml-6 list-decimal text-zinc-700">$1</li>')
            .replace(/\n\n/gim, '</p><p class="my-3 text-zinc-700 leading-relaxed">')
            .replace(/\n/gim, '<br>');

        if (Object.keys(metadata).length > 0) {
            let metaHtml = '<div class="bg-zinc-50 border border-zinc-200 rounded-lg p-4 mb-6">';
            metaHtml += '<h4 class="text-xs font-semibold text-zinc-500 uppercase mb-2">Metadata</h4>';
            metaHtml += '<div class="space-y-1">';
            for (const [key, value] of Object.entries(metadata)) {
                metaHtml += `<div class="flex gap-2"><span class="text-xs font-mono text-zinc-500">${key}:</span><span class="text-xs text-zinc-700">${value}</span></div>`;
            }
            metaHtml += '</div></div>';
            html = metaHtml + html;
        }

        return `<div class="prose prose-zinc max-w-none"><p class="my-3 text-zinc-700 leading-relaxed">${html}</p></div>`;
    }

    $effect(() => {
        if (open && url) {
            fetchMarkdown();
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
            class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col relative"
            onclick={(e) => e.stopPropagation()}
            role="document"
        >
            <div class="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between z-10">
                <div>
                    <h2 class="text-lg font-semibold tracking-tight">Markdown Preview</h2>
                    <p class="text-sm text-zinc-500 mt-0.5">{getDomain(url)}</p>
                </div>
                <div class="flex items-center gap-2">
                    <button
                        onclick={handleCopy}
                        disabled={!markdown}
                        class="px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                        <Icon icon="mdi:content-copy" class="text-base" />
                        Copy
                    </button>
                    <button
                        onclick={handleDownload}
                        disabled={!markdown}
                        class="px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                        <Icon icon="mdi:download" class="text-base" />
                        Download
                    </button>
                    {#if onSave}
                        <button
                            onclick={handleSave}
                            disabled={!markdown}
                            class="px-3 py-1.5 text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                            <Icon icon="mdi:content-save" class="text-base" />
                            Save
                        </button>
                    {/if}
                    <button
                        onclick={onClose}
                        class="p-2 hover:bg-zinc-100 rounded-lg transition-colors ml-2"
                        aria-label="Close"
                    >
                        <Icon icon="mdi:close" class="text-xl text-zinc-500" />
                    </button>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto">
                {#if isLoading}
                    <div class="flex flex-col items-center justify-center py-16">
                        <Icon icon="mdi:loading" class="text-4xl text-zinc-400 animate-spin mb-4" />
                        <p class="text-zinc-500">Fetching markdown...</p>
                    </div>
                {:else if error}
                    <div class="flex flex-col items-center justify-center py-16 px-6">
                        <Icon icon="mdi:alert-circle" class="text-4xl text-red-400 mb-4" />
                        <p class="text-zinc-700 font-medium mb-2">Failed to load markdown</p>
                        <p class="text-sm text-zinc-500 text-center">{error}</p>
                        <button
                            onclick={fetchMarkdown}
                            class="mt-4 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                {:else if markdown}
                    <div class="px-6 py-6">
                        {@html renderMarkdown(markdown)}
                    </div>
                {:else}
                    <div class="flex flex-col items-center justify-center py-16">
                        <Icon icon="mdi:file-document-outline" class="text-4xl text-zinc-300 mb-4" />
                        <p class="text-zinc-500">No markdown content</p>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}
