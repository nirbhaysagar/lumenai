import SmartEditor from '@/components/editor/SmartEditor';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditorPage() {
    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Smart Editor</h1>
                    <p className="text-muted-foreground">Write with AI superpowers.</p>
                </div>
            </div>

            <SmartEditor />
        </div>
    );
}
