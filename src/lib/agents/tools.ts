import { tool } from 'ai';
import { z } from 'zod';

// --- Researcher Agent Tools ---

export const searchWeb = tool({
    description: 'Search the web for information using Tavily (or mock fallback). Use this to find current events, specific facts, or technical documentation not in your memory.',
    parameters: z.object({
        query: z.string().describe('The search query to execute'),
    }),
    execute: async ({ query }) => {
        const apiKey = process.env.TAVILY_API_KEY;

        if (!apiKey) {
            console.warn('TAVILY_API_KEY not found. Using mock search results.');
            return {
                results: [
                    {
                        title: `Mock Result for: ${query}`,
                        url: 'https://example.com/mock-result',
                        content: `This is a simulated search result for the query "${query}". In a real environment, this would contain relevant information from the web.`,
                        score: 0.9
                    },
                    {
                        title: `Another Mock Result`,
                        url: 'https://example.com/mock-result-2',
                        content: `More simulated content related to "${query}". Please configure TAVILY_API_KEY to get real results.`,
                        score: 0.8
                    }
                ]
            };
        }

        try {
            const response = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    api_key: apiKey,
                    query,
                    search_depth: 'basic',
                    include_answer: true,
                    max_results: 5,
                }),
            });

            if (!response.ok) {
                throw new Error(`Tavily API error: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                results: data.results.map((r: any) => ({
                    title: r.title,
                    url: r.url,
                    content: r.content,
                    score: r.score
                })),
                answer: data.answer
            };
        } catch (error: any) {
            console.error('Search tool error:', error);
            return { error: 'Failed to perform search', details: error.message };
        }
    },
});

// --- Planner Agent Tools ---

export const planGoal = tool({
    description: 'Break down a complex user goal into a structured plan of actionable steps. Use this when the user asks for a "plan", "roadmap", or "how to" for a large task.',
    parameters: z.object({
        goal: z.string().describe('The main goal to achieve'),
        context: z.string().optional().describe('Additional context or constraints'),
    }),
    execute: async ({ goal, context }) => {
        // In a more complex system, this might call another LLM chain.
        // For now, we return a structured object that the main LLM can use to format its response.
        return {
            goal,
            status: 'plan_generated',
            steps: [
                { step: 1, action: 'Analyze requirements', details: `Understand the scope of "${goal}"` },
                { step: 2, action: 'Research', details: 'Gather necessary information and resources' },
                { step: 3, action: 'Draft outline', details: 'Create a structure for the solution' },
                { step: 4, action: 'Execute', details: 'Implement the core components' },
                { step: 5, action: 'Review', details: 'Verify against original requirements' }
            ],
            note: 'This is a template plan. Please customize these steps based on the specific user request in your final response.'
        };
    },
});
