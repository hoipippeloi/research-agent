import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'user_email';

function createUserEmailStore() {
	const stored = browser ? localStorage.getItem(STORAGE_KEY) : null;
	const { subscribe, set } = writable<string | null>(stored);

	return {
		subscribe,
		setEmail: (email: string) => {
			if (browser) {
				localStorage.setItem(STORAGE_KEY, email);
			}
			set(email);
		},
		clearEmail: () => {
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
			set(null);
		},
		getEmail: (): string | null => {
			if (browser) {
				return localStorage.getItem(STORAGE_KEY);
			}
			return null;
		}
	};
}

export const userEmail = createUserEmailStore();
