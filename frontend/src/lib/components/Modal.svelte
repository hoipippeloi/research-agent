<script lang="ts">
    import Icon from "@iconify/svelte";

    interface Props {
        open: boolean;
        title?: string;
        onClose: () => void;
        children?: import("svelte").Snippet;
    }

    let { open, title = "", onClose, children }: Props = $props();
    let modalRef: HTMLDivElement | undefined = $state();

    // Handle keyboard and focus management
    $effect(() => {
        if (open) {
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    onClose();
                }
            };

            document.addEventListener("keydown", handleEscape);

            // Focus the modal when opened
            setTimeout(() => {
                if (modalRef) {
                    modalRef.focus();
                }
            }, 0);

            // Prevent body scroll when modal is open
            document.body.style.overflow = "hidden";

            return () => {
                document.removeEventListener("keydown", handleEscape);
                document.body.style.overflow = "";
            };
        }
    });

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }
</script>

{#if open}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
        onclick={handleBackdropClick}
        onkeydown={(e) => e.key === "Escape" && onClose()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabindex="-1"
    >
        <div
            bind:this={modalRef}
            class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-scale-in"
        >
            <!-- Close Button -->
            <button
                onclick={onClose}
                class="absolute top-4 right-4 p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                aria-label="Close modal"
            >
                <Icon icon="mdi:close" class="text-xl text-zinc-400" />
            </button>

            <!-- Title -->
            {#if title}
                <h2
                    id="modal-title"
                    class="text-xl font-semibold tracking-tight mb-4 pr-8"
                >
                    {title}
                </h2>
            {/if}

            <!-- Content -->
            {#if children}
                {@render children()}
            {/if}
        </div>
    </div>
{/if}

<style>
    @keyframes fade-in {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes scale-in {
        from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
        }
        to {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }

    .animate-fade-in {
        animation: fade-in 0.2s ease-out;
    }

    .animate-scale-in {
        animation: scale-in 0.2s ease-out;
    }
</style>
