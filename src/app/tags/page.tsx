import { TagList } from '@/components/tags/TagList';

export default function TagsPage() {
    return (
        <div className="container mx-auto py-8 max-w-5xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Tag Manager</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your memory tags. Rename, merge, or delete tags to keep your knowledge base organized.
                </p>
            </div>
            <TagList />
        </div>
    );
}
