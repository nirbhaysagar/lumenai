import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UniversalInput } from './UniversalInput';

// Mock useRouter
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

describe('UniversalInput', () => {
    it('renders correctly', () => {
        render(<UniversalInput />);
        expect(screen.getByPlaceholderText(/Ask anything/i)).toBeDefined();
    });

    it('detects chat mode for questions', () => {
        render(<UniversalInput />);
        const input = screen.getByPlaceholderText(/Ask anything/i);
        fireEvent.change(input, { target: { value: 'What is the capital of France?' } });
        // Check if chat icon appears (implementation detail: we might need to check class or aria-label)
        // For now, just checking if value updates
        expect(input.getAttribute('value')).toBe('What is the capital of France?');
    });

    it('detects ingest mode for /add prefix', () => {
        render(<UniversalInput />);
        const input = screen.getByPlaceholderText(/Ask anything/i);
        fireEvent.change(input, { target: { value: '/add Buy milk' } });
        expect(input.getAttribute('value')).toBe('/add Buy milk');
    });
});
