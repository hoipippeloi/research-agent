export type ModalType = 'search' | 'options' | null;

export interface ModalState {
    type: ModalType;
    query?: string;
    markdownUrl?: string;
}

export function getModalFromUrl(url: URL): ModalState {
    const modal = url.searchParams.get('modal');
    const query = url.searchParams.get('query');
    const markdownUrl = url.searchParams.get('markdownUrl');
    
    if (!modal || !query) {
        return { type: null, markdownUrl: markdownUrl || undefined };
    }
    
    if (modal === 'search' || modal === 'options') {
        return { type: modal, query, markdownUrl: markdownUrl || undefined };
    }
    
    return { type: null, markdownUrl: markdownUrl || undefined };
}

export function openModal(
    goto: (url: string, options?: { replaceState?: boolean }) => Promise<void>,
    type: ModalType,
    query: string,
    replaceState = false
): Promise<void> {
    if (!type || !query) {
        return closeModal(goto);
    }
    
    const url = new URL(window.location.href);
    url.searchParams.set('modal', type);
    url.searchParams.set('query', query);
    
    return goto(url.search, { replaceState });
}

export function closeModal(
    goto: (url: string, options?: { replaceState?: boolean }) => Promise<void>
): Promise<void> {
    const url = new URL(window.location.href);
    url.searchParams.delete('modal');
    url.searchParams.delete('query');
    
    return goto(url.search || '?', { replaceState: true });
}

export function updateModalQuery(
    goto: (url: string, options?: { replaceState?: boolean }) => Promise<void>,
    query: string
): Promise<void> {
    const url = new URL(window.location.href);
    const currentModal = url.searchParams.get('modal');
    
    if (currentModal && query) {
        url.searchParams.set('query', query);
        return goto(url.search, { replaceState: true });
    }
    
    return Promise.resolve();
}

export function openMarkdownPreview(
    goto: (url: string, options?: { replaceState?: boolean }) => Promise<void>,
    markdownUrl: string
): Promise<void> {
    const url = new URL(window.location.href);
    url.searchParams.set('markdownUrl', markdownUrl);
    
    return goto(url.search, { replaceState: true });
}

export function closeMarkdownPreview(
    goto: (url: string, options?: { replaceState?: boolean }) => Promise<void>
): Promise<void> {
    const url = new URL(window.location.href);
    url.searchParams.delete('markdownUrl');
    
    return goto(url.search, { replaceState: true });
}
