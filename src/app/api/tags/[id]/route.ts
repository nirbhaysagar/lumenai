import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { name } = await req.json();

        if (!id || !name) {
            return NextResponse.json({ error: 'Missing ID or name' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('tags')
            .update({ name })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Tag name already exists' }, { status: 409 });
            }
            throw error;
        }

        return NextResponse.json({ tag: data });
    } catch (error: any) {
        console.error('Update tag error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        }

        // Cascade delete is handled by DB constraint, but we can be explicit if needed.
        // Since we defined ON DELETE CASCADE in migration, deleting the tag is enough.
        const { error } = await supabaseAdmin
            .from('tags')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete tag error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
