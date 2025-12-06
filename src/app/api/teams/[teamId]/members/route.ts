import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { teamId: string } }) {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    const { teamId } = params;

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify membership
    const { data: membership, error: memberError } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single();

    if (memberError || !membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // List members
    const { data: members, error } = await supabase
        .from('team_members')
        .select(`
            role,
            created_at,
            user:user_id (
                email,
                id
            )
        `)
        .eq('team_id', teamId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map to cleaner objects (optional, or just return as is)
    // Supabase returns nested objects, e.g. user: { email: ... }
    return NextResponse.json({ members });
}

export async function POST(request: Request, { params }: { params: { teamId: string } }) {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    const { teamId } = params;

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const json = await request.json();
        const { email, role = 'member' } = json;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Verify I am an owner/admin
        const { data: myMembership } = await supabase
            .from('team_members')
            .select('role')
            .eq('team_id', teamId)
            .eq('user_id', user.id)
            .single();

        if (!myMembership || (myMembership.role !== 'owner' && myMembership.role !== 'admin')) {
            return NextResponse.json({ error: 'Only owners can invite members' }, { status: 403 });
        }

        // Find user by email (Requires specialized setup or just trusting email exists in generic supabase setup? 
        // Standard Supabase doesn't let you query auth.users easily unless we used a trigger to sync public.users.
        // For MVP, we will assume we can't easily query auth.users by email directly from client SDK without admin rights.
        // Using service_role key here would be ideal but createRouteHandlerClient uses user token.
        // Option: Just invite by inserting into DB? Constraints will fail if user_id invalid.
        // PROBLEM: We have email, need user_id.
        // SOLUTION for MVP: We CANNOT natively look up user_id from email with standard RLS.
        // We need an RPC or a public profile table.
        // Assuming public.profiles exists or similar? 
        // Audit didn't show `users` table, only migrations.
        // I will assume for now we cannot invite by email unless we have a public users table.
        // Let's implement a limitation: For MVP, maybe we can't invite by email?
        // OR: We use the Supabase Admin Auth API (requires service role).
        // Best approach for MVP: Use Supabase Admin (service_role) in this route to lookup user by email.

        // However, I don't want to overengineer.
        // Let's check if the project has a `users` table synced to `auth.users`.
        // The audit showed `021` migration I just wrote references `auth.users`.
        // Existing migrations might have `public.users`?
        // I'll check `command_status` and if successful, check migrations dir again or assume no public.users.

        // Workaround: Mock "Invite sent" if simpler? No, need real team members.
        // I will just return "Feature Not Implemented" for POST for now or try to use `rpc`?
        // Better: Use `supabase-admin` client if env var available.
        // I see `process.env.SUPABASE_SERVICE_ROLE_KEY` is common. I'll check if I can use it.

        return NextResponse.json({ error: 'Invite by email not fully implemented in MVP without Service Role' }, { status: 501 });

    } catch (e) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
