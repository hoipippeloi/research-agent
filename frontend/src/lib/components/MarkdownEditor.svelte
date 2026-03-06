<script lang="ts">
    import { Carta, MarkdownEditor as CartaEditor } from "carta-md";
    import DOMPurify from "isomorphic-dompurify";

    let {
        value = $bindable(""),
        placeholder = "Start writing...",
    }: { value?: string; placeholder?: string } = $props();

    const carta = new Carta({
        sanitizer: DOMPurify.sanitize,
    });
</script>

<CartaEditor {carta} bind:value {placeholder} mode="tabs" theme="github" />

<style>
    :global(.carta-editor) {
        height: 100%;
        border: none;
        background: white;
    }

    :global(.carta-font-code) {
        font-family: var(--font-fira-code);
        font-size: 0.8rem;
        line-height: 1.5;
    }

    :global(.carta-wrapper) {
        height: calc(100% - 40px);
    }

    :global(.carta-input) {
        font-family: var(--font-inter);
        font-size: 0.8rem;
        line-height: 1.6;
        padding: 1rem;
    }

    :global(.carta-renderer) {
        font-family: var(--font-inter);
        font-size: 0.875rem;
        line-height: 1.6;
        padding: 1rem;
    }

    :global(.carta-renderer h1) {
        font-family: var(--font-aspekta);
        font-size: 1.5rem;
        font-weight: 650;
        margin: 1rem 0 0.5rem;
    }

    :global(.carta-renderer h2) {
        font-family: var(--font-aspekta);
        font-size: 1.25rem;
        font-weight: 650;
        margin: 1rem 0 0.5rem;
    }

    :global(.carta-renderer h3) {
        font-family: var(--font-aspekta);
        font-size: 1rem;
        font-weight: 650;
        margin: 0.75rem 0 0.5rem;
    }

    :global(.carta-renderer p) {
        margin: 0.5rem 0;
    }

    :global(.carta-renderer code) {
        font-family: var(--font-fira-code);
        background: #f6f8fa;
        padding: 0.2em 0.4em;
        border-radius: 6px;
        font-size: 85%;
    }

    :global(.carta-renderer pre) {
        font-family: var(--font-fira-code);
        background: #f6f8fa;
        padding: 1rem;
        border-radius: 6px;
        overflow-x: auto;
        margin: 0.5rem 0;
    }

    :global(.carta-renderer pre code) {
        background: transparent;
        padding: 0;
    }

    :global(.carta-renderer blockquote) {
        border-left: 4px solid #dfe2e5;
        padding-left: 1rem;
        color: #6a737d;
        margin: 0.5rem 0;
    }

    :global(.carta-renderer ul, .carta-renderer ol) {
        padding-left: 2rem;
        margin: 0.5rem 0;
    }

    :global(.carta-renderer li) {
        margin: 0.25rem 0;
    }

    :global(.carta-renderer a) {
        color: #0366d6;
        text-decoration: none;
    }

    :global(.carta-renderer a:hover) {
        text-decoration: underline;
    }
</style>
