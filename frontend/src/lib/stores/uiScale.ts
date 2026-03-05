import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'ui-scale';
const MIN_SCALE = 0.75;
const MAX_SCALE = 1.25;
const DEFAULT_SCALE = 0.85;
const SCALE_STEP = 0.05;

function createUIScale() {
    const initialScale = browser
        ? parseFloat(localStorage.getItem(STORAGE_KEY) || String(DEFAULT_SCALE))
        : DEFAULT_SCALE;

    const { subscribe, set, update } = writable<number>(initialScale);

    return {
        subscribe,
        zoomIn: () => {
            update(scale => {
                const newScale = Math.min(scale + SCALE_STEP, MAX_SCALE);
                if (browser) {
                    localStorage.setItem(STORAGE_KEY, String(newScale));
                }
                return newScale;
            });
        },
        zoomOut: () => {
            update(scale => {
                const newScale = Math.max(scale - SCALE_STEP, MIN_SCALE);
                if (browser) {
                    localStorage.setItem(STORAGE_KEY, String(newScale));
                }
                return newScale;
            });
        },
        reset: () => {
            if (browser) {
                localStorage.setItem(STORAGE_KEY, String(DEFAULT_SCALE));
            }
            set(DEFAULT_SCALE);
        }
    };
}

export const uiScale = createUIScale();
