import { writable } from "svelte/store";

// Dark mode temporarily removed. This store is a no-op and always reports "light".
// See CLAUDE.md (Known Gaps / TODO). Kept so existing imports don't break in one pass.

export const theme = writable("light");

export const toggleTheme = () => {
	// no-op while dark mode is disabled
};
