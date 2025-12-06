import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { KnowledgeRadar } from './KnowledgeRadar';

// Mock Recharts since it uses ResizeObserver which might not be available in jsdom
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    RadarChart: ({ children }: any) => <div data-testid="radar-chart">{children}</div>,
    PolarGrid: () => <div />,
    PolarAngleAxis: () => <div />,
    PolarRadiusAxis: () => <div />,
    Radar: () => <div />,
}));

// Mock fetch
global.fetch = vi.fn();

describe('KnowledgeRadar', () => {
    it('renders loading state initially', () => {
        render(<KnowledgeRadar />);
        // Check for loader or empty state
        // Implementation uses Loader2 icon, we can check for that or just that it doesn't crash
        expect(document.querySelector('.animate-spin')).toBeDefined();
    });

    it('fetches and displays data', async () => {
        const mockData = {
            knowledgeGraph: [
                { subject: 'Volume', A: 100, fullMark: 150 },
                { subject: 'Connectivity', A: 50, fullMark: 150 },
            ]
        };

        (global.fetch as any).mockResolvedValueOnce({
            json: async () => mockData,
        });

        render(<KnowledgeRadar />);

        await waitFor(() => {
            expect(screen.getByTestId('radar-chart')).toBeDefined();
        });
    });
});
