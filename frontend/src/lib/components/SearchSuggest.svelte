<!--
    SearchSuggest - Generic searchable dropdown component

    A flexible, reusable component for searching and selecting from any list of data.
    Supports custom display fields, search fields, filtering, and item rendering.

    Usage Examples:

    // Simple usage with collections
    <SearchSuggest
        data={collections}
        displayField="topic"
        searchFields={["topic"]}
        selectedItem={selectedCollection}
        label="Collection"
        placeholder="Search collections..."
        onselect={(item) => selectedCollection = item}
        onclear={() => selectedCollection = null}
    />

    // Advanced usage with users
    <SearchSuggest
        data={users}
        displayField="name"
        searchFields={["name", "email", "department"]}
        selectedItem={selectedUser}
        label="Assign to User"
        placeholder="Search by name, email, or department..."
        onselect={(user) => selectedUser = user}
        onclear={() => selectedUser = null}
        customFilter={(items, query) =>
            items.filter(item =>
                item.active &&
                item.name.toLowerCase().includes(query.toLowerCase())
            )
        }
    />

    // Custom rendering with snippets
    <SearchSuggest
        data={products}
        displayField="name"
        searchFields={["name", "sku", "category"]}
        selectedItem={selectedProduct}
        placeholder="Search products..."
        onselect={(product) => selectedProduct = product}
    >
        {#snippet itemRenderer(product, isSelected)}
            <div class="flex items-center gap-3">
                <img src={product.image} alt={product.name} class="w-8 h-8 rounded" />
                <div>
                    <div class="font-medium {isSelected ? 'text-blue-700' : ''}">{product.name}</div>
                    <div class="text-xs text-zinc-500">{product.sku} • ${product.price}</div>
                </div>
            </div>
        {/snippet}
    </SearchSuggest>
-->

<script lang="ts" generics="T extends Record<string, any>">
    import Icon from "@iconify/svelte";
    import type { Snippet } from "svelte";

    interface Props {
        data: T[];
        displayField: keyof T;
        searchFields?: (keyof T)[];
        selectedItem?: T | null;
        searchQuery?: string;
        placeholder?: string;
        label?: string;
        disabled?: boolean;
        required?: boolean;
        clearable?: boolean;
        emptyMessage?: string;
        noResultsMessage?: string;
        maxHeight?: string;
        onselect?: (item: T) => void;
        onclear?: () => void;
        onsearch?: (query: string) => void;
        customFilter?: (items: T[], query: string) => T[];
        getItemKey?: (item: T) => string | number;
        itemRenderer?: Snippet<[T, boolean]>;
        children?: Snippet;
    }

    let {
        data,
        displayField,
        searchFields = [displayField],
        selectedItem = null,
        searchQuery = "",
        placeholder = "Search...",
        label,
        disabled = false,
        required = false,
        clearable = true,
        emptyMessage = "No items available",
        noResultsMessage = "No items found",
        maxHeight = "12rem",
        onselect,
        onclear,
        onsearch,
        customFilter,
        getItemKey,
        itemRenderer,
        children,
    }: Props = $props();

    let showDropdown = $state(false);
    let searchInput: HTMLInputElement;
    let dropdownContainer = $state<HTMLDivElement>();

    // Default key function
    const defaultGetKey = (item: T): string | number => {
        if (
            "id" in item &&
            (typeof item.id === "string" || typeof item.id === "number")
        ) {
            return item.id;
        }
        return JSON.stringify(item);
    };

    const getKey = $derived(getItemKey || defaultGetKey);

    // Filter items based on search query
    let filteredData = $derived(
        !searchQuery.trim()
            ? data
            : customFilter
              ? customFilter(data, searchQuery.trim())
              : data.filter((item) =>
                    searchFields.some((field) => {
                        const value = item[field];
                        if (value == null) return false;
                        return String(value)
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase().trim());
                    }),
                ),
    );

    // Get display value for an item
    function getDisplayValue(item: T): string {
        const value = item[displayField];
        return value != null ? String(value) : "";
    }

    // Check if an item is selected
    function isItemSelected(item: T): boolean {
        if (!selectedItem) return false;
        return getKey(item) === getKey(selectedItem);
    }

    function handleFocus() {
        if (!disabled) {
            showDropdown = true;
        }
    }

    function handleBlur(event: FocusEvent) {
        // Check if the blur is because we're focusing on dropdown content
        const relatedTarget = event.relatedTarget as HTMLElement;
        if (relatedTarget && dropdownContainer?.contains(relatedTarget)) {
            return;
        }

        // Small delay to allow clicking on dropdown items
        setTimeout(() => {
            if (!dropdownContainer?.matches(":focus-within")) {
                showDropdown = false;
            }
        }, 150);
    }

    function handleInput(event: Event) {
        const target = event.target as HTMLInputElement;
        const newQuery = target.value;
        onsearch?.(newQuery);

        if (!showDropdown && newQuery.trim()) {
            showDropdown = true;
        }
    }

    function selectItem(item: T) {
        onselect?.(item);
        showDropdown = false;
        searchInput.blur();
    }

    function clearSelection() {
        onclear?.();
        searchInput.focus();
    }

    function handleKeydown(event: KeyboardEvent) {
        if (disabled) return;

        switch (event.key) {
            case "Escape":
                showDropdown = false;
                searchInput.blur();
                break;
            case "ArrowDown":
                event.preventDefault();
                if (!showDropdown) {
                    showDropdown = true;
                } else {
                    // Focus first item in dropdown
                    const firstButton = dropdownContainer?.querySelector(
                        "button",
                    ) as HTMLButtonElement;
                    firstButton?.focus();
                }
                break;
            case "Enter":
                if (!showDropdown && filteredData.length > 0) {
                    showDropdown = true;
                    event.preventDefault();
                }
                break;
        }
    }

    function handleDropdownKeydown(
        event: KeyboardEvent,
        item: T,
        index: number,
    ) {
        switch (event.key) {
            case "Enter":
            case " ":
                event.preventDefault();
                selectItem(item);
                break;
            case "Escape":
                event.preventDefault();
                showDropdown = false;
                searchInput.focus();
                break;
            case "ArrowUp":
                event.preventDefault();
                const prevButton = (event.currentTarget as HTMLElement)
                    ?.previousElementSibling as HTMLButtonElement;
                if (prevButton) {
                    prevButton.focus();
                } else {
                    searchInput.focus();
                }
                break;
            case "ArrowDown":
                event.preventDefault();
                const nextButton = (event.currentTarget as HTMLElement)
                    ?.nextElementSibling as HTMLButtonElement;
                nextButton?.focus();
                break;
        }
    }
</script>

<div class="search-suggest">
    {#if label}
        <label
            for="search-suggest-input"
            class="block text-sm font-medium text-zinc-700 mb-1"
        >
            {label}
            {#if required}
                <span class="text-red-500">*</span>
            {/if}
        </label>
    {/if}

    <div class="relative">
        <div class="relative">
            <Icon
                icon="mdi:magnify"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 {disabled
                    ? 'opacity-50'
                    : ''}"
            />
            <input
                bind:this={searchInput}
                id="search-suggest-input"
                type="text"
                value={searchQuery}
                oninput={handleInput}
                onfocus={handleFocus}
                onblur={handleBlur}
                onkeydown={handleKeydown}
                {disabled}
                placeholder={selectedItem && !searchQuery
                    ? getDisplayValue(selectedItem)
                    : placeholder}
                class="w-full pl-10 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-zinc-50 disabled:text-zinc-400 disabled:cursor-not-allowed transition-colors {clearable &&
                selectedItem &&
                !disabled
                    ? 'pr-10'
                    : 'pr-3'}"
                autocomplete="off"
                role="combobox"
                aria-expanded={showDropdown}
                aria-haspopup="listbox"
                aria-autocomplete="list"
                aria-controls="search-suggest-listbox"
            />
            {#if clearable && selectedItem && !disabled}
                <button
                    type="button"
                    onclick={clearSelection}
                    class="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 rounded transition-colors"
                    title="Clear selection"
                    aria-label="Clear selection"
                >
                    <Icon icon="mdi:close" class="text-zinc-400 text-sm" />
                </button>
            {/if}
        </div>

        {#if showDropdown && !disabled}
            <div
                bind:this={dropdownContainer}
                class="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden"
                style="max-height: {maxHeight}"
                id="search-suggest-listbox"
                role="listbox"
                aria-label="Search results"
            >
                {#if filteredData.length > 0}
                    <div
                        class="overflow-y-auto"
                        style="max-height: {maxHeight}"
                    >
                        {#each filteredData as item, index (getKey(item))}
                            <button
                                type="button"
                                onclick={() => selectItem(item)}
                                onkeydown={(e) =>
                                    handleDropdownKeydown(e, item, index)}
                                class="w-full px-3 py-2 text-left hover:bg-zinc-50 transition-colors focus:bg-zinc-50 focus:outline-none {isItemSelected(
                                    item,
                                )
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-zinc-900'}"
                                role="option"
                                aria-selected={isItemSelected(item)}
                                tabindex="-1"
                            >
                                {#if itemRenderer}
                                    {@render itemRenderer(
                                        item,
                                        isItemSelected(item),
                                    )}
                                {:else}
                                    <div
                                        class="flex items-center justify-between"
                                    >
                                        <span class="truncate font-medium">
                                            {getDisplayValue(item)}
                                        </span>
                                        {#if isItemSelected(item)}
                                            <Icon
                                                icon="mdi:check"
                                                class="text-blue-600 ml-2 shrink-0"
                                            />
                                        {/if}
                                    </div>
                                {/if}
                            </button>
                        {/each}
                    </div>
                {:else if searchQuery.trim()}
                    <div class="px-3 py-4 text-center text-sm text-zinc-500">
                        <Icon
                            icon="mdi:magnify"
                            class="text-zinc-400 text-lg mb-1"
                        />
                        <div>{noResultsMessage}</div>
                        {#if searchQuery.length < 2}
                            <div class="text-xs mt-1">
                                Try typing more characters
                            </div>
                        {/if}
                    </div>
                {:else}
                    <div class="px-3 py-4 text-center text-sm text-zinc-500">
                        <Icon
                            icon="mdi:text-search"
                            class="text-zinc-400 text-lg mb-1"
                        />
                        <div>Start typing to search...</div>
                    </div>
                {/if}
            </div>
        {/if}
    </div>

    {#if selectedItem && !searchQuery}
        <div class="mt-2 flex items-center gap-1 text-xs text-blue-600">
            <Icon icon="mdi:check-circle" class="text-sm" />
            <span>Selected: {getDisplayValue(selectedItem)}</span>
        </div>
    {/if}
</div>

<style>
    .search-suggest {
        position: relative;
    }

    /* Ensure dropdown appears above other elements */
    .search-suggest :global(.absolute.z-50) {
        z-index: 50;
    }
</style>
