import type { Snippet, SvelteComponent } from 'svelte';

export interface SearchSuggestProps<T extends Record<string, any>> {
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

declare class SearchSuggest<T extends Record<string, any>> extends SvelteComponent<SearchSuggestProps<T>> {}

export default SearchSuggest;
