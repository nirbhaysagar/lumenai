import { FileText, Link, MessageSquare, Image as ImageIcon } from 'lucide-react';

/**
 * Get the appropriate icon component for a source type
 */
export function getSourceIcon(type: string) {
    const icons: Record<string, any> = {
        pdf: FileText,
        url: Link,
        text: MessageSquare,
        image: ImageIcon,
    };
    return icons[type] || FileText;
}

/**
 * Get a human-readable name for a source type
 */
export function getSourceTypeName(type: string): string {
    const names: Record<string, string> = {
        pdf: 'PDF',
        url: 'Web',
        text: 'Note',
        image: 'Image',
    };
    return names[type] || 'Unknown';
}

/**
 * Get color class for source type badge
 */
export function getSourceTypeColor(type: string): string {
    const colors: Record<string, string> = {
        pdf: 'text-red-500',
        url: 'text-blue-500',
        text: 'text-slate-500',
        image: 'text-purple-500',
    };
    return colors[type] || 'text-muted-foreground';
}

/**
 * Format source metadata for display
 */
export function formatSourceMetadata(source: any): string {
    if (source.sourceType === 'pdf' && source.pdfPage) {
        return `Page ${source.pdfPage}`;
    }
    if (source.sourceType === 'url' && source.url) {
        try {
            const domain = new URL(source.url).hostname.replace('www.', '');
            return domain;
        } catch {
            return 'Web Source';
        }
    }
    if (source.metadata?.created_at) {
        return new Date(source.metadata.created_at).toLocaleDateString();
    }
    return '';
}
