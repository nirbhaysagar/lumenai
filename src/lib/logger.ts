import { supabaseAdmin } from './supabase';

// Pricing per 1M tokens (approximate as of late 2024)
const PRICING = {
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'text-embedding-3-large': { input: 0.13, output: 0 },
    'gpt-4o': { input: 2.50, output: 10.00 },
};

export async function logUsage(
    userId: string | null,
    type: 'embedding' | 'chat' | 'summary' | 'task_extraction',
    model: string,
    tokensInput: number,
    tokensOutput: number
) {
    try {
        let cost = 0;
        const price = PRICING[model as keyof typeof PRICING];

        if (price) {
            cost = (tokensInput / 1_000_000) * price.input + (tokensOutput / 1_000_000) * price.output;
        }

        const { error } = await supabaseAdmin.from('usage_logs').insert({
            user_id: userId,
            type,
            model,
            tokens_input: tokensInput,
            tokens_output: tokensOutput,
            cost,
        });

        if (error) {
            console.error('Failed to log usage:', error);
        }
    } catch (err) {
        console.error('Error logging usage:', err);
    }
}
