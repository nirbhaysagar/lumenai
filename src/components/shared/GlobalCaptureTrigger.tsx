'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { GlobalCaptureModal } from './GlobalCaptureModal';

export function GlobalCaptureTrigger() {
    const [isOpen, setIsOpen] = useState(false);

    // Optional: Keyboard shortcut (Cmd+K or Cmd+I)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
                e.preventDefault();
                setIsOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <>
            <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50">
                <Button
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-transform hover:scale-105"
                    onClick={() => setIsOpen(true)}
                    title="Quick Capture (Cmd+I)"
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>
            <GlobalCaptureModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
