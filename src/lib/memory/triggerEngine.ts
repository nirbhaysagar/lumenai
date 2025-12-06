import { supabaseAdmin } from '@/lib/supabase';

export interface TriggerResult {
    directiveId: string;
    targetType: string;
    targetId: string;
    action: string;
    reason: string;
}

/**
 * Check for time-based triggers that are due
 */
export async function checkTimeTriggers(userId: string): Promise<TriggerResult[]> {
    const now = new Date().toISOString();

    // Find active time triggers where trigger_value <= now
    // AND (last_triggered_at is null OR last_triggered_at < trigger_value)
    // Note: For recurring triggers, logic would be more complex. MVP assumes one-time reminders.
    const { data: directives, error } = await supabaseAdmin
        .from('memory_directives')
        .select('*')
        .eq('user_id', userId)
        .eq('trigger_type', 'time')
        .eq('is_active', true)
        .lte('trigger_value', now);

    if (error || !directives) return [];

    const results: TriggerResult[] = [];

    for (const directive of directives) {
        // Simple check: if never triggered, or triggered before the due date (re-armed?)
        // For MVP, we just check if it hasn't been triggered yet
        if (!directive.last_triggered_at) {
            results.push({
                directiveId: directive.id,
                targetType: directive.target_type,
                targetId: directive.target_id,
                action: directive.action,
                reason: `Time trigger due: ${new Date(directive.trigger_value).toLocaleString()}`,
            });
        }
    }

    return results;
}

/**
 * Check for topic-based triggers relevant to a given context/topic
 */
export async function checkTopicTriggers(userId: string, topic: string): Promise<TriggerResult[]> {
    // Find active topic triggers that match the given topic (case-insensitive partial match)
    const { data: directives, error } = await supabaseAdmin
        .from('memory_directives')
        .select('*')
        .eq('user_id', userId)
        .eq('trigger_type', 'topic')
        .eq('is_active', true)
        .ilike('trigger_value', `%${topic}%`);

    if (error || !directives) return [];

    return directives.map(d => ({
        directiveId: d.id,
        targetType: d.target_type,
        targetId: d.target_id,
        action: d.action,
        reason: `Topic match: ${d.trigger_value}`,
    }));
}

/**
 * Mark a directive as triggered
 */
export async function markTriggered(directiveId: string) {
    await supabaseAdmin
        .from('memory_directives')
        .update({
            last_triggered_at: new Date().toISOString(),
            // For one-time triggers, we might want to set is_active = false
            // But let's keep it active for history for now, logic handles the rest
        })
        .eq('id', directiveId);
}
