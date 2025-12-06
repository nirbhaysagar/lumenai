import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
    try {
        // Fetch logs (limit 100 for table)
        const { data: logs, error: logsError } = await supabaseAdmin
            .from('usage_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (logsError) throw logsError;

        // Fetch all logs for stats aggregation (in a real app, use DB aggregation)
        // For now, we'll fetch a larger batch or use RPC if performance is an issue.
        // Let's assume we can fetch last 1000 for stats to keep it light for this demo.
        const { data: allLogs, error: statsError } = await supabaseAdmin
            .from('usage_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1000);

        if (statsError) throw statsError;

        const stats = {
            totalCost: 0,
            totalTokens: 0,
            totalInputTokens: 0,
            totalOutputTokens: 0,
            dailyStats: [] as any[],
            typeStats: [] as any[],
        };

        const dailyMap = new Map();
        const typeMap = new Map();

        allLogs?.forEach(log => {
            stats.totalCost += log.cost;
            stats.totalTokens += (log.tokens_input + log.tokens_output);
            stats.totalInputTokens += log.tokens_input;
            stats.totalOutputTokens += log.tokens_output;

            // Daily stats
            const date = new Date(log.created_at).toLocaleDateString();
            if (!dailyMap.has(date)) {
                dailyMap.set(date, { date, cost: 0, tokens: 0 });
            }
            const dayStat = dailyMap.get(date);
            dayStat.cost += log.cost;
            dayStat.tokens += (log.tokens_input + log.tokens_output);

            // Type stats
            if (!typeMap.has(log.type)) {
                typeMap.set(log.type, { type: log.type, tokens: 0, cost: 0 });
            }
            const typeStat = typeMap.get(log.type);
            typeStat.tokens += (log.tokens_input + log.tokens_output);
            typeStat.cost += log.cost;
        });

        stats.dailyStats = Array.from(dailyMap.values()).reverse(); // Show oldest to newest
        stats.typeStats = Array.from(typeMap.values());

        return NextResponse.json({ logs, stats });

    } catch (error) {
        console.error('Stats API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
