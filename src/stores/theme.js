import { writable } from "svelte/store";
import { browser } from "$app/environment";

const defaultValue = "system";
const storageKey = "theme";

export const theme = writable(defaultValue);

const updateDocument = (newValue) => {
    if (!browser) return;
    const root = document.documentElement;
    if (newValue === "system") {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.setAttribute("data-theme", isDark ? "dark" : "light");
    } else {
        root.setAttribute("data-theme", newValue);
    }
    localStorage.setItem(storageKey, newValue);
};

if (browser) {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
        theme.set(stored);
        updateDocument(stored);
    } else {
        theme.set(defaultValue);
        updateDocument(defaultValue);
    }

    theme.subscribe((value) => {
        updateDocument(value);
    });

    // Listen for system changes if mode is system
    window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", (e) => {
            if (localStorage.getItem(storageKey) === "system") {
                const newTheme = e.matches ? "dark" : "light";
                document.documentElement.setAttribute("data-theme", newTheme);
            }
        });
}

export const toggleTheme = () => {
    theme.update((current) => {
        if (current === "system") {
            const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            return isDark ? "light" : "dark";
        }
        const next = current === "dark" ? "light" : "dark";
        return next;
    });
};
