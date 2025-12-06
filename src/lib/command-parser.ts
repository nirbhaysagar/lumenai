export type CommandIntent =
    | { type: 'create_workspace', name?: string }
    | { type: 'navigate', page: string }
    | { type: 'ingest', url: string }
    | { type: 'search', query: string }
    | { type: 'unknown' };

export function parseCommand(input: string): CommandIntent {
    const trimmed = input.trim();

    // Create Workspace
    // Matches: "create workspace", "new project Project Alpha", "create context"
    const createMatch = trimmed.match(/^(?:create|new) (?:workspace|context|project)(?: (.+))?/i);
    if (createMatch) {
        return { type: 'create_workspace', name: createMatch[1] };
    }

    // Navigation
    // Matches: "go to captures", "open graph", "navigate to memories"
    const navMatch = trimmed.match(/^(?:go to|open|navigate to|show) (.+)/i);
    if (navMatch) {
        const target = navMatch[1].toLowerCase();
        let page = '';

        if (target.includes('capture') || target.includes('inbox')) page = '/captures';
        else if (target.includes('memory') || target.includes('memories') || target.includes('library')) page = '/memories';
        else if (target.includes('graph') || target.includes('map') || target.includes('brain')) page = '/graph';
        else if (target.includes('context') || target.includes('workspace') || target.includes('project')) page = '/contexts';
        else if (target.includes('recall') || target.includes('review')) page = '/recall';
        else if (target.includes('home') || target.includes('dashboard')) page = '/';

        if (page) {
            return { type: 'navigate', page };
        }
    }

    // Ingest
    // Matches: "ingest https://...", "save https://..."
    const ingestMatch = trimmed.match(/^(?:ingest|save|capture) (https?:\/\/.+)/i);
    if (ingestMatch) {
        return { type: 'ingest', url: ingestMatch[1] };
    }

    // Default to search
    return { type: 'search', query: trimmed };
}
