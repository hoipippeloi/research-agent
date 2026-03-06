<script lang="ts">
    import Icon from "@iconify/svelte";

    let {
        onsubmit,
        onclose,
    }: { onsubmit?: (email: string) => void; onclose?: () => void } = $props();

    let email = $state("");
    let error = $state("");

    function validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function handleSubmit(e: Event) {
        e.preventDefault();

        if (!email.trim()) {
            error = "Email address is required";
            return;
        }

        if (!validateEmail(email)) {
            error = "Please enter a valid email address";
            return;
        }

        onsubmit?.(email);
    }

    function handleClose() {
        onclose?.();
    }
</script>

<div
    class="modal-overlay"
    onclick={handleClose}
    onkeydown={(e) => e.key === "Escape" && handleClose()}
    role="button"
    tabindex="0"
>
    <div
        class="modal-content"
        onclick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-modal-title"
    >
        <div class="modal-header">
            <h2 id="email-modal-title">
                <Icon icon="solar:letter-linear" class="icon" />
                Enter Your Email
            </h2>
            <p class="subtitle">
                Your email is used to link and retrieve your data across
                sessions
            </p>
        </div>

        <form onsubmit={handleSubmit}>
            <div class="form-group">
                <label for="email">Email Address</label>
                <input
                    type="email"
                    id="email"
                    bind:value={email}
                    placeholder="your@email.com"
                    required
                />
                {#if error}
                    <p class="error-message">
                        <Icon icon="solar:danger-triangle-linear" />
                        {error}
                    </p>
                {/if}
            </div>

            <div class="info-box">
                <Icon icon="solar:info-circle-linear" class="info-icon" />
                <p>
                    Your email is stored locally in your browser and used to
                    retrieve your search history, saved results, and preferences
                    from our database.
                </p>
            </div>

            <div class="modal-actions">
                <button type="submit" class="btn-primary">
                    <Icon icon="solar:check-circle-linear" />
                    Continue
                </button>
            </div>
        </form>

        <button class="close-btn" onclick={handleClose} aria-label="Close">
            <Icon icon="solar:close-circle-linear" />
        </button>
    </div>
</div>

<style>
    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .modal-content {
        background: var(--bg-primary, #ffffff);
        border-radius: 16px;
        padding: 32px;
        max-width: 480px;
        width: 90%;
        position: relative;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .modal-header {
        text-align: center;
        margin-bottom: 24px;
    }

    .modal-header h2 {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary, #1a1a1a);
        margin: 0 0 8px 0;
    }

    .icon {
        font-size: 2rem;
        color: var(--primary, #018790);
    }

    .subtitle {
        color: var(--text-secondary, #666);
        font-size: 0.9rem;
        margin: 0;
    }

    .form-group {
        margin-bottom: 20px;
    }

    label {
        display: block;
        font-weight: 600;
        margin-bottom: 8px;
        color: var(--text-primary, #1a1a1a);
    }

    input[type="email"] {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid var(--border-color, #e0e0e0);
        border-radius: 8px;
        font-size: 1rem;
        transition:
            border-color 0.2s,
            box-shadow 0.2s;
        background: var(--bg-secondary, #fafafa);
        color: var(--text-primary, #1a1a1a);
    }

    input[type="email"]:focus {
        outline: none;
        border-color: var(--primary, #018790);
        box-shadow: 0 0 0 3px rgba(0, 183, 181, 0.15);
    }

    .error-message {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #ef4444;
        font-size: 0.875rem;
        margin-top: 8px;
    }

    .info-box {
        display: flex;
        gap: 12px;
        padding: 12px;
        background: var(--info-bg, #e6fdfa);
        border: 1px solid var(--info-border, #00b7b5);
        border-radius: 8px;
        margin-bottom: 24px;
    }

    .info-icon {
        font-size: 1.25rem;
        color: var(--info-color, #018790);
        flex-shrink: 0;
        margin-top: 2px;
    }

    .info-box p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--text-secondary, #555);
        line-height: 1.5;
    }

    .modal-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
    }

    .btn-primary {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        background: var(--primary, #005461);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition:
            background 0.2s,
            transform 0.1s;
    }

    .btn-primary:hover {
        background: var(--primary-dark, #018790);
        transform: translateY(-1px);
    }

    .btn-primary:active {
        transform: translateY(0);
    }

    .close-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--text-secondary, #999);
        transition: color 0.2s;
    }

    .close-btn:hover {
        color: var(--text-primary, #666);
    }

    .close-btn iconify-icon {
        font-size: 1.5rem;
    }

    @media (max-width: 640px) {
        .modal-content {
            padding: 24px;
        }

        .modal-header h2 {
            font-size: 1.5rem;
        }
    }
</style>
