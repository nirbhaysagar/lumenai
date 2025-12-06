export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: number;
    sources?: any[];
}

export function exportMessageAsMarkdown(message: ChatMessage, contextId: string): void {
    let content = `# Chat Export - ${new Date().toLocaleString()}\n\n`;
    content += `**Role:** ${message.role.toUpperCase()}\n`;
    content += `**Date:** ${new Date(message.createdAt).toLocaleString()}\n\n`;
    content += `${message.content}\n\n`;

    if (message.sources && message.sources.length > 0) {
        content += `## Sources\n`;
        message.sources.forEach((source, index) => {
            content += `[^${index + 1}]: **${source.metadata?.title || 'Untitled'}** - ${source.snippet}\n`;
        });
    }

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumen_${contextId}_${message.createdAt}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function exportMessageAsJSON(message: ChatMessage, contextId: string): void {
    const data = {
        contextId,
        exportedAt: new Date().toISOString(),
        message,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumen_${contextId}_${message.createdAt}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
