import { useState, useEffect, useCallback, useRef } from 'react';
import { create } from 'zustand';

interface CommandPaletteState {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
    query: string;
    setQuery: (query: string) => void;
}

export const useCommandPaletteStore = create<CommandPaletteState>((set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false, query: '' }),
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    query: '',
    setQuery: (query) => set({ query }),
}));

export function useCommandPalette() {
    const { isOpen, open, close, toggle, query, setQuery } = useCommandPaletteStore();

    const lastToggleTime = useRef(0);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                if (e.repeat) return;

                const now = Date.now();
                if (now - lastToggleTime.current < 300) return; // Debounce 300ms
                lastToggleTime.current = now;

                e.preventDefault();
                toggle();
            }
            if (e.key === 'Escape' && isOpen) {
                close();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, toggle, close]);

    return {
        isOpen,
        open,
        close,
        toggle,
        query,
        setQuery,
    };
}
